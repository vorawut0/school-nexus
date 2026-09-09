import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { LeaveRequest, getLeaveRequests, submitLeaveRequest } from '../../services/leaveService';

interface StudentLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const StudentLeaveModal: React.FC<StudentLeaveModalProps> = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'request'>('history');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [leaveType, setLeaveType] = useState<'sick' | 'personal' | 'official'>('sick');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('');
  const [parentContact, setParentContact] = useState<string>('081-992-4411');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadRequests = () => {
    const all = getLeaveRequests();
    // Filter for this student or show all for testing
    const myRequests = all.filter(
      (r) =>
        r.studentId === user.studentId ||
        r.studentId === '66041001' ||
        r.studentName === user.name
    );
    setRequests(myRequests.length > 0 ? myRequests : all);
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      loadRequests();
    };
    window.addEventListener('sn_leave_requests_updated', handleUpdate);
    return () => window.removeEventListener('sn_leave_requests_updated', handleUpdate);
  }, [user]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
      showToast(`แนบไฟล์เอกสาร: ${e.target.files[0].name} เรียบร้อย`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('กรุณาระบุเหตุผลการลา');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitLeaveRequest({
        studentId: user.studentId || '66041001',
        studentName: user.name || 'Vorawut Phetrai',
        thaiName: user.thaiName || 'วรวุฒิ เพ็ชรราย',
        studentAvatar: user.avatar,
        className: 'ม.6/1 (AI & Robotics)',
        type: leaveType,
        startDate,
        endDate: endDate || startDate,
        reason,
        hasAttachment: !!attachmentName,
        attachmentName: attachmentName || undefined,
        submittedByRole: 'student',
        parentContact,
      });

      showToast('ส่งใบลาเรียนถึงอาจารย์ที่ปรึกษาเรียบร้อยแล้ว!');
      setReason('');
      setAttachmentName(null);
      setActiveTab('history');
      loadRequests();
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการส่งใบลา');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeBadge = (type: LeaveRequest['type']) => {
    switch (type) {
      case 'sick':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">local_hospital</span>
            <span>ลาป่วย</span>
          </span>
        );
      case 'personal':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">person</span>
            <span>ลากิจ</span>
          </span>
        );
      case 'official':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">emoji_events</span>
            <span>ราชการ/กิจกรรม</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
            <span className="material-symbols-outlined text-[15px]">hourglass_empty</span>
            <span>รออาจารย์พิจารณา</span>
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">verified</span>
            <span>อนุมัติแล้ว</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">cancel</span>
            <span>ไม่อนุมัติ</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[99] bg-[#121b2e] text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-slideInRightToast">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-[28px] max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[90vh] my-auto animate-scaleIn">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-blue-300">
              <span className="material-symbols-outlined text-[26px]">event_busy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold">
                  ระบบส่งใบลาเรียนออนไลน์ (Leave Request Portal)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                  Realtime Approval
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                {user.thaiName || user.name} • รหัส {user.studentId || '66041001'} • ห้อง ม.6/1
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-5 pt-3 bg-slate-50 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history_edu</span>
            <span>ประวัติใบลา ({requests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('request')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'request'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
            <span>ยื่นใบลาใหม่</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'history' ? (
            <div className="space-y-3.5">
              {requests.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">
                    event_available
                  </span>
                  <p className="text-sm font-medium">ไม่มีประวัติการขอลาเรียน</p>
                  <p className="text-xs text-slate-400 mt-1">
                    หากคุณไม่สามารถมาเรียนได้ สามารถคลิก "ยื่นใบลาใหม่" ได้ทันที
                  </p>
                </div>
              ) : (
                requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-xs transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(req.type)}
                        <span className="text-xs font-bold text-slate-700">
                          {req.startDate === req.endDate
                            ? `วันที่ ${req.startDate}`
                            : `${req.startDate} ถึง ${req.endDate}`}
                        </span>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-normal">เหตุผล: </span>
                      {req.reason}
                    </p>

                    {req.hasAttachment && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50/70 px-3 py-1.5 rounded-xl border border-blue-100 w-fit">
                        <span className="material-symbols-outlined text-[16px]">attach_file</span>
                        <span className="font-semibold">{req.attachmentName || 'ใบรับรองแพทย์/เอกสารแนบ'}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex-wrap gap-1">
                      <span>ยื่นเมื่อ: {req.submittedDate}</span>
                      {req.reviewedBy && (
                        <span className="text-slate-600 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-emerald-600">done</span>
                          พิจารณาโดย: {req.reviewedBy} ({req.reviewedAt})
                        </span>
                      )}
                    </div>

                    {req.reviewNote && (
                      <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
                        <span className="font-bold">ข้อความจากอาจารย์: </span>
                        {req.reviewNote}
                      </div>
                    )}
                  </div>
                ))
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('request')}
                  className="px-5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>ต้องการยื่นใบลาเรียนเพิ่ม</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ประเภทการลา <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  >
                    <option value="sick">🏥 ลาป่วย (Sick Leave)</option>
                    <option value="personal">🏠 ลากิจส่วนตัว (Personal Leave)</option>
                    <option value="official">🏆 ไปราชการ / กิจกรรมแข่งขัน</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ตั้งแต่วันที่ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ถึงวันที่ (หากลาวันเดียวใช้วันเดิม)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  เหตุผลความจำเป็นในการลา <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ระบุอาการป่วย สถานพยาบาลที่เข้ารับการรักษา หรือธุระความจำเป็น..."
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    เบอร์โทรติดต่อผู้ปกครองที่สามารถติดต่อได้
                  </label>
                  <input
                    type="tel"
                    value={parentContact}
                    onChange={(e) => setParentContact(e.target.value)}
                    placeholder="เช่น 081-xxx-xxxx"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    แนบใบรับรองแพทย์ / หนังสือขอตัว (ถ้ามี)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileSelect}
                      id="leave-file-input"
                      className="hidden"
                    />
                    <label
                      htmlFor="leave-file-input"
                      className="w-full h-11 px-3 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">upload_file</span>
                      <span className="truncate font-semibold">
                        {attachmentName ? attachmentName : 'คลิกเลือกไฟล์ภาพหรือ PDF'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">
                  info
                </span>
                <p className="leading-relaxed">
                  เมื่อกดส่งใบลา ระบบจะทำการส่งการแจ้งเตือนสด (Push Realtime Notification) ไปยังอาจารย์ที่ปรึกษาและครูประจำวิชาทันที และเมื่ออาจารย์กดอนุมัติ สถานะเข้าเรียนของคุณจะถูกอัปเดตเป็น "ลา" อัตโนมัติ
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>{isSubmitting ? 'กำลังส่งคำขอ...' : 'ยืนยันส่งใบลาเรียน'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
