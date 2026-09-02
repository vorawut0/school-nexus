import React, { useState, useEffect } from 'react';

export type CampusPulseTab = 'overview' | 'students' | 'teachers' | 'online' | 'attendance';

interface CampusPulseModalProps {
  isOpen: boolean;
  initialTab?: CampusPulseTab;
  onClose: () => void;
  totalStudents?: number;
}

export const CampusPulseModal: React.FC<CampusPulseModalProps> = ({
  isOpen,
  initialTab = 'overview',
  onClose,
  totalStudents = 1248,
}) => {
  const [activeTab, setActiveTab] = useState<CampusPulseTab>(initialTab);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherDeptFilter, setTeacherDeptFilter] = useState('all');
  const [studentGradeFilter, setStudentGradeFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto clear toast after 4s
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Update active tab if initialTab changes when opening
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Faculty Mock List
  const facultyMembers = [
    {
      id: 't-1',
      name: 'ดร. ธีรภัทร ชาญวิทย์',
      engName: 'Dr. Theeraphat Chanwit',
      dept: 'cs',
      deptName: 'วิทยาการคำนวณและ AI',
      role: 'Head of AI & CS Department',
      room: 'Sci-Tech Lab 402',
      status: 'available',
      statusText: 'พร้อมให้คำปรึกษา (Office Hour)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      email: 'theeraphat.c@nexus.ac.th',
      courses: ['CS30201 Advanced Computer Science', 'AI Machine Learning Lab'],
    },
    {
      id: 't-2',
      name: 'อ. กุลนันท์ พงศ์วราภรณ์',
      engName: 'Aj. Kulanan Pongwaraporn',
      dept: 'design',
      deptName: 'การออกแบบและดิจิทัลมีเดีย',
      role: 'Lead UI/UX Instructor',
      room: 'Design Studio 301',
      status: 'in_class',
      statusText: 'กำลังสอน (Lab Section A)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      email: 'kulanan.p@nexus.ac.th',
      courses: ['DS20104 UI/UX Design System', 'Creative Prototyping'],
    },
    {
      id: 't-3',
      name: 'อ. ภูวดล รัตนพิบูลย์',
      engName: 'Aj. Poowadol Rattanapiboon',
      dept: 'media',
      deptName: 'มัลติมีเดียและโปรดักชัน',
      role: 'Audio-Visual Sound Specialist',
      room: 'Sound Lab 204',
      status: 'available',
      statusText: 'ประจำห้องปฏิบัติการบันทึกเสียง',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      email: 'poowadol.r@nexus.ac.th',
      courses: ['MM30102 Multimedia Production', 'Spatial Sound Engineering'],
    },
    {
      id: 't-4',
      name: 'ผศ.ดร. นลินี ศรีสวัสดิ์',
      engName: 'Asst. Prof. Dr. Nalinee Srisawat',
      dept: 'math',
      deptName: 'คณิตศาสตร์ขั้นสูงและสถิติ',
      role: 'Senior Math Faculty',
      room: 'Math Center 505',
      status: 'meeting',
      statusText: 'ประชุมวิชาการ (Academic Board)',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      email: 'nalinee.s@nexus.ac.th',
      courses: ['MA30101 Advanced Calculus & Linear Algebra'],
    },
    {
      id: 't-5',
      name: 'อ. ภาคิน วรากร',
      engName: 'Aj. Parkin Warakorn',
      dept: 'cs',
      deptName: 'วิทยาการคำนวณและ AI',
      role: 'Cybersecurity & Cloud Systems Instructor',
      room: 'Cloud Computing Lab 405',
      status: 'in_class',
      statusText: 'กำลังสอน (Full-Stack Dev)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      email: 'parkin.w@nexus.ac.th',
      courses: ['CS30202 Cloud Architecture', 'Network Security'],
    },
    {
      id: 't-6',
      name: 'อ. รมิดา เกียรติเกรียงไกร',
      engName: 'Aj. Ramida Kiatkriangkrai',
      dept: 'lang',
      deptName: 'ภาษาและการสื่อสารสากล',
      role: 'Global Communications Director',
      room: 'Language Hub 102',
      status: 'available',
      statusText: 'พร้อมให้คำปรึกษา IELTS/TOEFL',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      email: 'ramida.k@nexus.ac.th',
      courses: ['EN30101 Academic English Presentation'],
    },
  ];

  const filteredFaculty = facultyMembers.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      item.engName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      item.deptName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      item.room.toLowerCase().includes(teacherSearch.toLowerCase());
    const matchDept = teacherDeptFilter === 'all' || item.dept === teacherDeptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-scaleIn">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#121b2e] to-[#1e293b] text-white flex justify-between items-center relative overflow-hidden border-b border-slate-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#1550d3] rounded-full mix-blend-screen filter blur-[70px] opacity-25 pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#1550d3] text-white flex items-center justify-center shadow-lg shadow-[#1550d3]/40 border border-white/20">
              <span className="material-symbols-outlined text-[26px]">monitoring</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Campus Pulse</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#20C997]/20 text-[#20C997] border border-[#20C997]/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse" />
                  Live Stream
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                ข้อมูลสถิติและสถานะภาพรวมของโรงเรียนแบบเรียลไทม์ (Real-Time School Telemetry)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10 active:scale-95"
            title="ปิดหน้าต่าง"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 bg-[#f4f6fb] border-b border-slate-200 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-[#1550d3] shadow-xs border border-slate-200/80'
                : 'text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>ภาพรวม (Overview)</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-white text-[#1550d3] shadow-xs border border-slate-200/80'
                : 'text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>นักเรียน ({totalStudents.toLocaleString()})</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-white text-[#5f3add] shadow-xs border border-slate-200/80'
                : 'text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">school</span>
            <span>คณาจารย์ (68)</span>
          </button>

          <button
            onClick={() => setActiveTab('online')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'online'
                ? 'bg-white text-[#00694d] shadow-xs border border-slate-200/80'
                : 'text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">wifi</span>
            <span>ออนไลน์ (326)</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80'
                : 'text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            <span>การเข้าเรียน (96.8%)</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#fbfbfe] space-y-6 relative">
          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="p-3 bg-[#1550d3] text-white rounded-xl text-xs font-semibold shadow-lg flex items-center justify-between animate-fadeIn sticky top-0 z-30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-white/80 hover:text-white text-xs font-bold px-2 py-0.5"
              >
                ✕
              </button>
            </div>
          )}
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* 4 Interactive KPI Cards (Clickable to switch tab) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  onClick={() => setActiveTab('students')}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:border-[#1550d3] hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#1550d3]/10 text-[#1550d3] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[22px]">group</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#1550d3] opacity-0 group-hover:opacity-100 transition-opacity">
                      ดูข้อมูล ➔
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[#737686] block">Total Students</span>
                    <span className="text-2xl font-bold text-[#121b2e]">{totalStudents.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#00694d] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    +100% Active Enrollment
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('teachers')}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:border-[#5f3add] hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#5f3add]/10 text-[#5f3add] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[22px]">school</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#5f3add] opacity-0 group-hover:opacity-100 transition-opacity">
                      ดูข้อมูล ➔
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[#737686] block">Faculty & Teachers</span>
                    <span className="text-2xl font-bold text-[#121b2e]">68</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#5f3add] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    พร้อมปรึกษา 16 ท่าน (สัดส่วน 1:18.3)
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('online')}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:border-[#20C997] hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#20C997]/15 text-[#00694d] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[22px]">wifi</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#00694d] opacity-0 group-hover:opacity-100 transition-opacity">
                      ดูข้อมูล ➔
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[#737686] block">Online Now</span>
                    <span className="text-2xl font-bold text-[#121b2e]">326</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#00694d] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse" />
                    LMS Active Traffic
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('attendance')}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:border-amber-400 hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#FFB800]/15 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[22px]">fact_check</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      ดูข้อมูล ➔
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[#737686] block">School Attendance</span>
                    <span className="text-2xl font-bold text-[#121b2e]">96.8%</span>
                  </div>
                  <div className="mt-2 text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">military_tech</span>
                    ยอดเยี่ยม (Top Tier)
                  </div>
                </div>
              </div>

              {/* Campus Infrastructure Highlights */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <h3 className="font-bold text-base text-[#121b2e] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1550d3]">sensors</span>
                  สถานะอาคารและสิ่งอำนวยความสะดวกในวิทยาเขต (Campus Facilities Pulse)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#f8f9fe] border border-slate-200/70 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-[#737686]">
                      <span className="font-semibold">ห้องสมุดดิจิทัล (Digital Library)</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        หนาแน่น 68%
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-lg font-bold text-[#121b2e]">98 / 150 ที่นั่ง</div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-[#1550d3] h-full rounded-full w-[68%]" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#f8f9fe] border border-slate-200/70 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-[#737686]">
                      <span className="font-semibold">Sci-Tech & AI Lab 402</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#1550d3] text-[10px] font-bold">
                        เปิดใช้งานปกติ
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-lg font-bold text-[#121b2e]">38 / 40 เครื่อง</div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-[#20C997] h-full rounded-full w-[95%]" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#f8f9fe] border border-slate-200/70 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-[#737686]">
                      <span className="font-semibold">โรงอาหารอัจฉริยะ (Cafeteria)</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        คิวเฉลี่ย 2 นาที
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-lg font-bold text-[#121b2e]">ระบบ Cashless 100%</div>
                      <div className="text-xs text-[#737686] mt-0.5">สแกนจ่ายผ่าน Nexus Digital ID</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick AI Summary */}
              <div className="bg-gradient-to-r from-[#1550d3]/10 to-[#7857f8]/10 p-4 rounded-2xl border border-[#1550d3]/20 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1550d3] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                </div>
                <div className="text-xs sm:text-sm text-[#121b2e]">
                  <span className="font-bold text-[#1550d3] block mb-0.5">สรุปภาพรวมวันนี้จากระบบวิเคราะห์อัตโนมัติ:</span>
                  วิทยาเขตมีการดำเนินกิจกรรมการเรียนการสอนเต็มรูปแบบ อัตราการเข้าเรียนของนักเรียนระดับ ม.6 สูงสุดที่ 98.4% ระบบเครือข่าย Wi-Fi 6 และเซิร์ฟเวอร์ LMS มีความเสถียร 99.98%
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TOTAL STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h3 className="font-bold text-base text-[#121b2e]">
                    โครงสร้างประชากรนักเรียน (Student Demographics)
                  </h3>
                  <p className="text-xs text-[#737686]">
                    จำนวนนักเรียนทั้งหมด {totalStudents.toLocaleString()} คน แบ่งตามระดับชั้นและแผนการเรียน
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={studentGradeFilter}
                    onChange={(e) => setStudentGradeFilter(e.target.value)}
                    className="text-xs font-semibold bg-[#f8f9fe] border border-slate-200 rounded-xl px-3 py-2 text-[#121b2e] focus:outline-none focus:ring-2 focus:ring-[#1550d3]/20 cursor-pointer"
                  >
                    <option value="all">ทุกระดับชั้น (ม.1 - ม.6)</option>
                    <option value="m6">มัธยมศึกษาปีที่ 6 (Grade 12)</option>
                    <option value="m5">มัธยมศึกษาปีที่ 5 (Grade 11)</option>
                    <option value="m4">มัธยมศึกษาปีที่ 4 (Grade 10)</option>
                    <option value="m3">มัธยมศึกษาตอนต้น (ม.1 - ม.3)</option>
                  </select>
                </div>
              </div>

              {/* Grade Level Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { grade: 'ม.6 (Grade 12)', count: 208, percent: 16.7, track: 'Sci-Tech / AI / Arts', color: '#1550d3' },
                  { grade: 'ม.5 (Grade 11)', count: 212, percent: 17.0, track: 'Sci-Tech / Language', color: '#5f3add' },
                  { grade: 'ม.4 (Grade 10)', count: 215, percent: 17.2, track: 'Sci-Math / Business', color: '#20C997' },
                  { grade: 'ม.3 (Grade 9)', count: 198, percent: 15.9, track: 'General Middle School', color: '#FFB800' },
                  { grade: 'ม.2 (Grade 8)', count: 205, percent: 16.4, track: 'General Middle School', color: '#00694d' },
                  { grade: 'ม.1 (Grade 7)', count: 210, percent: 16.8, track: 'Foundation Curriculum', color: '#7857f8' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#121b2e]">{item.grade}</span>
                        <span className="text-[11px] font-semibold text-[#737686]">{item.percent}%</span>
                      </div>
                      <div className="text-xl font-bold text-[#121b2e] mt-1">{item.count} คน</div>
                      <div className="text-[11px] text-[#737686] mt-0.5 truncate">{item.track}</div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.percent * 4}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Programs & Academic Tracks */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <h4 className="font-bold text-sm text-[#121b2e] mb-3">
                  สัดส่วนแผนการเรียนระดับมัธยมศึกษาตอนปลาย (High School Academic Tracks)
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>🤖 Sci-Tech, AI & Robotics (คอมพิวเตอร์และปัญญาประดิษฐ์)</span>
                      <span className="text-[#1550d3]">42% (266 คน)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#1550d3] h-full rounded-full w-[42%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>🎨 Digital Media, Arts & UI/UX (ดิจิทัลอาร์ตและออกแบบ)</span>
                      <span className="text-[#5f3add]">28% (178 คน)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#5f3add] h-full rounded-full w-[28%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>🌐 Global Languages & International Business (ภาษาและธุรกิจสากล)</span>
                      <span className="text-[#20C997]">18% (114 คน)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#20C997] h-full rounded-full w-[18%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>🔬 Applied Bio-Medicine & Health Sci (วิทยาศาสตร์สุขภาพและการแพทย์)</span>
                      <span className="text-amber-600">12% (77 คน)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#FFB800] h-full rounded-full w-[12%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEACHERS & FACULTY */}
          {activeTab === 'teachers' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Faculty Department Breakdown Banner */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-[#121b2e] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#5f3add]">groups</span>
                      โครงสร้างอัตรากำลังคณาจารย์ (Faculty Roster & Workload)
                    </h3>
                    <p className="text-xs text-[#737686]">
                      จำนวนคณาจารย์ทั้งหมด 68 ท่าน ประจำ 8 กลุ่มสาระการเรียนรู้ (สัดส่วนครูต่อนักเรียน 1 : 18.3 ตามเกณฑ์มาตรฐาน สพฐ.)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-50 text-[#5f3add] border border-purple-200 rounded-xl text-xs font-bold shrink-0 w-fit">
                    พร้อมปรึกษาขณะนี้ 16 ท่าน
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {[
                    { dept: 'วิทยาศาสตร์ & เทคโนโลยี', count: 14, color: '#1550d3' },
                    { dept: 'ภาษาต่างประเทศ', count: 12, color: '#5f3add' },
                    { dept: 'คณิตศาสตร์', count: 11, color: '#20C997' },
                    { dept: 'ภาษาไทย', count: 8, color: '#FFB800' },
                    { dept: 'สังคมศึกษาฯ', count: 8, color: '#e11d48' },
                    { dept: 'สุขศึกษา & พลศึกษา', count: 5, color: '#0284c7' },
                    { dept: 'ศิลปะ & ดนตรี', count: 5, color: '#9333ea' },
                    { dept: 'การงานอาชีพ & แนะแนว', count: 5, color: '#d97706' },
                  ].map((d, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-[#f8f9fe] border border-slate-200/70 flex items-center justify-between">
                      <span className="text-[11.5px] font-semibold text-[#434654] truncate mr-1">{d.dept}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md text-white shrink-0" style={{ backgroundColor: d.color }}>
                        {d.count} ท่าน
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="ค้นหาชื่ออาจารย์, ภาควิชา, หรือห้องพักครู..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-[#121b2e] placeholder:text-[#737686] focus:outline-none focus:ring-2 focus:ring-[#5f3add]/20 focus:border-[#5f3add]"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={teacherDeptFilter}
                    onChange={(e) => setTeacherDeptFilter(e.target.value)}
                    className="h-11 text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 text-[#121b2e] focus:outline-none focus:ring-2 focus:ring-[#5f3add]/20 cursor-pointer shrink-0"
                  >
                    <option value="all">ทุกกลุ่มสาระ (68 ท่าน)</option>
                    <option value="cs">วิทยาการคำนวณและ AI</option>
                    <option value="design">การออกแบบและ UI/UX</option>
                    <option value="media">มัลติมีเดีย</option>
                    <option value="math">คณิตศาสตร์ขั้นสูง</option>
                    <option value="lang">ภาษาต่างประเทศ</option>
                  </select>
                </div>
              </div>

              {/* Teacher Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredFaculty.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-3 hover:border-[#5f3add]/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={teacher.avatar}
                        alt={teacher.name}
                        className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-sm text-[#121b2e] truncate">{teacher.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              teacher.status === 'available'
                                ? 'bg-emerald-100 text-emerald-800'
                                : teacher.status === 'in_class'
                                ? 'bg-blue-100 text-[#1550d3]'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {teacher.status === 'available' ? 'พร้อมให้คำปรึกษา' : teacher.status === 'in_class' ? 'กำลังสอน' : 'ติดประชุม'}
                          </span>
                        </div>
                        <div className="text-xs text-[#5f3add] font-medium truncate">{teacher.role}</div>
                        <div className="text-[11px] text-[#737686] flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                          {teacher.room}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#f8f9fe] p-2.5 rounded-xl border border-slate-100 text-[11.5px] text-[#434654]">
                      <span className="font-bold text-[#121b2e] block mb-0.5">วิชาที่รับผิดชอบ:</span>
                      <div className="truncate text-[#737686]">{teacher.courses.join(', ')}</div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setToastMessage(`📅 ส่งคำขอเข้าพบอาจารย์ ${teacher.name} ในช่วง Office Hours เรียบร้อยแล้ว`)}
                        className="flex-1 py-2 rounded-xl bg-[#5f3add] hover:bg-[#4d2dbf] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[15px]">calendar_add_on</span>
                        <span>นัดปรึกษา</span>
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(teacher.email);
                          setToastMessage(`✉️ คัดลอกอีเมลอาจารย์แล้ว: ${teacher.email}`);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#434654] text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title={teacher.email}
                      >
                        <span className="material-symbols-outlined text-[16px]">mail</span>
                        <span>อีเมล</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ONLINE NOW & NETWORK */}
          {activeTab === 'online' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-[#121b2e] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#20C997] animate-pulse" />
                      326 อุปกรณ์ที่กำลังเชื่อมต่อระบบโรงเรียน
                    </h3>
                    <p className="text-xs text-[#737686]">
                      ความหนาแน่นของผู้ใช้งานเครือข่ายความเร็วสูง Wi-Fi 6 ในแต่ละโซนของวิทยาเขต
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-[#00694d] border border-emerald-200 rounded-xl text-xs font-bold">
                    Campus Network: 10 Gbps (Normal)
                  </span>
                </div>

                {/* Zone Traffic Bars */}
                <div className="space-y-3.5">
                  {[
                    { zone: 'Learning Commons & Library', users: 98, capacity: 150, ping: '2ms' },
                    { zone: 'Sci-Tech & AI Lab 402', users: 74, capacity: 80, ping: '1ms' },
                    { zone: 'Student Activity Lounge & Cafeteria', users: 56, capacity: 120, ping: '4ms' },
                    { zone: 'Multimedia & Sound Studio', users: 46, capacity: 50, ping: '2ms' },
                    { zone: 'Maker Space & Robotics Arena', users: 32, capacity: 40, ping: '3ms' },
                    { zone: 'Remote / VPN Connected Students', users: 20, capacity: 100, ping: '12ms' },
                  ].map((zone, idx) => {
                    const ratio = Math.round((zone.users / zone.capacity) * 100);
                    return (
                      <div key={idx} className="p-3 rounded-xl bg-[#f8f9fe] border border-slate-200/60">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-bold text-[#121b2e] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#1550d3]">
                              router
                            </span>
                            {zone.zone}
                          </span>
                          <span className="font-semibold text-[#00694d]">
                            {zone.users} อุปกรณ์ ({ratio}%) • Ping {zone.ping}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${ratio}%`,
                              backgroundColor: ratio > 80 ? '#FFB800' : '#20C997',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Devices Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center shadow-xs">
                  <span className="material-symbols-outlined text-[28px] text-[#1550d3]">laptop_mac</span>
                  <div className="text-xl font-bold text-[#121b2e] mt-1">189 เครื่อง (58%)</div>
                  <div className="text-xs text-[#737686]">แล็ปท็อปเพื่อการเขียนโค้ดและงานวิจัย</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center shadow-xs">
                  <span className="material-symbols-outlined text-[28px] text-[#5f3add]">tablet_mac</span>
                  <div className="text-xl font-bold text-[#121b2e] mt-1">85 เครื่อง (26%)</div>
                  <div className="text-xs text-[#737686]">แท็บเล็ตและไอแพดจดเลกเชอร์</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-center shadow-xs">
                  <span className="material-symbols-outlined text-[28px] text-[#20C997]">smartphone</span>
                  <div className="text-xl font-bold text-[#121b2e] mt-1">52 เครื่อง (16%)</div>
                  <div className="text-xs text-[#737686]">สมาร์ตโฟนผ่าน Nexus Mobile App</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-gradient-to-br from-[#1550d3] to-[#3c6bed] text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                    อัตราการเข้าเรียนประจำวัน (Daily Attendance Rate)
                  </span>
                  <div className="text-3xl sm:text-4xl font-bold mt-1">96.8%</div>
                  <p className="text-xs text-[#b5c4ff] mt-1">
                    เข้าเรียนตรงเวลา 1,208 คน จากทั้งหมด 1,248 คน
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-md text-center">
                    <div className="text-xs text-white/80">ลาป่วย/ลากิจ</div>
                    <div className="text-lg font-bold">26 คน</div>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-md text-center">
                    <div className="text-xs text-white/80">สาย (&gt;08:00)</div>
                    <div className="text-lg font-bold">10 คน</div>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-md text-center">
                    <div className="text-xs text-white/80">ขาดเรียน</div>
                    <div className="text-lg font-bold">4 คน</div>
                  </div>
                </div>
              </div>

              {/* Class by Class Attendance Ranking */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                <h4 className="font-bold text-sm text-[#121b2e] mb-3 flex items-center justify-between">
                  <span>อันดับความตรงต่อเวลาแยกตามระดับชั้น</span>
                  <span className="text-xs font-normal text-[#737686]">ประมวลผลผ่าน Gate Scanner RFID</span>
                </h4>

                <div className="space-y-2.5">
                  {[
                    { grade: 'มัธยมศึกษาปีที่ 6 (Grade 12)', rate: 98.4, rank: 1, highlight: true },
                    { grade: 'มัธยมศึกษาปีที่ 4 (Grade 10)', rate: 97.2, rank: 2 },
                    { grade: 'มัธยมศึกษาปีที่ 5 (Grade 11)', rate: 96.8, rank: 3 },
                    { grade: 'มัธยมศึกษาปีที่ 1 (Grade 7)', rate: 96.5, rank: 4 },
                    { grade: 'มัธยมศึกษาปีที่ 2 (Grade 8)', rate: 96.0, rank: 5 },
                    { grade: 'มัธยมศึกษาปีที่ 3 (Grade 9)', rate: 95.9, rank: 6 },
                  ].map((item) => (
                    <div
                      key={item.grade}
                      className={`p-3 rounded-xl flex items-center justify-between border ${
                        item.highlight
                          ? 'bg-[#1550d3]/5 border-[#1550d3]/30 font-semibold'
                          : 'bg-[#f8f9fe] border-slate-200/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            item.rank === 1
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.rank}
                        </span>
                        <span className="text-xs sm:text-sm text-[#121b2e]">
                          {item.grade} {item.highlight && <span className="text-[#1550d3] font-bold">(ระดับชั้นของคุณ)</span>}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-[#00694d]">{item.rate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-[#737686] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#20C997]">verified</span>
            อัปเดตข้อมูลอัตโนมัติทุก 30 วินาทีจาก School Nexus IoT Cloud
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#121b2e] font-bold text-xs transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
