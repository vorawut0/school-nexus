import React, { useState } from 'react';
import { UserProfile } from '../../types';

interface TeacherClassesViewProps {
  user: UserProfile;
  onOpenCreateClass?: () => void;
  onSelectClassroom?: (classId: string) => void;
}

interface ClassroomData {
  id: string;
  name: string;
  thaiGrade: string;
  subjectCode: string;
  subjectName: string;
  studentsCount: number;
  room: string;
  scheduleTime: string;
  dayOfWeek: string;
  attendanceTodayRate: number;
  pendingWorksCount: number;
  color: string;
}

export const TeacherClassesView: React.FC<TeacherClassesViewProps> = ({
  user,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'm6' | 'm5' | 'm4'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClassDetail, setShowClassDetail] = useState<string | null>(null);

  const classrooms: ClassroomData[] = [
    {
      id: 'cls-601-ai',
      name: 'ม.6/1 - ห้องเรียนวิทย์-คอมพิวเตอร์และหุ่นยนต์ AI',
      thaiGrade: 'ม.6/1',
      subjectCode: 'ว33281',
      subjectName: 'ปัญญาประดิษฐ์และวิทยาการหุ่นยนต์ (AI & Robotics)',
      studentsCount: 36,
      room: 'ห้อง 601 (AI Smart Lab)',
      scheduleTime: '08:30 - 10:10 น.',
      dayOfWeek: 'วันจันทร์, พุธ',
      attendanceTodayRate: 97.2,
      pendingWorksCount: 6,
      color: 'from-blue-600 to-indigo-700',
    },
    {
      id: 'cls-602-data',
      name: 'ม.6/2 - ห้องเรียนวิทยาการข้อมูลและอัลกอริทึม',
      thaiGrade: 'ม.6/2',
      subjectCode: 'ว33282',
      subjectName: 'วิทยาการข้อมูลและการพัฒนาเว็บสมัยใหม่',
      studentsCount: 35,
      room: 'ห้อง 602 (Computing Center)',
      scheduleTime: '10:20 - 12:00 น.',
      dayOfWeek: 'วันอังคาร, พฤหัสบดี',
      attendanceTodayRate: 94.3,
      pendingWorksCount: 12,
      color: 'from-purple-600 to-violet-700',
    },
    {
      id: 'cls-501-prog',
      name: 'ม.5/1 - การเขียนโปรแกรมเชิงวัตถุและโมบายล์แอป',
      thaiGrade: 'ม.5/1',
      subjectCode: 'ว32201',
      subjectName: 'การพัฒนาแอปพลิเคชันและโปรแกรมมิ่งพื้นฐาน',
      studentsCount: 38,
      room: 'ห้อง 501 (Innovation Hub)',
      scheduleTime: '13:00 - 14:40 น.',
      dayOfWeek: 'วันพุธ, ศุกร์',
      attendanceTodayRate: 100,
      pendingWorksCount: 3,
      color: 'from-cyan-600 to-blue-700',
    },
    {
      id: 'cls-401-cs',
      name: 'ม.4/1 - วิทยาการคำนวณและเทคโนโลยีดิจิทัล',
      thaiGrade: 'ม.4/1',
      subjectCode: 'ว31101',
      subjectName: 'วิทยาการคำนวณและทักษะศตวรรษที่ 21',
      studentsCount: 40,
      room: 'ห้อง 403 (Active Learning Room)',
      scheduleTime: '14:50 - 16:30 น.',
      dayOfWeek: 'วันพฤหัสบดี',
      attendanceTodayRate: 92.5,
      pendingWorksCount: 8,
      color: 'from-amber-600 to-orange-700',
    },
  ];

  const filteredClasses = classrooms.filter((cls) => {
    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'm6' && cls.thaiGrade.startsWith('ม.6')) ||
      (selectedFilter === 'm5' && cls.thaiGrade.startsWith('ม.5')) ||
      (selectedFilter === 'm4' && cls.thaiGrade.startsWith('ม.4'));

    const matchesSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.room.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 pb-28 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121b2e] via-[#1a2948] to-[#1550d3] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-400/30 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>ระบบบริหารจัดการชั้นเรียนอาจารย์ (Faculty Classrooms)</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ห้องเรียนและรายวิชาที่สอน
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            อาจารย์ {user.thaiName || user.name} • กลุ่มสาระ{user.department || 'วิทยาการคอมพิวเตอร์'} • ภาคเรียนที่ 1/2569
          </p>
        </div>

        {/* Quick Stats Summary */}
        <div className="relative z-10 grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 shrink-0">
          <div className="text-center px-2">
            <div className="text-2xl font-black font-mono text-white">4</div>
            <div className="text-[11px] text-blue-200">ห้องเรียนที่สอน</div>
          </div>
          <div className="text-center px-2 border-x border-white/10">
            <div className="text-2xl font-black font-mono text-[#67fcc6]">149</div>
            <div className="text-[11px] text-blue-200">นักเรียนทั้งหมด</div>
          </div>
          <div className="text-center px-2">
            <div className="text-2xl font-black font-mono text-amber-300">29</div>
            <div className="text-[11px] text-blue-200">งานรอตรวจ</div>
          </div>
        </div>
      </div>

      {/* Action Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-[#1550d3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด (4)
          </button>
          <button
            onClick={() => setSelectedFilter('m6')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'm6'
                ? 'bg-[#1550d3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ชั้น ม.6 (2)
          </button>
          <button
            onClick={() => setSelectedFilter('m5')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'm5'
                ? 'bg-[#1550d3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ชั้น ม.5 (1)
          </button>
          <button
            onClick={() => setSelectedFilter('m4')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'm4'
                ? 'bg-[#1550d3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ชั้น ม.4 (1)
          </button>
        </div>

        {/* Search Field */}
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาห้องเรียน, รหัสวิชา, หรือชื่อวิชา..."
            className="w-full pl-9.5 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1550d3] focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredClasses.map((classroom) => (
          <div
            key={classroom.id}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Card Top */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${classroom.color} text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0`}
                  >
                    {classroom.thaiGrade}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#1550d3] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {classroom.subjectCode}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{classroom.room}</span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-[#121b2e] leading-snug mt-1 group-hover:text-[#1550d3] transition-colors">
                      {classroom.subjectName}
                    </h3>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shrink-0">
                  {classroom.attendanceTodayRate}% มาเรียน
                </span>
              </div>

              {/* Meta Info */}
              <p className="text-xs text-slate-600 mb-4">{classroom.name}</p>

              {/* Progress and Schedule Grid */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">group</span>
                  <div>
                    <span className="text-[10px] text-slate-400 block">จำนวนนักเรียน</span>
                    <span className="font-bold text-slate-800">{classroom.studentsCount} คน</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">schedule</span>
                  <div>
                    <span className="text-[10px] text-slate-400 block">เวลาสอน</span>
                    <span className="font-bold text-slate-800">{classroom.scheduleTime}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">calendar_today</span>
                  <div>
                    <span className="text-[10px] text-slate-400 block">วันสอน</span>
                    <span className="font-bold text-slate-800">{classroom.dayOfWeek}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">pending_actions</span>
                  <div>
                    <span className="text-[10px] text-slate-400 block">งานรอตรวจ</span>
                    <span className="font-bold text-amber-700">{classroom.pendingWorksCount} ชิ้น</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClassDetail(classroom.id)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">folder_open</span>
                <span>สื่อ & แผนสอน</span>
              </button>
              <button
                type="button"
                onClick={() => alert(`เปิดรายชื่อนักเรียนห้อง ${classroom.thaiGrade} (${classroom.studentsCount} คน)`)}
                className="py-2.5 px-4 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">badge</span>
                <span>รายชื่อนักเรียน</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Classroom Detail Modal */}
      {showClassDetail && (
        <div
          onClick={() => setShowClassDetail(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 animate-scaleIn border border-slate-100"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1550d3]">auto_stories</span>
                <h3 className="font-bold text-base text-slate-900">สื่อการสอนและแผนการเรียน</h3>
              </div>
              <button
                onClick={() => setShowClassDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">description</span>
                  <div>
                    <div className="font-bold text-slate-800">เอกสารประกอบการสอน สัปดาห์ที่ 8 - AI Machine Learning</div>
                    <div className="text-slate-500 text-[10px]">PDF • 4.2 MB • อัปเดตเมื่อวานนี้</div>
                  </div>
                </div>
                <button className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px]">ดาวน์โหลด</button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-red-500 text-[20px]">slideshow</span>
                  <div>
                    <div className="font-bold text-slate-800">สไลด์บรรยาย: Neural Networks & Deep Learning</div>
                    <div className="text-slate-500 text-[10px]">PPTX • 18.5 MB</div>
                  </div>
                </div>
                <button className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 font-bold text-[11px]">เปิดดู</button>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">code</span>
                  <div>
                    <div className="font-bold text-slate-800">แล็บปฏิบัติการ: Python TensorFlow Lab Notebook</div>
                    <div className="text-slate-500 text-[10px]">Jupyter Notebook • ซิงค์กับ Google Colab</div>
                  </div>
                </div>
                <button className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]">เปิด Colab</button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowClassDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
