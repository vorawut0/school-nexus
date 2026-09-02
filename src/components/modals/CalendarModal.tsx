import React from 'react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const events = [
    { date: '18 ส.ค. 2569', title: 'กำหนดส่ง Coding Project (วิทยาการคำนวณ)', type: 'exam', color: 'bg-purple-100 text-purple-700' },
    { date: '22 ส.ค. 2569', title: 'ส่งแบบจำลอง UI Design Prototype', type: 'assignment', color: 'bg-emerald-100 text-emerald-700' },
    { date: '28 ส.ค. 2569', title: 'กิจกรรม Hackathon Smart School 2026', type: 'event', color: 'bg-blue-100 text-blue-700' },
    { date: '01 ก.ย. 2569', title: 'สอบกลางภาค (Midterm Examination)', type: 'exam', color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-scaleIn">
        <div className="p-5 sm:p-6 bg-[#f9f9ff] border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#1550d3] text-2xl">
              event
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#121b2e]">ปฏิทินกิจกรรมและการสอบ</h2>
              <p className="text-xs text-[#434654]">สิงหาคม - กันยายน 2569</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-3 overflow-y-auto">
          {events.map((ev, i) => (
            <div key={i} className="p-4 rounded-2xl border border-slate-200 flex items-start gap-3 hover:bg-slate-50 transition-colors">
              <div className="p-2 rounded-xl bg-[#f1f3ff] text-[#1550d3] text-center font-bold text-xs shrink-0 w-20">
                {ev.date}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[#121b2e] leading-snug">{ev.title}</h4>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${ev.color}`}>
                  {ev.type.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
