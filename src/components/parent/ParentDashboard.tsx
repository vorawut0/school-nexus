import React, { useState } from 'react';
import { UserProfile, Assignment } from '../../types';
import { ASSETS } from '../../data/mockData';

interface ParentDashboardProps {
  user: UserProfile;
  assignments?: Assignment[];
  onNavigateTab: (tab: string) => void;
  onOpenAITutor?: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  user,
  assignments = [],
  onNavigateTab,
  onOpenAITutor,
}) => {
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const pendingTasks = assignments.filter(
    (a) => a.status === 'to_submit' || a.status === 'in_progress' || a.status === 'overdue'
  );
  const completedTasks = assignments.filter((a) => a.status === 'submitted');

  const childName = user.childName || 'นายวรวุฒิ เพ็ชรราย';
  const childClass = 'ชั้นมัธยมศึกษาปีที่ 6/1 (ห้องเรียนพิเศษ AI & Robotics)';
  const studentId = 'STU-66040217';

  return (
    <div className="flex flex-col w-full relative pb-20 sm:pb-24 pt-4 sm:pt-6 px-3 sm:px-6 max-w-[1280px] mx-auto min-h-screen">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-3 sm:right-6 z-[90] bg-[#121b2e] text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slideInRightToast max-w-[calc(100vw-24px)] sm:max-w-md pointer-events-auto">
          <span className="material-symbols-outlined text-[#20C997] text-[18px] shrink-0">check_circle</span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-5 sm:gap-6">
        {/* Top Child Identity Card */}
        <div className="bg-gradient-to-r from-[#121b2e] via-[#1a2744] to-[#1550d3] rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
          {/* Decorative Background Circles */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={ASSETS.headerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={childName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-3 ring-white/30 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-[#121b2e] flex items-center justify-center" title="อยู่ในโรงเรียน">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                </span>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-400/30">
                    นักเรียนในความดูแล (Child Account)
                  </span>
                  <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    อยู่ในสถานศึกษา • อาคาร 4 ชั้น 2
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight truncate">
                  {childName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  {childClass} • รหัส: <span className="font-mono text-cyan-300">{studentId}</span>
                </p>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>อาจารย์ที่ปรึกษา: <strong>อ.ดร.ชัญญา ธนะไพศาล</strong></span>
                  <button
                    onClick={() => setShowAdvisorModal(true)}
                    className="text-cyan-300 hover:text-white underline font-semibold cursor-pointer"
                  >
                    ติดต่อครู
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Buttons in Banner */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
              <button
                onClick={() => onNavigateTab('parent-attendance')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 backdrop-blur-sm transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] text-emerald-300">edit_calendar</span>
                <span>แจ้งลาเรียน</span>
              </button>

              <button
                onClick={() => onNavigateTab('parent-wallet')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add_card</span>
                <span>เติมเงินบัตรอาหาร</span>
              </button>

              {onOpenAITutor && (
                <button
                  onClick={onOpenAITutor}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                  title="ปรึกษา AI Family Guide"
                >
                  <span className="material-symbols-outlined text-[18px]">family_restroom</span>
                  <span className="hidden sm:inline">AI Family</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4 Key Pillar Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Attendance */}
          <div
            onClick={() => onNavigateTab('parent-attendance')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#1550d3]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#737686] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">how_to_reg</span>
                เวลาเรียนวันนี้
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ตรงเวลา
              </span>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-black text-[#121b2e]">07:42 <span className="text-xs text-slate-500 font-normal">น.</span></div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">แตะบัตร RFID ประตูหลัก</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#1550d3] font-bold group-hover:underline">
              <span>ประวัติเข้าเรียน & ใบลา</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </div>

          {/* Card 2: Smart Canteen & Wallet */}
          <div
            onClick={() => onNavigateTab('parent-wallet')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-400/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#737686] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-600 text-[18px]">account_balance_wallet</span>
                กระเป๋าเงินดิจิทัล
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                วงเงิน ฿150/วัน
              </span>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-black text-amber-600">฿420.00</div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">ใช้ไปแล้ววันนี้ ฿75.00 (เหลือ ฿75)</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-700 font-bold group-hover:underline">
              <span>เติมเงิน & จัดการยอดเงิน</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </div>

          {/* Card 3: Homework & Tasks */}
          <div
            onClick={() => onNavigateTab('parent-tasks')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#737686] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">fact_check</span>
                การบ้าน & ภาระงาน
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                ส่งแล้ว {completedTasks.length} งาน
              </span>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-black text-[#1550d3]">
                {pendingTasks.length} <span className="text-xs text-slate-500 font-normal">งานค้างส่ง</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">กำหนดส่งล่าสุด: วันพรุ่งนี้ 23:59</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#1550d3] font-bold group-hover:underline">
              <span>ดูรายการการบ้านทั้งหมด</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </div>

          {/* Card 4: Academic Performance (GPAX) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#737686] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-purple-600 text-[18px]">military_tech</span>
                ผลการเรียนเฉลี่ย
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                อันดับที่ 1 ของห้อง
              </span>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-black text-purple-700">3.92 <span className="text-xs text-slate-500 font-normal">GPAX</span></div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">สะสม 65 หน่วยกิต • เกียรตินิยมดีเด่น</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-700 font-semibold">
              <span>ภาคเรียนที่ 1/2569</span>
              <span className="text-[10px] bg-purple-100 px-1.5 py-0.5 rounded text-purple-800 font-bold">+0.04</span>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Today's Live Feed vs Schedule & Nutrition */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Live Timeline of Student Activity */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1550d3] text-[22px]">timeline</span>
                <h3 className="text-base font-bold text-[#121b2e]">
                  ไทม์ไลน์กิจกรรมวันนี้ของบุตรหลาน (Today's Live Activity)
                </h3>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                อัปเดตสดแบบเรียลไทม์
              </span>
            </div>

            {/* Timeline Items */}
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-2.5 sm:before:left-3 before:w-0.5 before:bg-slate-200">
              {/* Event 1 */}
              <div className="relative">
                <span className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[13px] text-emerald-700">how_to_reg</span>
                </span>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#121b2e]">
                    แตะบัตร RFID เข้าประตูโรงเรียน (Gate 1 - Main Entrance)
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">07:42 น.</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  ผ่านการตรวจจับด้วยระบบ Smart Gate อุณหภูมิร่างกายปกติ (36.4°C) สถานะ: เข้าโรงเรียนตรงเวลา
                </p>
              </div>

              {/* Event 2 */}
              <div className="relative">
                <span className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-blue-100 border-2 border-[#1550d3] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[13px] text-[#1550d3]">menu_book</span>
                </span>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#121b2e]">
                    เช็กชื่อเข้าเรียนคาบที่ 1: ว33281 AI & Robotics
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">08:35 น.</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  อาจารย์ ดร.ชัญญา ธนะไพศาล บันทึกสถานะ "มาเรียนตรงเวลา" ณ ห้องปฏิบัติการ LAB-401 อาคาร 4
                </p>
              </div>

              {/* Event 3 */}
              <div className="relative">
                <span className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-amber-100 border-2 border-amber-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[13px] text-amber-700">lunch_dining</span>
                </span>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#121b2e]">
                    ชำระค่าอาหารกลางวัน Smart Canteen: ข้าวมันไก่ตอนพิเศษ (฿45.00)
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">12:15 น.</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  โรงอาหารกลาง (ร้านป้าพรอาหารจานเดียว) • ยอดคงเหลือในบัตร: ฿420.00
                </p>
              </div>

              {/* Event 4 */}
              <div className="relative">
                <span className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-purple-100 border-2 border-purple-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[13px] text-purple-700">task_alt</span>
                </span>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#121b2e]">
                    ส่งงานการบ้าน: โครงงาน CNN Image Classifier
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">14:20 น.</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  นักเรียนได้อัปโหลดไฟล์รายงานและแนบ GitHub Repository เรียบร้อย (+50 XP) รออาจารย์ตรวจคะแนน
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Today's Classes & Canteen Nutrition */}
          <div className="flex flex-col gap-6">
            {/* Today's Schedule Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h4 className="text-xs font-bold text-[#121b2e] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#1550d3] text-[18px]">calendar_today</span>
                  ตารางเรียนวันนี้ของ ม.6/1
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">วันอังคาร</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-blue-950">08:30 - 10:10 • ว33281 AI & Robotics</div>
                    <div className="text-[11px] text-blue-800">อ.ดร.ชัญญา ธนะไพศาล • LAB-401</div>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md">เรียนแล้ว</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">10:20 - 12:00 • ว33282 Data Science</div>
                    <div className="text-[11px] text-slate-600">อ.วิภาดา รัตนโชติ • LAB-402</div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md">กำลังเรียน</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">13:00 - 15:40 • โครงงานนวัตกรรมดิจิทัล</div>
                    <div className="text-[11px] text-slate-600">อ.ธีรภัทร • Digital Studio</div>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">ช่วงบ่าย</span>
                </div>
              </div>
            </div>

            {/* Nutrition & Health Guide */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-3xl p-5 border border-emerald-200/70 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00694d] text-[20px]">nutrition</span>
                <h4 className="text-xs font-bold text-emerald-950">
                  โภชนาการและสารอาหารวันนี้
                </h4>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                บุตรหลานได้รับพลังงานประมาณ <strong>620 kcal</strong> จากมื้อกลางวันและนมสด (มีโปรตีน คาร์โบไฮเดรต และแคลเซียมครบถ้วน)
              </p>
              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                <span className="text-emerald-800 font-semibold">แนะนำดื่มน้ำเพิ่ม: 1.5 ลิตร</span>
                <span className="text-emerald-700 font-bold">เกณฑ์ปกติ 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advisor Contact Modal */}
      {showAdvisorModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1550d3] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#121b2e]">อาจารย์ที่ปรึกษาประจำชั้น</h3>
                  <p className="text-xs text-slate-500">มัธยมศึกษาปีที่ 6/1</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdvisorModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-sm text-[#121b2e]">อาจารย์ ดร.ชัญญา ธนะไพศาล</div>
                <div className="text-slate-600 mt-0.5">กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (หัวหน้าสาขาวิทยาการคำนวณ)</div>
              </div>

              <div className="space-y-2">
                <a
                  href="tel:0812345678"
                  className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#1550d3]">call</span>
                  <span>โทรด่วน: 081-234-5678 (เวลา 08:00 - 17:00 น.)</span>
                </a>

                <a
                  href="mailto:chanya.t@schoolnexus.ac.th"
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-emerald-600">mail</span>
                  <span>อีเมล: chanya.t@schoolnexus.ac.th</span>
                </a>

                <button
                  onClick={() => {
                    setShowAdvisorModal(false);
                    showToast('ระบบส่งข้อความแจ้งเตือนขอคำปรึกษาไปยังอาจารย์ประจำชั้นแล้ว');
                  }}
                  className="w-full py-3 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>ส่งข้อความนัดหมายพูดคุย</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
