import React, { useState, useMemo, useRef } from 'react';
import { UserProfile, ScheduleItem } from '../../types';
import { WEEKLY_TEACHER_SCHEDULE } from '../../data/mockData';
import { GoogleSheetsManager } from './GoogleSheetsManager';
import { GoogleSheetSyncIndicator } from './GoogleSheetSyncIndicator';
import { AssignmentRubric, SheetPollResult } from '../../services/googleSheetsService';

interface TeacherDashboardProps {
  user: UserProfile;
  onNavigateTab: (tab: string) => void;
  onOpenScheduleModal: (item?: ScheduleItem) => void;
  onOpenIdCardModal: () => void;
  onOpenQrScanner: () => void;
  onOpenAITutor?: () => void;
  onOpenCalendarModal?: () => void;
  onOpenShareId?: () => void;
}

interface QuickSubmission {
  id: string;
  studentName: string;
  thaiName: string;
  studentId: string;
  avatar: string;
  assignmentTitle: string;
  subject: string;
  submittedTime: string;
  fileAttachment: string;
  maxScore: number;
  grade?: number;
  status: 'pending' | 'graded';
}

interface AttendanceAlert {
  id: string;
  studentName: string;
  studentId: string;
  classroom: string;
  type: 'absent_streak' | 'late' | 'leave_request';
  time: string;
  message: string;
  status: 'unread' | 'actioned';
  parentPhone?: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  onNavigateTab,
  onOpenScheduleModal,
  onOpenIdCardModal,
  onOpenQrScanner,
  onOpenAITutor,
  onOpenCalendarModal,
  onOpenShareId,
}) => {
  const [scheduleDay, setScheduleDay] = useState<'mon' | 'tue' | 'wed' | 'thu' | 'fri'>('mon');
  const [quickScoreModal, setQuickScoreModal] = useState<QuickSubmission | null>(null);
  const [inputScore, setInputScore] = useState<string>('');
  const [inputFeedback, setInputFeedback] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeRubric, setActiveRubric] = useState<AssignmentRubric | null>(null);
  const [activeSheetUrl, setActiveSheetUrl] = useState<string>(
    'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'
  );
  const [syncUpdateAlert, setSyncUpdateAlert] = useState<SheetPollResult | null>(null);
  const sheetsSectionRef = useRef<HTMLDivElement | null>(null);

  const scrollToSheets = () => {
    sheetsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleApplyRubricToGrading = (rubric: AssignmentRubric) => {
    setActiveRubric(rubric);
    showToast(`นำเกณฑ์ประเมิน "${rubric.title}" (${rubric.totalMaxScore} คะแนน) มาใช้กับการตรวจงานแล้ว`);
  };

  const handleSyncUpdateDetected = (result: SheetPollResult) => {
    setSyncUpdateAlert(result);
    if (result.data?.criteria) {
      setActiveRubric(result.data);
    }
    showToast(`⚡ Google Sheets ได้รับการอัปเดต: ${result.sheetTitle || 'พบการเปลี่ยนแปลงใหม่'} (${result.rowCount} รายการ)`);
  };

  // Quick submissions queue for teacher
  const [submissionsQueue, setSubmissionsQueue] = useState<QuickSubmission[]>([
    {
      id: 'sub-q-1',
      studentName: 'Worawut Phetraya',
      thaiName: 'วรวุฒิ เพ็ชรระยา',
      studentId: '66041001',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
      assignmentTitle: 'โครงงานโมเดล Deep Learning จำแนกภาพ CNN',
      subject: 'CS33201 วิทยาการคำนวณ (ม.6/1)',
      submittedTime: 'เมื่อวานนี้ 21:40 น.',
      fileAttachment: 'cnn_image_classifier.ipynb',
      maxScore: 20,
      status: 'pending',
    },
    {
      id: 'sub-q-2',
      studentName: 'Natthaphon Siriphan',
      thaiName: 'ณัฐพล ศิริพันธ์ (กันต์)',
      studentId: '66040188',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      assignmentTitle: 'โครงงานโมเดล Deep Learning จำแนกภาพ CNN',
      subject: 'CS33201 วิทยาการคำนวณ (ม.6/1)',
      submittedTime: 'วันนี้ 07:15 น.',
      fileAttachment: 'natthaphon_cnn.zip',
      maxScore: 20,
      status: 'pending',
    },
    {
      id: 'sub-q-3',
      studentName: 'Chanya Thanapaisan',
      thaiName: 'ชัญญา ธนะไพศาล (ไอซ์)',
      studentId: '66040052',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
      assignmentTitle: 'แบบฝึกหัดวิเคราะห์โครงสร้างฐานข้อมูล SQL',
      subject: 'DB33102 ฐานข้อมูลอัจฉริยะ (ม.6/2)',
      submittedTime: 'วันนี้ 08:05 น.',
      fileAttachment: 'database_schema_ex4.pdf',
      maxScore: 10,
      status: 'pending',
    },
  ]);

  // Attendance Alerts Feed
  const [attendanceAlerts, setAttendanceAlerts] = useState<AttendanceAlert[]>([
    {
      id: 'alt-1',
      studentName: 'ด.ช. ภัทรพล สิทธิกร',
      studentId: '66040089',
      classroom: 'ม.6/1',
      type: 'absent_streak',
      time: '08:45 น.',
      message: 'ขาดเรียนต่อเนื่อง 2 วันทำการ (ยังไม่มีใบลาจากผู้ปกครอง)',
      status: 'unread',
      parentPhone: '089-123-4567',
    },
    {
      id: 'alt-2',
      studentName: 'น.ส. ธนภรณ์ วงศ์สวรรค์',
      studentId: '66040092',
      classroom: 'ม.6/1',
      type: 'leave_request',
      time: '07:30 น.',
      message: 'ผู้ปกครองส่งคำขอลากิจ (ไปพบแพทย์) รออาจารย์ลงนามอนุมัติ',
      status: 'unread',
      parentPhone: '081-987-6543',
    },
    {
      id: 'alt-3',
      studentName: 'นาย กวินทร์ รัตนโชติ',
      studentId: '66040105',
      classroom: 'ม.6/2',
      type: 'late',
      time: '08:42 น.',
      message: 'สแกนเข้าคาบสายเกินเวลา 12 นาที',
      status: 'unread',
    },
  ]);

  const currentSchedule = useMemo(() => {
    return WEEKLY_TEACHER_SCHEDULE[scheduleDay] || WEEKLY_TEACHER_SCHEDULE.mon;
  }, [scheduleDay]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveQuickGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScoreModal) return;
    const scoreNum = parseFloat(inputScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > quickScoreModal.maxScore) {
      alert(`กรุณากรอกคะแนนระหว่าง 0 ถึง ${quickScoreModal.maxScore}`);
      return;
    }

    setSubmissionsQueue((prev) =>
      prev.map((item) =>
        item.id === quickScoreModal.id
          ? {
              ...item,
              grade: scoreNum,
              status: 'graded',
            }
          : item
      )
    );

    showToast(`บันทึกคะแนน ${scoreNum}/${quickScoreModal.maxScore} ของ ${quickScoreModal.thaiName} สำเร็จแล้ว!`);
    setQuickScoreModal(null);
    setInputScore('');
    setInputFeedback('');
  };

  const handleActionAlert = (alertId: string, actionName: string) => {
    setAttendanceAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'actioned' } : a))
    );
    showToast(`ดำเนินการ: ${actionName} เรียบร้อยแล้ว`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fadeIn pb-24">
      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center gap-3 text-xs font-semibold animate-slideDown max-w-sm">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          <span className="flex-1">{toastMsg}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Teacher Welcome & Quick Faculty Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a1120] via-[#0f214a] to-[#1550d3] text-white p-6 sm:p-8 shadow-xl border border-blue-500/30">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Teacher Bio & Department */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
                alt={user.thaiName || user.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-cyan-400/60 shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold" title="พร้อมปฏิบัติหน้าที่">
                ✓
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-bold border border-cyan-400/40">
                  อาจารย์ผู้สอน (Faculty Staff)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ภาคเรียนที่ 1/2569
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{user.thaiName || user.name}</span>
                <span className="text-xs font-normal text-cyan-200">({user.studentId || 'TCH-8804'})</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex flex-wrap items-center gap-y-1 gap-x-3">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-cyan-400">school</span>
                  <span>{user.department || 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-amber-400">meeting_room</span>
                  <span>{user.room || 'ครูประจำชั้น ม.6/1 (ห้อง 601)'}</span>
                </span>
              </p>
            </div>
          </div>

          {/* Right: Quick Action Shortcuts & Sync Status */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Live 60-Second Google Sheets Polling Indicator */}
            {activeSheetUrl && (
              <GoogleSheetSyncIndicator
                spreadsheetUrlOrId={activeSheetUrl}
                mode="rubric"
                isAutoPollEnabled={true}
                pollIntervalSeconds={60}
                onUpdateDetected={handleSyncUpdateDetected}
                variant="compact"
              />
            )}

            <button
              onClick={scrollToSheets}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-200">table_chart</span>
              <span>Google Sheets</span>
            </button>

            <button
              onClick={() => onNavigateTab('teacher-attendance')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              <span>เช็กชื่อคาบนี้</span>
            </button>

            <button
              onClick={() => onNavigateTab('teacher-grading')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">fact_check</span>
              <span>ตรวจงาน ({submissionsQueue.filter((s) => s.status === 'pending').length})</span>
            </button>

            <button
              onClick={onOpenIdCardModal}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/20 transition-all cursor-pointer"
              title="เปิดบัตรอาจารย์ดิจิทัล"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-300">badge</span>
              <span>บัตรอาจารย์</span>
            </button>

            {onOpenAITutor && (
              <button
                onClick={onOpenAITutor}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-indigo-400/40 transition-all cursor-pointer"
                title="เปิด AI ผู้ช่วยสอนและออกแบบบทเรียน"
              >
                <span className="material-symbols-outlined text-[18px] text-indigo-300">psychology</span>
                <span>AI ช่วยสอน</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Google Sheets Change Detection Notification Alert */}
      {syncUpdateAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-400/60 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0 animate-bounce">
              <span className="material-symbols-outlined text-[22px]">sync_problem</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md">
                  GOOGLE SHEETS UPDATED
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {syncUpdateAlert.timestamp}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                ตรวจพบการแก้ไขข้อมูลจากระยะไกลใน: <strong>{syncUpdateAlert.sheetTitle || 'Google Sheets'}</strong> ({syncUpdateAlert.rowCount} รายการ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => {
                scrollToSheets();
                setSyncUpdateAlert(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>ดูข้อมูลที่อัปเดต</span>
            </button>
            <button
              onClick={() => setSyncUpdateAlert(null)}
              className="p-1.5 rounded-xl hover:bg-amber-200/50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              title="ปิดการแจ้งเตือน"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Today Classes */}
        <div
          onClick={() => onNavigateTab('teacher-classes')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">คาบสอนวันนี้</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{currentSchedule.length}</span>
            <span className="text-xs text-slate-500">คาบเรียน</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-600 font-semibold flex items-center gap-1">
            <span>กำลังสอน: คาบที่ 1 (08:30)</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          </div>
        </div>

        {/* Card 2: Attendance Rate */}
        <div
          onClick={() => onNavigateTab('teacher-attendance')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">การเข้าเรียนรวม</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">97.4%</span>
            <span className="text-xs text-slate-500">142/145 คน</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <span>ขาด 1 • ลา 2 • สาย 3 คน</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          </div>
        </div>

        {/* Card 3: Pending Grading */}
        <div
          onClick={() => onNavigateTab('teacher-grading')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">งานรอตรวจ</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">
              {submissionsQueue.filter((s) => s.status === 'pending').length}
            </span>
            <span className="text-xs text-slate-500">รายการค้าง</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
            <span>ส่งมาใหม่ 2 รายการวันนี้</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          </div>
        </div>

        {/* Card 4: Managed Classrooms */}
        <div
          onClick={() => onNavigateTab('teacher-classes')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ห้องเรียนในความดูแล</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">groups</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">3</span>
            <span className="text-xs text-slate-500">ห้องเรียน (114 คน)</span>
          </div>
          <div className="mt-1 text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
            <span>ม.6/1, ม.6/2, ม.5/1</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Upcoming Teaching Schedule & Attendance Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Teaching Schedule (ตารางสอน) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl">calendar_month</span>
                <h2 className="text-base font-bold text-slate-900">ตารางสอนและคาบเรียนประจำวัน</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">เลือกวันเพื่อดูคาบสอน ห้องเรียน และหัวข้อเนื้อหา</p>
            </div>

            {/* Day Selector Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(
                [
                  { id: 'mon', label: 'จันทร์' },
                  { id: 'tue', label: 'อังคาร' },
                  { id: 'wed', label: 'พุธ' },
                  { id: 'thu', label: 'พฤหัส' },
                  { id: 'fri', label: 'ศุกร์' },
                ] as const
              ).map((day) => (
                <button
                  key={day.id}
                  onClick={() => setScheduleDay(day.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scheduleDay === day.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Item List */}
          <div className="mt-4 space-y-3 flex-1">
            {currentSchedule.map((item, idx) => {
              const isCurrent = idx === 0 && scheduleDay === 'mon';
              return (
                <div
                  key={item.id || idx}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border-blue-300 shadow-sm'
                      : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200/80'
                  }`}
                >
                  {/* Period Time & Status */}
                  <div className="flex items-center gap-3.5">
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {item.periodNumber ? `คาบ ${item.periodNumber}` : 'ช่วงเวลา'}
                      </span>
                      <span className="text-xs font-black text-slate-800">{item.time || item.startTime}</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold animate-pulse">
                            กำลังสอนอยู่ (LIVE)
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-800 text-[10px] font-extrabold">
                          {item.subjectCode}
                        </span>
                        {item.targetClass && (
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-semibold">
                            {item.targetClass}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                          <span>{item.room} ({item.building})</span>
                        </span>
                        {item.attendanceCount && (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <span className="material-symbols-outlined text-[14px]">task_alt</span>
                            <span>{item.attendanceCount}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => onNavigateTab('teacher-attendance')}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                      <span>{isCurrent ? 'เข้าห้องเช็กชื่อ' : 'เช็กชื่อ'}</span>
                    </button>

                    <button
                      onClick={() => onOpenScheduleModal(item)}
                      className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 cursor-pointer"
                      title="ดูรายละเอียดคาบ"
                    >
                      <span className="material-symbols-outlined text-[18px]">info</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Attendance Alerts & Warnings */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-xl">notification_important</span>
              <h2 className="text-base font-bold text-slate-900">แจ้งเตือนสถานะการเข้าเรียน</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
              {attendanceAlerts.filter((a) => a.status === 'unread').length} เรื่องด่วน
            </span>
          </div>

          {/* Alert Cards */}
          <div className="mt-4 space-y-3 flex-1">
            {attendanceAlerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-3.5 rounded-2xl border transition-all text-xs ${
                  alt.type === 'absent_streak'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : alt.type === 'leave_request'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        alt.type === 'absent_streak'
                          ? 'text-rose-600'
                          : alt.type === 'leave_request'
                          ? 'text-amber-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {alt.type === 'absent_streak'
                        ? 'cancel'
                        : alt.type === 'leave_request'
                        ? 'event_busy'
                        : 'schedule'}
                    </span>
                    <span>{alt.studentName} ({alt.classroom})</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">{alt.time}</span>
                </div>

                <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">{alt.message}</p>

                {/* Alert Action buttons */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  {alt.parentPhone && (
                    <a
                      href={`tel:${alt.parentPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200 flex items-center gap-1 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[14px] text-blue-600">call</span>
                      <span>โทรหาผู้ปกครอง</span>
                    </a>
                  )}

                  {alt.type === 'leave_request' && (
                    <button
                      onClick={() => handleActionAlert(alt.id, 'อนุมัติใบลา')}
                      disabled={alt.status === 'actioned'}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      <span>{alt.status === 'actioned' ? 'อนุมัติแล้ว' : 'อนุมัติใบลา'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleActionAlert(alt.id, 'รับทราบสถานะ')}
                    className="ml-auto text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {alt.status === 'actioned' ? '✓ ดำเนินการแล้ว' : 'ทำเครื่องหมายว่าอ่านแล้ว'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Roll Call Launcher Button */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={onOpenQrScanner}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-[18px] text-cyan-400">qr_code_scanner</span>
              <span>เปิดกล้องสแกน RFID / QR บัตรนักเรียน</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Quick Grading Queue (คิวตรวจงานด่วน) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600 text-xl">fact_check</span>
              <h2 className="text-base font-bold text-slate-900">คิวตรวจงานและการบ้านล่าสุด (Quick Grading)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">ให้คะแนนและคอมเมนต์ข้อเสนอแนะแก่นักเรียนได้ทันที</p>
          </div>

          <button
            onClick={() => onNavigateTab('teacher-grading')}
            className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>ดูงานทั้งหมด ({submissionsQueue.length})</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Submissions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {submissionsQueue.map((sub) => (
            <div
              key={sub.id}
              className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between gap-3 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                    {sub.subject}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sub.status === 'graded'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {sub.status === 'graded' ? `ตรวจแล้ว: ${sub.grade}/${sub.maxScore}` : 'รอตรวจ'}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 line-clamp-2">{sub.assignmentTitle}</h3>

                {/* Student Info */}
                <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-slate-200/60">
                  <img
                    src={sub.avatar}
                    alt={sub.thaiName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 truncate">{sub.thaiName}</div>
                    <div className="text-[10px] text-slate-500">รหัส {sub.studentId} • {sub.submittedTime}</div>
                  </div>
                </div>

                {/* Attached file */}
                <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[15px] text-indigo-600">attach_file</span>
                  <span className="truncate">{sub.fileAttachment}</span>
                </div>
              </div>

              {/* Grade Action Button */}
              <button
                onClick={() => {
                  setQuickScoreModal(sub);
                  setInputScore(sub.grade ? String(sub.grade) : '');
                  setInputFeedback('');
                }}
                className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  sub.status === 'graded'
                    ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {sub.status === 'graded' ? 'edit' : 'edit_note'}
                </span>
                <span>{sub.status === 'graded' ? 'แก้ไขคะแนน' : 'ให้คะแนนด่วน'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Classrooms Performance & AI Assistant Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Classrooms */}
        <div className="md:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-xl">school</span>
                <h2 className="text-base font-bold text-slate-900">ภาพรวมห้องเรียนในความรับผิดชอบ</h2>
              </div>
              <button
                onClick={() => onNavigateTab('teacher-classes')}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>จัดการห้องเรียน</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">ชั้น ม.6/1 (ห้อง 601)</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    ประจำชั้น
                  </span>
                </div>
                <div className="mt-2 text-xl font-black text-slate-800">40 คน</div>
                <div className="mt-1 text-[11px] text-slate-500">GPA เฉลี่ย: 3.52 • เข้าเรียน 98%</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">ชั้น ม.6/2</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    สอนวิทย์
                  </span>
                </div>
                <div className="mt-2 text-xl font-black text-slate-800">38 คน</div>
                <div className="mt-1 text-[11px] text-slate-500">GPA เฉลี่ย: 3.24 • เข้าเรียน 96%</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">ชั้น ม.5/1</span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                    สอน AI
                  </span>
                </div>
                <div className="mt-2 text-xl font-black text-slate-800">36 คน</div>
                <div className="mt-1 text-[11px] text-slate-500">GPA เฉลี่ย: 3.46 • เข้าเรียน 99%</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Teaching Assistant Banner */}
        <div className="bg-gradient-to-br from-[#121b2e] to-[#1e3a8a] text-white rounded-3xl p-5 sm:p-6 shadow-md border border-blue-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-300 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </div>
              <h3 className="text-sm font-bold text-white">AI Teaching Assistant</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ช่วยออกแบบแผนการสอน สร้างแบบฝึกหัด ออกข้อสอบวัดผล และสร้างเกณฑ์คะแนน Rubric ได้ในไม่กี่วินาที
            </p>
          </div>

          <button
            onClick={onOpenAITutor}
            className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>เริ่มสนทนากับ AI ช่วยสอน</span>
          </button>
        </div>
      </div>

      {/* 6. Google Sheets Realtime Integration Component */}
      <div ref={sheetsSectionRef}>
        <GoogleSheetsManager
          user={user}
          onApplyRubricToGrading={handleApplyRubricToGrading}
          onActiveSheetChanged={(url) => setActiveSheetUrl(url)}
        />
      </div>

      {/* Quick Score Modal */}
      {quickScoreModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setQuickScoreModal(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0c1527] to-[#1550d3] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={quickScoreModal.avatar}
                  alt={quickScoreModal.thaiName}
                  className="w-11 h-11 rounded-full object-cover border-2 border-cyan-400/60"
                />
                <div>
                  <h3 className="font-bold text-sm text-white">{quickScoreModal.thaiName}</h3>
                  <p className="text-xs text-cyan-200">รหัส {quickScoreModal.studentId} • {quickScoreModal.subject}</p>
                </div>
              </div>
              <button
                onClick={() => setQuickScoreModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveQuickGrade} className="p-5 space-y-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">หัวข้อชิ้นงาน:</span>
                <div className="text-xs font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {quickScoreModal.assignmentTitle}
                </div>
              </div>

              {/* Active Rubric Criteria Guide */}
              {activeRubric && (
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs">
                  <div className="flex items-center justify-between font-bold text-blue-900 mb-1.5">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-blue-600">fact_check</span>
                      <span>เกณฑ์ประเมิน: {activeRubric.title}</span>
                    </div>
                    <span className="text-[10px] bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-full">
                      เต็ม {activeRubric.totalMaxScore} คะแนน
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {activeRubric.criteria.map((crit, cIdx) => (
                      <div key={cIdx} className="bg-white p-2 rounded-xl border border-blue-100 flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-800 text-[11px]">{crit.name}</div>
                          <div className="text-slate-500 text-[10px] line-clamp-1">{crit.description}</div>
                        </div>
                        <span className="font-bold text-blue-600 text-[11px] shrink-0">
                          {crit.maxScore} คะแนน
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  คะแนนที่ได้ (เต็ม {quickScoreModal.maxScore} คะแนน) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={quickScoreModal.maxScore}
                    value={inputScore}
                    onChange={(e) => setInputScore(e.target.value)}
                    placeholder={`กรอกคะแนน 0 - ${quickScoreModal.maxScore}`}
                    required
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-900 outline-none"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-semibold">
                    / {quickScoreModal.maxScore}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  ข้อเสนอแนะและคอมเมนต์ (Feedback)
                </label>
                <textarea
                  rows={3}
                  value={inputFeedback}
                  onChange={(e) => setInputFeedback(e.target.value)}
                  placeholder="เขียนคำแนะนำ คำชมเชย หรือจุดที่ต้องพัฒนา..."
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white text-xs text-slate-900 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickScoreModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>บันทึกคะแนน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
