import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Assignment } from '../../types';

interface AssignmentSummaryChartProps {
  assignments: Assignment[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export const AssignmentSummaryChart: React.FC<AssignmentSummaryChartProps> = ({
  assignments,
  activeTab,
  onSelectTab,
}) => {
  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === 'submitted').length;
  const inProgress = assignments.filter((a) => a.status === 'in_progress').length;
  const toSubmit = assignments.filter((a) => a.status === 'to_submit').length;
  const overdue = assignments.filter((a) => a.status === 'overdue').length;
  const pending = total - completed;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Chart data formatted for Recharts
  const chartData = [
    { name: 'ส่งงานแล้ว (Completed)', value: completed, color: '#00875a', tabId: 'submitted' },
    { name: 'กำลังดำเนินการ (In Progress)', value: inProgress, color: '#1550d3', tabId: 'in_progress' },
    { name: 'รอส่งงาน (To Submit)', value: toSubmit, color: '#d97706', tabId: 'to_submit' },
    { name: 'เกินกำหนดส่ง (Overdue)', value: overdue, color: '#dc2626', tabId: 'overdue' },
  ].filter((item) => item.value > 0);

  // Fallback if all 0
  const displayData = chartData.length > 0 ? chartData : [{ name: 'ไม่มีงาน', value: 1, color: '#cbd5e1', tabId: 'all' }];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const count = data.value;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return (
        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-700 pointer-events-none">
          <div className="font-bold">{data.name}</div>
          <div className="text-slate-300 mt-0.5">
            {count} ชิ้น ({pct}% ของงานทั้งหมด)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left Side: Summary Metrics */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1550d3] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">pie_chart</span>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                  สรุปอัตราส่วนการส่งงาน (Assignments Ratio)
                </h3>
                <p className="text-xs text-slate-500">
                  สัดส่วนงานที่ส่งแล้วเทียบกับงานที่รอดำเนินการ
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              <span>ทั้งหมด {total} งาน</span>
            </div>
          </div>

          {/* Quick Filter Clickable Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {/* Completed */}
            <button
              type="button"
              onClick={() => onSelectTab(activeTab === 'submitted' ? 'all' : 'submitted')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeTab === 'submitted'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30'
                  : 'bg-slate-50/70 hover:bg-emerald-50/50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-800">ส่งแล้ว</span>
                <span className="w-2 h-2 rounded-full bg-[#00875a]" />
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {completed} <span className="text-[11px] font-normal text-slate-500">งาน</span>
              </div>
            </button>

            {/* In Progress */}
            <button
              type="button"
              onClick={() => onSelectTab(activeTab === 'in_progress' ? 'all' : 'in_progress')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeTab === 'in_progress'
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/30'
                  : 'bg-slate-50/70 hover:bg-blue-50/50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-800">กำลังทำ</span>
                <span className="w-2 h-2 rounded-full bg-[#1550d3]" />
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {inProgress} <span className="text-[11px] font-normal text-slate-500">งาน</span>
              </div>
            </button>

            {/* To Submit */}
            <button
              type="button"
              onClick={() => onSelectTab(activeTab === 'to_submit' ? 'all' : 'to_submit')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeTab === 'to_submit'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30'
                  : 'bg-slate-50/70 hover:bg-amber-50/50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-800">รอส่งงาน</span>
                <span className="w-2 h-2 rounded-full bg-[#d97706]" />
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {toSubmit} <span className="text-[11px] font-normal text-slate-500">งาน</span>
              </div>
            </button>

            {/* Overdue */}
            <button
              type="button"
              onClick={() => onSelectTab(activeTab === 'overdue' ? 'all' : 'overdue')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeTab === 'overdue'
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/30'
                  : 'bg-slate-50/70 hover:bg-rose-50/50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-rose-800">เกินกำหนด</span>
                <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {overdue} <span className="text-[11px] font-normal text-slate-500">งาน</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Side: Recharts Donut Summary Chart */}
        <div className="flex items-center justify-center sm:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 md:border-l md:pl-5 border-slate-100 shrink-0">
          {/* Chart Container */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={54}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Percentage Metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-extrabold text-slate-900 leading-none">
                {completionRate}%
              </span>
              <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                ส่งเสร็จ
              </span>
            </div>
          </div>

          {/* Key Legend Pill */}
          <div className="flex flex-col justify-center gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00875a] shrink-0" />
              <span className="font-semibold text-slate-800">ส่งแล้ว {completed}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
              <span className="font-medium text-slate-600">รอดำเนินการ {pending}</span>
            </div>
            <div className="text-[10px] text-slate-400 pt-0.5">
              ความสำเร็จ: {completed}/{total}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
