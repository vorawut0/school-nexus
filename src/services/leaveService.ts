import { pushRealtimeNotification } from './firebaseService';

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  thaiName?: string;
  studentAvatar?: string;
  className: string;
  type: 'sick' | 'personal' | 'official';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  hasAttachment: boolean;
  attachmentName?: string;
  submittedByRole: 'student' | 'parent';
  parentContact?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

const STORAGE_KEY = 'sn_leave_requests_db';

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-101',
    studentId: '66040402',
    studentName: 'Thanakorn Wongsawat',
    thaiName: 'ธนากร วงศ์สวัสดิ์',
    studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    className: 'ม.6/1 (AI & Robotics)',
    type: 'sick',
    startDate: '2026-09-09',
    endDate: '2026-09-09',
    reason: 'มีไข้สูง 38.5 องศา และปวดศีรษะ พบแพทย์ที่คลินิกแล้ว',
    status: 'pending',
    submittedDate: '09 ก.ย. 2026 07:30 น.',
    hasAttachment: true,
    attachmentName: 'medical_cert_clinic_dr_somchai.pdf',
    submittedByRole: 'parent',
    parentContact: '081-992-4411 (คุณแม่กรรณิการ์)',
  },
  {
    id: 'leave-102',
    studentId: '66040319',
    studentName: 'Kanya Rattanasak',
    thaiName: 'กัญญา รัตนศักดิ์',
    studentAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    className: 'ม.6/1 (AI & Robotics)',
    type: 'sick',
    startDate: '2026-09-08',
    endDate: '2026-09-09',
    reason: 'อาหารเป็นพิษ มีใบรับรองแพทย์จากโรงพยาบาลกรุงเทพ',
    status: 'approved',
    submittedDate: '08 ก.ย. 2026 06:45 น.',
    hasAttachment: true,
    attachmentName: 'bangkok_hospital_leave_slip.jpg',
    submittedByRole: 'student',
    parentContact: '089-445-1234',
    reviewedBy: 'อ.ดร.สมชาย วิศวกรรม',
    reviewedAt: '08 ก.ย. 2026 07:15 น.',
    reviewNote: 'อนุมัติการลาป่วย พักผ่อนให้หายดีครับ',
  },
  {
    id: 'leave-103',
    studentId: '66041001',
    studentName: 'Vorawut Phetrai',
    thaiName: 'วรวุฒิ เพ็ชรราย',
    studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
    className: 'ม.6/1 (AI & Robotics)',
    type: 'official',
    startDate: '2026-08-25',
    endDate: '2026-08-26',
    reason: 'เป็นตัวแทนโรงเรียนเข้าร่วมแข่งขันหุ่นยนต์ระดับชาติ AI Olympiad 2026',
    status: 'approved',
    submittedDate: '24 ส.ค. 2026 14:20 น.',
    hasAttachment: true,
    attachmentName: 'robotics_competition_invitation.pdf',
    submittedByRole: 'student',
    parentContact: '086-123-4567',
    reviewedBy: 'อ.ดร.สมชาย วิศวกรรม',
    reviewedAt: '24 ส.ค. 2026 16:00 น.',
    reviewNote: 'อนุมัติไปราชการและกิจกรรมแข่งขัน ขอให้คว้าชัยชนะกลับมา',
  },
  {
    id: 'leave-104',
    studentId: '66040233',
    studentName: 'Chatchai Phromsiri',
    thaiName: 'ฉัตรชัย พรหมศิริ',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    className: 'ม.6/1 (AI & Robotics)',
    type: 'personal',
    startDate: '2026-08-15',
    endDate: '2026-08-15',
    reason: 'ติดธุระสำคัญของครอบครัวต่างจังหวัด',
    status: 'approved',
    submittedDate: '14 ส.ค. 2026 19:30 น.',
    hasAttachment: false,
    submittedByRole: 'parent',
    parentContact: '084-555-8899',
    reviewedBy: 'อ.ดร.สมชาย วิศวกรรม',
    reviewedAt: '15 ส.ค. 2026 07:00 น.',
    reviewNote: 'รับทราบและอนุมัติ อย่าลืมตามงานย้อนหลังด้วยครับ',
  },
];

/**
 * Load all leave requests from storage or fallback to default
 */
export function getLeaveRequests(): LeaveRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load leave requests from localStorage:', e);
  }
  // Initialize with seed data
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LEAVE_REQUESTS));
  } catch {}
  return INITIAL_LEAVE_REQUESTS;
}

/**
 * Submit a new leave request
 */
export async function submitLeaveRequest(
  data: Omit<LeaveRequest, 'id' | 'status' | 'submittedDate'>
): Promise<LeaveRequest> {
  const current = getLeaveRequests();
  const now = new Date();
  const submittedDate =
    now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) +
    ' ' +
    now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) +
    ' น.';

  const newRequest: LeaveRequest = {
    ...data,
    id: `leave-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: 'pending',
    submittedDate,
  };

  const updated = [newRequest, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sn_leave_requests_updated', { detail: newRequest }));
  } catch (e) {
    console.warn('Failed to save leave request:', e);
  }

  // Cross-role push notification to Teachers & Admin
  const typeLabel =
    data.type === 'sick' ? 'ลาป่วย' : data.type === 'personal' ? 'ลากิจส่วนตัว' : 'ไปราชการ/กิจกรรม';
  const applicantName = data.thaiName || data.studentName;

  try {
    await pushRealtimeNotification({
      title: `📑 มีคำขอ${typeLabel}ใหม่ (${data.className})`,
      message: `${applicantName} (${data.studentId}) ยื่นคำขอ${typeLabel} วันที่ ${data.startDate} เหตุผล: "${data.reason}" รออาจารย์พิจารณาอนุมัติ`,
      type: 'attendance',
      priority: 'high',
      role: 'teacher',
      icon: 'pending_actions',
      timestamp: Date.now(),
    });

    await pushRealtimeNotification({
      title: `📑 คำขอ${typeLabel}ได้รับการบันทึกแล้ว`,
      message: `คำขอลาเรียนของคุณถูกส่งถึงอาจารย์ที่ปรึกษาเรียบร้อยแล้ว สถานะ: รอการอนุมัติ`,
      type: 'attendance',
      priority: 'normal',
      role: data.submittedByRole === 'parent' ? 'parent' : 'student',
      icon: 'check_circle',
      timestamp: Date.now(),
    });
  } catch (e) {
    console.warn('Leave request notification dispatch warning:', e);
  }

  return newRequest;
}

/**
 * Review leave request (Approve or Reject)
 */
export async function reviewLeaveRequest(
  id: string,
  status: 'approved' | 'rejected',
  reviewerName: string,
  reviewNote?: string
): Promise<LeaveRequest | null> {
  const current = getLeaveRequests();
  const index = current.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const now = new Date();
  const reviewedAt =
    now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) +
    ' ' +
    now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) +
    ' น.';

  const updatedReq: LeaveRequest = {
    ...current[index],
    status,
    reviewedBy: reviewerName,
    reviewedAt,
    reviewNote: reviewNote || (status === 'approved' ? 'อนุมัติการลาเรียบร้อย' : 'ไม่อนุมัติ'),
  };

  current[index] = updatedReq;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(
      new CustomEvent('sn_leave_requests_updated', {
        detail: { request: updatedReq, action: 'reviewed' },
      })
    );
  } catch (e) {
    console.warn('Failed to update leave request status:', e);
  }

  // Cross-role push notification to Student & Parent
  const statusThai = status === 'approved' ? 'ได้รับการอนุมัติแล้ว' : 'ไม่ได้รับการอนุมัติ';
  const typeLabel =
    updatedReq.type === 'sick'
      ? 'ลาป่วย'
      : updatedReq.type === 'personal'
      ? 'ลากิจส่วนตัว'
      : 'ไปราชการ/กิจกรรม';

  try {
    await pushRealtimeNotification({
      title: `📢 ผลการพิจารณาคำขอ${typeLabel}: ${status === 'approved' ? '✅ อนุมัติ' : '❌ ไม่อนุมัติ'}`,
      message: `คำขอ${typeLabel} วันที่ ${updatedReq.startDate} ${statusThai} โดย ${reviewerName}${
        reviewNote ? ` (หมายเหตุ: "${reviewNote}")` : ''
      }`,
      type: 'attendance',
      priority: 'high',
      role: 'student',
      icon: status === 'approved' ? 'task_alt' : 'cancel',
      timestamp: Date.now(),
    });

    await pushRealtimeNotification({
      title: `📢 ผลการพิจารณาคำขอ${typeLabel}ของบุตรหลาน`,
      message: `อาจารย์ ${reviewerName} ได้${statusThai} คำขอ${typeLabel}ของ ${
        updatedReq.thaiName || updatedReq.studentName
      } เรียบร้อยแล้ว`,
      type: 'attendance',
      priority: 'normal',
      role: 'parent',
      icon: status === 'approved' ? 'task_alt' : 'cancel',
      timestamp: Date.now(),
    });
  } catch (e) {
    console.warn('Leave review notification dispatch warning:', e);
  }

  return updatedReq;
}

/**
 * Get leave statistics
 */
export function getLeaveStats() {
  const requests = getLeaveRequests();
  return {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };
}
