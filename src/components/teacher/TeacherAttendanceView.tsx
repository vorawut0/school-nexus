import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { pushRealtimeNotification, subscribeToAllUsers } from '../../services/firebaseService';

interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  name: string;
  thaiName: string;
  avatar: string;
  status: 'present' | 'late' | 'leave' | 'absent';
  checkInTime?: string;
  method: 'rfid' | 'qr' | 'face' | 'manual';
  note?: string;
}

interface TeacherAttendanceViewProps {
  user: UserProfile;
  onOpenQrScanner?: () => void;
}

const DEFAULT_CLASS_STUDENTS: StudentAttendanceRecord[] = [
  {
    id: 'std-1',
    studentId: '66041001',
    name: 'Vorawut Phetrai',
    thaiName: 'วรวุฒิ เพ็ชรระยา',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
    status: 'present',
    checkInTime: '08:24 น.',
    method: 'rfid',
  },
  {
    id: 'std-2',
    studentId: '66040188',
    name: 'Natthaphon Siriphan',
    thaiName: 'ณัฐพล ศิริพันธ์ (กันต์)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    status: 'present',
    checkInTime: '08:26 น.',
    method: 'qr',
  },
  {
    id: 'std-3',
    studentId: '66040233',
    name: 'Chatchai Phromsiri',
    thaiName: 'ฉัตรชัย พรหมศิริ',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    status: 'late',
    checkInTime: '08:42 น.',
    method: 'manual',
    note: 'เดินทางจากต่างอำเภอ',
  },
  {
    id: 'std-4',
    studentId: '66040319',
    name: 'Kanya Rattanasak',
    thaiName: 'กัญญา รัตนศักดิ์',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    status: 'leave',
    method: 'manual',
    note: 'ลาป่วย มีใบรับรองแพทย์',
  },
  {
    id: 'std-5',
    studentId: '66040402',
    name: 'Thanakorn Wongsawat',
    thaiName: 'ธนากร วงศ์สวัสดิ์',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    status: 'present',
    checkInTime: '08:18 น.',
    method: 'rfid',
  },
  {
    id: 'std-6',
    studentId: '66040511',
    name: 'Pimchanok Srisuk',
    thaiName: 'พิมพ์ชนก ศรีสุข',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
    status: 'absent',
    method: 'manual',
    note: 'ไม่พบข้อมูลการติดต่อ',
  },
];

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({
  user,
  onOpenQrScanner,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('m6-1');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'late' | 'leave' | 'absent'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Student Attendance Data dynamically merged from Firestore
  const [students, setStudents] = useState<StudentAttendanceRecord[]>(DEFAULT_CLASS_STUDENTS);

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers((allUsers) => {
      const studentUsers = allUsers.filter((u) => u.role === 'student');
      if (studentUsers.length > 0) {
        setStudents((prev) => {
          const map = new Map<string, StudentAttendanceRecord>();
          prev.forEach((s) => map.set(s.studentId || s.id, s));
          
          studentUsers.forEach((su, idx) => {
            const key = su.studentId || su.id;
            const existing = map.get(key);
            if (existing) {
              map.set(key, {
                ...existing,
                name: su.name || existing.name,
                thaiName: su.thaiName || existing.thaiName,
                avatar: su.avatar || existing.avatar,
              });
            } else {
              map.set(key, {
                id: su.id,
                studentId: su.studentId || `6604${1000 + idx}`,
                name: su.name || 'STUDENT',
                thaiName: su.thaiName || su.name,
                avatar: su.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300',
                status: 'present',
                checkInTime: '08:20 น.',
                method: 'rfid',
              });
            }
          });
          return Array.from(map.values());
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleStudentStatus = async (studentId: string, nextStatus: StudentAttendanceRecord['status']) => {
    const targetStudent = students.find((s) => s.id === studentId);
    const timeNow = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              status: nextStatus,
              checkInTime:
                nextStatus === 'present' || nextStatus === 'late'
                  ? s.checkInTime || timeNow
                  : undefined,
            }
          : s
      )
    );

    if (!targetStudent) return;

    const statusThai =
      nextStatus === 'present'
        ? 'เข้าเรียนตรงเวลา'
        : nextStatus === 'late'
        ? 'เข้าเรียนสาย'
        : nextStatus === 'leave'
        ? 'ลาเรียน'
        : 'ขาดเรียน (ยังไม่มาเรียน)';

    // Push real-time notification to PARENT
    await pushRealtimeNotification({
      title: `🎒 แจ้งเตือนการเข้าเรียน: ${targetStudent.thaiName}`,
      message: `สถานะ: ${statusThai} • คาบที่ 1 วิชา ว33281 AI & Robotics (เวลา ${timeNow}) โดย ${user.thaiName || 'อาจารย์ผู้สอน'}`,
      type: 'attendance',
      priority: nextStatus === 'absent' ? 'high' : 'normal',
      role: 'parent',
      icon: nextStatus === 'present' ? 'how_to_reg' : nextStatus === 'late' ? 'schedule' : 'event_busy',
    });

    // Push real-time notification to STUDENT
    await pushRealtimeNotification({
      title: `📋 บันทึกการเข้าเรียน: วิชา ว33281`,
      message: `อาจารย์ได้บันทึกสถานะของคุณเป็น "${statusThai}" ในระบบเช็กชื่อเรียบร้อยแล้ว`,
      type: 'attendance',
      priority: 'normal',
      role: 'student',
      icon: 'how_to_reg',
    });
  };

  const handleMarkAllPresent = async () => {
    const timeNow = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'present',
        checkInTime: s.checkInTime || timeNow,
      }))
    );
    showToast('เช็กชื่อ "มาเรียนครบทุกคน" และซิงค์การแจ้งเตือนสดเรียบร้อยแล้ว');

    // Notify Parent role
    await pushRealtimeNotification({
      title: '🎒 แจ้งเตือนการเข้าเรียน: ม.6/1',
      message: `อาจารย์ได้ทำการเช็กชื่อคาบที่ 1 วิชา ว33281 AI & Robotics เรียบร้อยแล้ว (นักเรียนทุกคนมาเรียนครบ)`,
      type: 'attendance',
      priority: 'normal',
      role: 'parent',
      icon: 'how_to_reg',
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const presentCount = students.filter((s) => s.status === 'present').length;
  const lateCount = students.filter((s) => s.status === 'late').length;
  const leaveCount = students.filter((s) => s.status === 'leave').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;
  const attendanceRate = Math.round(((presentCount + lateCount) / students.length) * 100);

  const filteredStudents = students.filter((s) => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 pb-28 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#121b2e] text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-emerald-400/40 animate-slideDown">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121b2e] via-[#1a2d54] to-[#1550d3] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700/50 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-400/30 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              <span>ระบบเช็กชื่อเข้าชั้นเรียนแบบเรียลไทม์ (Live Attendance & Roll Call)</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            เช็กชื่อคาบเรียน & สแกนเข้าห้อง
          </h1>
          <p className="text-sm text-slate-300">
            วิชา ว33281 ปัญญาประดิษฐ์และหุ่นยนต์ AI • ห้อง 601 (Smart Lab)
          </p>
        </div>

        {/* Quick Actions & Live Scanner Trigger */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          {onOpenQrScanner && (
            <button
              onClick={onOpenQrScanner}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
              <span>เปิดกล้องสแกนบัตรนักเรียน</span>
            </button>
          )}

          <button
            onClick={handleMarkAllPresent}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/20 active:scale-98 transition-all cursor-pointer backdrop-blur-md"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-400">done_all</span>
            <span>มาครบทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* Class and Period Selector Strip */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Class Selection */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 shrink-0">เลือกห้องเรียน:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'm6-1', label: 'ม.6/1 (AI & Robotics)' },
              { id: 'm6-2', label: 'ม.6/2 (Data Science)' },
              { id: 'm5-1', label: 'ม.5/1 (Mobile Dev)' },
            ].map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedClass === cls.id
                    ? 'bg-[#1550d3] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cls.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period Selection */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 shrink-0">คาบที่:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                  selectedPeriod === p
                    ? 'bg-[#121b2e] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 uppercase">เปอร์เซ็นต์เข้าเรียน</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-[#1550d3]">{attendanceRate}%</span>
            <span className="text-xs text-slate-400">เป้าหมาย &gt;90%</span>
          </div>
        </div>

        <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-xs flex flex-col">
          <span className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            มาเรียนตรงเวลา
          </span>
          <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
            {presentCount} <span className="text-xs font-medium text-emerald-600">คน</span>
          </div>
        </div>

        <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col">
          <span className="text-[11px] font-bold text-amber-800 uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            มาสาย
          </span>
          <div className="text-2xl font-black font-mono text-amber-700 mt-1">
            {lateCount} <span className="text-xs font-medium text-amber-600">คน</span>
          </div>
        </div>

        <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200 shadow-xs flex flex-col">
          <span className="text-[11px] font-bold text-blue-800 uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            ลากิจ / ลาป่วย
          </span>
          <div className="text-2xl font-black font-mono text-blue-700 mt-1">
            {leaveCount} <span className="text-xs font-medium text-blue-600">คน</span>
          </div>
        </div>

        <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-200 shadow-xs flex flex-col col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-rose-800 uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            ขาดเรียน
          </span>
          <div className="text-2xl font-black font-mono text-rose-700 mt-1">
            {absentCount} <span className="text-xs font-medium text-rose-600">คน</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'present', 'late', 'leave', 'absent'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === st
                ? 'bg-[#121b2e] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st === 'all' && `ทั้งหมด (${students.length})`}
            {st === 'present' && `มาเรียน (${presentCount})`}
            {st === 'late' && `มาสาย (${lateCount})`}
            {st === 'leave' && `ลา (${leaveCount})`}
            {st === 'absent' && `ขาด (${absentCount})`}
          </button>
        ))}
      </div>

      {/* Students Roll Call List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {filteredStudents.map((std, idx) => (
          <div
            key={std.id}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
          >
            {/* Student Info */}
            <div className="flex items-center gap-3.5">
              <span className="font-mono text-xs font-bold text-slate-400 w-5 text-center">
                {idx + 1}
              </span>
              <div className="relative">
                <img
                  src={std.avatar}
                  alt={std.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white ${
                    std.status === 'present'
                      ? 'bg-emerald-500'
                      : std.status === 'late'
                      ? 'bg-amber-500'
                      : std.status === 'leave'
                      ? 'bg-blue-500'
                      : 'bg-rose-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{std.thaiName}</h4>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {std.studentId}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{std.name}</span>
                  {std.checkInTime && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-emerald-600 font-semibold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        {std.checkInTime}
                      </span>
                    </>
                  )}
                  {std.note && (
                    <>
                      <span>•</span>
                      <span className="text-amber-700 italic">({std.note})</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Status Buttons Group */}
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <button
                onClick={() => toggleStudentStatus(std.id, 'present')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  std.status === 'present'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                มา
              </button>
              <button
                onClick={() => toggleStudentStatus(std.id, 'late')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  std.status === 'late'
                    ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-400/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                }`}
              >
                สาย
              </button>
              <button
                onClick={() => toggleStudentStatus(std.id, 'leave')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  std.status === 'leave'
                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                ลา
              </button>
              <button
                onClick={() => toggleStudentStatus(std.id, 'absent')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  std.status === 'absent'
                    ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                }`}
              >
                ขาด
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
