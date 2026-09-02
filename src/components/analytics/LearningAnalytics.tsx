import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Area,
  Line,
  ReferenceLine,
} from 'recharts';
import { UserProfile, Course } from '../../types';
import { MOCK_COURSES } from '../../data/mockData';

export interface SubjectAnalyticsData {
  id: string;
  code: string;
  name: string;
  category: string;
  score: number; // Current score 0-100
  classAverage: number; // Class bench 0-100
  targetScore: number;
  grade: string;
  credits: number;
  color: string;
  assignmentCompletion: number; // Percentage 0-100
  midtermScore: number; // e.g. 28/30
  finalProjectScore: number; // e.g. 38/40
  quizAverage: number; // e.g. 19/20
  attendanceRate: number; // e.g. 98%
  studyHoursTotal: number;
  instructor: string;
}

export interface DayAttendanceRecord {
  dayIndex: number; // 1 to 30
  dateStr: string; // e.g. "25 ส.ค."
  fullDate: string; // "25 ส.ค. 2026"
  dayOfWeek: 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสฯ' | 'ศุกร์';
  status: 'on_time' | 'late' | 'leave' | 'absent';
  arrivalTime: string; // e.g. "07:38"
  arrivalMinutes: number; // minutes from 07:00 (e.g. 07:38 => 38, 08:05 => 65)
  gate: string; // e.g. "Gate 1 (Main RFID)"
  bodyTemp: number; // e.g. 36.4
  periodsAttended: number; // e.g. 7 / 7
  totalPeriods: number;
  note?: string;
}

interface LearningAnalyticsProps {
  user: UserProfile;
  courses?: Course[];
  onOpenCourse?: (course: Course) => void;
  onOpenAITutor?: (subjectName?: string) => void;
  className?: string;
}

// Color Palette for charts adhering to clean aesthetic design
const SUBJECT_COLORS = [
  '#1550d3', // Cyber Blue / Tech
  '#7857f8', // Purple / Math & Logic
  '#008562', // Emerald / Science & Biotech
  '#d97706', // Amber / Humanities & Language
  '#db2777', // Pink / Arts & Design
  '#0284c7', // Sky Blue / Electives
];

const ATTENDANCE_COLORS = {
  on_time: '#008562', // Emerald
  late: '#d97706', // Amber
  leave: '#0284c7', // Sky
  absent: '#ba1a1a', // Rose/Red
};

// Generate realistic 30-day attendance dataset for student
export function generate30DayAttendanceData(): DayAttendanceRecord[] {
  const dayNames: ('จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสฯ' | 'ศุกร์')[] = [
    'จันทร์',
    'อังคาร',
    'พุธ',
    'พฤหัสฯ',
    'ศุกร์',
  ];

  const records: DayAttendanceRecord[] = [];
  const now = new Date(2026, 7, 25); // 25 Aug 2026

  let count = 0;
  let dayOffset = 42; // look back ~6 calendar weeks to collect 30 school days

  while (count < 30 && dayOffset >= 0) {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    dayOffset--;

    const dayNum = d.getDay();
    if (dayNum === 0 || dayNum === 6) {
      continue; // Skip weekends
    }

    count++;
    const dayOfWeek = dayNames[(dayNum - 1) % 5];
    const dateStr = `${d.getDate()} ${['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][d.getMonth()]}`;
    const fullDate = `${d.getDate()} ${['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][d.getMonth()]} 2026`;

    // Realistic arrival distribution
    let status: 'on_time' | 'late' | 'leave' | 'absent' = 'on_time';
    let arrivalMinutes = 25 + Math.floor(Math.sin(count * 1.7) * 12) + (count % 4); // 07:15 - 07:45
    let arrivalTime = `07:${arrivalMinutes.toString().padStart(2, '0')}`;
    let note: string | undefined = undefined;

    // Introduce 1 late day and 1 leave day realistically
    if (count === 14) {
      status = 'late';
      arrivalMinutes = 68; // 08:08
      arrivalTime = '08:08';
      note = 'การจราจรถนนสายหลักติดขัดหน้าโรงเรียน';
    } else if (count === 22) {
      status = 'leave';
      arrivalMinutes = 0;
      arrivalTime = '-';
      note = 'ลาป่วย (แนบใบรับรองแพทย์ตรวจคลินิก)';
    }

    const bodyTemp = status === 'leave' ? 37.8 : Number((36.3 + (count % 5) * 0.1).toFixed(1));
    const periodsAttended = status === 'leave' ? 0 : 7;

    records.push({
      dayIndex: count,
      dateStr,
      fullDate,
      dayOfWeek,
      status,
      arrivalTime,
      arrivalMinutes: status === 'leave' ? 0 : arrivalMinutes,
      gate: count % 3 === 0 ? 'Gate 2 (East RFID)' : 'Gate 1 (Main RFID Hub)',
      bodyTemp,
      periodsAttended,
      totalPeriods: 7,
      note,
    });
  }

  return records;
}

// Generate comprehensive subject performance statistics
export function generateSubjectAnalyticsData(userGpa: number = 3.92): SubjectAnalyticsData[] {
  const gpaMultiplier = userGpa / 4.0;

  return [
    {
      id: 'cs-101',
      code: 'ว30101',
      name: 'วิทยาการคำนวณ & AI',
      category: 'เทคโนโลยี',
      score: Math.min(99, Math.round(96 * gpaMultiplier + 3)),
      classAverage: 82.4,
      targetScore: 95,
      grade: '4.0',
      credits: 1.5,
      color: SUBJECT_COLORS[0],
      assignmentCompletion: 100,
      midtermScore: 29.5,
      finalProjectScore: 39.0,
      quizAverage: 19.5,
      attendanceRate: 100,
      studyHoursTotal: 42.5,
      instructor: 'อ. กิตติพงษ์ วิศวกรรมไอที',
    },
    {
      id: 'math-102',
      code: 'ค33101',
      name: 'คณิตศาสตร์ขั้นสูง (Calculus & Vectors)',
      category: 'คณิตศาสตร์',
      score: Math.min(98, Math.round(92 * gpaMultiplier + 4)),
      classAverage: 76.8,
      targetScore: 90,
      grade: '4.0',
      credits: 2.0,
      color: SUBJECT_COLORS[1],
      assignmentCompletion: 98,
      midtermScore: 28.0,
      finalProjectScore: 37.5,
      quizAverage: 19.0,
      attendanceRate: 97.5,
      studyHoursTotal: 48.0,
      instructor: 'ดร. สมชาย พัฒนกิจ',
    },
    {
      id: 'phy-103',
      code: 'ว33201',
      name: 'ฟิสิกส์ประยุกต์ & พลังงานสะอาด',
      category: 'วิทยาศาสตร์',
      score: Math.min(96, Math.round(90 * gpaMultiplier + 4)),
      classAverage: 74.2,
      targetScore: 88,
      grade: '4.0',
      credits: 1.5,
      color: SUBJECT_COLORS[2],
      assignmentCompletion: 95,
      midtermScore: 27.5,
      finalProjectScore: 36.0,
      quizAverage: 18.5,
      attendanceRate: 98.0,
      studyHoursTotal: 38.0,
      instructor: 'อ. ดนัย วิทยาศาสตร์ชีวภาพ',
    },
    {
      id: 'eng-104',
      code: 'อ33101',
      name: 'ภาษาอังกฤษเชิงวิชาการ (Academic English)',
      category: 'ภาษาต่างประเทศ',
      score: Math.min(95, Math.round(89 * gpaMultiplier + 3)),
      classAverage: 78.5,
      targetScore: 85,
      grade: '4.0',
      credits: 1.0,
      color: SUBJECT_COLORS[3],
      assignmentCompletion: 100,
      midtermScore: 27.0,
      finalProjectScore: 35.5,
      quizAverage: 18.0,
      attendanceRate: 100,
      studyHoursTotal: 32.0,
      instructor: 'Teacher Mark Robinson',
    },
    {
      id: 'design-105',
      code: 'ศ33101',
      name: 'การออกแบบระบบ & UI/UX Innovation',
      category: 'ศิลปะและการออกแบบ',
      score: Math.min(97, Math.round(94 * gpaMultiplier + 2)),
      classAverage: 81.0,
      targetScore: 92,
      grade: '4.0',
      credits: 1.0,
      color: SUBJECT_COLORS[4],
      assignmentCompletion: 100,
      midtermScore: 28.5,
      finalProjectScore: 38.5,
      quizAverage: 19.0,
      attendanceRate: 96.0,
      studyHoursTotal: 29.5,
      instructor: 'อ. พัชรา รัตนไพศาล',
    },
    {
      id: 'thai-106',
      code: 'ท33101',
      name: 'ภาษาไทยเพื่อการสื่อสารเชิงวิชาชีพ',
      category: 'ภาษาไทย',
      score: Math.min(94, Math.round(88 * gpaMultiplier + 3)),
      classAverage: 79.2,
      targetScore: 85,
      grade: '3.5',
      credits: 1.0,
      color: SUBJECT_COLORS[5],
      assignmentCompletion: 92,
      midtermScore: 26.0,
      finalProjectScore: 35.0,
      quizAverage: 17.5,
      attendanceRate: 98.0,
      studyHoursTotal: 24.0,
      instructor: 'อ. นิตยา แสงจันทร์',
    },
  ];
}

export const LearningAnalytics: React.FC<LearningAnalyticsProps> = ({
  user,
  courses: _courses = MOCK_COURSES,
  onOpenCourse: _onOpenCourse,
  onOpenAITutor,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'attendance' | 'insights'>('overview');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [attendancePeriod, setAttendancePeriod] = useState<'30' | '14' | '7'>('30');
  const [pieChartMode, setPieChartMode] = useState<'subject_scores' | 'attendance_breakdown' | 'grade_distribution'>('subject_scores');
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [selectedDayRecord, setSelectedDayRecord] = useState<DayAttendanceRecord | null>(null);

  // Data sets
  const subjectData = useMemo(() => generateSubjectAnalyticsData(user.gpa || 3.92), [user.gpa]);
  const rawAttendance30Days = useMemo(() => generate30DayAttendanceData(), []);

  // Filter attendance by period
  const attendanceData = useMemo(() => {
    const limit = parseInt(attendancePeriod, 10);
    return rawAttendance30Days.slice(-limit);
  }, [rawAttendance30Days, attendancePeriod]);

  // Overall calculations
  const overallStats = useMemo(() => {
    const totalScoreWeighted = subjectData.reduce((acc, s) => acc + s.score * s.credits, 0);
    const totalCredits = subjectData.reduce((acc, s) => acc + s.credits, 0);
    const weightedAverageScore = (totalScoreWeighted / totalCredits).toFixed(1);

    const onTimeCount = rawAttendance30Days.filter((r) => r.status === 'on_time').length;
    const lateCount = rawAttendance30Days.filter((r) => r.status === 'late').length;
    const leaveCount = rawAttendance30Days.filter((r) => r.status === 'leave').length;
    const absentCount = rawAttendance30Days.filter((r) => r.status === 'absent').length;
    const onTimeRate = ((onTimeCount / rawAttendance30Days.length) * 100).toFixed(1);

    const totalStudyHours = subjectData.reduce((acc, s) => acc + s.studyHoursTotal, 0).toFixed(1);
    const averageAssignmentCompletion = (
      subjectData.reduce((acc, s) => acc + s.assignmentCompletion, 0) / subjectData.length
    ).toFixed(1);

    // Calculate arrival average
    const validArrivals = rawAttendance30Days.filter((r) => r.arrivalMinutes > 0);
    const avgMinutes =
      validArrivals.reduce((acc, r) => acc + r.arrivalMinutes, 0) / (validArrivals.length || 1);
    const avgArrivalFormatted = `07:${Math.round(avgMinutes).toString().padStart(2, '0')} น.`;

    return {
      weightedAverageScore,
      totalCredits,
      onTimeCount,
      lateCount,
      leaveCount,
      absentCount,
      onTimeRate,
      totalStudyHours,
      averageAssignmentCompletion,
      avgArrivalFormatted,
      totalDays: rawAttendance30Days.length,
    };
  }, [subjectData, rawAttendance30Days]);

  // Data for Pie Chart modes
  const pieChartData = useMemo(() => {
    if (pieChartMode === 'subject_scores') {
      return subjectData.map((s) => ({
        name: s.name,
        code: s.code,
        value: s.score,
        credits: s.credits,
        color: s.color,
        category: s.category,
        grade: s.grade,
      }));
    }

    if (pieChartMode === 'attendance_breakdown') {
      return [
        {
          name: 'ตรงเวลา (On Time)',
          value: overallStats.onTimeCount,
          percentage: `${overallStats.onTimeRate}%`,
          color: ATTENDANCE_COLORS.on_time,
          icon: 'check_circle',
        },
        {
          name: 'มาสาย (Late)',
          value: overallStats.lateCount,
          percentage: `${((overallStats.lateCount / overallStats.totalDays) * 100).toFixed(1)}%`,
          color: ATTENDANCE_COLORS.late,
          icon: 'schedule',
        },
        {
          name: 'ลาป่วย/ลากิจ (Leave)',
          value: overallStats.leaveCount,
          percentage: `${((overallStats.leaveCount / overallStats.totalDays) * 100).toFixed(1)}%`,
          color: ATTENDANCE_COLORS.leave,
          icon: 'sick',
        },
      ];
    }

    // Grade distribution
    const gradeCounts: Record<string, { count: number; credits: number; color: string }> = {
      'เกรด 4.0': { count: 5, credits: 7.0, color: '#008562' },
      'เกรด 3.5': { count: 1, credits: 1.0, color: '#1550d3' },
      'เกรด 3.0': { count: 0, credits: 0, color: '#d97706' },
    };
    return Object.entries(gradeCounts).map(([k, v]) => ({
      name: k,
      value: v.count,
      credits: v.credits,
      color: v.color,
    }));
  }, [pieChartMode, subjectData, overallStats]);

  // Bar Chart Data (Comparison between Student Score vs Class Average)
  const barChartData = useMemo(() => {
    let filtered = subjectData;
    if (selectedSubjectId !== 'all') {
      filtered = subjectData.filter((s) => s.id === selectedSubjectId);
    }
    return filtered.map((s) => ({
      name: s.code,
      fullName: s.name,
      myScore: s.score,
      classAvg: s.classAverage,
      target: s.targetScore,
      grade: s.grade,
      color: s.color,
      assignments: s.assignmentCompletion,
      midterm: s.midtermScore,
      final: s.finalProjectScore,
    }));
  }, [subjectData, selectedSubjectId]);

  // Attendance Line & Bar Chart Data formatted for recharts
  const attendanceChartData = useMemo(() => {
    return attendanceData.map((d) => ({
      day: d.dateStr,
      fullDate: d.fullDate,
      dayOfWeek: d.dayOfWeek,
      arrivalMinutes: d.arrivalMinutes,
      arrivalTime: d.arrivalTime,
      status: d.status,
      periodsAttended: d.periodsAttended,
      bodyTemp: d.bodyTemp,
      gate: d.gate,
      note: d.note,
    }));
  }, [attendanceData]);

  return (
    <div className={`flex flex-col gap-6 w-full ${className}`}>
      {/* Top Banner & KPI Stat Cards */}
      <div className="bg-gradient-to-br from-[#121b2e] via-[#1a2642] to-[#1550d3] rounded-[28px] p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-white/10">
        {/* Subtle background decoration */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[140px]">monitoring</span>
        </div>

        <div className="relative z-10 flex flex-col gap-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <span className="material-symbols-outlined text-[28px] text-blue-300">analytics</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    การวิเคราะห์ผลการเรียนรู้ & สถิติการเข้าเรียน
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Live Real-Time
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  ระบบติดตามความก้าวหน้าทางวิชาการและการตรงต่อเวลา ย้อนหลัง 30 วันทำการ
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {onOpenAITutor && (
                <button
                  type="button"
                  onClick={() => onOpenAITutor('วิเคราะห์จุดแข็งทางการเรียน')}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-300">auto_awesome</span>
                  <span>ถาม AI สรุปจุดเด่น</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Summary Highlight Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
            {/* Card 1: GPA / Average Score */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-300 text-xs">
                <span>คะแนนเฉลี่ยรวมทุกวิชา</span>
                <span className="material-symbols-outlined text-[18px] text-blue-300">grade</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {overallStats.weightedAverageScore}
                </span>
                <span className="text-xs text-slate-300 font-medium">/ 100 คะแนน</span>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-emerald-300 font-semibold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  +2.8% จากเทอมก่อน
                </span>
                <span className="text-slate-300">{overallStats.totalCredits} หน่วยกิต</span>
              </div>
            </div>

            {/* Card 2: 30-Day Attendance Rate */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-300 text-xs">
                <span>อัตราการเข้าเรียน 30 วัน</span>
                <span className="material-symbols-outlined text-[18px] text-emerald-300">how_to_reg</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {overallStats.onTimeRate}%
                </span>
                <span className="text-xs text-emerald-300 font-semibold">ตรงเวลา</span>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                <span>สาย {overallStats.lateCount} วัน • ลา {overallStats.leaveCount} วัน</span>
                <span className="text-emerald-300 font-bold">เกณฑ์ A+</span>
              </div>
            </div>

            {/* Card 3: Average Arrival Time */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-300 text-xs">
                <span>เวลาสแกนเข้าเฉลี่ย</span>
                <span className="material-symbols-outlined text-[18px] text-amber-300">schedule</span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {overallStats.avgArrivalFormatted}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                <span className="text-slate-300">ประตู RFID Gate 1 & 2</span>
                <span className="text-amber-300 font-medium">ก่อนแถว 12 นาที</span>
              </div>
            </div>

            {/* Card 4: Assignments & Study Hours */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-300 text-xs">
                <span>ส่งการบ้านครบถ้วน</span>
                <span className="material-symbols-outlined text-[18px] text-purple-300">task_alt</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {overallStats.averageAssignmentCompletion}%
                </span>
                <span className="text-xs text-slate-300">สะสม {overallStats.totalStudyHours} ชม.</span>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-purple-200">งานตรวจแล้ว 100%</span>
                <span className="text-emerald-300 font-semibold">ไม่มีค้างส่ง</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-[#1550d3] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">dashboard_customize</span>
          <span className="truncate">ภาพรวมวิเคราะห์</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-white text-[#1550d3] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">bar_chart</span>
          <span className="truncate">คะแนนเฉลี่ยรายวิชา</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-white text-[#1550d3] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">timeline</span>
          <span className="truncate">เวลาเข้าเรียน 30 วัน</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'insights'
              ? 'bg-white text-[#1550d3] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">psychology</span>
          <span className="truncate">ข้อเสนอแนะ AI</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: OVERVIEW TAB (Pie Chart & Quick Highlights)     */}
      {/* ========================================================= */}
      {(activeTab === 'overview' || activeTab === 'subjects') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut / Pie Chart (Col 5) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-blue-50 text-[#1550d3] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">pie_chart</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-[#121b2e]">สัดส่วนและแนวโน้ม (Donut Chart)</h3>
                    <p className="text-xs text-[#737686]">แตะบนกราฟเพื่อดูรายละเอียดสัดส่วน</p>
                  </div>
                </div>
              </div>

              {/* Pie Mode Toggle Buttons */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setPieChartMode('subject_scores')}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                    pieChartMode === 'subject_scores'
                      ? 'bg-white text-[#1550d3] shadow-2xs font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  คะแนนรายวิชา
                </button>
                <button
                  type="button"
                  onClick={() => setPieChartMode('attendance_breakdown')}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                    pieChartMode === 'attendance_breakdown'
                      ? 'bg-white text-[#1550d3] shadow-2xs font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  การเข้าเรียน
                </button>
                <button
                  type="button"
                  onClick={() => setPieChartMode('grade_distribution')}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                    pieChartMode === 'grade_distribution'
                      ? 'bg-white text-[#1550d3] shadow-2xs font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  การตัดเกรด
                </button>
              </div>

              {/* Pie Chart Interactive Canvas */}
              <div className="relative w-full h-[260px] flex items-center justify-center mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data: any = payload[0].payload;
                          return (
                            <div className="bg-[#121b2e] text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700">
                              <p className="font-bold flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                <span>{data.name}</span>
                              </p>
                              {data.code && <p className="text-slate-400 text-[10px] mt-0.5">รหัสวิชา: {data.code}</p>}
                              <div className="mt-1.5 pt-1.5 border-t border-slate-700 flex justify-between gap-4 font-mono">
                                <span className="text-slate-300">
                                  {pieChartMode === 'subject_scores' ? 'คะแนนเฉลี่ย:' : 'สัดส่วน / จำนวน:'}
                                </span>
                                <span className="font-bold text-amber-300">
                                  {pieChartMode === 'subject_scores' ? `${data.value} / 100` : `${data.value} วัน`}
                                </span>
                              </div>
                              {data.grade && (
                                <p className="text-emerald-400 text-[11px] font-semibold mt-1">
                                  ผลการเรียน: {data.grade} ({data.credits} หน่วยกิต)
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={activePieIndex === index ? '#121b2e' : '#ffffff'}
                          strokeWidth={activePieIndex === index ? 3 : 2}
                          className="transition-all duration-300 cursor-pointer"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {pieChartMode === 'subject_scores'
                      ? 'คะแนนเฉลี่ย'
                      : pieChartMode === 'attendance_breakdown'
                      ? 'ตรงเวลา'
                      : 'เกรดเฉลี่ยสะสม'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#121b2e] font-mono leading-none mt-0.5">
                    {pieChartMode === 'subject_scores'
                      ? overallStats.weightedAverageScore
                      : pieChartMode === 'attendance_breakdown'
                      ? `${overallStats.onTimeRate}%`
                      : user.gpa?.toFixed(2) || '3.92'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {pieChartMode === 'subject_scores'
                      ? 'ระดับผลการเรียน 4.0'
                      : pieChartMode === 'attendance_breakdown'
                      ? '30 วันทำการ'
                      : 'เกียรตินิยมอันดับ 1'}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Legend / Mini-list */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
              {pieChartData.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                    activePieIndex === idx ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
                  }`}
                  onMouseEnter={() => setActivePieIndex(idx)}
                  onMouseLeave={() => setActivePieIndex(null)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-slate-800 text-[11px] sm:text-xs">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-[#121b2e] text-[11px] sm:text-xs shrink-0">
                    {item.value} {pieChartMode === 'subject_scores' ? 'คะแนน' : pieChartMode === 'attendance_breakdown' ? 'วัน' : 'วิชา'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart: Subject Performance vs Class Average (Col 7) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-purple-50 text-[#7857f8] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                </span>
                <div>
                  <h3 className="font-bold text-base text-[#121b2e]">คะแนนเฉลี่ยรายวิชาเปรียบเทียบ (Bar Chart)</h3>
                  <p className="text-xs text-[#737686]">เปรียบเทียบคะแนนของคุณกับค่าเฉลี่ยของระดับชั้น</p>
                </div>
              </div>

              {/* Subject Filter Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:border-[#1550d3] cursor-pointer"
                >
                  <option value="all">แสดงทุกรายวิชา (6 วิชา)</option>
                  {subjectData.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Bar Chart Canvas */}
            <div className="w-full h-[280px] sm:h-[300px] mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 15, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[50, 100]}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item: any = payload[0].payload;
                        return (
                          <div className="bg-[#121b2e] text-white p-3.5 rounded-2xl shadow-xl text-xs border border-slate-700 min-w-[200px]">
                            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-700">
                              <span className="font-bold text-amber-300">{item.name}</span>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                                เกรด {item.grade}
                              </span>
                            </div>
                            <p className="text-slate-200 text-xs font-semibold mt-1.5 truncate">{item.fullName}</p>
                            
                            <div className="mt-2 space-y-1 text-[11px] font-mono">
                              <div className="flex justify-between text-blue-300 font-bold">
                                <span>คะแนนของฉัน:</span>
                                <span>{item.myScore} / 100</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>ค่าเฉลี่ยระดับชั้น:</span>
                                <span>{item.classAvg} / 100</span>
                              </div>
                              <div className="flex justify-between text-emerald-400">
                                <span>เป้าหมาย (Target):</span>
                                <span>{item.target} คะแนน</span>
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-700/80 text-[10px] text-slate-300 flex justify-between">
                              <span>สอบกลางภาค: {item.midterm}/30</span>
                              <span>โปรเจกต์: {item.final}/40</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 600 }}
                    formatter={(value) => (value === 'myScore' ? 'คะแนนของฉัน (My Score)' : 'ค่าเฉลี่ยระดับชั้น (Class Benchmark)')}
                  />
                  <ReferenceLine y={80} stroke="#008562" strokeDasharray="3 3" label={{ value: 'เกณฑ์เกรด 4 (80+)', fill: '#008562', fontSize: 10 }} />
                  <Bar
                    dataKey="myScore"
                    name="myScore"
                    fill="#1550d3"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="classAvg"
                    name="classAvg"
                    fill="#cbd5e1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Mini KPI summary for subjects */}
            <div className="mt-2 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/70 text-center">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">วิชาที่ได้คะแนนสูงสุด</p>
                <p className="text-xs sm:text-sm font-bold text-[#1550d3] mt-0.5 truncate">ว30101 วิทยาการคำนวณ (99)</p>
              </div>
              <div className="border-x border-slate-200">
                <p className="text-[10px] text-slate-500 font-bold uppercase">สูงกว่าค่าเฉลี่ยเฉลี่ย</p>
                <p className="text-xs sm:text-sm font-bold text-emerald-600 mt-0.5">+15.4 คะแนน</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">อัตราส่งงานครบ</p>
                <p className="text-xs sm:text-sm font-bold text-[#7857f8] mt-0.5">97.5%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: 30-DAY ATTENDANCE TRENDS TAB (Timeline / Area) */}
      {/* ========================================================= */}
      {(activeTab === 'overview' || activeTab === 'attendance') && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col gap-6">
          {/* Title & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">history_toggle_off</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg text-[#121b2e]">
                    แนวโน้มเวลาสแกนเข้าเรียนย้อนหลัง {attendancePeriod} วัน (RFID Attendance Trends)
                  </h3>
                </div>
                <p className="text-xs text-[#737686] mt-0.5">
                  บันทึกเวลาจริงจากประตู Smart Gate สแกนเข้าโรงเรียนและสถานะตรงต่อเวลา
                </p>
              </div>
            </div>

            {/* Time Period Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setAttendancePeriod('30')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  attendancePeriod === '30' ? 'bg-white text-[#1550d3] shadow-2xs font-extrabold' : 'hover:text-slate-900'
                }`}
              >
                30 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setAttendancePeriod('14')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  attendancePeriod === '14' ? 'bg-white text-[#1550d3] shadow-2xs font-extrabold' : 'hover:text-slate-900'
                }`}
              >
                14 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setAttendancePeriod('7')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  attendancePeriod === '7' ? 'bg-white text-[#1550d3] shadow-2xs font-extrabold' : 'hover:text-slate-900'
                }`}
              >
                7 วันล่าสุด
              </button>
            </div>
          </div>

          {/* Interactive Attendance Timeline Chart */}
          <div className="w-full h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={attendanceChartData} margin={{ top: 10, right: 15, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008562" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#008562" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 80]}
                  ticks={[15, 30, 45, 50, 60, 75]}
                  tickFormatter={(val) => {
                    if (val === 0) return 'ลา';
                    const mm = val.toString().padStart(2, '0');
                    return `07:${mm}`;
                  }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item: any = payload[0].payload;
                      return (
                        <div className="bg-[#121b2e] text-white p-3 rounded-2xl shadow-xl text-xs border border-slate-700 min-w-[200px]">
                          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                            <span className="font-bold text-slate-200">
                              {item.fullDate} ({item.dayOfWeek})
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'on_time'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : item.status === 'late'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {item.status === 'on_time'
                                ? '✓ ตรงเวลา'
                                : item.status === 'late'
                                ? '⚠ มาสาย'
                                : 'ℹ ลาป่วย/กิจ'}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1 text-[11px] font-mono">
                            <div className="flex justify-between">
                              <span className="text-slate-400">เวลาสแกนเข้า:</span>
                              <span className="font-bold text-amber-300">{item.arrivalTime} น.</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">ประตูที่เข้า:</span>
                              <span className="text-slate-200">{item.gate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">อุณหภูมิ:</span>
                              <span className="text-emerald-300">{item.bodyTemp} °C</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">คาบเรียนที่เข้า:</span>
                              <span className="text-blue-300">{item.periodsAttended} / 7 คาบ</span>
                            </div>
                          </div>

                          {item.note && (
                            <p className="mt-2 pt-1.5 border-t border-slate-700 text-[10px] text-amber-200/90 italic">
                              หมายเหตุ: {item.note}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* On-Time threshold line (07:50 = 50 min) */}
                <ReferenceLine
                  y={50}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  label={{ value: 'เกณฑ์เวลาแถว (07:50 น.)', fill: '#d97706', fontSize: 10, position: 'top' }}
                />
                <ReferenceLine
                  y={60}
                  stroke="#ba1a1a"
                  strokeDasharray="2 2"
                  label={{ value: 'เริ่มตัดสาย (08:00 น.)', fill: '#ba1a1a', fontSize: 10, position: 'top' }}
                />

                <Area
                  type="monotone"
                  dataKey="arrivalMinutes"
                  name="เวลาสแกน (นาทีจาก 07:00)"
                  stroke="#008562"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#attendanceGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="arrivalMinutes"
                  stroke="#008562"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#008562', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#1550d3' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 30-Day Attendance Matrix / Calendar Heatmap */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-[#121b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">calendar_month</span>
                <span>ตารางบันทึกสถานะการเข้าเรียนรายวัน (แตะที่วันเพื่อดูบันทึก)</span>
              </h4>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>ตรงเวลา ({overallStats.onTimeCount})</span>
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>สาย ({overallStats.lateCount})</span>
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>ลา ({overallStats.leaveCount})</span>
                </span>
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
              {rawAttendance30Days.map((record) => {
                const isSelected = selectedDayRecord?.dayIndex === record.dayIndex;
                const statusColor =
                  record.status === 'on_time'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : record.status === 'late'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 ring-2 ring-amber-400'
                    : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100';

                return (
                  <button
                    key={record.dayIndex}
                    type="button"
                    onClick={() => setSelectedDayRecord(record)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1 shadow-2xs active:scale-95 ${statusColor} ${
                      isSelected ? 'ring-2 ring-[#1550d3] scale-105 shadow-md' : ''
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 font-medium">{record.dateStr}</span>
                    <span className="text-[12px] font-extrabold font-mono leading-none">
                      {record.arrivalTime === '-' ? 'ลา' : record.arrivalTime}
                    </span>
                    <span className="text-[9px] font-bold opacity-80">{record.dayOfWeek}</span>
                  </button>
                );
              })}
            </div>

            {/* Detail Drawer for Selected Day */}
            {selectedDayRecord && (
              <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                      selectedDayRecord.status === 'on_time'
                        ? 'bg-emerald-600'
                        : selectedDayRecord.status === 'late'
                        ? 'bg-amber-600'
                        : 'bg-blue-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {selectedDayRecord.status === 'on_time'
                        ? 'check_circle'
                        : selectedDayRecord.status === 'late'
                        ? 'warning'
                        : 'sick'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#121b2e]">
                        {selectedDayRecord.fullDate} ({selectedDayRecord.dayOfWeek})
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200">
                        {selectedDayRecord.arrivalTime} น.
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ประตู: {selectedDayRecord.gate} • อุณหภูมิ: {selectedDayRecord.bodyTemp}°C • คาบเรียน: {selectedDayRecord.periodsAttended}/7 คาบ
                    </p>
                    {selectedDayRecord.note && (
                      <p className="text-xs text-amber-700 font-semibold mt-1">
                        หมายเหตุ: {selectedDayRecord.note}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDayRecord(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 self-end sm:self-auto cursor-pointer"
                >
                  ปิดรายละเอียด ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: AI LEARNING INSIGHTS & STRENGTHS              */}
      {/* ========================================================= */}
      {(activeTab === 'overview' || activeTab === 'insights') && (
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 rounded-3xl p-5 sm:p-7 border border-blue-200/60 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1550d3] text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[20px]">psychology</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-[#121b2e]">
                  บทวิเคราะห์อัจฉริยะเชิงลึก (AI Learning Analytics Diagnostic)
                </h3>
                <p className="text-xs text-slate-600">
                  ประมวลผลความสอดคล้องระหว่างคะแนนเฉลี่ย พฤติกรรมการเข้าเรียน และสถิติการส่งงาน
                </p>
              </div>
            </div>

            <span className="text-[11px] font-extrabold text-[#1550d3] bg-white px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
              AI Confidence: 99.4%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-1">
            {/* Strength 1 */}
            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#008562] font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]">stars</span>
                  <span>ความเชี่ยวชาญโดดเด่น (Key Mastery)</span>
                </div>
                <h4 className="font-bold text-sm text-[#121b2e] mt-1.5">
                  วิทยาการคำนวณ & การออกแบบ (Top 2%)
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ทำคะแนนเก็บและโปรเจกต์ได้ 99/100 ในวิชา ว30101 เหมาะสมต่อการเข้าร่วมแข่งขันโอลิมปิกวิชาการและโครงงาน AI นวัตกรรม
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#1550d3] font-bold">
                <span>ความแม่นยำ 98%</span>
                <span>แนะนำหลักสูตรขั้นสูง ↗</span>
              </div>
            </div>

            {/* Strength 2 */}
            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#1550d3] font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]">schedule_send</span>
                  <span>ความสม่ำเสมอในการส่งงาน (Consistency)</span>
                </div>
                <h4 className="font-bold text-sm text-[#121b2e] mt-1.5">
                  ตรงเวลา 97.5% • การบ้านส่งครบ 100%
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ส่งงานตรงกำหนดเวลาล่วงหน้าเฉลี่ย 1.4 วัน ไม่พบภาระงานค้างส่งในรอบ 30 วันที่ผ่านมา
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-600 font-bold">
                <span>สถานะ: ยอดเยี่ยม</span>
                <span>รักษาระดับผลงาน</span>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]">tips_and_updates</span>
                  <span>ข้อแนะนำเพื่อคะแนนเต็ม (Growth Point)</span>
                </div>
                <h4 className="font-bold text-sm text-[#121b2e] mt-1.5">
                  วิชาภาษาไทยเพื่อการสื่อสาร (3.5 → 4.0)
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ขาดอีกเพียง 2 คะแนนเพื่อขยับเป็นเกรด 4.0 แนะนำทบทวนหัวข้อการเขียนบทความเชิงวิชาชีพเพิ่มเติม 15 นาที/สัปดาห์
                </p>
              </div>
              {onOpenAITutor && (
                <button
                  type="button"
                  onClick={() => onOpenAITutor('ภาษาไทยเพื่อการสื่อสารเชิงวิชาชีพ')}
                  className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
                >
                  <span>เปิดสรุปเนื้อหากับ AI Tutor</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
