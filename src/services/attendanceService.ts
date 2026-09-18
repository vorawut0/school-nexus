import { pushRealtimeNotification } from './firebaseService';

export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  name: string;
  thaiName: string;
  avatar: string;
  status: 'present' | 'late' | 'leave' | 'absent';
  checkInTime?: string;
  method: 'rfid' | 'qr' | 'face' | 'manual';
  note?: string;
  updatedAt?: number;
}

const STORAGE_KEY = 'sn_daily_attendance_v2';

export const DEFAULT_CLASS_STUDENTS: StudentAttendanceRecord[] = [
  {
    id: 'std-1',
    studentId: '66041001',
    name: 'Vorawut Phetrai',
    thaiName: 'วรวุฒิ เพ็ชรราย',
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

export function getDailyAttendance(): StudentAttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLASS_STUDENTS));
      return DEFAULT_CLASS_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_CLASS_STUDENTS;
  } catch (err) {
    console.error('Failed to get daily attendance:', err);
    return DEFAULT_CLASS_STUDENTS;
  }
}

export function saveDailyAttendance(records: StudentAttendanceRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sn_attendance_updated', {
          detail: { records },
        })
      );
    }
  } catch (err) {
    console.error('Failed to save daily attendance:', err);
  }
}

export async function updateSingleStudentAttendance(
  studentId: string,
  nextStatus: StudentAttendanceRecord['status'],
  options?: {
    checkInTime?: string;
    note?: string;
    updatedByTeacherName?: string;
  }
): Promise<StudentAttendanceRecord | null> {
  const current = getDailyAttendance();
  const index = current.findIndex((s) => s.id === studentId || s.studentId === studentId);
  if (index === -1) return null;

  const now = new Date();
  const timeNow =
    options?.checkInTime ||
    now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

  const updatedRecord: StudentAttendanceRecord = {
    ...current[index],
    status: nextStatus,
    checkInTime:
      nextStatus === 'present' || nextStatus === 'late'
        ? current[index].checkInTime || timeNow
        : undefined,
    note: options?.note !== undefined ? options.note : current[index].note,
    updatedAt: Date.now(),
  };

  current[index] = updatedRecord;
  saveDailyAttendance(current);

  const statusThai =
    nextStatus === 'present'
      ? 'เข้าเรียนตรงเวลา'
      : nextStatus === 'late'
      ? 'เข้าเรียนสาย'
      : nextStatus === 'leave'
      ? 'ลาเรียน'
      : 'ขาดเรียน (ยังไม่มาเรียน)';

  // Push notifications
  try {
    await pushRealtimeNotification({
      title: `🎒 แจ้งเตือนการเข้าเรียน: ${updatedRecord.thaiName}`,
      message: `สถานะ: ${statusThai} (เวลาบันทึก: ${timeNow}) โดย ${options?.updatedByTeacherName || 'อาจารย์ประจำวิชา'}`,
      type: 'attendance',
      priority: nextStatus === 'absent' ? 'high' : 'normal',
      role: 'parent',
      icon: nextStatus === 'present' ? 'how_to_reg' : nextStatus === 'late' ? 'schedule' : 'event_busy',
      timestamp: Date.now(),
    });

    await pushRealtimeNotification({
      title: `📋 บันทึกการเข้าเรียนวิชา ว33281`,
      message: `สถานะของคุณได้รับการอัปเดตเป็น "${statusThai}" (${timeNow}) อัตโนมัติ`,
      type: 'attendance',
      priority: 'normal',
      role: 'student',
      icon: 'how_to_reg',
      timestamp: Date.now(),
    });
  } catch (e) {
    console.warn('Attendance notification error:', e);
  }

  return updatedRecord;
}

export function getStudentAttendanceById(studentId: string): StudentAttendanceRecord | undefined {
  const list = getDailyAttendance();
  return list.find((s) => s.studentId === studentId || s.id === studentId);
}
