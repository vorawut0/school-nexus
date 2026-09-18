import React, { useState, useRef, useMemo } from 'react';
import { StudentSubmission } from './TeacherGradingView';

export interface BatchGradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  feedback: string;
  isMatched: boolean;
  hasWarning: boolean;
  warningMessage?: string;
  matchedSubmissionId?: string;
  isExistingGraded?: boolean;
}

interface BatchCsvGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: StudentSubmission[];
  defaultMaxScore?: number;
  assignmentTitle?: string;
  subjectTitle?: string;
  onApplyBatchGrades: (
    records: BatchGradeRecord[],
    options: { pushNotifications: boolean; createNewEntries: boolean }
  ) => Promise<void> | void;
}

export const BatchCsvGradingModal: React.FC<BatchCsvGradingModalProps> = ({
  isOpen,
  onClose,
  submissions,
  defaultMaxScore = 20,
  assignmentTitle = 'งานที่มอบหมาย',
  subjectTitle = 'รายวิชา',
  onApplyBatchGrades,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [createNewEntries, setCreateNewEntries] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'all' | 'matched' | 'warning'>('all');
  const [editedRecords, setEditedRecords] = useState<BatchGradeRecord[]>([]);
  const [hasParsed, setHasParsed] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Normalize clean string
  const cleanStr = (val: any): string => {
    if (val === undefined || val === null) return '';
    return String(val).trim().replace(/^["']|["']$/g, '');
  };

  // Parse CSV / TSV text into tabular data
  const parseCsvLines = (text: string): string[][] => {
    const lines = text
      .split(/\r\n|\n|\r/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const rows: string[][] = [];

    for (const line of lines) {
      // Determine delimiter (tab, comma, or semicolon)
      const tabCount = (line.match(/\t/g) || []).length;
      const commaCount = (line.match(/,/g) || []).length;
      const semiCount = (line.match(/;/g) || []).length;

      let delimiter = ',';
      if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
      else if (semiCount > commaCount) delimiter = ';';

      // Parse with regex considering quoted values
      const row: string[] = [];
      let current = '';
      let insideQuote = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (insideQuote && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            insideQuote = !insideQuote;
          }
        } else if (char === delimiter && !insideQuote) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      rows.push(row);
    }

    return rows;
  };

  // Convert raw parsed rows into structured BatchGradeRecords
  const processRowsIntoRecords = (rows: string[][]): BatchGradeRecord[] => {
    if (rows.length === 0) return [];

    // Detect header index
    let headerIdx = 0;
    let studentIdCol = -1;
    let nameCol = -1;
    let scoreCol = -1;
    let maxScoreCol = -1;
    let feedbackCol = -1;

    // Search for header keywords
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const row = rows[i].map((c) => cleanStr(c).toLowerCase());
      const sId = row.findIndex((c) =>
        c.includes('รหัส') || c.includes('studentid') || c.includes('student_id') || c === 'id' || c.includes('เลขประจำตัว')
      );
      const sc = row.findIndex((c) =>
        c.includes('คะแนน') || c.includes('score') || c.includes('point') || c.includes('grade')
      );

      if (sId !== -1 || sc !== -1) {
        headerIdx = i;
        studentIdCol = sId;
        scoreCol = sc;

        nameCol = row.findIndex((c) =>
          c.includes('ชื่อ') || c.includes('name') || c.includes('นักเรียน')
        );
        maxScoreCol = row.findIndex((c) =>
          c.includes('เต็ม') || c.includes('max') || c.includes('total')
        );
        feedbackCol = row.findIndex((c) =>
          c.includes('ข้อคิดเห็น') || c.includes('ข้อเสนอแนะ') || c.includes('feedback') || c.includes('comment') || c.includes('หมายเหตุ') || c.includes('note')
        );
        break;
      }
    }

    // Default column fallback if headers not found explicitly
    if (studentIdCol === -1) studentIdCol = 0;
    if (nameCol === -1) nameCol = 1;
    if (scoreCol === -1) scoreCol = rows[0].length >= 3 ? 2 : (studentIdCol === 0 ? 1 : 0);

    const dataRows = rows.slice(headerIdx + 1);
    const results: BatchGradeRecord[] = [];

    dataRows.forEach((cols, idx) => {
      if (cols.length === 0 || cols.every((c) => !c)) return;

      const rawId = cleanStr(cols[studentIdCol] || '');
      // If student ID is purely headers or invalid metadata, skip
      if (rawId.toLowerCase().includes('รหัส') || rawId.toLowerCase() === 'student id' || rawId.toLowerCase() === 'id') {
        return;
      }
      if (!rawId) return;

      const rawName = nameCol !== -1 && cols[nameCol] ? cleanStr(cols[nameCol]) : '';
      const rawScoreStr = scoreCol !== -1 && cols[scoreCol] ? cleanStr(cols[scoreCol]) : '0';
      const parsedScore = parseFloat(rawScoreStr);
      const validScore = isNaN(parsedScore) ? 0 : parsedScore;

      const rawMaxScoreStr = maxScoreCol !== -1 && cols[maxScoreCol] ? cleanStr(cols[maxScoreCol]) : '';
      const parsedMaxScore = parseFloat(rawMaxScoreStr);
      const resolvedMaxScore = !isNaN(parsedMaxScore) && parsedMaxScore > 0 ? parsedMaxScore : defaultMaxScore;

      const feedback = feedbackCol !== -1 && cols[feedbackCol] ? cleanStr(cols[feedbackCol]) : '';

      // Match against current submissions list
      const matched = submissions.find(
        (s) =>
          cleanStr(s.studentId).toLowerCase() === rawId.toLowerCase() ||
          (s.thaiName && s.thaiName.includes(rawName) && rawName.length >= 3) ||
          (s.studentName && s.studentName.toLowerCase().includes(rawName.toLowerCase()) && rawName.length >= 3)
      );

      let warning: string | undefined;
      let hasWarning = false;

      if (validScore > resolvedMaxScore) {
        warning = `คะแนนที่ระบุ (${validScore}) สูงกว่าคะแนนเต็ม (${resolvedMaxScore})`;
        hasWarning = true;
      } else if (validScore < 0) {
        warning = 'คะแนนติดลบ';
        hasWarning = true;
      } else if (isNaN(parsedScore)) {
        warning = 'รูปแบบคะแนนไม่ใช่ตัวเลข';
        hasWarning = true;
      } else if (!matched) {
        warning = 'ไม่พบรหัสในรายชื่อที่ส่งงาน (จะสร้างรายการใหม่อัตโนมัติ)';
        hasWarning = true;
      }

      results.push({
        id: `batch-item-${idx}-${Date.now()}`,
        studentId: rawId,
        studentName: matched ? (matched.thaiName || matched.studentName) : (rawName || `นักเรียน (${rawId})`),
        score: validScore,
        maxScore: matched ? matched.maxScore : resolvedMaxScore,
        feedback: feedback || (matched?.feedback || ''),
        isMatched: !!matched,
        hasWarning,
        warningMessage: warning,
        matchedSubmissionId: matched?.id,
        isExistingGraded: matched?.status === 'graded',
      });
    });

    return results;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        const rows = parseCsvLines(content);
        const records = processRowsIntoRecords(rows);
        setEditedRecords(records);
        setHasParsed(true);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt') && !file.name.endsWith('.tsv')) {
      alert('กรุณาเลือกไฟล์รูปแบบ .csv หรือ .tsv');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        const rows = parseCsvLines(content);
        const records = processRowsIntoRecords(rows);
        setEditedRecords(records);
        setHasParsed(true);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleParseRawText = (textToParse: string) => {
    setRawText(textToParse);
    if (!textToParse.trim()) {
      setEditedRecords([]);
      setHasParsed(false);
      return;
    }
    const rows = parseCsvLines(textToParse);
    const records = processRowsIntoRecords(rows);
    setEditedRecords(records);
    setHasParsed(true);
  };

  const handleLoadSample = () => {
    // Generate sample with actual students if available
    let sampleContent = '';
    if (submissions.length > 0) {
      const sampleRows = submissions.map((s, idx) => {
        const sampleScore = Math.max(s.maxScore - (idx % 4) * 2, s.maxScore * 0.65);
        const sampleFeedback =
          idx % 3 === 0
            ? 'ผลงานยอดเยี่ยม โครงสร้างและอัลกอริทึมถูกต้องสมบูรณ์'
            : idx % 3 === 1
            ? 'ทำงานได้ดีมาก ควรเพิ่มเติมการอธิบายผลลัพธ์ในรายงาน'
            : 'ผ่านเกณฑ์มาตรฐาน ควรปรับปรุงประสิทธิภาพของฟังก์ชัน';
        return `"${s.studentId}","${s.thaiName || s.studentName}",${sampleScore},${s.maxScore},"${sampleFeedback}"`;
      });
      sampleContent = [
        'รหัสนักเรียน,ชื่อ-นามสกุล,คะแนนที่ได้,คะแนนเต็ม,ข้อเสนอแนะอาจารย์',
        ...sampleRows,
      ].join('\r\n');
    } else {
      sampleContent = [
        'รหัสนักเรียน,ชื่อ-นามสกุล,คะแนนที่ได้,คะแนนเต็ม,ข้อเสนอแนะอาจารย์',
        '"66041001","วรวุฒิ เพ็ชรราย",19,20,"ทำงานได้ยอดเยี่ยม เขียนเอกสารครบถ้วน"',
        '"66040188","ณัฐพล ศิริพันธ์ (กันต์)",18,20,"โมเดลมีความแม่นยำสูง โค้ดอ่านง่าย"',
        '"66040233","ฉัตรชัย พรหมศิริ",17,20,"ผลการทดสอบผ่านเกณฑ์ดีมาก"',
        '"66040512","กัญญาณัฐ วงศ์วิชัย",19.5,20,"ผลงานโดดเด่น จัดทำสรุปภาพประกอบได้สวยงาม"',
        '"66040999","ธนกร สุขเจริญ",16,20,"ผ่านเกณฑ์มาตรฐาน แนะนำให้เพิ่ม Unit Test"',
      ].join('\r\n');
    }

    setFileName('sample_grades_template.csv');
    handleParseRawText(sampleContent);
  };

  const handleDownloadTemplate = () => {
    let rows: string[] = [];
    if (submissions.length > 0) {
      rows = submissions.map((s) => `"${s.studentId}","${(s.thaiName || s.studentName).replace(/"/g, '""')}",,${s.maxScore},""`);
    } else {
      rows = [
        '"66041001","วรวุฒิ เพ็ชรราย",,20,""',
        '"66040188","ณัฐพล ศิริพันธ์",,20,""',
        '"66040233","ฉัตรชัย พรหมศิริ",,20,""',
      ];
    }

    const templateContent = '\uFEFF' + [
      'รหัสนักเรียน,ชื่อ-นามสกุล,คะแนนที่ได้,คะแนนเต็ม,ข้อเสนอแนะอาจารย์',
      ...rows,
    ].join('\r\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `เทมเพลตคะแนน_${assignmentTitle.replace(/[^a-zA-Z0-9ก-๙]/g, '_').slice(0, 20)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpdateRecordField = (id: string, field: 'score' | 'feedback', value: any) => {
    setEditedRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;

        if (field === 'score') {
          const scoreNum = parseFloat(value);
          const valid = isNaN(scoreNum) ? 0 : scoreNum;
          const warning = valid > rec.maxScore ? `คะแนนที่ระบุ (${valid}) เกินคะแนนเต็ม (${rec.maxScore})` : undefined;
          return {
            ...rec,
            score: valid,
            hasWarning: !!warning,
            warningMessage: warning,
          };
        } else if (field === 'feedback') {
          return {
            ...rec,
            feedback: String(value),
          };
        }
        return rec;
      })
    );
  };

  const handleRemoveRecord = (id: string) => {
    setEditedRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Filtered view list
  const filteredRecords = useMemo(() => {
    if (filterMode === 'matched') return editedRecords.filter((r) => r.isMatched);
    if (filterMode === 'warning') return editedRecords.filter((r) => r.hasWarning);
    return editedRecords;
  }, [editedRecords, filterMode]);

  // Statistics
  const totalCount = editedRecords.length;
  const matchedCount = editedRecords.filter((r) => r.isMatched).length;
  const warningCount = editedRecords.filter((r) => r.hasWarning).length;
  const averageScore =
    totalCount > 0
      ? (editedRecords.reduce((acc, curr) => acc + curr.score, 0) / totalCount).toFixed(1)
      : '0.0';

  const handleApply = async () => {
    if (editedRecords.length === 0) return;
    setIsProcessing(true);
    try {
      await onApplyBatchGrades(editedRecords, {
        pushNotifications,
        createNewEntries,
      });
      onClose();
    } catch (err) {
      console.error('Batch grading error:', err);
      alert('เกิดข้อผิดพลาดในการนำเข้าคะแนน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <span className="material-symbols-outlined text-[24px]">upload_file</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  นำเข้าคะแนนเป็นกลุ่ม (Batch CSV Grade Import)
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase">
                  CSV / Excel
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {assignmentTitle} &bull; {subjectTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Helper Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">เครื่องมือตัวช่วย:</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="ดาวน์โหลดไฟล์ CSV พร้อมรหัสและรายชื่อนักเรียนในห้องเพื่อนำไปกรอกคะแนน"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600">download</span>
                <span>ดาวน์โหลดเทมเพลต CSV</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="ทดลองโหลดชุดข้อมูลจำลองเพื่อดูตัวอย่างการแสดงผล"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600">dataset</span>
                <span>โหลดข้อมูลตัวอย่าง</span>
              </button>
            </div>

            {hasParsed && (
              <button
                type="button"
                onClick={() => {
                  setRawText('');
                  setFileName(null);
                  setEditedRecords([]);
                  setHasParsed(false);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                <span>ล้างข้อมูล</span>
              </button>
            )}
          </div>

          {/* Import Modes: File Upload vs Raw Paste */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">cloud_upload</span>
                <span>อัปโหลดไฟล์ (.csv / .tsv)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">content_paste</span>
                <span>วางตารางจาก Excel / Sheets</span>
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/60 scale-[0.99]'
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[28px]">attach_file</span>
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {fileName ? (
                    <span className="text-emerald-700 flex items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>เลือกไฟล์: {fileName}</span>
                    </span>
                  ) : (
                    'ลากไฟล์ CSV มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์'
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  รองรับไฟล์ .csv หรือ .tsv ที่ส่งออกจาก Microsoft Excel, Google Sheets, หรือระบบสารสนเทศสถานศึกษา
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => handleParseRawText(e.target.value)}
                  placeholder={`วางข้อมูลคะแนนที่คัดลอกมาจาก Excel หรือ Google Sheets เช่น:\n66041001\tวรวุฒิ เพ็ชรราย\t19\t20\tผลงานยอดเยี่ยม\n66040188\tณัฐพล ศิริพันธ์\t18\t20\tดีมาก`}
                  className="w-full font-mono text-xs p-3.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-slate-50/50"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>รองรับทั้งการคั่นด้วย Tab (เมื่อก๊อปปี้จาก Excel/Sheets) และเครื่องหมายจุลภาค (Comma)</span>
                  <span>{rawText ? `${rawText.split('\n').filter((l) => l.trim()).length} บรรทัด` : '0 บรรทัด'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Parsed Preview Section */}
          {hasParsed && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">จำนวนทั้งหมด</div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                    {totalCount} <span className="text-xs font-normal text-slate-500">คน</span>
                  </div>
                </div>

                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <div className="text-[11px] font-bold text-emerald-700">ตรงกับงานที่ส่ง</div>
                  <div className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5">
                    {matchedCount} <span className="text-xs font-normal text-emerald-600">คน</span>
                  </div>
                </div>

                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                  <div className="text-[11px] font-bold text-amber-800">รายการแจ้งเตือน/ใหม่</div>
                  <div className="text-xl font-extrabold text-amber-800 font-mono mt-0.5">
                    {warningCount} <span className="text-xs font-normal text-amber-700">คน</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200">
                  <div className="text-[11px] font-bold text-blue-700">คะแนนเฉลี่ย</div>
                  <div className="text-xl font-extrabold text-blue-800 font-mono mt-0.5">
                    {averageScore} <span className="text-xs font-normal text-blue-600">/ {defaultMaxScore}</span>
                  </div>
                </div>
              </div>

              {/* Table Controls & Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterMode === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ทั้งหมด ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('matched')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterMode === 'matched'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ตรงกับนักเรียน ({matchedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('warning')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterMode === 'warning'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    มีข้อสังเกต ({warningCount})
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  * สามารถแก้ไขคะแนนและข้อคิดเห็นในตารางก่อนกดยืนยันได้ทันที
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3">รหัสนักเรียน</th>
                        <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                        <th className="py-2.5 px-3 w-28">คะแนนที่ได้</th>
                        <th className="py-2.5 px-3 w-20 text-center">เต็ม</th>
                        <th className="py-2.5 px-3">ข้อคิดเห็น / ข้อเสนอแนะ</th>
                        <th className="py-2.5 px-3 text-center">สถานะ</th>
                        <th className="py-2.5 px-2 w-10 text-center">ลบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            ไม่พบรายการที่ตรงกับเงื่อนไขการกรอง
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((rec, idx) => (
                          <tr
                            key={rec.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              rec.hasWarning ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {rec.studentId}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {rec.studentName}
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={rec.maxScore}
                                value={rec.score}
                                onChange={(e) => handleUpdateRecordField(rec.id, 'score', e.target.value)}
                                className={`w-20 px-2 py-1 rounded-lg border font-mono font-bold text-sm text-center focus:outline-hidden ${
                                  rec.score > rec.maxScore
                                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                                    : 'border-slate-300 focus:border-emerald-500'
                                }`}
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                              {rec.maxScore}
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={rec.feedback}
                                onChange={(e) => handleUpdateRecordField(rec.id, 'feedback', e.target.value)}
                                placeholder="เพิ่มข้อคิดเห็น..."
                                className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500 bg-slate-50/50"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {rec.isMatched ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                  <span>{rec.isExistingGraded ? 'ตรวจซ้ำ' : 'พร้อมบันทึก'}</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold"
                                  title={rec.warningMessage}
                                >
                                  <span className="material-symbols-outlined text-[12px]">person_add</span>
                                  <span>รายการใหม่</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRecord(rec.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="ลบรายการนี้"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Processing Options */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>
                    <b>ส่งการแจ้งเตือนสด (Push Real-time Notification)</b> ไปยังนักเรียนและผู้ปกครองที่เกี่ยวข้องทันที
                  </span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={createNewEntries}
                    onChange={(e) => setCreateNewEntries(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>
                    <b>เพิ่มประวัติการตรวจให้อัตโนมัติ</b> สำหรับนักเรียนในไฟล์ที่ยังไม่เคยมีรายการส่งงานในระบบ
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {hasParsed ? (
              <span>
                พร้อมนำเข้า <b>{editedRecords.length}</b> รายการ
              </span>
            ) : (
              <span>กรุณาเลือกไฟล์หรือวางข้อความเพื่อเริ่มต้น</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              disabled={!hasParsed || editedRecords.length === 0 || isProcessing}
              onClick={handleApply}
              className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isProcessing ? 'sync' : 'done_all'}
              </span>
              <span>
                {isProcessing
                  ? 'กำลังประมวลผลคะแนน...'
                  : `ยืนยันนำเข้าคะแนน (${editedRecords.length} คน)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
