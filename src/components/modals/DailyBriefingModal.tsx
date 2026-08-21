import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onOpenAITutor?: () => void;
  onOpenIdCardModal?: () => void;
  onOpenScheduleModal?: () => void;
  onOpenCalendarModal?: () => void;
  onOpenCampusPulse?: () => void;
}

const INSPIRATIONAL_QUOTES = {
  student: [
    { text: '“ความพยายามในวันนี้ คือความสำเร็จที่น่าภาคภูมิใจในวันข้างหน้า”', author: 'Nexus Wisdom' },
    { text: '“ทุกคำถามที่คุณถาม คือก้าวหนึ่งของการเติบโตทางปัญญา”', author: 'Albert Einstein' },
    { text: '“การเรียนรู้ไม่ใช่เรื่องของการแข่งขันกับใคร แต่คือการเก่งขึ้นกว่าตัวเราเมื่อวาน”', author: 'Daily Focus' },
    { text: '“จงเชื่อมั่นในศักยภาพของตนเอง เพราะไม่มีขีดจำกัดใดหยุดยั้งความพยายามได้”', author: 'Nexus Inspiration' },
    { text: '“วินัยเล็กๆ ในทุกวัน จะสร้างผลลัพธ์ที่ยิ่งใหญ่ในระยะยาว”', author: 'Growth Mindset' },
  ],
  teacher: [
    { text: '“ครูคือผู้จุดประกายความคิดและเปิดประตูสู่โลกกว้างให้กับผู้เรียน”', author: 'Nexus Educator' },
    { text: '“การสอนที่ดีที่สุดคือการสร้างแรงบันดาลใจให้ผู้เรียนอยากค้นคว้าด้วยตนเอง”', author: 'Daily Inspiration' },
    { text: '“ขอบคุณสำหรับความทุ่มเทและการส่งต่อความรู้ที่ทรงคุณค่าในทุกๆ วัน”', author: 'School Nexus' },
  ],
  admin: [
    { text: '“เสถียรภาพและความปลอดภัยของระบบ คือรากฐานการเรียนรู้ที่ไร้รอยต่อ”', author: 'IT Operations' },
    { text: '“การจัดการที่มีประสิทธิภาพขับเคลื่อนทั้งองค์กรสู่ความเป็นเลิศ”', author: 'Leadership Core' },
  ],
  parent: [
    { text: '“ความรักและความเข้าใจของครอบครัว คือพลังขับเคลื่อนที่ยิ่งใหญ่ที่สุดของลูก”', author: 'Family Warmth' },
    { text: '“ทุกย่างก้าวของการเติบโต เราพร้อมร่วมเคียงข้างและสนับสนุนไปด้วยกัน”', author: 'Nexus Family' },
  ],
};

const MOODS = [
  { id: 'fire', emoji: '🔥', label: 'ไฟแรงเต็มร้อย', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'happy', emoji: '😊', label: 'สดใสพร้อมลุย', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'calm', emoji: '☕', label: 'นิ่งสงบมีสมาธิ', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'focus', emoji: '🎯', label: 'มุ่งมั่นเป้าหมาย', color: 'bg-blue-50 text-blue-600 border-blue-200' },
];

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAITutor,
  onOpenIdCardModal,
  onOpenScheduleModal,
  onOpenCalendarModal,
  onOpenCampusPulse,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<{ greeting: string; icon: string; bgGradient: string }>({
    greeting: 'สวัสดี',
    icon: 'wb_sunny',
    bgGradient: 'from-blue-600 to-indigo-700',
  });

  const quotesList = INSPIRATIONAL_QUOTES[user.role] || INSPIRATIONAL_QUOTES.student;
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [waveCount, setWaveCount] = useState(0);
  const [showWaveCelebration, setShowWaveCelebration] = useState(false);

  // Calculate live clock & time-based greeting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      setCurrentTime(timeStr);
      setCurrentDate(dateStr);

      if (hours >= 5 && hours < 12) {
        setTimePeriod({
          greeting: 'อรุณสวัสดิ์ยามเช้า',
          icon: 'wb_twilight',
          bgGradient: 'from-[#1550d3] via-[#2b7fff] to-[#4facfe]',
        });
      } else if (hours >= 12 && hours < 17) {
        setTimePeriod({
          greeting: 'สวัสดีตอนบ่าย',
          icon: 'wb_sunny',
          bgGradient: 'from-[#0284c7] via-[#2563eb] to-[#4338ca]',
        });
      } else if (hours >= 17 && hours < 21) {
        setTimePeriod({
          greeting: 'สวัสดีตอนเย็น',
          icon: 'wb_twilight',
          bgGradient: 'from-[#4338ca] via-[#6366f1] to-[#a855f7]',
        });
      } else {
        setTimePeriod({
          greeting: 'ราตรีสวัสดิ์ยามค่ำคืน',
          icon: 'bedtime',
          bgGradient: 'from-[#0f172a] via-[#1e1b4b] to-[#312e81]',
        });
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % quotesList.length);
  };

  const handleWaveBack = () => {
    setWaveCount((prev) => prev + 1);
    setShowWaveCelebration(true);
    setTimeout(() => setShowWaveCelebration(false), 2500);
  };

  if (!isOpen) return null;

  const currentQuote = quotesList[quoteIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Background click to close */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Main Modal Card */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header with Dynamic Gradient */}
        <div className={`relative px-6 pt-7 pb-6 bg-gradient-to-r ${timePeriod.bgGradient} text-white shrink-0`}>
          {/* Subtle Ambient Shapes */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 active:scale-95 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10"
            title="ปิดหน้าต่าง"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          {/* Greeting Badge */}
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[12px] font-semibold tracking-wide border border-white/20">
              <span className="material-symbols-outlined text-[16px] animate-pulse">{timePeriod.icon}</span>
              <span>{timePeriod.greeting}</span>
            </div>
            <div className="text-[12px] text-white/80 font-mono">
              {currentTime}
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[24px] sm:text-[26px] font-bold text-white leading-tight flex items-center gap-2">
                สวัสดีครับ, {user.thaiName.split(' ')[0]}
                <button
                  onClick={handleWaveBack}
                  className="inline-block hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                  title="คลิกเพื่อโบกมือทักทาย!"
                >
                  <span className="inline-block animate-bounce text-[26px]">👋</span>
                </button>
              </h2>
              <p className="text-white/85 text-[13px] sm:text-[14px] mt-1 font-light">
                {currentDate} • ยินดีต้อนรับสู่ศูนย์กลางการเรียนรู้ดิจิทัล
              </p>
            </div>
          </div>

          {/* Wave Celebration Banner */}
          {showWaveCelebration && (
            <div className="mt-3 py-1.5 px-3.5 bg-white/20 backdrop-blur-md rounded-xl text-[13px] text-white flex items-center justify-between animate-fadeIn border border-white/30">
              <span className="flex items-center gap-1.5 font-medium">
                <span>✨</span> คุณได้โบกมือทักทายแล้ว {waveCount} ครั้ง! ขอให้เป็นวันที่ยอดเยี่ยม
              </span>
              <span className="text-[12px] bg-white text-[#1550d3] px-2 py-0.5 rounded-full font-bold">
                +1 พลังใจ
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-6 flex flex-col gap-5 text-[#121b2e]">
          
          {/* Section 1: Campus Realtime Atmosphere */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-3 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-blue-600 text-[22px] mb-1">thermostat</span>
              <span className="text-[11px] text-slate-500 font-medium">อุณหภูมิแคมปัส</span>
              <span className="text-[14px] font-bold text-slate-800">28.5°C</span>
              <span className="text-[10px] text-emerald-600 font-medium">แดดอ่อน สบาย</span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-3 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-emerald-600 text-[22px] mb-1">air</span>
              <span className="text-[11px] text-slate-500 font-medium">คุณภาพอากาศ</span>
              <span className="text-[14px] font-bold text-emerald-700">AQI 26</span>
              <span className="text-[10px] text-emerald-600 font-medium">อากาศดีมาก</span>
            </div>

            <div className="bg-purple-50/70 border border-purple-100/80 rounded-2xl p-3 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-purple-600 text-[22px] mb-1">wifi</span>
              <span className="text-[11px] text-slate-500 font-medium">Nexus Wi-Fi 6</span>
              <span className="text-[14px] font-bold text-purple-700">1.2 Gbps</span>
              <span className="text-[10px] text-purple-600 font-medium">สัญญาณเต็ม 100%</span>
            </div>

            <div className="bg-amber-50/70 border border-amber-100/80 rounded-2xl p-3 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-amber-600 text-[22px] mb-1">verified_user</span>
              <span className="text-[11px] text-slate-500 font-medium">ระบบความปลอดภัย</span>
              <span className="text-[14px] font-bold text-amber-700">Active</span>
              <span className="text-[10px] text-amber-600 font-medium">RFID & Face OK</span>
            </div>
          </div>

          {/* Section 2: Daily Inspiration Quote with interactive cycle button */}
          <div className="relative bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold text-[#1550d3] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                ข้อคิดสร้างแรงบันดาลใจประจำวัน
              </span>
              <button
                onClick={handleNextQuote}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-[#1550d3] bg-white hover:bg-blue-50 px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-95"
                title="สุ่มข้อความถัดไป"
              >
                <span className="material-symbols-outlined text-[14px]">casino</span>
                <span>เปลี่ยนข้อคิด</span>
              </button>
            </div>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-700 italic leading-relaxed">
              {currentQuote.text}
            </p>
            <div className="text-right text-[11px] text-slate-400 font-medium mt-1">
              — {currentQuote.author}
            </div>
          </div>

          {/* Section 3: Today's Mood Check-in */}
          <div>
            <span className="text-[12px] font-bold text-slate-700 block mb-2">
              เช็กอินความรู้สึกของคุณวันนี้:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MOODS.map((m) => {
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMood(m.id)}
                    className={`py-2 px-3 rounded-xl border text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? `${m.color} ring-2 ring-blue-500/30 scale-[1.02] shadow-xs font-bold`
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Quick Action Launchers */}
          <div>
            <span className="text-[12px] font-bold text-slate-700 block mb-2">
              ทางลัดด่วนสำหรับวันนี้:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {onOpenAITutor && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAITutor();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 shadow-2xs hover:shadow-xs transition-all text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800">ถาม Nexus AI</div>
                    <div className="text-[11px] text-slate-500">สรุปงาน แผนการเรียน หรือคำถามด่วน</div>
                  </div>
                </button>
              )}

              {onOpenIdCardModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenIdCardModal();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-2xs hover:shadow-xs transition-all text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800">เปิดบัตร Smart ID Card</div>
                    <div className="text-[11px] text-slate-500">สแกน NFC / QR Code ประจำตัว</div>
                  </div>
                </button>
              )}

              {onOpenScheduleModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenScheduleModal();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-2xs hover:shadow-xs transition-all text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800">ดูตารางเรียน/การสอน</div>
                    <div className="text-[11px] text-slate-500">ตรวจสอบวิชาและห้องเรียนวันนี้</div>
                  </div>
                </button>
              )}

              {onOpenCampusPulse && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCampusPulse();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 shadow-2xs hover:shadow-xs transition-all text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-800">Campus Pulse & สถิติ</div>
                    <div className="text-[11px] text-slate-500">ดูอาจารย์และกิจกรรมในสถาบัน</div>
                  </div>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            onClick={handleWaveBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[13px] font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <span>👋</span>
            <span>ส่งแรงใจทักทาย</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1550d3] hover:bg-[#1242b3] text-white text-[13px] font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            เข้าใจแล้ว เริ่มต้นวันใหม่
          </button>
        </div>
      </div>
    </div>
  );
};
