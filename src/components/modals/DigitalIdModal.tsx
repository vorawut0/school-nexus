import React, { useState, useEffect } from 'react';
import { ASSETS } from '../../data/mockData';
import { UserProfile } from '../../types';
import {
  CARD_THEMES,
  CardThemeId,
  GuillochePatternSvg,
  SmartChipSvg,
  HologramEmblemSvg,
  ContactlessWaveSvg,
} from '../common/SmartIdCardGraphics';
import { saveUserProfile } from '../../services/firebaseService';

interface DigitalIdModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner: () => void;
  onOpenShareId?: () => void;
  onUpdateTheme?: (theme: CardThemeId) => void;
}

export const DigitalIdModal: React.FC<DigitalIdModalProps> = ({
  user,
  isOpen,
  onClose,
  onOpenScanner,
  onOpenShareId,
  onUpdateTheme,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>(
    user.cardTheme || 'obsidian-gold'
  );
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [nfcBeep, setNfcBeep] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update live digital pass time every second
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentThemeConfig = CARD_THEMES[selectedTheme] || CARD_THEMES['obsidian-gold'];

  const formattedTime = currentDateTime.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentDateTime.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleFlipCard = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Haptic vibration feedback trigger
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([30, 40, 30]);
      } catch {
        // Ignore
      }
    }
    setIsFlipped((prev) => !prev);
  };

  const handleSelectTheme = (themeId: CardThemeId) => {
    setSelectedTheme(themeId);
    if (onUpdateTheme) {
      onUpdateTheme(themeId);
    }
    // Save to Firestore
    saveUserProfile({
      ...user,
      cardTheme: themeId,
    });
    setToastMessage(`เปลี่ยนลายบัตรเป็น: ${CARD_THEMES[themeId].thaiName}`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSimulateNfc = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNfcBeep(true);
    setTimeout(() => setNfcBeep(false), 1500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#121b2e] text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-amber-400/40 animate-slideDown">
          <span className="material-symbols-outlined text-amber-400 text-[18px]">palette</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[32px] max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-5 sm:p-6 animate-scaleIn relative my-auto"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1550d3] to-[#7857f8] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#121b2e] leading-tight">
                บัตรประจำตัวดิจิทัล (Smart Digital ID)
              </h3>
              <p className="text-[11px] text-[#737686]">แตะที่บัตรเพื่อพลิกดูด้านหน้า-หลัง</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างบัตร"
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-all cursor-pointer border border-slate-200/80 active:scale-95 shadow-xs"
            title="ปิดหน้าต่าง (Esc)"
          >
            <span className="text-xs font-bold hidden sm:inline">ปิด</span>
            <span className="material-symbols-outlined text-[18px] font-bold">close</span>
          </button>
        </div>

        {/* Theme Selector Strip */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase px-1 shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">palette</span>
            <span>เลือกลายบัตร:</span>
          </span>
          {(Object.keys(CARD_THEMES) as CardThemeId[]).map((tId) => {
            const cfg = CARD_THEMES[tId];
            const isSelected = selectedTheme === tId;
            return (
              <button
                key={tId}
                onClick={() => handleSelectTheme(tId)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#121b2e] text-white border-amber-400 shadow-xs ring-2 ring-amber-400/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                }`}
                title={cfg.name}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cfg.accentColor }}
                />
                <span>{cfg.thaiName}</span>
              </button>
            );
          })}
        </div>

        {/* 3D Flippable Card Stage */}
        <div
          onClick={handleFlipCard}
          className="relative w-full h-[280px] sm:h-[295px] cursor-pointer perspective-1000 mb-4 select-none group"
          title="แตะเพื่อพลิกหน้า-หลัง"
        >
          <div
            className="w-full h-full card-flip-smooth relative"
            style={{
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* ------------------------------------------------------------- */}
            {/* FRONT SIDE (TEXTURED WITH GUILLOCHE & GOLD FOIL ACCENTS) */}
            {/* ------------------------------------------------------------- */}
            <div
              className={`absolute inset-0 w-full h-full bg-gradient-to-br ${currentThemeConfig.bgGradient} rounded-[26px] p-5 sm:p-6 text-white shadow-2xl flex flex-col justify-between border ${currentThemeConfig.borderColor} overflow-hidden`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)',
                WebkitTransform: 'rotateY(0deg)',
                pointerEvents: isFlipped ? 'none' : 'auto',
                zIndex: isFlipped ? 0 : 20,
              }}
            >
              {/* Guilloche Security Mesh Pattern */}
              <GuillochePatternSvg themeId={selectedTheme} opacity={0.22} />

              {/* Shimmering Holographic Seal Watermark */}
              <HologramEmblemSvg themeId={selectedTheme} />

              {/* Ambient Glows */}
              <div
                className={`absolute top-0 right-0 w-60 h-60 ${currentThemeConfig.accentGlow} rounded-full mix-blend-screen filter blur-[70px] opacity-40 pointer-events-none`}
              />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#1550d3]/20 rounded-full mix-blend-screen filter blur-[60px] opacity-35 pointer-events-none" />

              {/* Micro-text Security Ribbon at Top Edge */}
              <div className="relative z-10 -mx-6 -mt-3 px-6 py-0.5 bg-black/40 border-b border-white/10 flex justify-between items-center text-[8px] font-mono tracking-wider text-white/50 uppercase">
                <span>SCHOOL NEXUS OFFICIAL IDENTITY CREDENTIAL</span>
                <span>ACADEMIC YEAR 2026</span>
              </div>

              {/* Card Header (Photo, Chip & School Info) */}
              <div className="relative z-10 flex justify-between items-start pt-1">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={user.avatar || ASSETS.cardAvatar}
                      alt={user.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-amber-400/60 shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#20C997] ring-2 ring-[#12141a] flex items-center justify-center shadow-xs">
                      <span className="material-symbols-outlined text-[10px] text-white font-bold">
                        verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-white/60 tracking-wider uppercase block">
                      {user.role === 'student'
                        ? 'STUDENT DIGITAL IDENTITY'
                        : user.role === 'teacher'
                        ? 'FACULTY DIGITAL IDENTITY'
                        : user.role === 'parent'
                        ? 'GUARDIAN DIGITAL IDENTITY'
                        : 'ADMINISTRATOR IDENTITY'}
                    </span>
                    <h4 className="font-bold text-base sm:text-[18px] text-white leading-tight">
                      {user.name}
                    </h4>
                    <p className={`text-xs ${currentThemeConfig.textColor} font-medium`}>
                      {user.thaiName}
                    </p>
                  </div>
                </div>

                {/* EMV Smart Chip & Contactless Indicator */}
                <div className="flex flex-col items-end gap-1.5">
                  <SmartChipSvg size={38} isGold={currentThemeConfig.goldOrSilver === 'gold'} />
                  <div className="flex items-center gap-1">
                    <ContactlessWaveSvg color={currentThemeConfig.accentColor} />
                    <span className="text-[9px] font-mono font-bold tracking-widest text-white/60">
                      NFC
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Middle Info Grid with Glassmorphic Texture */}
              <div className="relative z-10 grid grid-cols-3 gap-2 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-xs shadow-inner">
                <div>
                  <span className="text-[10px] text-white/50 block">
                    {user.role === 'student'
                      ? 'รหัสนักเรียน'
                      : user.role === 'teacher'
                      ? 'รหัสบุคลากร'
                      : user.role === 'admin'
                      ? 'รหัสผู้ดูแล'
                      : 'รหัสผู้ปกครอง'}
                  </span>
                  <span
                    className="font-mono font-bold text-sm tracking-wide"
                    style={{ color: currentThemeConfig.accentColor }}
                  >
                    {user.studentId}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-white/50 block">
                    {user.role === 'student'
                      ? 'ระดับชั้น / ห้อง'
                      : user.role === 'teacher'
                      ? 'ตำแหน่ง'
                      : user.role === 'admin'
                      ? 'ตำแหน่ง / หน้าที่'
                      : 'ผู้ปกครองของ'}
                  </span>
                  <span className="font-semibold text-white truncate block">
                    {user.role === 'student' && (user.grade || 'ม.6/1')}
                    {user.role === 'teacher' && (user.position || 'อาจารย์ชำนาญการพิเศษ')}
                    {user.role === 'admin' && (user.position || 'ผู้ดูแลระบบไอทีและเครือข่าย')}
                    {user.role === 'parent' && (user.childName || 'วรวุฒิ เพ็ชรระยา')}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-white/50 block">
                    {user.role === 'student'
                      ? 'สถานะนักเรียน'
                      : user.role === 'teacher'
                      ? 'กลุ่มสาระฯ / สังกัด'
                      : user.role === 'admin'
                      ? 'ฝ่าย / สังกัด'
                      : 'สถานะการยืนยัน'}
                  </span>
                  <span
                    className={`font-bold truncate block ${
                      user.role === 'student' ? 'text-[#67fcc6]' : 'text-white'
                    }`}
                  >
                    {user.role === 'student' && (user.dutyStatus || 'กำลังศึกษา (Active)')}
                    {user.role === 'teacher' && (user.department || 'วิทยาศาสตร์และเทคโนโลยี')}
                    {user.role === 'admin' && (user.department || 'ศูนย์เทคโนโลยีสารสนเทศ')}
                    {user.role === 'parent' && (user.dutyStatus || 'ยืนยันตัวตนแล้ว')}
                  </span>
                </div>
              </div>

              {/* Card Footer Bar */}
              <div className="relative z-10 flex justify-between items-center pt-2 border-t border-white/10 text-[11px]">
                <div className="flex items-center gap-1.5 text-white/70">
                  <span className="material-symbols-outlined text-[15px] text-emerald-400">
                    verified_user
                  </span>
                  <span>
                    {formattedDate} {formattedTime}
                  </span>
                </div>

                <div
                  className="flex items-center gap-1 font-semibold transition-colors"
                  style={{ color: currentThemeConfig.accentColor }}
                >
                  <span className="material-symbols-outlined text-[14px]">3d_rotation</span>
                  <span>แตะเพื่อดู QR โค้ด</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* BACK SIDE (WITH BARCODE, QR CODE & NFC SIMULATION) */}
            {/* ------------------------------------------------------------- */}
            <div
              className={`absolute inset-0 w-full h-full bg-gradient-to-br ${currentThemeConfig.bgGradient} rounded-[26px] p-5 sm:p-6 text-white shadow-2xl flex flex-col justify-between border ${currentThemeConfig.borderColor} overflow-hidden`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                WebkitTransform: 'rotateY(180deg)',
                pointerEvents: isFlipped ? 'auto' : 'none',
                zIndex: isFlipped ? 20 : 0,
              }}
            >
              {/* Guilloche Background on Back */}
              <GuillochePatternSvg themeId={selectedTheme} opacity={0.16} />

              {/* Magnetic Stripe on Back */}
              <div className="relative z-10 -mx-6 -mt-3 h-8 bg-black/80 border-b border-white/10 flex items-center px-6">
                <span className="text-[9px] font-mono text-white/30 tracking-widest">
                  ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
                </span>
              </div>

              <div className="flex justify-between items-center pb-1 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-400 text-[18px]">
                    qr_code_2
                  </span>
                  <span className="text-xs font-bold text-white">QR ยืนยันตัวตนดิจิทัล (OFFICIAL QR)</span>
                </div>
                <span className="text-[10px] text-white/60 font-mono">SN-{user.studentId}</span>
              </div>

              <div className="flex items-center justify-between gap-3.5 my-auto relative z-10">
                <div className="p-2 bg-white rounded-2xl shadow-inner flex items-center justify-center shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=https://schoolnexus.ac.th/verify/student/${user.studentId}&color=12-27-46`}
                    alt="Student QR Code"
                    className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-1.5 text-xs text-slate-300">
                  {user.role === 'student' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/50">เกรดเฉลี่ย (GPAX):</span>
                        <span className="font-bold text-emerald-400">
                          {user.gpa?.toFixed(2) || '3.92'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">อาจารย์ที่ปรึกษา:</span>
                        <span className="truncate text-white/90">{user.advisor || 'ดร. สมนึก เจริญศิลป์'}</span>
                      </div>
                    </>
                  )}

                  {user.role === 'teacher' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/50">กลุ่มสาระฯ:</span>
                        <span className="font-bold text-white truncate max-w-[130px]">
                          {user.department || 'วิทยาศาสตร์และเทคโนโลยี'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">ห้องพักอาจารย์:</span>
                        <span className="truncate text-white/90">{user.officeRoom || 'ห้องพักครู 401'}</span>
                      </div>
                    </>
                  )}

                  {user.role === 'admin' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/50">ฝ่ายงาน:</span>
                        <span className="font-bold text-white truncate max-w-[130px]">
                          {user.department || 'ศูนย์เทคโนโลยีสารสนเทศ'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">ห้องปฏิบัติการ:</span>
                        <span className="truncate text-white/90">{user.officeRoom || 'Server Room'}</span>
                      </div>
                    </>
                  )}

                  {user.role === 'parent' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/50">นักเรียนในความดูแล:</span>
                        <span className="font-bold text-white truncate max-w-[130px]">
                          {user.childName || 'วรวุฒิ เพ็ชรระยา'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">สังกัด:</span>
                        <span className="truncate text-white/90">{user.department || 'สมาคมผู้ปกครองและครู'}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between">
                    <span className="text-white/50">RFID Card:</span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: currentThemeConfig.accentColor }}
                    >
                      {user.rfidCard || 'NFC-SN-8849-2026'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateNfc}
                    className="mt-1 py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/20 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[15px] text-amber-400">
                      {nfcBeep ? 'check_circle' : 'contactless'}
                    </span>
                    <span>{nfcBeep ? 'แตะ NFC ติดแล้ว! ✓' : 'จำลองแตะ NFC ประตูโรงเรียน'}</span>
                  </button>
                </div>
              </div>

              {/* Security Barcode & Footer */}
              <div className="flex justify-between items-center pt-2 border-t border-white/10 text-[11px] text-white/60 relative z-10">
                <span className="font-mono text-[10px]">AUTH: SN-SEC-2026-X99</span>
                <div
                  className="flex items-center gap-1 font-semibold"
                  style={{ color: currentThemeConfig.accentColor }}
                >
                  <span className="material-symbols-outlined text-[14px]">sync</span>
                  <span>แตะเพื่อพลิกกลับ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Close Buttons */}
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="py-3 bg-[#1550d3] hover:bg-[#1a53d6] text-white font-semibold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              <span>เปิดกล้องสแกน</span>
            </button>

            {onOpenShareId && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShareId();
                }}
                className="py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-98 transition-all"
                title="แชร์ QR บัตรประจำตัวสำหรับให้ผู้อื่นสแกน"
              >
                <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                <span>แชร์ ID QR</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleFlipCard}
              className="py-3 bg-slate-100 text-[#121b2e] hover:bg-slate-200 font-semibold rounded-2xl text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 transition-all border border-slate-200"
            >
              <span className="material-symbols-outlined text-[18px]">3d_rotation</span>
              <span>{isFlipped ? 'ดูหน้าบัตร' : 'พลิกหลังบัตร'}</span>
            </button>
          </div>

          {/* Full-width Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            <span>ปิดหน้าต่างบัตรประจำตัว (Exit)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
