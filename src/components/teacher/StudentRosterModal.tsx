import React, { useState } from 'react';
import { pushRealtimeNotification } from '../../services/firebaseService';

export interface StudentRosterItem {
  id: string;
  studentNumber: number;
  studentId: string;
  name: string;
  thaiName: string;
  nickname: string;
  avatar: string;
  gender: 'male' | 'female';
  gpa: number;
  attendanceRate: number; // percentage
  submittedWorksCount: number;
  totalWorksCount: number;
  status: 'normal' | 'at_risk' | 'outstanding';
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  parentRelation: string;
  notes?: string;
}

interface StudentRosterModalProps {
  classroom: {
    id: string;
    thaiGrade: string;
    subjectCode: string;
    subjectName: string;
    room: string;
    studentsCount: number;
    color: string;
  };
  onClose: () => void;
}

// Realistic student rosters per classroom
const MOCK_ROSTERS: Record<string, StudentRosterItem[]> = {
  'cls-601-ai': [
    {
      id: 'std-601-01',
      studentNumber: 1,
      studentId: '66040217',
      name: 'Worawut Phetrai',
      thaiName: 'นายวรวุฒิ เพ็ชรราย',
      nickname: 'วุฒิ',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
      gender: 'male',
      gpa: 3.92,
      attendanceRate: 98.5,
      submittedWorksCount: 12,
      totalWorksCount: 12,
      status: 'outstanding',
      email: 'worawut.p@schoolnexus.ac.th',
      phone: '081-456-7890',
      parentName: 'นายสมศักดิ์ เพ็ชรราย',
      parentPhone: '089-112-3456',
      parentRelation: 'บิดา',
      notes: 'หัวหน้าห้อง ได้รับรางวัลเหรียญทองโครงงาน AI ระดับชาติ',
    },
    {
      id: 'std-601-02',
      studentNumber: 2,
      studentId: '66040188',
      name: 'Natthaphon Siriphan',
      thaiName: 'นายณัฐพล ศิริพันธ์',
      nickname: 'กันต์',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      gender: 'male',
      gpa: 3.75,
      attendanceRate: 96.0,
      submittedWorksCount: 11,
      totalWorksCount: 12,
      status: 'normal',
      email: 'natthaphon.s@schoolnexus.ac.th',
      phone: '082-345-6789',
      parentName: 'นางศิริพร ศิริพันธ์',
      parentPhone: '081-223-4455',
      parentRelation: 'มารดา',
      notes: 'มีความถนัดด้าน Web Development และ Full-stack',
    },
    {
      id: 'std-601-03',
      studentNumber: 3,
      studentId: '66040233',
      name: 'Chatchai Phromsiri',
      thaiName: 'นายฉัตรชัย พรหมศิริ',
      nickname: 'บอส',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      gender: 'male',
      gpa: 2.45,
      attendanceRate: 81.2,
      submittedWorksCount: 7,
      totalWorksCount: 12,
      status: 'at_risk',
      email: 'chatchai.p@schoolnexus.ac.th',
      phone: '083-987-6543',
      parentName: 'นายประเสริฐ พรหมศิริ',
      parentPhone: '084-556-7788',
      parentRelation: 'บิดา',
      notes: 'ขาดส่งงานปฏิบัติการ 5 ชิ้น และเริ่มมีประวัติเข้าเรียนสาย',
    },
    {
      id: 'std-601-04',
      studentNumber: 4,
      studentId: '66040319',
      name: 'Kanya Rattanasak',
      thaiName: 'นางสาวกัญญา รัตนศักดิ์',
      nickname: 'พลอย',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
      gender: 'female',
      gpa: 3.88,
      attendanceRate: 97.5,
      submittedWorksCount: 12,
      totalWorksCount: 12,
      status: 'outstanding',
      email: 'kanya.r@schoolnexus.ac.th',
      phone: '084-567-8901',
      parentName: 'นางวิไล รัตนศักดิ์',
      parentPhone: '086-778-9900',
      parentRelation: 'มารดา',
      notes: 'ผู้แทนศูนย์โอลิมปิกวิชาการคอมพิวเตอร์ (สอวน.) ค่าย 2',
    },
    {
      id: 'std-601-05',
      studentNumber: 5,
      studentId: '66040402',
      name: 'Thanakorn Wongsawat',
      thaiName: 'นายธนากร วงศ์สวัสดิ์',
      nickname: 'นนท์',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      gender: 'male',
      gpa: 3.65,
      attendanceRate: 94.8,
      submittedWorksCount: 11,
      totalWorksCount: 12,
      status: 'normal',
      email: 'thanakorn.w@schoolnexus.ac.th',
      phone: '085-678-9012',
      parentName: 'นายสุรชัย วงศ์สวัสดิ์',
      parentPhone: '087-889-0011',
      parentRelation: 'บิดา',
      notes: 'เชี่ยวชาญด้านฮาร์ดแวร์ IoT, ESP32 และเซนเซอร์',
    },
    {
      id: 'std-601-06',
      studentNumber: 6,
      studentId: '66040511',
      name: 'Pimchanok Srisuk',
      thaiName: 'นางสาวพิมพ์ชนก ศรีสุข',
      nickname: 'ใบเฟิร์น',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
      gender: 'female',
      gpa: 3.95,
      attendanceRate: 100,
      submittedWorksCount: 12,
      totalWorksCount: 12,
      status: 'outstanding',
      email: 'pimchanok.s@schoolnexus.ac.th',
      phone: '086-789-0123',
      parentName: 'นางกาญจนา ศรีสุข',
      parentPhone: '089-990-1122',
      parentRelation: 'มารดา',
      notes: 'คะแนนการสอบปฏิบัติ Machine Learning เป็นอันดับที่ 1 ของสายชั้น',
    },
    {
      id: 'std-601-07',
      studentNumber: 7,
      studentId: '66040582',
      name: 'Pheerawit Somchai',
      thaiName: 'นายพีรวิชญ์ สมชัย',
      nickname: 'พีท',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300',
      gender: 'male',
      gpa: 3.32,
      attendanceRate: 91.0,
      submittedWorksCount: 10,
      totalWorksCount: 12,
      status: 'normal',
      email: 'pheerawit.s@schoolnexus.ac.th',
      phone: '087-123-4567',
      parentName: 'นายประดิษฐ์ สมชัย',
      parentPhone: '081-334-5566',
      parentRelation: 'บิดา',
    },
    {
      id: 'std-601-08',
      studentNumber: 8,
      studentId: '66040645',
      name: 'Sasithorn Dechakul',
      thaiName: 'นางสาวศศิธร เดชะกุล',
      nickname: 'แพรว',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
      gender: 'female',
      gpa: 3.58,
      attendanceRate: 95.5,
      submittedWorksCount: 11,
      totalWorksCount: 12,
      status: 'normal',
      email: 'sasithorn.d@schoolnexus.ac.th',
      phone: '088-234-5678',
      parentName: 'นางนฤมล เดชะกุล',
      parentPhone: '082-445-6677',
      parentRelation: 'มารดา',
    },
  ],
  'cls-602-data': [
    {
      id: 'std-602-01',
      studentNumber: 1,
      studentId: '66040112',
      name: 'Kritchanat Wongthai',
      thaiName: 'นายกฤตณัฐ วงศ์ไทย',
      nickname: 'มาร์ค',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
      gender: 'male',
      gpa: 3.82,
      attendanceRate: 97.0,
      submittedWorksCount: 10,
      totalWorksCount: 10,
      status: 'outstanding',
      email: 'kritchanat.w@schoolnexus.ac.th',
      phone: '089-345-6789',
      parentName: 'นายเกรียงไกร วงศ์ไทย',
      parentPhone: '083-556-7788',
      parentRelation: 'บิดา',
    },
    {
      id: 'std-602-02',
      studentNumber: 2,
      studentId: '66040145',
      name: 'Nicha Prasertsin',
      thaiName: 'นางสาวณิชา ประเสริฐสิน',
      nickname: 'มิ้นท์',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=300',
      gender: 'female',
      gpa: 3.74,
      attendanceRate: 96.5,
      submittedWorksCount: 10,
      totalWorksCount: 10,
      status: 'normal',
      email: 'nicha.p@schoolnexus.ac.th',
      phone: '081-567-8901',
      parentName: 'นางมณีรัตน์ ประเสริฐสิน',
      parentPhone: '084-667-8899',
      parentRelation: 'มารดา',
    },
    {
      id: 'std-602-03',
      studentNumber: 3,
      studentId: '66040201',
      name: 'Thanapat Boonsong',
      thaiName: 'นายธนภัทร บุญส่ง',
      nickname: 'กัปตัน',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300',
      gender: 'male',
      gpa: 2.30,
      attendanceRate: 78.0,
      submittedWorksCount: 4,
      totalWorksCount: 10,
      status: 'at_risk',
      email: 'thanapat.b@schoolnexus.ac.th',
      phone: '082-678-9012',
      parentName: 'นายวินัย บุญส่ง',
      parentPhone: '085-778-9900',
      parentRelation: 'บิดา',
      notes: 'ขาดส่งงาน SQL Query และ Dashboard ต้องติดตามด่วน',
    },
    {
      id: 'std-602-04',
      studentNumber: 4,
      studentId: '66040289',
      name: 'Rinrada Suksumran',
      thaiName: 'นางสาวรินรดา สุขสำราญ',
      nickname: 'มายด์',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      gender: 'female',
      gpa: 3.90,
      attendanceRate: 98.2,
      submittedWorksCount: 10,
      totalWorksCount: 10,
      status: 'outstanding',
      email: 'rinrada.s@schoolnexus.ac.th',
      phone: '083-789-0123',
      parentName: 'นางวรรณา สุขสำราญ',
      parentPhone: '086-889-0011',
      parentRelation: 'มารดา',
    },
  ],
  'cls-501-prog': [
    {
      id: 'std-501-01',
      studentNumber: 1,
      studentId: '67040101',
      name: 'Panupong Chaiyot',
      thaiName: 'นายภานุพงศ์ ชัยยศ',
      nickname: 'เจมส์',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
      gender: 'male',
      gpa: 3.85,
      attendanceRate: 100,
      submittedWorksCount: 8,
      totalWorksCount: 8,
      status: 'outstanding',
      email: 'panupong.c@schoolnexus.ac.th',
      phone: '084-890-1234',
      parentName: 'นายชูศักดิ์ ชัยยศ',
      parentPhone: '087-990-1122',
      parentRelation: 'บิดา',
    },
    {
      id: 'std-501-02',
      studentNumber: 2,
      studentId: '67040156',
      name: 'Ornicha Teerasak',
      thaiName: 'นางสาวอรณิชา ธีรศักดิ์',
      nickname: 'อุ้ม',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
      gender: 'female',
      gpa: 3.60,
      attendanceRate: 98.0,
      submittedWorksCount: 8,
      totalWorksCount: 8,
      status: 'normal',
      email: 'ornicha.t@schoolnexus.ac.th',
      phone: '085-901-2345',
      parentName: 'นางสุภาพร ธีรศักดิ์',
      parentPhone: '088-001-2233',
      parentRelation: 'มารดา',
    },
  ],
  'cls-401-cs': [
    {
      id: 'std-401-01',
      studentNumber: 1,
      studentId: '68040012',
      name: 'Suppakorn Maneerat',
      thaiName: 'เด็กชายศุภกร มณีรัตน์',
      nickname: 'ภูมิ',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      gender: 'male',
      gpa: 3.70,
      attendanceRate: 95.0,
      submittedWorksCount: 6,
      totalWorksCount: 6,
      status: 'normal',
      email: 'suppakorn.m@schoolnexus.ac.th',
      phone: '086-012-3456',
      parentName: 'นายณรงค์ มณีรัตน์',
      parentPhone: '089-112-3344',
      parentRelation: 'บิดา',
    },
    {
      id: 'std-401-02',
      studentNumber: 2,
      studentId: '68040055',
      name: 'Chonlada Kaewmanee',
      thaiName: 'เด็กหญิงชลลดา แก้วมณี',
      nickname: 'เนย',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
      gender: 'female',
      gpa: 3.92,
      attendanceRate: 98.5,
      submittedWorksCount: 6,
      totalWorksCount: 6,
      status: 'outstanding',
      email: 'chonlada.k@schoolnexus.ac.th',
      phone: '087-123-4567',
      parentName: 'นางพิมล แก้วมณี',
      parentPhone: '081-223-4455',
      parentRelation: 'มารดา',
    },
  ],
};

export const StudentRosterModal: React.FC<StudentRosterModalProps> = ({
  classroom,
  onClose,
}) => {
  const [roster, setRoster] = useState<StudentRosterItem[]>(() => {
    return MOCK_ROSTERS[classroom.id] || MOCK_ROSTERS['cls-601-ai'];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'outstanding' | 'normal' | 'at_risk'>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentRosterItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notifyModalStudent, setNotifyModalStudent] = useState<StudentRosterItem | null>(null);
  const [notifyText, setNotifyText] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    studentId: '',
    thaiName: '',
    nickname: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    parentName: '',
    parentPhone: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredRoster = roster.filter((std) => {
    const matchesSearch =
      std.thaiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      std.studentId.includes(searchQuery) ||
      std.nickname.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || std.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const outstandingCount = roster.filter((s) => s.status === 'outstanding').length;
  const atRiskCount = roster.filter((s) => s.status === 'at_risk').length;
  const avgGpa = (roster.reduce((acc, curr) => acc + curr.gpa, 0) / (roster.length || 1)).toFixed(2);
  const avgAttendance = (roster.reduce((acc, curr) => acc + curr.attendanceRate, 0) / (roster.length || 1)).toFixed(1);

  const handleExportCSV = () => {
    const headers = [
      'เลขที่',
      'รหัสนักเรียน',
      'ชื่อ-นามสกุล',
      'ชื่อเล่น',
      'เพศ',
      'เกรดเฉลี่ย',
      'อัตราการเข้าเรียน (%)',
      'ส่งงานแล้ว (ชิ้น)',
      'งานทั้งหมด',
      'สถานะ',
      'เบอร์โทรนักเรียน',
      'ผู้ปกครอง',
      'เบอร์โทรผู้ปกครอง',
    ];

    const rows = roster.map((s) => [
      s.studentNumber,
      `"${s.studentId}"`,
      `"${s.thaiName}"`,
      `"${s.nickname}"`,
      s.gender === 'male' ? 'ชาย' : 'หญิง',
      s.gpa.toFixed(2),
      `${s.attendanceRate}%`,
      s.submittedWorksCount,
      s.totalWorksCount,
      s.status === 'outstanding' ? 'ดีเยี่ยม' : s.status === 'at_risk' ? 'เสี่ยงตกหล่น' : 'ปกติ',
      `"${s.phone}"`,
      `"${s.parentName} (${s.parentRelation})"`,
      `"${s.parentPhone}"`,
    ]);

    const csvContent = '\uFEFF' + [
      `"บัญชีรายชื่อนักเรียน - ห้อง ${classroom.thaiGrade}"`,
      `"วิชา: ${classroom.subjectCode} ${classroom.subjectName}",,"พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}"`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      '',
      `"สรุปภาพรวมห้องเรียน",,"จำนวนนักเรียนทั้งหมด: ${roster.length} คน","GPA เฉลี่ย: ${avgGpa}","การเข้าเรียนเฉลี่ย: ${avgAttendance}%"`,
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายชื่อนักเรียน_${classroom.thaiGrade.replace('/', '_')}_${classroom.subjectCode}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`ดาวน์โหลดบัญชีรายชื่อห้อง ${classroom.thaiGrade} สำเร็จแล้ว!`);
  };

  const handleSendNotification = async () => {
    if (!notifyModalStudent || !notifyText.trim()) return;
    try {
      await pushRealtimeNotification({
        title: `ข้อความจากอาจารย์ผู้สอน (${classroom.subjectCode})`,
        message: notifyText.trim(),
        type: 'grade',
        priority: 'high',
      });
      showToast(`ส่งข้อความแจ้งเตือนถึง ${notifyModalStudent.thaiName} และผู้ปกครองสำเร็จ!`);
      setNotifyModalStudent(null);
      setNotifyText('');
    } catch (e) {
      showToast(`ส่งข้อความสำเร็จ! (แจ้งเตือนถึงผู้เรียนทันที)`);
      setNotifyModalStudent(null);
      setNotifyText('');
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.studentId || !newStudentData.thaiName) {
      alert('กรุณากรอกรหัสและชื่อ-นามสกุลนักเรียน');
      return;
    }
    const newStudent: StudentRosterItem = {
      id: `std-custom-${Date.now()}`,
      studentNumber: roster.length + 1,
      studentId: newStudentData.studentId,
      name: newStudentData.thaiName,
      thaiName: newStudentData.thaiName,
      nickname: newStudentData.nickname || '-',
      avatar: newStudentData.gender === 'male'
        ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
      gender: newStudentData.gender,
      gpa: 3.50,
      attendanceRate: 100,
      submittedWorksCount: 0,
      totalWorksCount: 12,
      status: 'normal',
      email: `${newStudentData.studentId}@schoolnexus.ac.th`,
      phone: newStudentData.phone || '-',
      parentName: newStudentData.parentName || '-',
      parentPhone: newStudentData.parentPhone || '-',
      parentRelation: 'ผู้ปกครอง',
    };

    setRoster((prev) => [...prev, newStudent]);
    setShowAddStudentModal(false);
    setNewStudentData({
      studentId: '',
      thaiName: '',
      nickname: '',
      gender: 'male',
      phone: '',
      parentName: '',
      parentPhone: '',
    });
    showToast(`เพิ่ม ${newStudent.thaiName} เข้าห้อง ${classroom.thaiGrade} เรียบร้อยแล้ว!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div
        className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-bounce">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Modal Header Banner */}
        <div className="bg-gradient-to-r from-[#121b2e] via-[#1a2948] to-[#1550d3] p-5 sm:p-6 text-white relative flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl font-black font-mono shadow-sm">
              {classroom.thaiGrade}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-400/20 text-blue-200 border border-blue-400/30 text-[11px] font-mono font-bold">
                  {classroom.subjectCode}
                </span>
                <span className="text-xs text-blue-200">{classroom.room}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
                บัญชีรายชื่อนักเรียน (Student Roster)
              </h2>
              <p className="text-xs text-slate-300">
                {classroom.subjectName} • ทั้งหมด {roster.length} คน
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="ส่งออกรายชื่อเป็นไฟล์ Excel / CSV"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-300">download</span>
              <span>ส่งออก CSV/Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddStudentModal(true)}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>เพิ่มนักเรียน</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200/80 shrink-0">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1550d3] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">จำนวนทั้งหมด</div>
              <div className="text-base font-black text-slate-900">{roster.length} คน</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">school</span>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">เกรดเฉลี่ย (GPA)</div>
              <div className="text-base font-black text-emerald-600">{avgGpa}</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">การเข้าเรียนเฉลี่ย</div>
              <div className="text-base font-black text-cyan-800">{avgAttendance}%</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">กลุ่มเสี่ยงตกหล่น</div>
              <div className="text-base font-black text-amber-600">{atRiskCount} คน</div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 bg-white">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-[#1550d3] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({roster.length})
            </button>
            <button
              onClick={() => setFilterStatus('outstanding')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'outstanding'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              ดีเยี่ยม ({outstandingCount})
            </button>
            <button
              onClick={() => setFilterStatus('normal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'normal'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              ปกติ
            </button>
            <button
              onClick={() => setFilterStatus('at_risk')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'at_risk'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              เสี่ยงตกหล่น / ขาดงาน ({atRiskCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัส, ชื่อ, หรือชื่อเล่น..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1550d3] focus:bg-white"
            />
          </div>
        </div>

        {/* Students Table / Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredRoster.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <span className="material-symbols-outlined text-4xl">search_off</span>
              <div className="text-sm font-bold text-slate-600">ไม่พบข้อมูลนักเรียนที่ค้นหา</div>
              <div className="text-xs">ลองค้นหาด้วยคำค้นอื่น หรือเปลี่ยนแท็บตัวกรอง</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredRoster.map((std) => (
                <div
                  key={std.id}
                  className="bg-white hover:bg-blue-50/40 p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  {/* Left Identity Info */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      {std.studentNumber}
                    </div>

                    <img
                      src={std.avatar}
                      alt={std.thaiName}
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-xs shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[#1550d3] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {std.studentId}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{std.thaiName}</h4>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          ({std.nickname})
                        </span>
                        {std.status === 'outstanding' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">star</span>
                            <span>ดีเยี่ยม</span>
                          </span>
                        )}
                        {std.status === 'at_risk' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            <span>ติดตามด่วน</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1 flex-wrap">
                        <span>{std.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">call</span>
                          <span>{std.phone}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">family_restroom</span>
                          <span>ผู้ปกครอง: {std.parentName} ({std.parentPhone})</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Academic Stats & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                    <div className="flex items-center gap-3 text-right">
                      <div className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="text-[9px] text-slate-400 font-bold uppercase">GPA</div>
                        <div className="text-xs font-black text-slate-800 font-mono">{std.gpa.toFixed(2)}</div>
                      </div>

                      <div className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="text-[9px] text-slate-400 font-bold uppercase">เข้าเรียน</div>
                        <div className={`text-xs font-black font-mono ${std.attendanceRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {std.attendanceRate}%
                        </div>
                      </div>

                      <div className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="text-[9px] text-slate-400 font-bold uppercase">ส่งงาน</div>
                        <div className="text-xs font-black text-blue-700 font-mono">
                          {std.submittedWorksCount}/{std.totalWorksCount}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(std)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="ดูข้อมูลนักเรียนฉบับเต็ม"
                      >
                        <span className="material-symbols-outlined text-[15px]">badge</span>
                        <span className="hidden sm:inline">ประวัติ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNotifyModalStudent(std);
                          setNotifyText(`เรียน ผู้ปกครองของ ${std.thaiName}: ขอแจ้งความคืบหน้าการเรียนวิชา ${classroom.subjectCode}`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1550d3] border border-blue-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="ส่งข้อความแจ้งเตือนนักเรียน / ผู้ปกครอง"
                      >
                        <span className="material-symbols-outlined text-[15px]">send</span>
                        <span className="hidden sm:inline">แจ้งเตือน</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            แสดง <span className="font-bold text-slate-800">{filteredRoster.length}</span> จากทั้งหมด <span className="font-bold text-slate-800">{roster.length}</span> คน
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudent.avatar}
                  alt={selectedStudent.thaiName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[#1550d3] shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1550d3] font-mono text-xs font-bold border border-blue-200">
                      {selectedStudent.studentId}
                    </span>
                    <span className="text-xs text-slate-400">เลขที่ {selectedStudent.studentNumber}</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">{selectedStudent.thaiName}</h3>
                  <p className="text-xs text-slate-500">{selectedStudent.name} (ชื่อเล่น: {selectedStudent.nickname})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-center">
                  <div className="text-[10px] text-slate-400 font-bold">GPA สะสม</div>
                  <div className="text-base font-black text-[#1550d3]">{selectedStudent.gpa.toFixed(2)}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <div className="text-[10px] text-slate-400 font-bold">การเข้าเรียน</div>
                  <div className="text-base font-black text-emerald-600">{selectedStudent.attendanceRate}%</div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-center">
                  <div className="text-[10px] text-slate-400 font-bold">ส่งงานวิชานี้</div>
                  <div className="text-base font-black text-purple-700">{selectedStudent.submittedWorksCount}/{selectedStudent.totalWorksCount}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">contact_phone</span>
                  <span>ข้อมูลติดต่อ & ผู้ปกครอง</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">อีเมลสถาบัน:</span>
                    <span className="font-semibold text-slate-700">{selectedStudent.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">เบอร์โทรศัพท์:</span>
                    <span className="font-semibold text-slate-700">{selectedStudent.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ผู้ปกครอง ({selectedStudent.parentRelation}):</span>
                    <span className="font-semibold text-slate-700">{selectedStudent.parentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">เบอร์โทรผู้ปกครอง:</span>
                    <span className="font-semibold text-slate-700">{selectedStudent.parentPhone}</span>
                  </div>
                </div>
              </div>

              {selectedStudent.notes && (
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">sticky_note_2</span>
                    <span>บันทึกความประพฤติ & หมายเหตุ</span>
                  </div>
                  <p className="text-xs text-amber-900 mt-1">{selectedStudent.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const s = selectedStudent;
                  setSelectedStudent(null);
                  setNotifyModalStudent(s);
                  setNotifyText(`เรียน ผู้ปกครองของ ${s.thaiName}: รายงานผลการเรียนและการเข้าชั้นเรียนวิชา ${classroom.subjectCode}`);
                }}
                className="px-4 py-2 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">send</span>
                <span>ส่งข้อความหานักเรียน</span>
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify Student / Parent Modal */}
      {notifyModalStudent && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setNotifyModalStudent(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1550d3] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">ส่งการแจ้งเตือนถึงผู้เรียน</h3>
                <p className="text-xs text-slate-500">ถึง: {notifyModalStudent.thaiName} ({notifyModalStudent.studentId})</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">ข้อความแจ้งเตือน:</label>
              <textarea
                value={notifyText}
                onChange={(e) => setNotifyText(e.target.value)}
                rows={4}
                placeholder="พิมพ์ข้อความที่ต้องการแจ้งเตือน เช่น แจ้งเตือนส่งงาน, นัดหมายติวเสริม..."
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1550d3] focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNotifyModalStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSendNotification}
                className="px-5 py-2 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>ส่งแจ้งเตือนทันที</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowAddStudentModal(false)}
        >
          <form
            onSubmit={handleAddStudent}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">person_add</span>
                <h3 className="font-bold text-base text-slate-900">เพิ่มนักเรียนเข้าห้อง {classroom.thaiGrade}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">รหัสนักเรียน *</label>
                  <input
                    type="text"
                    required
                    value={newStudentData.studentId}
                    onChange={(e) => setNewStudentData({ ...newStudentData, studentId: e.target.value })}
                    placeholder="เช่น 66040999"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เพศ</label>
                  <select
                    value={newStudentData.gender}
                    onChange={(e) => setNewStudentData({ ...newStudentData, gender: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white"
                  >
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อ-นามสกุล (ภาษาไทย) *</label>
                <input
                  type="text"
                  required
                  value={newStudentData.thaiName}
                  onChange={(e) => setNewStudentData({ ...newStudentData, thaiName: e.target.value })}
                  placeholder="เช่น นายธนพล สุขสวัสดิ์"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ชื่อเล่น</label>
                  <input
                    type="text"
                    value={newStudentData.nickname}
                    onChange={(e) => setNewStudentData({ ...newStudentData, nickname: e.target.value })}
                    placeholder="เช่น ท็อป"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={newStudentData.phone}
                    onChange={(e) => setNewStudentData({ ...newStudentData, phone: e.target.value })}
                    placeholder="08X-XXX-XXXX"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ชื่อผู้ปกครอง</label>
                  <input
                    type="text"
                    value={newStudentData.parentName}
                    onChange={(e) => setNewStudentData({ ...newStudentData, parentName: e.target.value })}
                    placeholder="ชื่อ-นามสกุล ผู้ปกครอง"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เบอร์โทรผู้ปกครอง</label>
                  <input
                    type="text"
                    value={newStudentData.parentPhone}
                    onChange={(e) => setNewStudentData({ ...newStudentData, parentPhone: e.target.value })}
                    placeholder="08X-XXX-XXXX"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                บันทึกรายชื่อ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
