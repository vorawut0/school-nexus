import React, { useState } from 'react';
import { getSubmissionFileDetails, SubmissionDetailsData, SubmissionFileArchiveItem } from '../../data/mockStudentSubmissions';
import { AssignmentRubric } from '../../services/googleSheetsService';

export interface SubmissionModalItem {
  id: string;
  assignmentId?: string;
  studentName: string;
  thaiName: string;
  studentId: string;
  avatar: string;
  assignmentTitle: string;
  subject: string;
  submittedDate: string;
  fileAttachment: string;
  maxScore: number;
  currentScore?: number;
  status: 'pending' | 'graded';
  feedback?: string;
  fileBlobUrl?: string;
}

interface StudentSubmissionFileModalProps {
  submission: SubmissionModalItem | null;
  activeRubric?: AssignmentRubric | null;
  onClose: () => void;
  onSaveGrade?: (submissionId: string, score: number, feedback: string) => void;
}

export const StudentSubmissionFileModal: React.FC<StudentSubmissionFileModalProps> = ({
  submission,
  activeRubric,
  onClose,
  onSaveGrade,
}) => {
  if (!submission) return null;

  const fileDetails: SubmissionDetailsData = getSubmissionFileDetails(
    submission.fileAttachment,
    submission.thaiName || submission.studentName,
    submission.subject
  );

  // States
  const [activeTab, setActiveTab] = useState<'preview' | 'archive_tree' | 'metrics' | 'readme'>(
    fileDetails.category === 'zip' ? 'archive_tree' : 'preview'
  );
  const [selectedArchiveFile, setSelectedArchiveFile] = useState<SubmissionFileArchiveItem | null>(
    fileDetails.archiveFiles && fileDetails.archiveFiles.length > 0 ? fileDetails.archiveFiles[0] : null
  );
  const [activePdfPage, setActivePdfPage] = useState<number>(1);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  
  // Inline grading within file viewer
  const [scoreInput, setScoreInput] = useState<string>(
    submission.currentScore !== undefined ? String(submission.currentScore) : ''
  );
  const [feedbackInput, setFeedbackInput] = useState<string>(submission.feedback || '');
  const [isGradingOpen, setIsGradingOpen] = useState<boolean>(true);
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  // Download File Handler
  const handleDownloadFile = () => {
    try {
      let content = '';
      let mimeType = 'text/plain';
      const fileName = fileDetails.fileName;

      if (fileDetails.category === 'code') {
        content = fileDetails.codeSnippet || `# School Nexus Submission: ${fileName}\n# Student: ${submission.thaiName}`;
        mimeType = 'text/plain';
      } else if (fileDetails.category === 'zip') {
        content = JSON.stringify(fileDetails, null, 2);
        mimeType = 'application/json';
      } else {
        content = `School Nexus Submission File: ${fileName}\nStudent: ${submission.thaiName} (${submission.studentId})\nSubject: ${submission.subject}\nSubmitted: ${submission.submittedDate}\nSummary: ${fileDetails.summary || '-'}`;
        mimeType = 'text/plain';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = submission.fileBlobUrl || URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (!submission.fileBlobUrl) URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Copy Code Handler
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Submit Grade from within File Viewer
  const handleSaveGradeInternal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(scoreInput);
    if (isNaN(parsed) || parsed < 0 || parsed > submission.maxScore) {
      alert(`กรุณากรอกคะแนนระหว่าง 0 ถึง ${submission.maxScore}`);
      return;
    }

    if (onSaveGrade) {
      onSaveGrade(submission.id, parsed, feedbackInput);
      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 3000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#0f172a] text-slate-100 w-full max-w-6xl max-h-[94vh] rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col animate-scaleIn relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#1e293b] p-4 sm:p-5 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <img
              src={submission.avatar}
              alt={submission.thaiName}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-white">{submission.thaiName}</h2>
                <span className="text-xs text-slate-400 font-mono">({submission.studentId})</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {submission.subject}
                </span>
                {submission.status === 'graded' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ตรวจแล้ว: {submission.currentScore}/{submission.maxScore}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    รอตรวจ (เต็ม {submission.maxScore} คะแนน)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                <span>งาน: <b className="text-white">{submission.assignmentTitle}</b></span>
                <span>•</span>
                <span className="text-slate-400">ส่งเมื่อ: {submission.submittedDate}</span>
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={handleDownloadFile}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              title="ดาวน์โหลดไฟล์งานลงเครื่อง"
            >
              <span className="material-symbols-outlined text-[16px]">
                {downloadSuccess ? 'check_circle' : 'download'}
              </span>
              <span>{downloadSuccess ? 'ดาวน์โหลดแล้ว' : 'ดาวน์โหลดไฟล์'}</span>
            </button>

            <button
              onClick={() => setIsGradingOpen((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                isGradingOpen
                  ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
              }`}
              title="เปิด/ปิดแถบตรวจให้คะแนน"
            >
              <span className="material-symbols-outlined text-[16px]">rate_review</span>
              <span>{isGradingOpen ? 'ซ่อนแถบให้คะแนน' : 'ให้คะแนน'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-slate-700"
              aria-label="ปิดหน้าต่าง"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* File Information Banner */}
        <div className="bg-[#131d31] px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-400 text-[18px]">
              {fileDetails.category === 'zip'
                ? 'folder_zip'
                : fileDetails.category === 'code'
                ? 'code'
                : fileDetails.category === 'pdf'
                ? 'picture_as_pdf'
                : fileDetails.category === 'image'
                ? 'image'
                : 'description'}
            </span>
            <span className="font-mono font-bold text-white text-xs">{fileDetails.fileName}</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px] font-mono">
              {fileDetails.fileSize}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 text-[11px] uppercase font-mono">
              {fileDetails.category}
            </span>
          </div>

          {/* Navigation Tabs for ZIP or Detailed content */}
          {fileDetails.category === 'zip' && (
            <div className="flex items-center gap-1 bg-slate-850 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setActiveTab('archive_tree')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'archive_tree'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">account_tree</span>
                <span>โครงสร้างไฟล์ ({fileDetails.archiveFiles?.length || 0})</span>
              </button>

              {fileDetails.metrics && (
                <button
                  onClick={() => setActiveTab('metrics')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'metrics'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">analytics</span>
                  <span>ผลการทดสอบ & AI Metrics</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('readme')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'readme'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">description</span>
                <span>รายงาน README</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area + Side Grading Drawer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[460px]">
          {/* Main Viewer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[#0b1120]">
            {/* 1. Summary Box */}
            {fileDetails.summary && (
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
                <span className="material-symbols-outlined text-indigo-400 text-[20px] shrink-0 mt-0.5">
                  info
                </span>
                <div className="text-xs leading-relaxed text-slate-300">
                  <b className="text-white block mb-0.5">สรุปสาระสำคัญของผลงาน:</b>
                  {fileDetails.summary}
                </div>
              </div>
            )}

            {/* 2. CATEGORY: ZIP Archive View */}
            {fileDetails.category === 'zip' && activeTab === 'archive_tree' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* File Tree Left */}
                <div className="bg-[#131d31] rounded-2xl border border-slate-800 p-3 space-y-2 lg:col-span-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                    <span>ไฟล์ทั้งหมดใน Archive</span>
                    <span className="font-mono">{fileDetails.archiveFiles?.length} ไฟล์</span>
                  </div>
                  <div className="space-y-1">
                    {fileDetails.archiveFiles?.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => setSelectedArchiveFile(file)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          selectedArchiveFile?.path === file.path
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="material-symbols-outlined text-[16px] text-indigo-300">
                            {file.type === 'code'
                              ? 'terminal'
                              : file.type === 'doc'
                              ? 'description'
                              : file.type === 'data'
                              ? 'data_object'
                              : 'settings'}
                          </span>
                          <span className="truncate font-mono">{file.name}</span>
                        </div>
                        <span className="text-[10px] opacity-70 font-mono shrink-0">{file.size}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Content Preview Right */}
                <div className="bg-[#131d31] rounded-2xl border border-slate-800 p-4 lg:col-span-2 flex flex-col justify-between">
                  {selectedArchiveFile ? (
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-white">
                            {selectedArchiveFile.path}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                            {selectedArchiveFile.size}
                          </span>
                        </div>
                        {selectedArchiveFile.content && (
                          <button
                            onClick={() => handleCopyCode(selectedArchiveFile.content || '')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {codeCopied ? 'done' : 'content_copy'}
                            </span>
                            <span>{codeCopied ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}</span>
                          </button>
                        )}
                      </div>

                      {selectedArchiveFile.description && (
                        <p className="text-xs text-indigo-300 mb-3 bg-indigo-950/40 p-2 rounded-xl border border-indigo-900/40">
                          {selectedArchiveFile.description}
                        </p>
                      )}

                      {/* Code Area with line numbers */}
                      {selectedArchiveFile.content ? (
                        <div className="bg-[#0b1120] rounded-xl p-3.5 font-mono text-xs text-emerald-300 overflow-x-auto border border-slate-900 max-h-[380px] custom-scrollbar leading-relaxed">
                          <pre className="whitespace-pre">{selectedArchiveFile.content}</pre>
                        </div>
                      ) : (
                        <div className="text-center py-10 text-slate-500 text-xs">
                          ไม่มีข้อมูลตัวอย่างในไฟล์นี้
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      เลือกไฟล์ทางด้านซ้ายเพื่อเปิดดูเนื้อหา
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. CATEGORY: ZIP Metrics & Architecture View */}
            {fileDetails.category === 'zip' && activeTab === 'metrics' && fileDetails.metrics && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/40">
                    <div className="text-[11px] font-bold text-indigo-300">Accuracy (ความแม่นยำ)</div>
                    <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                      {fileDetails.metrics.accuracy}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">ประเมินบนชุดข้อมูล Test Set</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-800/40">
                    <div className="text-[11px] font-bold text-blue-300">Validation Loss</div>
                    <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
                      {fileDetails.metrics.valLoss}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">CrossEntropyLoss</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-800/40">
                    <div className="text-[11px] font-bold text-purple-300">Epochs ที่ฝึกสอน</div>
                    <div className="text-2xl font-black text-purple-300 font-mono mt-1">
                      {fileDetails.metrics.epochs}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">พร้อม Early Stopping</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40">
                    <div className="text-[11px] font-bold text-emerald-300">F1-Score / Macro</div>
                    <div className="text-2xl font-black text-emerald-300 font-mono mt-1">
                      {fileDetails.metrics.f1Score || '0.942'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">สมดุลระหว่าง Precision/Recall</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131d31] border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-white">สถาปัตยกรรมโครงข่ายประสาทเทียม:</div>
                  <div className="p-3 bg-slate-950 rounded-xl font-mono text-indigo-300 border border-slate-800">
                    {fileDetails.metrics.modelArchitecture}
                  </div>
                  <div className="text-slate-400 text-[11px] pt-1">
                    ขนาดชุดข้อมูลฝึกสอน: <b>{fileDetails.metrics.datasetSize}</b>
                  </div>
                </div>
              </div>
            )}

            {/* 4. CATEGORY: README Doc View */}
            {fileDetails.category === 'zip' && activeTab === 'readme' && (
              <div className="bg-[#131d31] p-5 rounded-2xl border border-slate-800 font-sans text-xs text-slate-200 leading-relaxed space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="font-bold text-sm text-white">README.md (เอกสารสรุปโครงการ)</div>
                  <span className="text-[10px] font-mono text-slate-400">Markdown Format</span>
                </div>
                <div className="space-y-2 whitespace-pre-line font-mono text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-900">
                  {fileDetails.archiveFiles?.find((f) => f.name === 'README.md')?.content ||
                    'ไม่มีเอกสาร README.md'}
                </div>
              </div>
            )}

            {/* 5. CATEGORY: Pure Code View (.py, .ts, .js, .sql) */}
            {fileDetails.category === 'code' && (
              <div className="bg-[#131d31] rounded-2xl border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {fileDetails.fileName}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      ภาษา: {fileDetails.language || 'Python'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(fileDetails.codeSnippet || '')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {codeCopied ? 'done' : 'content_copy'}
                    </span>
                    <span>{codeCopied ? 'คัดลอกแล้ว' : 'คัดลอกโค้ดทั้งหมด'}</span>
                  </button>
                </div>

                <div className="bg-[#0b1120] rounded-xl p-4 font-mono text-xs text-emerald-300 overflow-x-auto border border-slate-900 max-h-[420px] custom-scrollbar leading-relaxed">
                  <pre className="whitespace-pre">{fileDetails.codeSnippet}</pre>
                </div>
              </div>
            )}

            {/* 6. CATEGORY: PDF & Report Document Viewer */}
            {fileDetails.category === 'pdf' && fileDetails.pdfPages && (
              <div className="bg-[#131d31] rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-400 text-[20px]">
                      picture_as_pdf
                    </span>
                    <span className="font-bold text-sm text-white">{fileDetails.fileName}</span>
                  </div>
                  {/* Page Navigator */}
                  <div className="flex items-center gap-2">
                    <button
                      disabled={activePdfPage <= 1}
                      onClick={() => setActivePdfPage((p) => Math.max(1, p - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center cursor-pointer"
                    >
                      ‹
                    </button>
                    <span className="text-xs font-mono text-slate-300">
                      หน้า {activePdfPage} / {fileDetails.pdfPages.length}
                    </span>
                    <button
                      disabled={activePdfPage >= fileDetails.pdfPages.length}
                      onClick={() => setActivePdfPage((p) => Math.min(fileDetails.pdfPages!.length, p + 1))}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center cursor-pointer"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* Active PDF Page Content */}
                {(() => {
                  const curr = fileDetails.pdfPages[activePdfPage - 1];
                  if (!curr) return null;
                  return (
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="font-bold text-base text-indigo-300">{curr.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{curr.content}</p>
                      {curr.subsections && curr.subsections.length > 0 && (
                        <div className="pt-2 space-y-2">
                          {curr.subsections.map((sub, idx) => (
                            <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                              <div className="font-bold text-xs text-white mb-1">{sub.title}</div>
                              <div className="text-[11px] text-slate-300 leading-relaxed">{sub.body}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 7. CATEGORY: Images & Design Screenshots */}
            {fileDetails.category === 'image' && (
              <div className="bg-[#131d31] rounded-2xl border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="font-bold text-xs text-white">{fileDetails.fileName}</div>
                  <span className="text-[10px] text-slate-400 font-mono">High Resolution Preview</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
                  <img
                    src={fileDetails.imagePreviewUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000'}
                    alt={fileDetails.fileName}
                    className="max-h-[380px] w-auto object-contain rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Side Panel: Integrated Grading Drawer */}
          {isGradingOpen && (
            <div className="w-full md:w-80 lg:w-96 bg-[#162033] border-t md:border-t-0 md:border-l border-slate-700 p-5 flex flex-col justify-between overflow-y-auto">
              <form onSubmit={handleSaveGradeInternal} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <span className="material-symbols-outlined text-indigo-400 text-[18px]">
                      rate_review
                    </span>
                    <span>ตรวจให้คะแนนผลงาน</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    เต็ม {submission.maxScore} คะแนน
                  </span>
                </div>

                {/* Rubric Reference if available */}
                {activeRubric && (
                  <div className="p-3 bg-indigo-950/50 rounded-2xl border border-indigo-800/60 text-xs space-y-1.5">
                    <div className="font-bold text-indigo-200 flex items-center justify-between">
                      <span>เกณฑ์: {activeRubric.title}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        เต็ม {activeRubric.totalMaxScore}
                      </span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {activeRubric.criteria.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] text-slate-300">
                          <span className="truncate">{c.name}</span>
                          <span className="font-bold text-indigo-400">{c.maxScore} คะแนน</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    คะแนนที่ได้รับ (0 - {submission.maxScore}) <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={submission.maxScore}
                      value={scoreInput}
                      onChange={(e) => setScoreInput(e.target.value)}
                      placeholder={`0 - ${submission.maxScore}`}
                      required
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-base focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setScoreInput(String(submission.maxScore))}
                      className="px-3 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold cursor-pointer"
                    >
                      เต็ม
                    </button>
                  </div>
                </div>

                {/* Quick percentage shortcuts */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setScoreInput(String(Math.round(submission.maxScore * 0.9)))}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                  >
                    90% ({Math.round(submission.maxScore * 0.9)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoreInput(String(Math.round(submission.maxScore * 0.8)))}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                  >
                    80% ({Math.round(submission.maxScore * 0.8)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoreInput(String(Math.round(submission.maxScore * 0.7)))}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                  >
                    70% ({Math.round(submission.maxScore * 0.7)})
                  </button>
                </div>

                {/* Feedback Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ข้อเสนอแนะและคอมเมนต์ (Feedback)
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="เขียนคำแนะนำ คำชมเชย หรือจุดที่ต้องพัฒนาให้นักเรียน..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>

                {isSavedFeedback && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>บันทึกคะแนนและส่งแจ้งเตือนสำเร็จ!</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>บันทึกคะแนน & ซิงค์แจ้งเตือน</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
