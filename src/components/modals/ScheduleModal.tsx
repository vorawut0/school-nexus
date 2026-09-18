import React, { useState, useMemo } from 'react';
import {
  WEEKLY_STUDENT_SCHEDULE,
  WEEKLY_TEACHER_SCHEDULE,
  WEEKLY_ADMIN_SCHEDULE,
} from '../../data/mockData';
import { ScheduleItem, UserProfile } from '../../types';

interface ScheduleModalProps {
  selectedItem?: ScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  onOpenCampusMap?: () => void;
}

type TimetableRoleView = 'student' | 'teacher' | 'admin';
type ViewMode = 'daily' | 'matrix';

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  selectedItem,
  isOpen,
  onClose,
  user,
  onOpenCampusMap,
}) => {
  // Determine default day based on actual day of week or 'mon'
  const initialDay = useMemo(() => {
    const dayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    const map: { [key: number]: string } = {
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
    };
    return map[dayIndex] || 'mon';
  }, []);

  const [activeDay, setActiveDay] = useState<string>(initialDay);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [timetableRole, setTimetableRole] = useState<TimetableRoleView>(
    user?.role === 'teacher' ? 'teacher' : user?.role === 'admin' ? 'admin' : 'student'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadedItem, setDownloadedItem] = useState<string | null>(null);
  const [exportedMessage, setExportedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const days = [
    { id: 'mon', label: 'จันทร์ (Mon)', short: 'จันทร์', color: 'border-amber-400 bg-amber-50 text-amber-900', badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'tue', label: 'อังคาร (Tue)', short: 'อังคาร', color: 'border-pink-400 bg-pink-50 text-pink-900', badgeColor: 'bg-pink-100 text-pink-800' },
    { id: 'wed', label: 'พุธ (Wed)', short: 'พุธ', color: 'border-emerald-400 bg-emerald-50 text-emerald-900', badgeColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'thu', label: 'พฤหัส (Thu)', short: 'พฤหัส', color: 'border-orange-400 bg-orange-50 text-orange-900', badgeColor: 'bg-orange-100 text-orange-800' },
    { id: 'fri', label: 'ศุกร์ (Fri)', short: 'ศุกร์', color: 'border-blue-400 bg-blue-50 text-blue-900', badgeColor: 'bg-blue-100 text-blue-800' },
  ];

  // Get current active schedule map based on selected role
  const activeScheduleMap =
    timetableRole === 'teacher'
      ? WEEKLY_TEACHER_SCHEDULE
      : timetableRole === 'admin'
      ? WEEKLY_ADMIN_SCHEDULE
      : WEEKLY_STUDENT_SCHEDULE;

  const currentDayItems = activeScheduleMap[activeDay] || [];

  // Filter items
  const filteredItems = currentDayItems.filter((item) => {
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'lab' && item.category !== 'lab') return false;
      if (categoryFilter === 'core' && item.category !== 'core') return false;
      if (categoryFilter === 'elective' && item.category !== 'elective') return false;
      if (categoryFilter === 'activity' && item.category !== 'activity') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCode = item.subjectCode.toLowerCase().includes(q);
      const matchRoom = item.room.toLowerCase().includes(q);
      const matchInstructor = item.instructor.toLowerCase().includes(q);
      return matchTitle || matchCode || matchRoom || matchInstructor;
    }
    return true;
  });

  // Calculate summary stats for the week
  const totalPeriodsThisDay = currentDayItems.filter((i) => i.category !== 'break').length;
  const totalCreditsThisDay = currentDayItems
    .reduce((sum, i) => sum + (i.credits || 0), 0)
    .toFixed(1);

  const handleExport = () => {
    setExportedMessage('✅ ส่งออกตารางเรียนประจำภาคเรียน 1/2569 (รูปแบบ PDF/iCal) เรียบร้อยแล้ว');
    setTimeout(() => setExportedMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-scaleIn">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#f8faff] border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1550d3] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <span className="material-symbols-outlined text-2xl">calendar_month</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-[#121b2e]">
                  {timetableRole === 'teacher'
                    ? 'ตารางสอนและภาระงานครู'
                    : timetableRole === 'admin'
                    ? 'ตารางงานระบบและบำรุงรักษา IT'
                    : 'ตารางเรียนและกิจกรรมประจำสัปดาห์'}
                </h2>
                <span className="text-[11px] font-bold bg-[#1550d3]/10 text-[#1550d3] px-2.5 py-0.5 rounded-full">
                  ภาคเรียนที่ 1/2569
                </span>
              </div>
              <p className="text-xs text-[#5a5f73] mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>
                  {timetableRole === 'teacher'
                    ? 'อ. กิตติพงษ์ เลิศพิริยะ • กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี'
                    : timetableRole === 'admin'
                    ? 'ฝ่ายเทคโนโลยีสารสนเทศ • แคมปัสดิจิทัล'
                    : 'ชั้นมัธยมศึกษาปีที่ 6/1 (ห้อง 601) • แผนการเรียนวิทย์-คณิต'}
                </span>
                <span>•</span>
                <span className="text-[#1550d3] font-medium">รวม 7 คาบ/วัน</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'daily'
                    ? 'bg-white text-[#1550d3] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="มุมมองรายวันแบบ Timeline"
              >
                <span className="material-symbols-outlined text-[15px]">view_timeline</span>
                <span>รายวัน</span>
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-white text-[#1550d3] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="มุมมองตารางรวมทั้งสัปดาห์"
              >
                <span className="material-symbols-outlined text-[15px]">grid_view</span>
                <span>ตารางรวม</span>
              </button>
            </div>

            <button
              onClick={handleExport}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#1550d3] transition-colors cursor-pointer"
              title="พิมพ์ตารางเรียน / ส่งออก PDF"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Role Timetable Switcher Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-slate-500 mr-1">สลับตาราง:</span>
            <button
              onClick={() => setTimetableRole('student')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                timetableRole === 'student'
                  ? 'bg-[#1550d3] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">school</span>
              <span>ตารางเรียน ม.6/1</span>
            </button>
            <button
              onClick={() => setTimetableRole('teacher')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                timetableRole === 'teacher'
                  ? 'bg-[#1550d3] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">badge</span>
              <span>ตารางสอนอาจารย์</span>
            </button>
            <button
              onClick={() => setTimetableRole('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                timetableRole === 'admin'
                  ? 'bg-[#1550d3] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
              <span>ตารางงานระบบ IT</span>
            </button>
          </div>

          {/* Quick search input */}
          <div className="relative min-w-[140px] sm:min-w-[200px]">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="ค้นหาวิชา, ห้อง, อาจารย์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1550d3]"
            />
          </div>
        </div>

        {/* Day Selector Tabs (When in Daily mode) */}
        {viewMode === 'daily' && (
          <div className="flex border-b border-slate-200 px-4 sm:px-6 pt-3 gap-2 bg-[#f4f7ff] overflow-x-auto no-scrollbar">
            {days.map((day) => {
              const isSelected = activeDay === day.id;
              const count = (activeScheduleMap[day.id] || []).filter((c) => c.category !== 'break').length;
              return (
                <button
                  key={day.id}
                  onClick={() => setActiveDay(day.id)}
                  className={`px-4 py-2.5 rounded-t-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 cursor-pointer border-t-2 ${
                    isSelected
                      ? 'bg-white text-[#1550d3] border-[#1550d3] shadow-xs'
                      : 'bg-white/60 text-slate-600 border-transparent hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <span>{day.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-[#1550d3] text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count} คาบ
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Category Pills (Daily mode) */}
        {viewMode === 'daily' && (
          <div className="px-4 sm:px-6 py-2 border-b border-slate-100 bg-white flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">หมวดวิชา:</span>
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'core', label: '📚 วิชาหลัก/บรรยาย' },
                { id: 'lab', label: '🔬 ปฏิบัติการ/Lab' },
                { id: 'elective', label: '🎨 วิชาเลือก/ภาษา' },
                { id: 'activity', label: '🏅 กิจกรรม/ชมรม' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 hidden sm:block shrink-0">
              <span className="font-semibold text-slate-700">{totalPeriodsThisDay} คาบ</span>
              {timetableRole === 'student' && (
                <span> • รวม {totalCreditsThisDay} นก.</span>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-3 relative bg-[#fafbff]">
          {/* Notifications banner */}
          {exportedMessage && (
            <div className="p-3.5 bg-[#00694d] text-white rounded-2xl text-xs font-semibold shadow-md flex items-center justify-between animate-fadeIn sticky top-0 z-30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>{exportedMessage}</span>
              </div>
              <button
                onClick={() => setExportedMessage(null)}
                className="text-white/80 hover:text-white text-xs font-bold px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {downloadedItem && (
            <div className="p-3.5 bg-[#1550d3] text-white rounded-2xl text-xs font-semibold shadow-md flex items-center justify-between animate-fadeIn sticky top-0 z-30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">download_done</span>
                <span>{downloadedItem}</span>
              </div>
              <button
                onClick={() => setDownloadedItem(null)}
                className="text-white/80 hover:text-white text-xs font-bold px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* VIEW MODE 1: DAILY TIMELINE */}
          {viewMode === 'daily' ? (
            filteredItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">event_busy</span>
                <p className="text-sm font-medium">ไม่พบคาบเรียนหรือกิจกรรมที่ตรงกับเงื่อนไขการค้นหา</p>
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 text-xs text-[#1550d3] font-bold hover:underline cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredItems.map((item, idx) => {
                  const isBreak = item.category === 'break';
                  const isActive = item.status === 'active';

                  if (isBreak) {
                    return (
                      <div
                        key={item.id || idx}
                        className="py-3 px-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-emerald-900 my-1"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">restaurant</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs sm:text-sm">{item.title}</h4>
                              <span className="text-[10px] bg-emerald-200/80 font-bold px-2 py-0.5 rounded-full text-emerald-800">
                                {item.startTime} - {item.endTime} น.
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-700/80 flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[13px]">location_on</span>
                              <span>{item.room} ({item.building})</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-800 hidden sm:inline-block">
                          ☕ เวลาพักผ่อนประจำวัน
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                        isActive
                          ? 'bg-blue-50/70 border-[#1550d3] ring-2 ring-[#1550d3]/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Left: Period & Time info + Subject Details */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Period Box */}
                        <div
                          className="w-16 sm:w-20 p-2.5 rounded-xl border text-center shrink-0 flex flex-col justify-center items-center shadow-2xs"
                          style={{
                            borderColor: item.color ? `${item.color}40` : '#cbd5e1',
                            backgroundColor: item.color ? `${item.color}08` : '#f8fafc',
                          }}
                        >
                          <span
                            className="text-[10px] font-extrabold uppercase tracking-wider"
                            style={{ color: item.color || '#1550d3' }}
                          >
                            คาบที่ {item.periodNumber || idx + 1}
                          </span>
                          <span className="text-[11px] font-bold text-slate-800 font-mono mt-0.5">
                            {item.startTime}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            ถึง {item.endTime}
                          </span>
                        </div>

                        {/* Subject Title & Tags */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-sm sm:text-[15px] text-[#121b2e] leading-snug">
                              {item.title}
                            </h4>
                            <span className="text-[11px] bg-slate-100 text-slate-700 font-mono font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                              {item.subjectCode}
                            </span>
                            {item.credits && (
                              <span className="text-[10px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-md border border-purple-200">
                                {item.credits} นก.
                              </span>
                            )}
                            {item.targetClass && (
                              <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-md border border-amber-200">
                                {item.targetClass}
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[10px] bg-[#20C997]/20 text-[#00694d] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse"></span>
                                กำลังเรียน
                              </span>
                            )}
                          </div>

                          {/* Room, Building, and Instructor */}
                          <div className="text-xs text-[#5a5f73] flex items-center gap-2 flex-wrap mt-1">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-[#1550d3]">
                                room
                              </span>
                              {item.room}
                            </span>
                            <span>•</span>
                            <span>{item.building}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-700">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">
                                person
                              </span>
                              {item.instructor}
                            </span>
                          </div>

                          {/* Note or requirements */}
                          {item.note && (
                            <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 inline-flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[13px] text-amber-600">
                                info
                              </span>
                              <span>{item.note}</span>
                            </div>
                          )}

                          {item.attendanceCount && (
                            <div className="mt-1.5 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
                              <span>{item.attendanceCount}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right action buttons */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {item.materialsCount ? (
                          <button
                            onClick={() => {
                              setDownloadedItem(
                                `📥 ดาวน์โหลดเอกสารและสไลด์วิชา ${item.title} (${item.materialsCount} ไฟล์) สำเร็จ`
                              );
                              setTimeout(() => setDownloadedItem(null), 3500);
                            }}
                            className="px-3 py-1.5 bg-[#f1f3ff] text-[#1550d3] hover:bg-[#1550d3] hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[15px]">download</span>
                            <span>เอกสาร ({item.materialsCount})</span>
                          </button>
                        ) : null}

                        {onOpenCampusMap && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenCampusMap();
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            title="ดูแผนที่อาคารเรียน"
                          >
                            <span className="material-symbols-outlined text-[14px]">map</span>
                            <span>แผนที่ห้อง</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* VIEW MODE 2: FULL WEEKLY TIMETABLE MATRIX (ตารางสอน/ตารางเรียนรวม 5 วัน) */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#121b2e]">
                    ตารางเรียนและคาบสอนรวมทั้งสัปดาห์ (Weekly Timetable Matrix)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    แสดงโครงสร้างรายวิชาประจำวันจันทร์ถึงศุกร์ ภาคเรียนที่ 1/2569
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-blue-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> บรรยาย/วิทย์
                  </span>
                  <span className="flex items-center gap-1 text-purple-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span> คำนวณ/Lab
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> ภาษา/กิจกรรม
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                      <th className="p-2.5 text-center w-20 border-r border-slate-200">วัน</th>
                      <th className="p-2 text-center border-r border-slate-200">
                        คาบ 1<br />
                        <span className="text-[9px] font-normal text-slate-500">08:30-09:20</span>
                      </th>
                      <th className="p-2 text-center border-r border-slate-200">
                        คาบ 2<br />
                        <span className="text-[9px] font-normal text-slate-500">09:25-10:15</span>
                      </th>
                      <th className="p-2 text-center border-r border-slate-200">
                        คาบ 3<br />
                        <span className="text-[9px] font-normal text-slate-500">10:20-11:10</span>
                      </th>
                      <th className="p-2 text-center border-r border-slate-200">
                        คาบ 4<br />
                        <span className="text-[9px] font-normal text-slate-500">11:15-12:05</span>
                      </th>
                      <th className="p-2 text-center w-12 bg-amber-50/50 text-amber-900 border-r border-slate-200">
                        พักเที่ยง<br />
                        <span className="text-[9px] font-normal">12:05-13:00</span>
                      </th>
                      <th className="p-2 text-center border-r border-slate-200">
                        คาบ 5<br />
                        <span className="text-[9px] font-normal text-slate-500">13:00-13:50</span>
                      </th>
                      <th className="p-2 text-center border-r border-slate-200">
                        คาบ 6<br />
                        <span className="text-[9px] font-normal text-slate-500">13:55-14:45</span>
                      </th>
                      <th className="p-2 text-center">
                        คาบ 7<br />
                        <span className="text-[9px] font-normal text-slate-500">14:50-15:40</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => {
                      const daySchedule = activeScheduleMap[day.id] || [];
                      const periods = daySchedule.filter((i) => i.category !== 'break');

                      return (
                        <tr key={day.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                          {/* Day Column */}
                          <td className={`p-2.5 font-bold text-xs text-center border-r border-slate-200 ${day.color}`}>
                            {day.short}
                          </td>

                          {/* Periods 1 to 4 */}
                          {[0, 1, 2, 3].map((pIdx) => {
                            const pItem = periods[pIdx];
                            return (
                              <td
                                key={pIdx}
                                className="p-1.5 border-r border-slate-200 align-top text-[10.5px] max-w-[130px]"
                              >
                                {pItem ? (
                                  <div
                                    className="p-1.5 rounded-lg border h-full flex flex-col justify-between"
                                    style={{
                                      borderColor: pItem.color ? `${pItem.color}40` : '#cbd5e1',
                                      backgroundColor: pItem.color ? `${pItem.color}08` : '#f8fafc',
                                    }}
                                  >
                                    <div>
                                      <span className="font-bold text-slate-900 block truncate" title={pItem.title}>
                                        {pItem.title}
                                      </span>
                                      <span className="text-[9.5px] font-mono text-slate-500 block">
                                        {pItem.subjectCode}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-[9px] text-slate-600 truncate">
                                      📍 {pItem.room}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-1.5 rounded-lg bg-slate-50 text-slate-300 text-center text-[10px]">
                                    -
                                  </div>
                                )}
                              </td>
                            );
                          })}

                          {/* Lunch Break Column */}
                          <td className="p-1 text-center bg-amber-50/30 border-r border-slate-200 text-[10px] text-amber-800 font-semibold">
                            <span className="material-symbols-outlined text-[14px] block mb-0.5">restaurant</span>
                            พัก
                          </td>

                          {/* Periods 5 to 7 */}
                          {[4, 5, 6].map((pIdx) => {
                            const pItem = periods[pIdx];
                            return (
                              <td
                                key={pIdx}
                                className={`p-1.5 align-top text-[10.5px] max-w-[130px] ${
                                  pIdx < 6 ? 'border-r border-slate-200' : ''
                                }`}
                              >
                                {pItem ? (
                                  <div
                                    className="p-1.5 rounded-lg border h-full flex flex-col justify-between"
                                    style={{
                                      borderColor: pItem.color ? `${pItem.color}40` : '#cbd5e1',
                                      backgroundColor: pItem.color ? `${pItem.color}08` : '#f8fafc',
                                    }}
                                  >
                                    <div>
                                      <span className="font-bold text-slate-900 block truncate" title={pItem.title}>
                                        {pItem.title}
                                      </span>
                                      <span className="text-[9.5px] font-mono text-slate-500 block">
                                        {pItem.subjectCode}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-[9px] text-slate-600 truncate">
                                      📍 {pItem.room}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-1.5 rounded-lg bg-slate-50 text-slate-300 text-center text-[10px]">
                                    -
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#5a5f73]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1550d3] text-[18px]">verified</span>
            <span>
              ระบบจัดตารางเรียน-สอนอัจฉริยะ (AI Smart Timetable) • อัปเดตล่าสุด 18 ส.ค. 2569
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">file_download</span>
              <span>ส่งออกไฟล์ iCal / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#1550d3] text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
