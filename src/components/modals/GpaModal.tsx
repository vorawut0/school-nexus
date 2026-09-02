import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { GpaAnalyticsChart } from '../analytics/GpaAnalyticsChart';

interface GpaModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const GpaModal: React.FC<GpaModalProps> = ({ user, isOpen, onClose }) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'stem' | 'language' | 'arts'>('all');
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!isOpen) return null;

  const grades = [
    { code: 'CS30201', name: 'วิทยาการคำนวณ & AI ประยุกต์', credit: 1.5, grade: '4.0', score: 96, category: 'stem', teacher: 'ดร.สมชาย วิศวกรรม' },
    { code: 'DS20104', name: 'การออกแบบส่วนติดต่อผู้ใช้ (UI/UX)', credit: 1.0, grade: '4.0', score: 98, category: 'arts', teacher: 'อ.อรทัย ดิจิทัล' },
    { code: 'MM30102', name: 'Multimedia Production', credit: 1.5, grade: '3.5', score: 84, category: 'arts', teacher: 'อ.พงศธร มัลติมีเดีย' },
    { code: 'MA30101', name: 'คณิตศาสตร์ขั้นสูง & แคลคูลัส', credit: 2.0, grade: '4.0', score: 95, category: 'stem', teacher: 'ดร.พรพิมล คณานุรักษ์' },
    { code: 'SC30101', name: 'ฟิสิกส์ประยุกต์และทฤษฎีควอนตัม', credit: 1.5, grade: '4.0', score: 92, category: 'stem', teacher: 'ดร.วิชาญ วิทยาศาสตร์' },
    { code: 'EN30101', name: 'ภาษาอังกฤษเพื่อการสื่อสารระดับสากล', credit: 1.0, grade: '4.0', score: 94, category: 'language', teacher: 'Ms. Sarah Jenkins' },
  ];

  const filteredGrades = grades.filter((g) => {
    if (selectedFilter === 'all') return true;
    return g.category === selectedFilter;
  });

  const baseGpa = user.gpa || 3.92;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summaryText = `[School Nexus Official Transcript Summary]\nนักเรียน: ${user.thaiName || user.name} (${user.studentId})\nGPAX สะสม: ${baseGpa.toFixed(2)}\nหน่วยกิตสะสม: 84.5 หน่วยกิต\nสถานะ: เกียรตินิยมอันดับ 1 (Top 2% สายวิทย์-คอมฯ)\nออกเอกสาร: ${new Date().toLocaleDateString('th-TH')}`;
    navigator.clipboard?.writeText(summaryText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[92vh] animate-scaleIn my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#f0f4ff] via-[#f9f9ff] to-white border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1550d3] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[26px]">
                analytics
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#121b2e]">
                  รายงานและวิเคราะห์ผลการเรียน (GPA & Academic Analytics)
                </h2>
                <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                  D3 / Recharts Engine
                </span>
              </div>
              <p className="text-xs text-[#434654] mt-0.5">
                {user.thaiName || user.name} • รหัสนักเรียน {user.studentId} • แผนการเรียนวิทยาศาสตร์-เทคโนโลยี
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="คัดลอกสรุปผลการเรียน"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
              <span className="hidden sm:inline">{copiedNotification ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="พิมพ์รายงานผลการเรียน"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span className="hidden sm:inline">พิมพ์ / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer ml-1"
              title="ปิดหน้าต่าง"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          {/* Top Banner: GPA Summary & Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-[#1550d3] to-[#0a2e8a] text-white p-5 rounded-2xl flex justify-between items-center shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-3 translate-y-3 pointer-events-none">
                <span className="material-symbols-outlined text-[90px]">school</span>
              </div>
              <div className="relative z-10">
                <div className="text-[11px] text-white/80 uppercase font-semibold tracking-wider">
                  เกรดเฉลี่ยสะสม (GPAX)
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono mt-0.5">
                  {baseGpa.toFixed(2)}
                </div>
                <div className="text-xs text-[#b5c4ff] mt-1">อันดับ Top 1.8% ของสายชั้น</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl backdrop-blur-md shrink-0 shadow-inner">
                🏅
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                  หน่วยกิตสะสมที่ผ่าน
                </span>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
                  84.5 <span className="text-sm font-normal text-slate-500">/ 100.0</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '84.5%' }} />
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>ความก้าวหน้าหลักสูตร</span>
                  <span className="font-bold text-emerald-700">84.5%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                  สถานะการรับรองเกียรตินิยม
                </span>
                <div className="text-base font-bold text-amber-900 mt-1 flex items-center gap-1.5">
                  <span>🏆</span>
                  <span>เกียรตินิยมอันดับ 1</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 bg-amber-50 border border-amber-200/60 p-2 rounded-xl text-amber-900">
                มีสิทธิ์รับทุนการศึกษาความเป็นเลิศทางวิชาการและโควตาเข้าศึกษาต่อระดับอุดมศึกษา
              </div>
            </div>
          </div>

          {/* Recharts Analytics Section */}
          <div className="bg-slate-50/60 rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
            <GpaAnalyticsChart user={user} variant="full" />
          </div>

          {/* Current Semester Courses & Grades Table */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-[#121b2e] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#1550d3]">list_alt</span>
                  <span>ผลการเรียนรายวิชา ภาคเรียนปัจจุบัน (ม.6 ภาคเรียนที่ 1)</span>
                </h4>
                <p className="text-xs text-slate-500">6 รายวิชา • รวม 8.5 หน่วยกิต</p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                {[
                  { id: 'all', label: 'ทั้งหมด (6)' },
                  { id: 'stem', label: 'วิทย์-คณิต-คอม' },
                  { id: 'language', label: 'ภาษา' },
                  { id: 'arts', label: 'ออกแบบ' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      selectedFilter === tab.id
                        ? 'bg-white text-[#1550d3] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs sm:text-sm bg-white shadow-xs">
              {filteredGrades.map((g) => (
                <div
                  key={g.code}
                  className="p-3.5 sm:p-4 flex justify-between items-center hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5 border border-blue-100">
                      {g.credit} Cr
                    </div>
                    <div>
                      <div className="font-bold text-[#121b2e] text-sm">{g.name}</div>
                      <div className="text-[11px] text-[#737686] flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{g.code}</span>
                        <span>•</span>
                        <span>{g.teacher}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-mono font-bold text-slate-800">{g.score} / 100</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">คะแนนสะสม 96%</div>
                    </div>
                    <span className="px-3 py-1.5 bg-[#20C997]/15 text-[#00694d] font-bold rounded-xl font-mono text-sm border border-[#20C997]/30 shadow-xs">
                      เกรด {g.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
