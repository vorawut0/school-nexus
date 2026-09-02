import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { UserProfile } from '../../types';

export interface SemesterGpaRecord {
  semester: string;
  semesterShort: string;
  termGpa: number;
  cumulativeGpa: number;
  targetGpa: number;
  credits: number;
  totalCredits: number;
  rankInGrade: string;
  honor: string;
}

export interface SubjectCategoryScore {
  category: string;
  shortCategory: string;
  gpa: number;
  score: number;
  fullMark: number;
  credits: number;
  color: string;
}

interface GpaAnalyticsChartProps {
  user: UserProfile;
  variant?: 'compact' | 'full';
  onOpenDetailedModal?: () => void;
}

// Generate realistic dynamic GPA history tailored to the user's current GPA
export function getStudentGpaData(baseGpa: number = 3.92) {
  const diff = baseGpa - 3.92;
  const clamp = (val: number) => Math.max(2.0, Math.min(4.0, Math.round((val + diff) * 100) / 100));

  const semesterHistory: SemesterGpaRecord[] = [
    {
      semester: 'ม.4 ภาคเรียนที่ 1',
      semesterShort: 'ม.4/1',
      termGpa: clamp(3.78),
      cumulativeGpa: clamp(3.78),
      targetGpa: 3.80,
      credits: 16.5,
      totalCredits: 16.5,
      rankInGrade: 'Top 5%',
      honor: 'เกียรตินิยม',
    },
    {
      semester: 'ม.4 ภาคเรียนที่ 2',
      semesterShort: 'ม.4/2',
      termGpa: clamp(3.84),
      cumulativeGpa: clamp(3.81),
      targetGpa: 3.85,
      credits: 17.0,
      totalCredits: 33.5,
      rankInGrade: 'Top 4%',
      honor: 'เกียรตินิยมอันดับ 1',
    },
    {
      semester: 'ม.5 ภาคเรียนที่ 1',
      semesterShort: 'ม.5/1',
      termGpa: clamp(3.91),
      cumulativeGpa: clamp(3.85),
      targetGpa: 3.90,
      credits: 17.0,
      totalCredits: 50.5,
      rankInGrade: 'Top 3%',
      honor: 'เกียรตินิยมอันดับ 1 (ดีเด่น)',
    },
    {
      semester: 'ม.5 ภาคเรียนที่ 2',
      semesterShort: 'ม.5/2',
      termGpa: clamp(3.94),
      cumulativeGpa: clamp(3.88),
      targetGpa: 3.90,
      credits: 17.5,
      totalCredits: 68.0,
      rankInGrade: 'Top 2%',
      honor: 'เกียรตินิยมอันดับ 1 (ดีเด่น)',
    },
    {
      semester: 'ม.6 ภาคเรียนที่ 1',
      semesterShort: 'ม.6/1 (ล่าสุด)',
      termGpa: clamp(baseGpa >= 3.95 ? 4.0 : baseGpa + 0.04),
      cumulativeGpa: baseGpa,
      targetGpa: 3.95,
      credits: 16.5,
      totalCredits: 84.5,
      rankInGrade: 'Top 1.8%',
      honor: 'เกียรตินิยมอันดับ 1 (เหรียญทอง)',
    },
  ];

  const subjectCategories: SubjectCategoryScore[] = [
    {
      category: 'วิทยาการคำนวณ & เทคโนโลยี',
      shortCategory: 'คอมฯ & AI',
      gpa: 4.0,
      score: 96,
      fullMark: 100,
      credits: 12.0,
      color: '#1550d3',
    },
    {
      category: 'คณิตศาสตร์ & สถิติประยุกต์',
      shortCategory: 'คณิตศาสตร์',
      gpa: clamp(3.95),
      score: 94,
      fullMark: 100,
      credits: 18.0,
      color: '#0284c7',
    },
    {
      category: 'วิทยาศาสตร์ & ฟิสิกส์',
      shortCategory: 'วิทยาศาสตร์',
      gpa: clamp(3.90),
      score: 91,
      fullMark: 100,
      credits: 22.5,
      color: '#10b981',
    },
    {
      category: 'ภาษาต่างประเทศ (English/JP)',
      shortCategory: 'ภาษาต่างประเทศ',
      gpa: clamp(3.92),
      score: 93,
      fullMark: 100,
      credits: 14.0,
      color: '#8b5cf6',
    },
    {
      category: 'การออกแบบ & มัลติมีเดีย',
      shortCategory: 'ดีไซน์ & สื่อ',
      gpa: 4.0,
      score: 98,
      fullMark: 100,
      credits: 8.0,
      color: '#f59e0b',
    },
    {
      category: 'สังคมศึกษา & มนุษยศาสตร์',
      shortCategory: 'สังคม & ประวัติฯ',
      gpa: clamp(3.85),
      score: 89,
      fullMark: 100,
      credits: 10.0,
      color: '#ec4899',
    },
  ];

  return { semesterHistory, subjectCategories };
}

// Custom Tooltip with glass effect and high readability
const CustomGpaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as SemesterGpaRecord;
    return (
      <div className="bg-[#0f172a]/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 text-xs min-w-[200px] animate-fadeIn">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/80 mb-2">
          <span className="font-bold text-sm text-cyan-300">{data?.semester || label}</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 text-[10px] font-semibold">
            {data?.rankInGrade}
          </span>
        </div>

        <div className="space-y-1.5 font-mono">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1550d3] border border-white/50" />
              เกรดเฉลี่ยประจำภาค (GPA):
            </span>
            <span className="font-bold text-white text-sm">{data?.termGpa?.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#20C997] border border-white/50" />
              เกรดเฉลี่ยสะสม (GPAX):
            </span>
            <span className="font-bold text-[#67fcc6] text-sm">{data?.cumulativeGpa?.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800">
            <span>เป้าหมายที่ตั้งไว้:</span>
            <span className="text-amber-300">{data?.targetGpa?.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 text-[11px]">
            <span>หน่วยกิตสะสม:</span>
            <span className="text-slate-200">{data?.totalCredits} หน่วยกิต</span>
          </div>
        </div>

        {data?.honor && (
          <div className="mt-2.5 pt-1.5 border-t border-slate-700/60 text-[10px] text-amber-200 flex items-center gap-1 font-sans">
            <span>🎖️</span>
            <span className="truncate">{data.honor}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const GpaAnalyticsChart: React.FC<GpaAnalyticsChartProps> = ({
  user,
  variant = 'compact',
  onOpenDetailedModal,
}) => {
  const [viewMode, setViewMode] = useState<'trend' | 'radar' | 'breakdown'>('trend');
  const [simulationTermScore, setSimulationTermScore] = useState<number>(4.0);

  const baseGpa = user.gpa || 3.92;
  const { semesterHistory, subjectCategories } = useMemo(
    () => getStudentGpaData(baseGpa),
    [baseGpa]
  );

  // Projected GPA calculator
  const simulatedGpax = useMemo(() => {
    const currentCredits = 84.5;
    const currentTotalPoints = baseGpa * currentCredits;
    const nextTermCredits = 15.5;
    const nextTotalPoints = currentTotalPoints + simulationTermScore * nextTermCredits;
    const finalGpax = nextTotalPoints / (currentCredits + nextTermCredits);
    return Math.round(finalGpax * 100) / 100;
  }, [baseGpa, simulationTermScore]);

  // If Compact Mode (Dashboard Card)
  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm ring-1 ring-slate-200/80 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
        {/* Decorative subtle ambient gradient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-500/5 via-cyan-500/5 to-transparent rounded-full pointer-events-none -mr-10 -mt-10" />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">trending_up</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  แนวโน้มผลการเรียนสะสม (GPAX Trend)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +0.17 จาก ม.4
                </span>
              </div>
              <p className="text-xs text-slate-500">
                วิเคราะห์ผลการเรียนระดับชั้น ม.4 - ม.6 (D3/Recharts Analytics)
              </p>
            </div>
          </div>

          {onOpenDetailedModal && (
            <button
              onClick={onOpenDetailedModal}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer shrink-0 ml-2"
            >
              <span>รายงานฉบับเต็ม</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          )}
        </div>

        {/* Quick Stat Pill Row */}
        <div className="grid grid-cols-3 gap-2 mb-3 relative z-10">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center">
            <span className="text-[10.5px] text-slate-500 block font-medium">GPAX ปัจจุบัน</span>
            <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
              {baseGpa.toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center">
            <span className="text-[10.5px] text-slate-500 block font-medium">เกรดเทอมล่าสุด</span>
            <span className="text-base sm:text-lg font-bold text-emerald-600 font-mono">
              {semesterHistory[semesterHistory.length - 1]?.termGpa?.toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center">
            <span className="text-[10.5px] text-slate-500 block font-medium">อันดับในสายชั้น</span>
            <span className="text-base sm:text-lg font-bold text-blue-600 font-mono">Top 2%</span>
          </div>
        </div>

        {/* Mini Recharts Interactive Area Chart */}
        <div className="h-44 sm:h-48 w-full mt-1 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={semesterHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="compactGpaxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1550d3" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#1550d3" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="compactTermGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#20C997" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#20C997" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="semesterShort"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                domain={[3.5, 4.0]}
                ticks={[3.5, 3.6, 3.7, 3.8, 3.9, 4.0]}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomGpaTooltip />} />
              <ReferenceLine y={3.5} stroke="#94a3b8" strokeDasharray="3 3" />
              <ReferenceLine y={4.0} stroke="#3b82f6" strokeDasharray="2 2" strokeOpacity={0.6} />

              <Area
                type="monotone"
                dataKey="cumulativeGpa"
                name="GPAX สะสม"
                stroke="#1550d3"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#compactGpaxGrad)"
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2, fill: '#1550d3' }}
              />
              <Line
                type="monotone"
                dataKey="termGpa"
                name="GPA รายเทอม"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#10b981' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#1550d3]" />
              <span>GPAX สะสม</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span>GPA รายเทอม</span>
            </span>
          </div>
          <span className="text-slate-400 font-mono">84.5 / 100 หน่วยกิต</span>
        </div>
      </div>
    );
  }

  // Full / Modal Mode (Detailed Analysis View)
  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Control Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('trend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'trend'
                ? 'bg-white text-[#1550d3] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">show_chart</span>
            <span>เส้นทางแนวโน้ม (Timeline Trend)</span>
          </button>

          <button
            onClick={() => setViewMode('radar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'radar'
                ? 'bg-white text-[#1550d3] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">radar</span>
            <span>วิเคราะห์กลุ่มสาระ (Radar Map)</span>
          </button>

          <button
            onClick={() => setViewMode('breakdown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'breakdown'
                ? 'bg-white text-[#1550d3] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">equalizer</span>
            <span>จำลองเป้าหมาย (GPA Simulator)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            สถานะ: เกียรตินิยมอันดับ 1
          </span>
        </div>
      </div>

      {/* Main Visual Presentation by Tab */}
      {viewMode === 'trend' && (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
            {/* Ambient Graphic Accent */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-b from-blue-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
              <div>
                <span className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">
                  Official Academic Trajectory
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                  พัฒนาการและแนวโน้มเกรดเฉลี่ยสะสม 5 ภาคเรียน
                </h3>
              </div>

              <div className="flex items-center gap-3 bg-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
                <div className="text-right">
                  <div className="text-[10px] text-white/70">GPAX รวม</div>
                  <div className="text-lg font-bold font-mono text-cyan-300">{baseGpa.toFixed(2)}</div>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div>
                  <div className="text-[10px] text-white/70">หน่วยกิต</div>
                  <div className="text-sm font-bold font-mono text-white">84.5 Cr.</div>
                </div>
              </div>
            </div>

            {/* Main Recharts Area Chart */}
            <div className="h-64 sm:h-72 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={semesterHistory}
                  margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="fullGpaxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="fullTermGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="semester"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#475569' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[3.5, 4.0]}
                    ticks={[3.5, 3.6, 3.7, 3.8, 3.9, 4.0]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomGpaTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
                    formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                  />
                  <ReferenceLine
                    y={3.5}
                    stroke="#fbbf24"
                    strokeDasharray="4 4"
                    label={{
                      value: 'เกณฑ์เกียรตินิยม (3.50)',
                      fill: '#fbbf24',
                      fontSize: 10,
                      position: 'insideBottomRight',
                    }}
                  />
                  <ReferenceLine
                    y={3.8}
                    stroke="#38bdf8"
                    strokeDasharray="2 2"
                    strokeOpacity={0.7}
                    label={{
                      value: 'เกียรตินิยมอันดับ 1 (3.80)',
                      fill: '#38bdf8',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="cumulativeGpa"
                    name="GPAX สะสมตลอดหลักสูตร"
                    stroke="#38bdf8"
                    strokeWidth={3.5}
                    fillOpacity={1}
                    fill="url(#fullGpaxGrad)"
                    activeDot={{ r: 7, stroke: '#0f172a', strokeWidth: 2, fill: '#38bdf8' }}
                  />

                  <Area
                    type="monotone"
                    dataKey="termGpa"
                    name="GPA รายภาคเรียน (Semester GPA)"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#fullTermGrad)"
                    dot={{ r: 4.5, stroke: '#0f172a', strokeWidth: 2, fill: '#34d399' }}
                  />

                  <Line
                    type="monotone"
                    dataKey="targetGpa"
                    name="เป้าหมายที่กำหนด (Goal)"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown cards for each semester */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {semesterHistory.map((s, idx) => {
              const isLast = idx === semesterHistory.length - 1;
              return (
                <div
                  key={s.semester}
                  className={`p-3 rounded-2xl border transition-all ${
                    isLast
                      ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-between">
                    <span>{s.semesterShort}</span>
                    {isLast && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">
                    {s.termGpa.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    สะสม: {s.cumulativeGpa.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">{s.rankInGrade}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'radar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Radar Chart */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col items-center">
            <h4 className="text-sm font-bold text-cyan-300 mb-1 w-full text-left">
              ความถนัดและสมรรถนะรายกลุ่มสาระ (Competency Radar)
            </h4>
            <p className="text-xs text-slate-400 mb-2 w-full text-left">
              แผนภูมิเรดาร์แสดงจุดเด่นรายกลุ่มวิชาหลัก 6 กลุ่มสาระ
            </p>

            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  outerRadius="75%"
                  data={subjectCategories}
                  margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
                >
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis
                    dataKey="shortCategory"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[60, 100]}
                    tick={{ fill: '#64748b', fontSize: 9 }}
                  />
                  <Radar
                    name="คะแนนสัมฤทธิ์ผล (%)"
                    dataKey="score"
                    stroke="#38bdf8"
                    fill="#38bdf8"
                    fillOpacity={0.45}
                  />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const d = payload[0]?.payload as SubjectCategoryScore;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-xl border border-slate-700 text-xs shadow-xl font-mono">
                            <div className="font-bold text-cyan-300 font-sans">{d.category}</div>
                            <div className="mt-1">คะแนนเฉลี่ย: {d.score} / 100</div>
                            <div>เกรดเฉลี่ยกลุ่มวิชา: {d.gpa.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400">{d.credits} หน่วยกิต</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart list */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                สัดส่วนคะแนนแยกตามหมวดวิชา (Subject Group Performance)
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                การกระจายตัวของผลการเรียนและคะแนนเฉลี่ยรวม
              </p>

              <div className="space-y-3">
                {subjectCategories.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{cat.category}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-900">{cat.score}%</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-blue-700 font-bold text-[11px]">
                          GPA {cat.gpa.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.score}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>กลุ่มวิชาที่โดดเด่นสูงสุด:</span>
              <span className="font-bold text-blue-600">การออกแบบ & มัลติมีเดีย (98%)</span>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'breakdown' && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="font-bold text-base text-cyan-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">science</span>
                แบบจำลองคำนวณ GPAX คาดการณ์สำเร็จการศึกษา (GPA Simulator)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                ทดลองปรับเปลี่ยนผลการเรียนภาคการศึกษาถัดไป (ม.6/2: 15.5 หน่วยกิต)
              </p>
            </div>

            <div className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 text-xs font-bold">
              GPAX ปัจจุบัน: {baseGpa.toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Slider Control */}
            <div className="md:col-span-2 bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300 font-medium">เกรดเฉลี่ยเป้าหมายภาคเรียนหน้า (ม.6/2):</span>
                <span className="font-extrabold text-lg text-amber-400 font-mono">
                  {simulationTermScore.toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min="2.5"
                max="4.0"
                step="0.05"
                value={simulationTermScore}
                onChange={(e) => setSimulationTermScore(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>2.50</span>
                <span>3.00</span>
                <span>3.50</span>
                <span>3.80</span>
                <span>4.00 (สมบูรณ์แบบ)</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                {[3.5, 3.8, 4.0].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSimulationTermScore(preset)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                      simulationTermScore === preset
                        ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-sm'
                        : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    เป้าหมาย {preset.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            {/* Projected Result Box */}
            <div className="bg-gradient-to-b from-blue-600/30 to-cyan-600/20 rounded-2xl p-4 border border-cyan-400/40 flex flex-col justify-between text-center">
              <div>
                <span className="text-[11px] font-semibold text-cyan-200 uppercase tracking-wider block">
                  เกรดเฉลี่ยสะสมจบการศึกษา (Projected Final GPAX)
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1 drop-shadow-md">
                  {simulatedGpax.toFixed(2)}
                </div>
                <div className="text-xs text-cyan-300 mt-1">หน่วยกิตรวมครบ 100.0 หน่วยกิต</div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-cyan-500/30 text-[11px] text-slate-200">
                {simulatedGpax >= 3.8 ? (
                  <span className="text-amber-300 font-bold flex items-center justify-center gap-1">
                    <span>🏆</span> ได้รับเกียรตินิยมอันดับ 1 (เหรียญทอง)
                  </span>
                ) : simulatedGpax >= 3.5 ? (
                  <span className="text-emerald-300 font-bold flex items-center justify-center gap-1">
                    <span>🎖️</span> ได้รับเกียรตินิยมอันดับ 2
                  </span>
                ) : (
                  <span className="text-slate-300 font-medium">สำเร็จการศึกษาตามเกณฑ์มาตรฐาน</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
