import React, { useState } from 'react';
import { Assignment, UserProfile } from '../../types';

interface ParentTasksViewProps {
  user: UserProfile;
  assignments: Assignment[];
}

export const ParentTasksView: React.FC<ParentTasksViewProps> = ({ user, assignments }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const [showContactModal, setShowContactModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredTasks = assignments.filter((item) => {
    if (filter === 'pending') {
      return item.status === 'to_submit' || item.status === 'in_progress' || item.status === 'overdue';
    }
    if (filter === 'submitted') {
      return item.status === 'submitted';
    }
    return true;
  });

  const pendingCount = assignments.filter(
    (a) => a.status === 'to_submit' || a.status === 'in_progress' || a.status === 'overdue'
  ).length;

  return (
    <div className="flex flex-col w-full relative pb-20 sm:pb-24 pt-5 sm:pt-6 px-4 sm:px-6 max-w-[1280px] mx-auto min-h-screen">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#121b2e] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slideDown">
          <span className="material-symbols-outlined text-[#20C997] text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold border border-amber-200">
                โหมดติดตามสำหรับผู้ปกครอง (Parent Monitor)
              </span>
              <span className="text-xs text-[#737686]">
                นักเรียนในความดูแล: {user.childName || 'วรวุฒิ เพ็ชรราย'} (ม.6/1)
              </span>
            </div>
            <h1 className="text-[26px] sm:text-[32px] font-bold text-[#121b2e] leading-tight">
              ติดตามการบ้าน & ภาระงานของบุตรหลาน
            </h1>
            <p className="text-[#434654] text-[15px]">
              ตรวจสอบรายการการบ้าน กำหนดส่ง และสถานะการตรวจคะแนนเพื่อช่วยดูแลการเรียนรู้
            </p>
          </div>

          <button
            onClick={() => setShowContactModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>ติดต่ออาจารย์ประจำวิชา</span>
          </button>
        </div>

        {/* Notice Banner */}
        <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
          <span className="material-symbols-outlined text-[#1550d3] text-[22px] shrink-0 mt-0.5">info</span>
          <div>
            <strong>คำแนะนำสำหรับผู้ปกครอง:</strong> หน้านี้จัดทำขึ้นเพื่อให้ผู้ปกครองสามารถติดตามภาระงานของบุตรหลานได้อย่างใกล้ชิด
            โดยระบบจะแสดงสถานะการส่งงานและคะแนนแบบเรียลไทม์ (การส่งงานและอัปโหลดไฟล์จะทำผ่านบัญชีของนักเรียนโดยตรง)
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[11px] text-[#737686] font-semibold">งานทั้งหมดในภาคเรียนนี้</span>
            <div className="text-[22px] font-bold text-[#121b2e]">{assignments.length} <span className="text-xs text-[#737686] font-normal">รายการ</span></div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[11px] text-[#737686] font-semibold">การบ้านที่ยังค้างส่ง</span>
            <div className="text-[22px] font-bold text-amber-600">{pendingCount} <span className="text-xs text-[#737686] font-normal">รายการ</span></div>
            <span className="text-[10px] text-amber-700 font-semibold">ควรส่งตามกำหนดเวลา</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-[#737686] font-semibold">ส่งงานเรียบร้อยแล้ว</span>
            <div className="text-[22px] font-bold text-[#00694d]">
              {assignments.filter((a) => a.status === 'submitted').length} <span className="text-xs text-[#737686] font-normal">รายการ</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">ตรวจแล้วและรอตรวจ</span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'การบ้านทั้งหมด' },
            { id: 'pending', label: 'ที่ต้องทำ / ยังไม่ส่ง' },
            { id: 'submitted', label: 'ส่งแล้ว / มีคะแนนแล้ว' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                filter === tab.id
                  ? 'bg-[#121b2e] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Task Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((as) => (
            <div
              key={as.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">{as.subject}</span>
                  <h3 className="font-bold text-[15px] text-[#121b2e] mt-0.5">{as.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{as.description}</p>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 shadow-2xs ${
                    as.status === 'submitted'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : as.status === 'overdue'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {as.status === 'submitted' ? 'check_circle' : as.status === 'overdue' ? 'error' : 'hourglass_top'}
                  </span>
                  <span>
                    {as.status === 'submitted'
                      ? 'ส่งแล้ว (Submitted)'
                      : as.status === 'overdue'
                      ? 'เกินกำหนด (Overdue)'
                      : 'ใกล้กำหนดส่ง (Due Soon)'}
                  </span>
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col gap-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>กำหนดส่ง:</span>
                  <span className="font-semibold text-[#121b2e]">{as.dueDate}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>คะแนนเต็ม:</span>
                  <span className="font-bold text-[#1550d3]">{as.points} คะแนน</span>
                </div>
                {as.submittedAt && (
                  <div className="flex justify-between text-slate-600">
                    <span>ส่งเมื่อ:</span>
                    <span className="text-emerald-700 font-medium">{as.submittedAt}</span>
                  </div>
                )}
                {as.currentScore && (
                  <div className="flex justify-between text-slate-600">
                    <span>ผลการตรวจ:</span>
                    <span className="font-bold text-[#00694d]">{as.currentScore}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Teacher Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-[#121b2e]">ติดต่ออาจารย์ที่ปรึกษา / ประจำวิชา</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1550d3] flex items-center justify-center font-bold text-lg">
                ดร.
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#121b2e]">ดร. สมนึก เจริญศิลป์</h4>
                <div className="text-xs text-slate-500">อาจารย์ที่ปรึกษา ชั้น ม.6/1</div>
                <div className="text-[11px] text-[#1550d3] font-mono mt-0.5">somnuk.c@schoolnexus.ac.th</div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121b2e] block mb-1">ข้อความถึงอาจารย์</label>
              <textarea
                placeholder="สอบถามเกี่ยวกับความคืบหน้าของการบ้าน หรือปรึกษาเรื่องการเรียน..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-[#1550d3]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  showToast('ส่งข้อความถึงอาจารย์ที่ปรึกษาเรียบร้อยแล้ว');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                ส่งข้อความ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
