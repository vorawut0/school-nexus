import React from 'react';
import { UserProfile } from '../../types';

interface GpaModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const GpaModal: React.FC<GpaModalProps> = ({ user, isOpen, onClose }) => {
  if (!isOpen) return null;

  const grades = [
    { code: 'CS30201', name: 'วิทยาการคำนวณ', credit: 1.5, grade: '4.0', score: 94 },
    { code: 'DS20104', name: 'การออกแบบ (UI/UX)', credit: 1.0, grade: '4.0', score: 91 },
    { code: 'MM30102', name: 'Multimedia Production', credit: 1.5, grade: '3.5', score: 84 },
    { code: 'MA30101', name: 'คณิตศาสตร์ขั้นสูง', credit: 2.0, grade: '4.0', score: 96 },
    { code: 'SC30101', name: 'ฟิสิกส์ประยุกต์', credit: 1.5, grade: '4.0', score: 90 },
    { code: 'EN30101', name: 'ภาษาอังกฤษเพื่อการสื่อสาร', credit: 1.0, grade: '4.0', score: 92 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#f9f9ff] border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#1550d3] text-2xl">
              assessment
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#121b2e]">
                รายงานผลการเรียน (Official Transcript)
              </h2>
              <p className="text-xs text-[#434654]">{user.name} • {user.studentId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* GPA Summary Card */}
        <div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-[#1550d3] text-white p-5 rounded-2xl flex justify-between items-center shadow-md">
            <div>
              <div className="text-xs text-white/80 uppercase font-semibold tracking-wider">
                เกรดเฉลี่ยสะสม (GPAX)
              </div>
              <div className="text-3xl font-bold">{user.gpa}</div>
              <div className="text-xs text-[#b5c4ff] mt-0.5">หน่วยกิตสะสม: 84.5 หน่วยกิต</div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl backdrop-blur-md">
              🏅
            </div>
          </div>

          {/* Grades Table */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-[#737686] uppercase tracking-wider">
              ผลการเรียนรายวิชา ภาคเรียนปัจจุบัน
            </h4>
            <div className="flex flex-col divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs sm:text-sm">
              {grades.map((g) => (
                <div key={g.code} className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-[#121b2e]">{g.name}</div>
                    <div className="text-[11px] text-[#737686]">{g.code} • {g.credit} หน่วยกิต</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#737686]">{g.score}/100</span>
                    <span className="px-2.5 py-1 bg-[#20C997]/15 text-[#00694d] font-bold rounded-lg">
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
