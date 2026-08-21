import React, { useState } from 'react';
import { MOCK_ASSIGNMENTS } from '../data/mockData';
import { Assignment } from '../types';
import { AssignmentSummaryChart } from './assignments/AssignmentSummaryChart';

interface AssignmentsViewProps {
  assignments?: Assignment[];
  onOpenAssignmentModal: (assignment: Assignment) => void;
  onOpenCreateTaskModal: () => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments: propAssignments,
  onOpenAssignmentModal,
  onOpenCreateTaskModal,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [csvDownloadFeedback, setCsvDownloadFeedback] = useState<string | null>(null);
  const assignments = propAssignments || MOCK_ASSIGNMENTS;

  const tabs = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'to_submit', label: 'รอส่งงาน' },
    { id: 'in_progress', label: 'กำลังดำเนินการ' },
    { id: 'submitted', label: 'ส่งงานแล้ว' },
    { id: 'overdue', label: 'เกินกำหนดส่ง' },
  ];

  const filteredAssignments = assignments.filter((item) => {
    if (activeTab === 'all') return true;
    return item.status === activeTab;
  });

  const getStatusLabel = (status: Assignment['status'], isLate?: boolean) => {
    switch (status) {
      case 'submitted':
        return isLate ? 'ส่งย้อนหลังแล้ว' : 'ส่งงานแล้ว';
      case 'in_progress':
        return 'กำลังดำเนินการ';
      case 'overdue':
        return 'เกินกำหนดส่ง';
      case 'to_submit':
      default:
        return 'รอส่งงาน';
    }
  };

  const handleDownloadCSV = () => {
    try {
      const listToExport = filteredAssignments.length > 0 ? filteredAssignments : assignments;
      
      const escapeCsvCell = (val: string | number | undefined | null) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const headers = [
        'ลำดับ/ID',
        'รหัสวิชา',
        'ชื่อวิชา',
        'หัวข้องาน/การบ้าน',
        'สถานะ',
        'กำหนดส่ง',
        'คะแนนเต็ม',
        'คะแนนที่ได้',
        'ความคืบหน้า(%)',
        'ส่งงานย้อนหลัง',
        'รายละเอียดงาน',
      ];

      const rows = listToExport.map((a, index) => [
        escapeCsvCell(a.id || index + 1),
        escapeCsvCell(a.subjectCode || '-'),
        escapeCsvCell(a.subject || '-'),
        escapeCsvCell(a.title || '-'),
        escapeCsvCell(getStatusLabel(a.status, a.isLate)),
        escapeCsvCell(a.dueDate || a.dueRelative || '-'),
        escapeCsvCell(a.maxScore ?? 0),
        escapeCsvCell(a.score !== undefined ? a.score : '-'),
        escapeCsvCell(a.progress !== undefined ? `${a.progress}%` : '0%'),
        escapeCsvCell(a.isLate ? 'ใช่ (ส่งย้อนหลัง)' : 'ไม่ใช่'),
        escapeCsvCell(a.description || '-'),
      ]);

      const csvContent = '\uFEFF' + [
        headers.map((h) => `"${h}"`).join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `SchoolNexus_Assignments_${activeTab}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCsvDownloadFeedback(`ดาวน์โหลดรายการงาน (${listToExport.length} รายการ) เป็นไฟล์ CSV เรียบร้อยแล้ว!`);
      setTimeout(() => setCsvDownloadFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const getStatusBadge = (status: Assignment['status'], isLate?: boolean) => {
    switch (status) {
      case 'submitted':
        return (
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0 border border-emerald-200 text-xs font-semibold shadow-2xs">
            <span className="material-symbols-outlined text-[15px] fill-1">check_circle</span>
            <span className="whitespace-nowrap">{isLate ? 'ส่งย้อนหลังแล้ว' : 'ส่งงานแล้ว'}</span>
          </div>
        );
      case 'overdue':
        return (
          <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2.5 py-1 rounded-lg shrink-0 border border-red-200 text-xs font-semibold shadow-2xs">
            <span className="material-symbols-outlined text-[15px] fill-1">error</span>
            <span className="whitespace-nowrap">เกินกำหนดส่ง (Overdue)</span>
          </div>
        );
      case 'in_progress':
        return (
          <div className="flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg shrink-0 border border-orange-200 text-xs font-semibold shadow-2xs">
            <span className="material-symbols-outlined text-[15px]">schedule</span>
            <span className="whitespace-nowrap">กำลังดำเนินการ (Due Soon)</span>
          </div>
        );
      case 'to_submit':
      default:
        return (
          <div className="flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg shrink-0 border border-orange-200 text-xs font-semibold shadow-2xs">
            <span className="material-symbols-outlined text-[15px]">hourglass_top</span>
            <span className="whitespace-nowrap">ใกล้ถึงกำหนด (Due Soon)</span>
          </div>
        );
    }
  };

  const getProgressBarColor = (status: Assignment['status']) => {
    switch (status) {
      case 'submitted':
        return 'bg-[#00694d]';
      case 'overdue':
        return 'bg-[#ba1a1a]';
      case 'in_progress':
      default:
        return 'bg-[#1550d3]';
    }
  };

  return (
    <div className="flex flex-col w-full relative pb-20 sm:pb-24 pt-5 sm:pt-6 px-4 sm:px-6 max-w-[1280px] mx-auto min-h-screen">
      <div className="flex flex-col gap-5 sm:gap-6">
        {/* Header with Title & Action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-[26px] sm:text-[32px] font-bold text-[#121b2e] leading-tight">
              ศูนย์รวมงาน (Tasks & Assignments)
            </h1>
            <p className="text-[#434654] text-[15px]">
              จัดการ ตรวจสอบกำหนดส่ง และอัปโหลดส่งไฟล์งานจากทุกอุปกรณ์
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* CSV Download Button */}
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 font-semibold text-[13px] sm:text-[14px] shadow-2xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              title="ส่งออกรายการงานทั้งหมดเป็นไฟล์ CSV สำหรับ Excel, Google Sheets"
            >
              <span className="material-symbols-outlined text-[18px] text-[#00875a]">download</span>
              <span className="whitespace-nowrap">ดาวน์โหลด CSV</span>
            </button>

            {/* Add Task Button */}
            <button
              type="button"
              onClick={onOpenCreateTaskModal}
              className="px-3.5 py-2 rounded-xl bg-[#1550d3] text-white font-semibold text-[13px] sm:text-[14px] shadow-sm hover:bg-[#1a53d6] flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="whitespace-nowrap">เพิ่มงานใหม่</span>
            </button>
          </div>
        </div>

        {/* CSV Download Toast / Banner Feedback */}
        {csvDownloadFeedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-fadeIn shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">
                check_circle
              </span>
              <span>{csvDownloadFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setCsvDownloadFeedback(null)}
              className="text-emerald-700 hover:text-emerald-950 text-xs px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Small Summary Chart: Ratio of Completed vs Pending */}
        <AssignmentSummaryChart
          assignments={assignments}
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
        />

        {/* Filter Tabs (Horizontal Scrollable) */}
        <div className="overflow-x-auto no-scrollbar flex gap-2 pb-1 snap-x">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`snap-start shrink-0 px-4 py-2 rounded-full text-[13px] sm:text-[14px] font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#1550d3] text-white shadow-sm scale-102'
                    : 'bg-[#e9edff] text-[#434654] hover:bg-[#e1e8ff] hover:text-[#121b2e]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Assignment Cards List */}
        <div className="flex flex-col gap-3.5">
          {filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#f1f3ff] text-[#1550d3] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <h3 className="font-bold text-lg text-[#121b2e] mb-1">
                ไม่มีรายการงานในหมวดหมู่นี้
              </h3>
              <p className="text-sm text-[#434654]">
                คุณได้จัดการภาระงานในกลุ่มนี้เรียบร้อยแล้ว ยอดเยี่ยมมาก!
              </p>
            </div>
          ) : (
            filteredAssignments.map((as) => {
              const isOverdue = as.status === 'overdue';
              const fileCount = as.attachments?.length || as.attachmentsCount || 0;

              return (
                <div
                  key={as.id}
                  onClick={() => onOpenAssignmentModal(as)}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3.5 border border-slate-200/80 cursor-pointer relative overflow-hidden group hover:-translate-y-0.5"
                >
                  {/* Decorative gradient corner on hover */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#1550d3]/10 to-transparent rounded-bl-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-0" />

                  {/* Header Row: Subject, Title, Status */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-md w-fit"
                          style={{
                            backgroundColor: `${as.categoryColor}15`,
                            color: as.categoryColor,
                          }}
                        >
                          {as.subject}
                        </span>
                        {fileCount > 0 && (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">attach_file</span>
                            <span>{fileCount} ไฟล์แนบ</span>
                          </span>
                        )}
                        {as.lastCommitSha && (
                          <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">code</span>
                            <span>Commit: {as.lastCommitSha.substring(0, 7)}</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-[18px] sm:text-[20px] font-bold text-[#121b2e] truncate group-hover:text-[#1550d3] transition-colors mt-0.5">
                        {as.title}
                      </h3>
                    </div>

                    {getStatusBadge(as.status, as.isLate)}
                  </div>

                  {/* Due date info */}
                  <div
                    className={`flex items-center gap-1.5 text-[13px] font-medium ${
                      isOverdue ? 'text-[#ba1a1a]' : 'text-[#434654]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      {isOverdue ? 'event_busy' : 'event'}
                    </span>
                    <span>{as.dueRelative}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="flex justify-between items-center text-[12px] font-semibold text-[#434654]">
                      <span>ความคืบหน้า</span>
                      <span className="text-[#121b2e] font-bold">{as.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#f1f3ff] rounded-full overflow-hidden border border-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 relative ${getProgressBarColor(
                          as.status
                        )}`}
                        style={{ width: `${as.progress}%` }}
                      >
                        {as.progress > 0 && as.progress < 100 && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Row: Score */}
                  <div className="mt-1 flex justify-between items-center text-[12px] text-[#737686] pt-2 border-t border-slate-100">
                    <span className={`text-[11px] font-medium flex items-center gap-1 ${
                      isOverdue ? 'text-amber-700 font-semibold' : 'text-[#1550d3]'
                    }`}>
                      <span>
                        {isOverdue 
                          ? 'คลิกเพื่อยื่นส่งงานย้อนหลัง & อัปโหลดไฟล์' 
                          : 'คลิกเพื่อดูรายละเอียดและอัปโหลดส่งงาน'}
                      </span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </span>
                    <span className="font-semibold text-[#121b2e]">
                      คะแนน: {as.currentScore}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
