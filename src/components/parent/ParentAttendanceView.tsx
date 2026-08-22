import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { pushRealtimeNotification } from '../../services/firebaseService';

interface ParentAttendanceViewProps {
  user: UserProfile;
}

interface LeaveRequest {
  id: string;
  type: 'sick' | 'personal' | 'official';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  submittedDate: string;
  hasAttachment: boolean;
}

const INITIAL_LEAVE_HISTORY: LeaveRequest[] = [
  {
    id: 'leave-1',
    type: 'sick',
    startDate: '10 ส.ค. 2026',
    endDate: '10 ส.ค. 2026',
    reason: 'มีไข้และพบแพทย์ตามนัดหมาย',
    status: 'approved',
    submittedDate: '10 ส.ค. 2026 07:15 น.',
    hasAttachment: true,
  }
];

export const ParentAttendanceView: React.FC<ParentAttendanceViewProps> = ({ user }) => {
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState<'sick' | 'personal' | 'official'>('sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>(INITIAL_LEAVE_HISTORY);

  useEffect(() => {
    const handleReset = () => {
      setLeaveHistory(INITIAL_LEAVE_HISTORY);
      setShowLeaveForm(false);
      setLeaveReason('');
      setStartDate('');
      setEndDate('');
    };
    window.addEventListener('sn_system_full_reset', handleReset);
    return () => {
      window.removeEventListener('sn_system_full_reset', handleReset);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFileName(e.target.files[0].name);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !leaveReason.trim()) {
      showToast('กรุณากรอกวันที่และเหตุผลการลา');
      return;
    }

    const leaveTypeThai = leaveType === 'sick' ? 'ลาป่วย' : leaveType === 'personal' ? 'ลากิจส่วนตัว' : 'ไปราชการ/กิจกรรม';

    const newReq: LeaveRequest = {
      id: `leave-${Date.now()}`,
      type: leaveType,
      startDate: startDate,
      endDate: endDate || startDate,
      reason: leaveReason,
      status: 'pending',
      submittedDate: new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.',
      hasAttachment: !!attachedFileName,
    };

    setLeaveHistory([newReq, ...leaveHistory]);
    setShowLeaveForm(false);
    setLeaveReason('');
    setStartDate('');
    setEndDate('');
    setAttachedFileName(null);
    showToast('ส่งคำร้องขอลาเรียนถึงอาจารย์ที่ปรึกษาและซิงค์การแจ้งเตือนสดเรียบร้อยแล้ว');

    // 1. Real-time Notification for TEACHER
    await pushRealtimeNotification({
      title: '📋 มีคำขอลาหยุดเรียนใหม่ (จากผู้ปกครอง)',
      message: `ผู้ปกครองของ นายวรวุฒิ เพ็ชรระยา ยื่นขอ${leaveTypeThai} วันที่ ${startDate} (เหตุผล: "${leaveReason}")`,
      type: 'attendance',
      priority: 'high',
      role: 'teacher',
      icon: 'event_busy',
    });

    // 2. Real-time Notification for STUDENT
    await pushRealtimeNotification({
      title: '📋 ผู้ปกครองยื่นขอลาเรียนให้คุณแล้ว',
      message: `บันทึกคำขอ${leaveTypeThai} วันที่ ${startDate} ส่งถึงอาจารย์ที่ปรึกษาเรียบร้อยแล้ว`,
      type: 'attendance',
      priority: 'normal',
      role: 'student',
      icon: 'event_busy',
    });
  };

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
              <span className="px-2.5 py-0.5 rounded-full bg-[#00694d]/10 text-[#00694d] text-xs font-bold">
                Parent Portal
              </span>
              <span className="text-xs text-[#737686]">
                ข้อมูลนักเรียนในความดูแล: {user.childName || 'วรวุฒิ เพ็ชรระยา'} (ม.6/1)
              </span>
            </div>
            <h1 className="text-[26px] sm:text-[32px] font-bold text-[#121b2e] leading-tight">
              การเข้าเรียน & แจ้งลาออนไลน์ (Attendance & Leave)
            </h1>
            <p className="text-[#434654] text-[15px]">
              ตรวจสอบเวลาแตะบัตรเข้า-ออกโรงเรียน สถิติการเข้าชั้นเรียน และส่งใบลาเรียนถึงอาจารย์ที่ปรึกษา
            </p>
          </div>

          <button
            onClick={() => setShowLeaveForm(!showLeaveForm)}
            className="px-4 py-2.5 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">
              {showLeaveForm ? 'close' : 'edit_calendar'}
            </span>
            <span>{showLeaveForm ? 'ปิดแบบฟอร์ม' : 'แจ้งลาเรียนออนไลน์'}</span>
          </button>
        </div>

        {/* Leave Form (Collapsible) */}
        {showLeaveForm && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-5 sm:p-6 animate-fadeIn">
            <h3 className="text-base font-bold text-[#121b2e] flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#1550d3]">assignment_add</span>
              <span>ส่งคำร้องขอลาเรียน (สำหรับผู้ปกครอง)</span>
            </h3>

            <form onSubmit={handleSubmitLeave} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#121b2e] block mb-1">ประเภทการลา *</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-[#1550d3]"
                  >
                    <option value="sick">ลาป่วย (Sick Leave)</option>
                    <option value="personal">ลากิจส่วนตัว (Personal Leave)</option>
                    <option value="official">ลากิจพิเศษ / กิจกรรมราชการ</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#121b2e] block mb-1">ตั้งแต่วันที่ *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-[#1550d3]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#121b2e] block mb-1">ถึงวันที่ (ถ้าลาวันเดียวเว้นว่างได้)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-[#1550d3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#121b2e] block mb-1">เหตุผลและรายละเอียดการลา *</label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="ระบุเหตุผลการลา เช่น มีอาการเป็นไข้ หรือมีความจำเป็นต้องเดินทางไปต่างจังหวัด..."
                  rows={3}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-[#1550d3]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#121b2e] block mb-1">แนบใบรับรองแพทย์ / เอกสารประกอบ (ถ้ามี)</label>
                <label className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs text-slate-600">
                  <span className="material-symbols-outlined text-[20px] text-[#1550d3]">upload_file</span>
                  <span>{attachedFileName ? `ไฟล์ที่เลือก: ${attachedFileName}` : 'คลิกเพื่อเลือกไฟล์ (PDF, JPG, PNG) จากเครื่อง'}</span>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  ส่งใบลาเรียนถึงอาจารย์ที่ปรึกษา
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Attendance Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[11px] text-[#737686] font-semibold">สถานะวันนี้ (17 ส.ค.)</span>
            <div className="text-[20px] font-bold text-[#00694d] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#20C997] animate-pulse"></span>
              <span>เข้าเรียนแล้ว</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">แตะประตู 1: 07:42 น.</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[11px] text-[#737686] font-semibold">อัตราการเข้าเรียนเทอมนี้</span>
            <div className="text-[22px] font-bold text-[#1550d3]">100%</div>
            <span className="text-[10px] text-emerald-600 font-semibold">มาเรียนครบทุกคาบ</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[11px] text-[#737686] font-semibold">สถิติมาสาย</span>
            <div className="text-[22px] font-bold text-[#121b2e]">0 <span className="text-xs text-[#737686] font-normal">ครั้ง</span></div>
            <span className="text-[10px] text-slate-500 font-semibold">ตรงเวลาสม่ำเสมอ</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[11px] text-[#737686] font-semibold">ประวัติการลา</span>
            <div className="text-[22px] font-bold text-amber-600">1 <span className="text-xs text-[#737686] font-normal">วัน</span></div>
            <span className="text-[10px] text-amber-700 font-semibold">ลาป่วย (อนุมัติแล้ว)</span>
          </div>
        </div>

        {/* Daily Scan History Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4">
          <h3 className="font-bold text-base text-[#121b2e] flex items-center justify-between">
            <span>บันทึกการแตะบัตรเข้า-ออก 5 วันล่าสุด</span>
            <span className="text-xs text-[#1550d3] font-semibold">โรงเรียนเตรียมอุดมศึกษาน้อมเกล้า</span>
          </h3>

          <div className="flex flex-col divide-y divide-slate-100">
            {[
              { date: 'วันนี้ (จันทร์ 17 ส.ค. 2026)', inTime: '07:42 น. (ประตู 1)', outTime: 'ยังไม่ถึงเวลาเลิกเรียน', status: 'present' },
              { date: 'ศุกร์ 14 ส.ค. 2026', inTime: '07:38 น. (ประตู 1)', outTime: '16:30 น. (ประตู 1)', status: 'present' },
              { date: 'พฤหัสบดี 13 ส.ค. 2026', inTime: '07:45 น. (ประตู 1)', outTime: '16:45 น. (ประตู 2)', status: 'present' },
              { date: 'พุธ 12 ส.ค. 2026', inTime: 'วันหยุดราชการ', outTime: '-', status: 'holiday' },
              { date: 'อังคาร 11 ส.ค. 2026', inTime: '07:40 น. (ประตู 1)', outTime: '16:30 น. (ประตู 1)', status: 'present' },
            ].map((item, idx) => (
              <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${item.status === 'present' ? 'bg-[#00694d]' : 'bg-slate-300'}`}></span>
                  <span className="font-bold text-[#121b2e]">{item.date}</span>
                </div>
                <div className="flex items-center gap-4 pl-4 sm:pl-0 font-mono text-slate-600">
                  <span>เข้า: <strong className="text-emerald-700">{item.inTime}</strong></span>
                  <span>ออก: <strong className="text-slate-700">{item.outTime}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Request History */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-3">
          <h3 className="font-bold text-base text-[#121b2e]">ประวัติการส่งใบลาเรียน</h3>
          <div className="flex flex-col divide-y divide-slate-100">
            {leaveHistory.map((lh) => (
              <div key={lh.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#121b2e]">
                      {lh.type === 'sick' ? 'ลาป่วย' : lh.type === 'personal' ? 'ลากิจส่วนตัว' : 'ลากิจพิเศษ'}
                    </span>
                    <span className="text-slate-500 font-mono">({lh.startDate} - {lh.endDate})</span>
                    {lh.hasAttachment && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#1550d3] text-[10px] font-semibold">
                        มีไฟล์แนบ
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-0.5">{lh.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      lh.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : lh.status === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {lh.status === 'approved' ? 'อนุมัติแล้ว' : lh.status === 'pending' ? 'รออาจารย์พิจารณา' : 'ไม่อนุมัติ'}
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">{lh.submittedDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
