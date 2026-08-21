import React, { useState, useEffect, useMemo } from 'react';
import {
  ASSETS,
  MOCK_SCHEDULE,
  WEEKLY_STUDENT_SCHEDULE,
  WEEKLY_TEACHER_SCHEDULE,
  WEEKLY_ADMIN_SCHEDULE,
} from '../data/mockData';
import { UserProfile, ScheduleItem } from '../types';
import { CampusPulseTab } from './modals/CampusPulseModal';
import { DailyBriefingModal } from './modals/DailyBriefingModal';
import {
  CARD_THEMES,
  GuillochePatternSvg,
  SmartChipSvg,
  HologramEmblemSvg,
  ContactlessWaveSvg,
} from './common/SmartIdCardGraphics';

interface DashboardViewProps {
  user: UserProfile;
  onNavigateTab: (tab: string) => void;
  onOpenScheduleModal: (item?: ScheduleItem) => void;
  onOpenIdCardModal: () => void;
  onOpenQrScanner: () => void;
  onOpenGpaModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenAITutor?: () => void;
  onOpenCampusPulse?: (tab?: CampusPulseTab) => void;
  onOpenShareId?: () => void;
  onOpenInstallApp?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onNavigateTab,
  onOpenScheduleModal,
  onOpenIdCardModal,
  onOpenQrScanner,
  onOpenGpaModal,
  onOpenCalendarModal,
  onOpenAITutor,
  onOpenCampusPulse,
  onOpenShareId,
  onOpenInstallApp,
}) => {
  const [aiQuery, setAiQuery] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiMessage, setAiMessage] = useState(
    user.role === 'admin'
      ? '“สวัสดีครับผู้ดูแลระบบ ระบบเครือข่ายและเซิร์ฟเวอร์ทั้งหมดทำงานปกติ 99.8% พร้อมสนับสนุนการตรวจสอบ”'
      : user.role === 'parent'
      ? '“สวัสดีครับผู้ปกครอง วรวุฒิ สแกนบัตรเข้าโรงเรียนเรียบร้อยเมื่อ 07:42 น. วันนี้มีการบ้านค้างส่ง 1 รายการครับ”'
      : user.role === 'teacher'
      ? '“สวัสดีครับอาจารย์ วันนี้มี 4 คาบสอน และมีภาระงานรอตรวจ 2 รายการครับ”'
      : '“สวัสดีครับ วันนี้ผมพร้อมช่วยคุณจัดการเรื่องการเรียนและการบ้าน”'
  );
  const [counterStudents, setCounterStudents] = useState(0);
  const [scheduleDay, setScheduleDay] = useState<'mon' | 'tue' | 'wed' | 'thu' | 'fri'>('mon');
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);

  // Determine current active schedule based on role and selected day
  const currentScheduleList = useMemo(() => {
    if (user.role === 'teacher') {
      return WEEKLY_TEACHER_SCHEDULE[scheduleDay] || WEEKLY_TEACHER_SCHEDULE.mon;
    }
    if (user.role === 'admin') {
      return WEEKLY_ADMIN_SCHEDULE[scheduleDay] || WEEKLY_ADMIN_SCHEDULE.mon;
    }
    return WEEKLY_STUDENT_SCHEDULE[scheduleDay] || WEEKLY_STUDENT_SCHEDULE.mon;
  }, [user.role, scheduleDay]);

  // Update default AI message if role changes
  useEffect(() => {
    setAiMessage(
      user.role === 'admin'
        ? '“สวัสดีครับผู้ดูแลระบบ ระบบเครือข่ายและเซิร์ฟเวอร์ทั้งหมดทำงานปกติ 99.8% พร้อมสนับสนุนการตรวจสอบ”'
        : user.role === 'parent'
        ? '“สวัสดีครับผู้ปกครอง วรวุฒิ สแกนบัตรเข้าโรงเรียนเรียบร้อยเมื่อ 07:42 น. วันนี้มีการบ้านค้างส่ง 1 รายการครับ”'
        : user.role === 'teacher'
        ? '“สวัสดีครับอาจารย์ วันนี้มี 4 คาบสอน และมีภาระงานรอตรวจ 2 รายการครับ”'
        : '“สวัสดีครับ วันนี้ผมพร้อมช่วยคุณจัดการเรื่องการเรียนและการบ้าน”'
    );
  }, [user.role]);

  // Animate counter on mount
  useEffect(() => {
    let start = 0;
    const target = 1248;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCounterStudents(target);
        clearInterval(timer);
      } else {
        setCounterStudents(start);
      }
    }, 25);
    return () => clearInterval(timer);
  }, []);

  const handleAiSend = (queryText?: string) => {
    const textToSend = queryText || aiQuery;
    if (!textToSend.trim()) return;

    setAiThinking(true);
    setAiQuery('');

    setTimeout(() => {
      const q = textToSend.toLowerCase();
      let response = '';

      if (user.role === 'admin') {
        if (q.includes('ระบบ') || q.includes('server') || q.includes('node') || q.includes('สถานะ')) {
          response = '🖥️ ระบบหลักทำงานปกติ: 12 IoT Nodes ออนไลน์ 100%, Core Switch 10Gbps แบนด์วิดท์เหลือ 78%, ไม่มีแจ้งเตือนข้อผิดพลาดร้ายแรง';
        } else if (q.includes('ผู้ใช้') || q.includes('rfid') || q.includes('บัตร')) {
          response = '👥 ผู้ใช้งานในระบบ: นักเรียน 1,248 คน, คณาจารย์ 68 คน (สัดส่วนมาตรฐาน 1:18.3), สแกน RFID Gate สำเร็จ 100% ประจำวัน';
        } else {
          response = `⚙️ Nexus Admin AI: รับคำสั่ง "${textToSend}" และตรวจสอบฐานข้อมูลระบบแล้ว สถานะทั้งหมดปลอดภัยและพร้อมทำงาน`;
        }
      } else if (user.role === 'parent') {
        if (q.includes('เข้าเรียน') || q.includes('เวลา') || q.includes('มาโรงเรียน')) {
          response = '⏰ วรวุฒิ เพ็ชรระยา สแกนเข้าประตูหน้า 1 เมื่อเวลา 07:42 น. (ตรงเวลา) อุณหภูมิปกติ 36.5°C ครับ';
        } else if (q.includes('เงิน') || q.includes('บัตร') || q.includes('กระเป๋า') || q.includes('อาหาร')) {
          response = '💳 ยอดเงินคงเหลือในบัตร Smart Pass: ฿420.00 (ใช้ซื้ออาหารและเครื่องดื่มไป ฿75.00 วันนี้)';
        } else if (q.includes('การบ้าน') || q.includes('งาน') || q.includes('คะแนน')) {
          response = '📚 การบ้านที่ต้องติดตาม: Coding Project วิชา ว30101 กำหนดส่ง 18 ส.ค. (เหลือเวลา 1 วัน)';
        } else {
          response = `👨‍👩‍👦 ข้อมูลการดูแลบุตรหลาน: ระบบบันทึกข้อสอบถาม "${textToSend}" พร้อมประสานงานกับอาจารย์ที่ปรึกษาหากจำเป็นครับ`;
        }
      } else {
        if (q.includes('ตาราง') || q.includes('เรียน') || q.includes('คาบ')) {
          response =
            '💡 วันนี้คุณมีเรียน 4 วิชา: 09:00 วิทยาการคำนวณ (Lab 402), 11:00 การออกแบบ, 13:00 Multimedia, 15:00 คณิตศาสตร์ครับ';
        } else if (q.includes('งาน') || q.includes('การบ้าน') || q.includes('ส่ง')) {
          response =
            '📌 งานที่ต้องส่งด่วน: Coding Project (วิทยาการคำนวณ) กำหนดส่งพรุ่งนี้ 23:59 น. ทำไปแล้ว 45% ครับ';
        } else if (q.includes('เกรด') || q.includes('ผลการเรียน') || q.includes('gpa')) {
          response =
            '🌟 ผลการเรียนเฉลี่ยสะสมปัจจุบัน (GPAX): 3.92 (อยู่อันดับ Top 3% ของสายวิทย์-คอมพิวเตอร์ครับ)';
        } else if (q.includes('ห้อง') || q.includes('lab') || q.includes('อาคาร')) {
          response =
            '🏢 Computer Lab 01 และ Lab 402 เปิดใช้งานปกติ ส่วน Science Lab พร้อมใช้งาน Network Health อยู่ที่ 92% ครับ';
        } else {
          response = `🤖 ตอบคำถาม "${textToSend}": ระบบได้บันทึกและพร้อมช่วยอำนวยความสะดวกในการเรียนของคุณตลอด 24 ชั่วโมงครับ!`;
        }
      }

      setAiMessage(`“${response}”`);
      setAiThinking(false);
    }, 700);
  };

  return (
    <div className="flex flex-col w-full relative pb-20 sm:pb-24 pt-5 sm:pt-6 px-4 sm:px-6 max-w-[1280px] mx-auto min-h-screen">
      {/* Living Ambient SVG Background Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute w-[460px] h-[460px] -top-20 -right-20 opacity-[0.035] animate-[spin_60s_linear_infinite]"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="text-[#1550d3]"
            d="M42.7,-73.4C55.9,-65.8,67.6,-54.6,76.4,-41.4C85.2,-28.2,91.1,-13.1,89.5,1.5C87.9,16.1,78.8,30.2,68.6,42.4C58.4,54.6,47.1,64.9,33.9,71.7C20.7,78.5,5.6,81.8,-8.4,79.9C-22.4,78,-35.3,70.9,-46.8,61.7C-58.3,52.5,-68.4,41.2,-74.6,27.8C-80.8,14.4,-83.1,-1.1,-79.8,-15.5C-76.5,-29.9,-67.6,-43.2,-55.8,-52.7C-44,-62.2,-29.3,-67.9,-14.9,-71.8C-0.5,-75.7,13.6,-77.8,27.3,-76.8C41,-75.8,29.5,-81,42.7,-73.4Z"
            fill="currentColor"
            transform="translate(100 100)"
          />
        </svg>
      </div>

      <div className="z-10 w-full flex flex-col gap-6 sm:gap-8">
        {/* Header Greeting */}
        <section className="flex flex-col gap-2">
          <button
            onClick={() => setIsBriefingModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#1550d3]/10 to-[#7857f8]/10 hover:from-[#1550d3]/20 hover:to-[#7857f8]/20 text-[#1550d3] w-fit border border-[#1550d3]/20 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-95 group"
            title="คลิกเพื่อเปิดสรุปประจำวัน & รับพลังบวก 🌟"
          >
            <span className="material-symbols-outlined text-[16px] group-hover:rotate-12 transition-transform">wb_twilight</span>
            <span className="text-[12px] font-bold tracking-wide uppercase flex items-center gap-1">
              สวัสดี <span className="inline-block group-hover:animate-bounce">👋</span>
            </span>
            <span className="text-[10px] bg-[#1550d3] text-white px-1.5 py-0.2 rounded-full font-medium ml-0.5 group-hover:scale-105 transition-transform">
              สรุปประจำวัน ✨
            </span>
          </button>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-[#121b2e] leading-tight">
            {user.thaiName.split(' ')[0]}, ยินดีต้อนรับกลับสู่ SCHOOL NEXUS
          </h1>
          <p className="text-[#434654] text-[15px]">
            นี่คือภาพรวมด้านการเรียนและภาระงานประจำวันของคุณ
          </p>
        </section>

        {/* Section 1: Nexus AI School Core Assistant */}
        <section className="relative">
          <div className="absolute -inset-1 bg-gradient-to-br from-[#1550d3]/20 via-transparent to-[#7857f8]/20 rounded-[28px] blur-sm opacity-60 pointer-events-none"></div>
          <div className="relative bg-white rounded-[24px] p-5 sm:p-6 shadow-xl shadow-[#1550d3]/5 flex flex-col gap-5 ring-1 ring-slate-200/80">
            {/* AI Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center relative shadow-md ${
                  user.role === 'teacher'
                    ? 'bg-gradient-to-tr from-[#1550d3] to-[#2b7fff] shadow-blue-500/30'
                    : user.role === 'admin'
                    ? 'bg-gradient-to-tr from-[#6e2acf] to-[#9b51e0] shadow-purple-500/30'
                    : user.role === 'parent'
                    ? 'bg-gradient-to-tr from-[#d97706] to-[#f59e0b] shadow-amber-500/30'
                    : 'bg-[#3c6bed] shadow-[#3c6bed]/30'
                }`}>
                  <span className="material-symbols-outlined text-[26px] fill-1">
                    {user.role === 'teacher'
                      ? 'menu_book'
                      : user.role === 'admin'
                      ? 'security'
                      : user.role === 'parent'
                      ? 'family_restroom'
                      : 'smart_toy'}
                  </span>
                  <div className="absolute top-0 right-0 w-3 h-3 bg-[#20C997] rounded-full border-2 border-white shadow-xs"></div>
                </div>
                <div>
                  <h2 className="font-bold text-[18px] text-[#121b2e] flex items-center gap-1.5">
                    {user.role === 'teacher'
                      ? 'Nexus AI ระบบช่วยสอน'
                      : user.role === 'admin'
                      ? 'Nexus AI ควบคุมระบบ'
                      : user.role === 'parent'
                      ? 'Nexus AI ผู้ช่วยดูแลบุตรหลาน'
                      : 'Nexus AI ติวเตอร์อัจฉริยะ'}
                    <span className="text-[10px] bg-[#1550d3]/10 text-[#1550d3] font-semibold px-2 py-0.5 rounded-full">
                      {user.role === 'teacher'
                        ? 'วิชาการ & การสอน'
                        : user.role === 'admin'
                        ? 'ความปลอดภัย & IT'
                        : user.role === 'parent'
                        ? 'การดูแลครอบครัว'
                        : 'เวอร์ชัน 2.6'}
                    </span>
                  </h2>
                  <p className="text-[13px] text-[#434654]">
                    {user.role === 'teacher'
                      ? 'ผู้ช่วยออกแบบแผนการสอน & จัดการชั้นเรียน'
                      : user.role === 'admin'
                      ? 'ผู้ช่วยตรวจวิเคราะห์ระบบ & ความปลอดภัย'
                      : user.role === 'parent'
                      ? 'ผู้ช่วยที่ปรึกษา & พัฒนาการบุตรหลาน'
                      : 'ผู้ช่วยการเรียนรู้ & ติวเตอร์ส่วนบุคคล'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {onOpenAITutor && (
                  <button
                    onClick={onOpenAITutor}
                    className="px-3 py-1.5 rounded-xl bg-[#1550d3] text-white hover:bg-[#1a53d6] flex items-center gap-1.5 text-[12px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                    title="เปิดแผงผู้ช่วย AI"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    <span>
                      {user.role === 'teacher'
                        ? 'แผงผู้ช่วยสอน AI'
                        : user.role === 'admin'
                        ? 'แผงควบคุมระบบ AI'
                        : user.role === 'parent'
                        ? 'แผงดูแลบุตรหลาน AI'
                        : 'แผงติวเตอร์ AI'}
                    </span>
                  </button>
                )}
                <button
                  onClick={() =>
                    handleAiSend(
                      user.role === 'teacher'
                        ? 'สรุปภาระการสอนและงานที่รอตรวจวันนี้'
                        : user.role === 'admin'
                        ? 'สรุปสุขภาพระบบและความปลอดภัยวันนี้'
                        : user.role === 'parent'
                        ? 'สรุปการเข้าเรียนและการบ้านของบุตรหลานวันนี้'
                        : 'สรุปข้อมูลวิชาการและกิจกรรมของฉันทั้งหมดในวันนี้'
                    )
                  }
                  className="w-10 h-10 rounded-xl bg-[#f1f3ff] text-[#434654] flex items-center justify-center hover:bg-[#e1e8ff] hover:text-[#1550d3] transition-colors cursor-pointer"
                  title="สรุปภาพรวม AI"
                >
                  <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                </button>
              </div>
            </div>

            {/* AI Speech Bubble */}
            <div className="bg-[#1550d3]/6 p-4 rounded-2xl relative border border-[#1550d3]/10 transition-all">
              <div className="absolute -top-1.5 left-6 w-3 h-3 bg-[#1550d3]/6 border-t border-l border-[#1550d3]/10 rotate-45"></div>
              <p className="text-[15px] sm:text-[16px] text-[#121b2e] relative z-10 leading-relaxed">
                {aiThinking ? (
                  <span className="flex items-center gap-2 text-[#1550d3]">
                    <span className="w-2 h-2 rounded-full bg-[#1550d3] animate-ping" />
                    Nexus AI กำลังประมวลผลคำตอบ...
                  </span>
                ) : (
                  aiMessage
                )}
              </p>
            </div>

            {/* 4 Quick Action Tiles */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Tile 1 */}
              <button
                onClick={() => onOpenScheduleModal()}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#f1f3ff] hover:bg-[#e1e8ff] hover:shadow-xs transition-all group border border-slate-100 text-left active:scale-98 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-white text-[#1550d3] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">menu_book</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[13px] sm:text-[14px] text-[#121b2e] group-hover:text-[#1550d3] transition-colors">
                    {user.role === 'teacher'
                      ? 'ตารางสอนวันนี้'
                      : user.role === 'admin'
                      ? 'ตารางปฏิบัติงาน'
                      : user.role === 'parent'
                      ? 'ตารางเรียนบุตรหลาน'
                      : 'ตารางเรียนวันนี้'}
                  </span>
                  <span className="text-[11px] text-[#737686]">
                    {user.role === 'teacher'
                      ? '4 คาบสอน'
                      : user.role === 'admin'
                      ? 'ตรวจสอบระบบ'
                      : '4 คาบเรียน (ม.6/1)'}
                  </span>
                </div>
              </button>

              {/* Tile 2 */}
              <button
                onClick={() => {
                  if (user.role === 'admin') {
                    onNavigateTab('admin-logs');
                  } else if (user.role === 'parent') {
                    onNavigateTab('parent-tasks');
                  } else {
                    onNavigateTab('assignments');
                  }
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#f1f3ff] hover:bg-[#e1e8ff] hover:shadow-xs transition-all group border border-slate-100 text-left active:scale-98 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-white text-[#ba1a1a] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">
                    {user.role === 'admin' ? 'security' : user.role === 'parent' ? 'checklist' : 'edit_note'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[13px] sm:text-[14px] text-[#121b2e] group-hover:text-[#1550d3] transition-colors">
                    {user.role === 'teacher'
                      ? 'งานที่ต้องตรวจ'
                      : user.role === 'admin'
                      ? 'บันทึกความปลอดภัย'
                      : user.role === 'parent'
                      ? 'ติดตามการบ้าน'
                      : 'งานที่ต้องส่ง'}
                  </span>
                  <span className="text-[11px] text-[#ba1a1a] font-medium">
                    {user.role === 'teacher'
                      ? 'รอตรวจ 2 งาน'
                      : user.role === 'admin'
                      ? 'ระบบปลอดภัย'
                      : user.role === 'parent'
                      ? 'ค้างส่ง 1 งาน'
                      : '1 งานด่วน'}
                  </span>
                </div>
              </button>

              {/* Tile 3 */}
              <button
                onClick={() => {
                  if (user.role === 'admin') {
                    onNavigateTab('admin-users');
                  } else if (user.role === 'parent') {
                    onNavigateTab('parent-wallet');
                  } else if (user.role === 'teacher') {
                    onNavigateTab('learning');
                  } else {
                    onOpenGpaModal();
                  }
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#f1f3ff] hover:bg-[#e1e8ff] hover:shadow-xs transition-all group border border-slate-100 text-left active:scale-98 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-white text-[#00694d] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">
                    {user.role === 'admin' ? 'group' : user.role === 'parent' ? 'credit_card' : 'bar_chart'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[13px] sm:text-[14px] text-[#121b2e] group-hover:text-[#1550d3] transition-colors">
                    {user.role === 'teacher'
                      ? 'รายวิชาที่สอน'
                      : user.role === 'admin'
                      ? 'จัดการผู้ใช้ & สิทธิ์'
                      : user.role === 'parent'
                      ? 'บัตร & ค่าอาหาร'
                      : 'ผลการเรียน'}
                  </span>
                  <span className="text-[11px] text-[#00694d] font-medium">
                    {user.role === 'teacher'
                      ? '4 รายวิชา'
                      : user.role === 'admin'
                      ? '1,334 บัญชี'
                      : user.role === 'parent'
                      ? 'คงเหลือ ฿420'
                      : `GPA ${user.gpa || '3.92'}`}
                  </span>
                </div>
              </button>

              {/* Tile 4 */}
              <button
                onClick={() => {
                  if (user.role === 'admin') {
                    onNavigateTab('campus');
                  } else if (user.role === 'parent') {
                    onNavigateTab('parent-attendance');
                  } else {
                    onOpenCalendarModal();
                  }
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#f1f3ff] hover:bg-[#e1e8ff] hover:shadow-xs transition-all group border border-slate-100 text-left active:scale-98 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-white text-[#1550d3] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">
                    {user.role === 'admin' ? 'sensors' : user.role === 'parent' ? 'schedule' : 'calendar_month'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[13px] sm:text-[14px] text-[#121b2e] group-hover:text-[#1550d3] transition-colors">
                    {user.role === 'admin'
                      ? 'ระบบ IoT แคมปัส'
                      : user.role === 'parent'
                      ? 'การเข้าเรียนบุตร'
                      : 'ปฏิทิน'}
                  </span>
                  <span className="text-[11px] text-[#737686]">
                    {user.role === 'admin'
                      ? '12 Nodes ทำงาน'
                      : user.role === 'parent'
                      ? 'เข้าเรียน 07:42 น.'
                      : 'กิจกรรมสัปดาห์นี้'}
                  </span>
                </div>
              </button>
            </div>

            {/* AI Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAiSend();
              }}
              className="relative mt-1"
            >
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="มีอะไรให้ช่วยไหม? (เช่น ถามตารางเรียน, ขอแนวข้อสอบ)"
                className="w-full h-13 pl-11 pr-13 rounded-2xl bg-[#f9f9ff] text-[#121b2e] text-[14px] placeholder:text-[#737686] border border-slate-200 focus:border-[#1550d3] focus:ring-2 focus:ring-[#1550d3]/20 focus:outline-none transition-all"
              />
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737686] text-[20px]">
                search
              </span>
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#1550d3] text-white flex items-center justify-center shadow-md hover:bg-[#1a53d6] hover:scale-105 active:scale-95 transition-all"
                title="ส่งคำถาม"
              >
                <span className="material-symbols-outlined text-[20px] fill-1">send</span>
              </button>
            </form>
          </div>
        </section>

        {/* Section 2: Student Digital Identity Card */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[18px] text-[#121b2e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1550d3]">badge</span>
              บัตรประจำตัวดิจิทัล (Digital Identity)
            </h3>
            <button
              onClick={onOpenIdCardModal}
              className="text-[13px] font-semibold text-[#1550d3] hover:underline"
            >
              ดูบัตร 3D ➔
            </button>
          </div>

          {(() => {
            const cardThemeCfg = CARD_THEMES[user.cardTheme || 'obsidian-gold'] || CARD_THEMES['obsidian-gold'];
            return (
              <div
                onClick={onOpenIdCardModal}
                className={`relative rounded-[26px] overflow-hidden bg-gradient-to-br ${cardThemeCfg.bgGradient} text-white shadow-2xl p-5 sm:p-6 group cursor-pointer border ${cardThemeCfg.borderColor} hover:shadow-cyan-900/20 transition-all duration-300`}
              >
                {/* Guilloche Security Pattern & Shimmer */}
                <GuillochePatternSvg themeId={user.cardTheme || 'obsidian-gold'} opacity={0.20} />
                <HologramEmblemSvg themeId={user.cardTheme || 'obsidian-gold'} />

                {/* Glass & Glow Ambient Background */}
                <div
                  className={`absolute top-0 right-0 w-64 h-64 ${cardThemeCfg.accentGlow} rounded-full mix-blend-screen filter blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none`}
                />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#1550d3]/20 rounded-full mix-blend-screen filter blur-[60px] opacity-25 pointer-events-none" />

                {/* Top Security Micro-ribbon */}
                <div className="relative z-10 -mx-6 -mt-3 mb-2 px-6 py-0.5 bg-black/40 border-b border-white/10 flex justify-between items-center text-[8px] font-mono tracking-wider text-white/50 uppercase">
                  <span>SCHOOL NEXUS OFFICIAL IDENTITY PASS</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>ACTIVE</span>
                  </span>
                </div>

                <div className="relative z-10 flex flex-col gap-4">
                  {/* Header Info */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3.5">
                      <div className="w-15 h-15 sm:w-16 sm:h-16 rounded-2xl overflow-hidden ring-2 ring-amber-400/60 p-0.5 bg-white/10 backdrop-blur-md shadow-lg shrink-0">
                        <img
                          src={user.avatar || ASSETS.cardAvatar}
                          alt={user.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-[17px] sm:text-[19px] tracking-tight text-white uppercase leading-tight">
                          {user.name}
                        </h4>
                        <p className={`text-xs ${cardThemeCfg.textColor} font-medium mt-0.5`}>
                          {user.thaiName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-white/15 text-[11px] font-bold tracking-wider backdrop-blur-md border border-white/15 text-white">
                            {user.role === 'student' && (user.grade || 'มัธยมศึกษาปีที่ 6/1')}
                            {user.role === 'teacher' && (user.position || 'อาจารย์ชำนาญการพิเศษ')}
                            {user.role === 'admin' && (user.position || 'ผู้ดูแลระบบไอที')}
                            {user.role === 'parent' && 'ผู้ปกครองนักเรียน'}
                          </span>
                          <span className="text-white/40 text-xs">•</span>
                          <span className="text-[12px] text-white/80 font-medium font-mono">
                            {user.role === 'student' && `ID: ${user.studentId}`}
                            {user.role === 'teacher' && (user.department || 'วิทยาศาสตร์และเทคโนโลยี')}
                            {user.role === 'admin' && (user.department || 'ศูนย์เทคโนโลยีสารสนเทศ')}
                            {user.role === 'parent' && (user.childName ? `ดูแล ${user.childName}` : 'ยืนยันตัวตนแล้ว')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* QR Scanner & Share ID Triggers + Chip */}
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:block">
                        <SmartChipSvg size={34} isGold={cardThemeCfg.goldOrSilver === 'gold'} />
                      </div>

                      {onOpenShareId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenShareId();
                          }}
                          className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                          title="แชร์ QR บัตรประจำตัว (Share My ID as QR)"
                        >
                          <span className="material-symbols-outlined text-white text-[20px]">
                            qr_code_2
                          </span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQrScanner();
                        }}
                        className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                        title="สแกน QR Code"
                      >
                        <span className="material-symbols-outlined text-white text-[20px]">
                          qr_code_scanner
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Stats & Progress */}
                  {user.role === 'student' ? (
                    <div className="bg-black/35 rounded-2xl p-3.5 border border-white/10 backdrop-blur-md flex justify-between items-center shadow-inner">
                      <div>
                        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider block">
                          สถานะการเข้าเรียนวันนี้
                        </span>
                        <span className="text-[15px] font-bold text-[#67fcc6] flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-[#20C997] animate-pulse"></span>
                          <span>เช็คชื่อเข้าเรียนแล้ว (07:42 น.)</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-white/60 block">เกรดเฉลี่ยสะสม (GPAX)</span>
                        <span className="text-sm font-bold text-amber-300 font-mono">
                          {user.gpa ? user.gpa.toFixed(2) : '3.92'}
                        </span>
                      </div>
                    </div>
                  ) : user.role === 'admin' ? (
                    <div className="bg-black/35 rounded-2xl p-3.5 border border-white/10 backdrop-blur-md flex justify-between items-center shadow-inner">
                      <div>
                        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider block">
                          ความพร้อมของระบบแคมปัส
                        </span>
                        <span className="text-[17px] font-bold text-[#67fcc6]">
                          ออนไลน์ 99.8%
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-white/60 block">โหนด IoT ที่ทำงานอยู่</span>
                        <span className="text-sm font-bold text-white font-mono">12 / 12 Nodes</span>
                      </div>
                    </div>
                  ) : user.role === 'parent' ? (
                    <div className="bg-black/35 rounded-2xl p-3.5 border border-white/10 backdrop-blur-md flex justify-between items-center shadow-inner">
                      <div>
                        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider block">
                          นักเรียนในความปกครอง
                        </span>
                        <span className="text-[15px] font-bold text-white">
                          วรวุฒิ เพ็ชรระยา (ม.6/1)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-white/60 block">ยอดเงินคงเหลือในบัตร</span>
                        <span className="text-sm font-bold text-[#67fcc6] font-mono">฿420.00</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/35 rounded-2xl p-3.5 border border-white/10 backdrop-blur-md flex justify-between items-center shadow-inner">
                      <div>
                        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider block">
                          กลุ่มสาระการเรียนรู้
                        </span>
                        <span className="text-[15px] font-bold text-white">
                          {user.department || 'วิทยาศาสตร์และเทคโนโลยี'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-white/60 block">รายวิชาที่รับผิดชอบ</span>
                        <span className="text-sm font-bold text-blue-200 font-mono">4 รายวิชา</span>
                      </div>
                    </div>
                  )}

                  {/* Card Bottom: Official Smart Pass Info & Chip */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                        บัตรประจำตัวดิจิทัล SCHOOL NEXUS
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono font-bold text-xs"
                          style={{ color: cardThemeCfg.accentColor }}
                        >
                          {user.rfidCard || 'NFC-SN-8849-2026'}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#20C997] animate-pulse"></span>
                        <span className="text-[10px] text-slate-300 font-medium">พร้อมใช้งาน</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-[11px]">
                      <ContactlessWaveSvg color={cardThemeCfg.accentColor} />
                      <span className="font-semibold">แตะดูบัตร 3D</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Mobile Install Quick Chip */}
          {onOpenInstallApp && (
            <div className="mt-3 flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white shadow-sm border border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">install_mobile</span>
                </span>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>แอปมือถือ School Nexus</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">Android & iOS</span>
                  </div>
                  <div className="text-[11px] text-slate-400">ติดตั้งบนหน้าจอมือถือ เปิดเต็มจอ ใช้งานออฟไลน์</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenInstallApp}
                className="py-1.5 px-3 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
              >
                ติดตั้งแอป
              </button>
            </div>
          )}
        </section>

        {/* Section 3: Today's Schedule Timeline */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[18px] text-[#121b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1550d3]">schedule</span>
                {user.role === 'teacher'
                  ? 'ตารางสอนประจำวัน'
                  : user.role === 'admin'
                  ? 'ตารางบำรุงรักษาและงานระบบ'
                  : user.role === 'parent'
                  ? 'ตารางเรียนบุตรหลาน (ม.6/1)'
                  : 'ตารางเรียนประจำวัน'}
              </h3>
            </div>

            <div className="flex items-center gap-2 justify-between sm:justify-end">
              {/* Day Switcher Pills */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                {[
                  { id: 'mon', label: 'จ.' },
                  { id: 'tue', label: 'อ.' },
                  { id: 'wed', label: 'พ.' },
                  { id: 'thu', label: 'พฤ.' },
                  { id: 'fri', label: 'ศ.' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setScheduleDay(d.id as any)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      scheduleDay === d.id
                        ? 'bg-[#1550d3] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onOpenScheduleModal()}
                className="text-[13px] font-semibold text-[#1550d3] hover:underline cursor-pointer flex items-center gap-0.5 shrink-0"
              >
                <span>ดูตารางเต็ม</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md ring-1 ring-slate-200/70 relative overflow-hidden">
            {/* Vertical timeline line */}
            <div className="absolute top-8 bottom-8 left-[65px] sm:left-[75px] w-0.5 bg-[#e1e8ff] z-0"></div>

            <div className="flex flex-col gap-3.5 relative z-10">
              {currentScheduleList.map((item, idx) => {
                const isActive = item.status === 'active';
                const isBreak = item.category === 'break';

                if (isBreak) {
                  return (
                    <div
                      key={item.id || idx}
                      className="flex gap-3 sm:gap-4 items-center opacity-85"
                    >
                      <div className="w-14 sm:w-16 text-right shrink-0">
                        <span className="text-[12px] font-semibold text-emerald-700 font-mono">
                          {item.time}
                        </span>
                      </div>
                      <div className="relative w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-200 shrink-0 z-10" />
                      <div className="flex-1 rounded-xl p-2.5 bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-800">
                        <span className="font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px]">restaurant</span>
                          <span>{item.title}</span>
                        </span>
                        <span className="text-[11px] text-emerald-600 hidden sm:inline">
                          {item.startTime} - {item.endTime} น.
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id || idx}
                    onClick={() => onOpenScheduleModal(item)}
                    className="flex gap-3 sm:gap-4 items-center group cursor-pointer"
                  >
                    {/* Time Label */}
                    <div className="w-14 sm:w-16 text-right shrink-0">
                      <span
                        className={`text-[13px] sm:text-[14px] font-semibold font-mono ${
                          isActive ? 'text-[#1550d3]' : 'text-[#737686]'
                        }`}
                      >
                        {item.time}
                      </span>
                    </div>

                    {/* Timeline node */}
                    <div
                      className={`relative w-4 h-4 rounded-full border-2 shrink-0 z-10 transition-all ${
                        isActive
                          ? 'bg-[#1550d3] border-white ring-4 ring-[#1550d3]/20 scale-125'
                          : 'bg-white border-[#737686] group-hover:border-[#1550d3]'
                      }`}
                    />

                    {/* Class Card */}
                    <div
                      className={`flex-1 rounded-2xl p-3.5 sm:p-4 transition-all duration-200 border ${
                        isActive
                          ? 'bg-[#f1f3ff] border-[#1550d3]/40 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200/60 hover:bg-[#f1f3ff]/60 hover:border-[#1550d3]/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.periodNumber && (
                            <span className="text-[10px] bg-slate-200/70 text-slate-700 font-bold px-1.5 py-0.2 rounded font-mono">
                              คาบ {item.periodNumber}
                            </span>
                          )}
                          <h4
                            className={`font-semibold text-[14px] sm:text-[15px] ${
                              isActive ? 'text-[#1550d3]' : 'text-[#121b2e]'
                            }`}
                          >
                            {item.title}
                          </h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.2 rounded">
                            {item.subjectCode}
                          </span>
                          {item.targetClass && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded">
                              {item.targetClass}
                            </span>
                          )}
                        </div>

                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1550d3]/10 text-[#1550d3] border border-[#1550d3]/20">
                            กำลังเรียน
                          </span>
                        )}
                      </div>

                      <div className="text-[12px] sm:text-[13px] text-[#737686] flex items-center gap-2 flex-wrap mt-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#1550d3]">
                            location_on
                          </span>
                          {item.room}
                        </span>
                        <span>•</span>
                        <span>{item.instructor}</span>
                        {item.materialsCount ? (
                          <>
                            <span>•</span>
                            <span className="text-[#1550d3] font-semibold text-[11px] flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[13px]">folder</span>
                              {item.materialsCount} เอกสาร
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 4: Real-Time Campus Pulse */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[18px] text-[#121b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1550d3]">monitoring</span>
                ชีพจรแคมปัส (Campus Pulse)
              </h3>
              <div className="flex items-center gap-1.5 bg-[#20C997]/10 px-2.5 py-0.5 rounded-full border border-[#20C997]/20">
                <span className="w-2 h-2 rounded-full bg-[#20C997] animate-pulse"></span>
                <span className="text-[10.5px] font-bold text-[#00694d] uppercase tracking-wider">
                  ข้อมูลสดแบบเรียลไทม์
                </span>
              </div>
            </div>

            {onOpenCampusPulse && (
              <button
                onClick={() => onOpenCampusPulse('overview')}
                className="text-[12px] font-bold text-[#1550d3] hover:underline flex items-center gap-1 cursor-pointer group"
                title="คลิกเพื่อดูรายละเอียดสถิติเชิงลึก"
              >
                <span>ดูรายละเอียดทั้งหมด</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Students */}
            <div
              onClick={() => onOpenCampusPulse && onOpenCampusPulse('students')}
              className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200/70 flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-md hover:ring-[#1550d3]/40 transition-all cursor-pointer group relative overflow-hidden"
              title="คลิกเพื่อดูโครงสร้างประชากรนักเรียนและแผนการเรียน"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1550d3]/10 text-[#1550d3] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#1550d3] group-hover:text-white transition-all shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                </div>
                <span className="text-[10px] font-bold text-[#1550d3] bg-[#1550d3]/10 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  ดูสถิติ ➔
                </span>
              </div>
              <div>
                <span className="text-[12px] font-medium text-[#737686] mb-1 block">
                  นักเรียนทั้งหมด
                </span>
                <div className="text-[22px] sm:text-[26px] text-[#121b2e] font-bold tracking-tight">
                  {counterStudents.toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-[10.5px] text-[#737686] group-hover:text-[#1550d3] flex items-center gap-1 font-medium transition-colors">
                <span className="material-symbols-outlined text-[13px]">touch_app</span>
                คลิกดูระดับชั้น ม.1-ม.6
              </div>
            </div>

            {/* Teachers */}
            <div
              onClick={() => onOpenCampusPulse && onOpenCampusPulse('teachers')}
              className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200/70 flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-md hover:ring-[#5f3add]/40 transition-all cursor-pointer group relative overflow-hidden"
              title="คลิกเพื่อดูรายชื่ออาจารย์และสถานะ Office Hours"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#5f3add]/10 text-[#5f3add] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#5f3add] group-hover:text-white transition-all shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">school</span>
                </div>
                <span className="text-[10px] font-bold text-[#5f3add] bg-[#5f3add]/10 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  ดูคณาจารย์ ➔
                </span>
              </div>
              <div>
                <span className="text-[12px] font-medium text-[#737686] mb-1 block">
                  คณาจารย์
                </span>
                <div className="text-[22px] sm:text-[26px] text-[#121b2e] font-bold tracking-tight">
                  68
                </div>
              </div>
              <div className="mt-2 text-[10.5px] text-[#737686] group-hover:text-[#5f3add] flex items-center gap-1 font-medium transition-colors">
                <span className="material-symbols-outlined text-[13px]">touch_app</span>
                พร้อมปรึกษา 16 ท่าน
              </div>
            </div>

            {/* Online Now */}
            <div
              onClick={() => onOpenCampusPulse && onOpenCampusPulse('online')}
              className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200/70 flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-md hover:ring-[#20C997]/40 transition-all cursor-pointer group relative overflow-hidden"
              title="คลิกเพื่อดูความหนาแน่น Wi-Fi และเครือข่ายแต่ละอาคาร"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#20C997]/15 text-[#00694d] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#20C997] group-hover:text-white transition-all shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">wifi</span>
                </div>
                <span className="text-[10px] font-bold text-[#00694d] bg-[#20C997]/20 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  ดูโซน ➔
                </span>
              </div>
              <div>
                <span className="text-[12px] font-medium text-[#737686] mb-1 block">
                  ออนไลน์ขณะนี้
                </span>
                <div className="text-[22px] sm:text-[26px] text-[#121b2e] font-bold tracking-tight">
                  326
                </div>
              </div>
              <div className="mt-2 text-[10.5px] text-[#737686] group-hover:text-[#00694d] flex items-center gap-1 font-medium transition-colors">
                <span className="material-symbols-outlined text-[13px]">touch_app</span>
                ทราฟฟิก Wi-Fi & LMS
              </div>
            </div>

            {/* Attendance */}
            <div
              onClick={() => onOpenCampusPulse && onOpenCampusPulse('attendance')}
              className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200/70 flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-md hover:ring-amber-400 transition-all cursor-pointer group relative overflow-hidden"
              title="คลิกเพื่อดูสถิติการเข้าเรียนและการตรงต่อเวลาแยกตามห้อง"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFB800]/15 text-amber-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FFB800] group-hover:text-amber-950 transition-all shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">fact_check</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-[#FFB800]/20 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  ดูรายห้อง ➔
                </span>
              </div>
              <div>
                <span className="text-[12px] font-medium text-[#737686] mb-1 block">
                  อัตราการเข้าเรียน
                </span>
                <div className="text-[22px] sm:text-[26px] text-[#121b2e] font-bold tracking-tight">
                  96.8<span className="text-sm font-normal text-[#737686]">%</span>
                </div>
              </div>
              <div className="mt-2 text-[10.5px] text-[#737686] group-hover:text-amber-700 flex items-center gap-1 font-medium transition-colors">
                <span className="material-symbols-outlined text-[13px]">touch_app</span>
                เช็กชื่อ RFID Gate 100%
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Daily Briefing & Mood Inspiration Modal */}
      <DailyBriefingModal
        isOpen={isBriefingModalOpen}
        onClose={() => setIsBriefingModalOpen(false)}
        user={user}
        onOpenAITutor={onOpenAITutor}
        onOpenIdCardModal={onOpenIdCardModal}
        onOpenScheduleModal={() => onOpenScheduleModal()}
        onOpenCalendarModal={onOpenCalendarModal}
        onOpenCampusPulse={onOpenCampusPulse}
      />
    </div>
  );
};
