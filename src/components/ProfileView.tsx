import React, { useState, useEffect } from 'react';
import { ASSETS, DEMO_PRESET_USERS } from '../data/mockData';
import { UserProfile, UserRole } from '../types';
import {
  CARD_THEMES,
  GuillochePatternSvg,
  SmartChipSvg,
  HologramEmblemSvg,
  ContactlessWaveSvg,
} from './common/SmartIdCardGraphics';

interface ProfileViewProps {
  user: UserProfile;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isOffline?: boolean;
  onUpdateUser?: (updated: UserProfile) => void;
  onSwitchRole: (role: UserRole) => void;
  onSignOut: () => void;
  onLockScreen?: () => void;
  onOpenQrScanner: () => void;
  onOpenGpaModal: () => void;
  onOpenShareId?: () => void;
  onOpenIdCardModal?: () => void;
  onOpenInstallApp?: () => void;
  onOpenChangePhoto?: () => void;
  onOpenEditProfile?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  theme = 'light',
  onToggleTheme,
  isOffline = !navigator.onLine,
  onUpdateUser,
  onSwitchRole,
  onSignOut,
  onLockScreen,
  onOpenQrScanner,
  onOpenGpaModal,
  onOpenShareId,
  onOpenIdCardModal,
  onOpenInstallApp,
  onOpenChangePhoto,
  onOpenEditProfile,
}) => {
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [nfcFastCheckIn, setNfcFastCheckIn] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="flex flex-col w-full relative pb-20 sm:pb-24 pt-5 sm:pt-6 px-4 sm:px-6 max-w-[1280px] mx-auto min-h-screen">
      <div className="flex flex-col gap-6 sm:gap-8">
        {/* Title Header */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-[26px] sm:text-[32px] font-bold text-[#121b2e] leading-tight">
              Profile & Digital ID
            </h1>
            <p className="text-[#434654] text-[15px]">
              ข้อมูลส่วนตัวและบัตรประจำตัวดิจิทัล
            </p>
          </div>
        </div>

        {/* User Profile Header Card with Direct Photo Upload */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Profile Avatar with Camera Click Overlay & Live Status Dot */}
            <div
              onClick={onOpenChangePhoto}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-blue-50 shadow-md shrink-0 cursor-pointer group bg-slate-100"
              title="คลิกเพื่อเปลี่ยนรูปภาพโปรไฟล์"
            >
              <img
                src={user.avatar || ASSETS.cardAvatar}
                alt={user.name}
                className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-200"
              />
              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                <span className="text-[10px] font-bold mt-0.5">เปลี่ยนรูป</span>
              </div>
              
              {/* Online (Green) / Offline (Red) Status Indicator Dot on Avatar */}
              <div
                className={`absolute top-2 left-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-colors duration-300 ${
                  isOffline
                    ? 'bg-rose-500 ring-2 ring-rose-300/60 shadow-rose-500/50'
                    : 'bg-emerald-500 ring-2 ring-emerald-300/60 shadow-emerald-500/50'
                }`}
                title={isOffline ? 'สถานะ: ออฟไลน์ (Offline)' : 'สถานะ: ออนไลน์ (Online)'}
              />

              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#1550d3] text-white flex items-center justify-center shadow-md ring-2 ring-white">
                <span className="material-symbols-outlined text-[13px]">photo_camera</span>
              </div>
            </div>

            {/* User Info Details */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#1550d3] text-[11px] font-bold tracking-wide border border-blue-100">
                  {user.role === 'student'
                    ? 'STUDENT ACCOUNT'
                    : user.role === 'teacher'
                    ? 'TEACHER ACCOUNT'
                    : user.role === 'admin'
                    ? 'ADMIN ACCOUNT'
                    : 'PARENT ACCOUNT'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  ID: {user.studentId}
                </span>

                {/* Dynamic Status Badge (Online: Green / Offline: Red) */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border transition-all duration-300 ${
                    isOffline
                      ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                  }`}
                  title={isOffline ? 'กำลังทำงานในโหมดออฟไลน์' : 'เชื่อมต่อเซิร์ฟเวอร์แบบเรียลไทม์'}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      isOffline ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <span>{isOffline ? 'ออฟไลน์ (Offline)' : 'ออนไลน์ (Online)'}</span>
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#121b2e] leading-tight">
                {user.name}
              </h2>
              <p className="text-sm font-semibold text-slate-600">
                {user.thaiName}
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">sync</span>
                <span className="text-emerald-700 font-medium">รูปโปรไฟล์จะซิงค์แสดงผลบนบัตรดิจิทัลโดยอัตโนมัติ</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Edit Profile & Change Photo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
            {onOpenEditProfile && (
              <button
                type="button"
                onClick={onOpenEditProfile}
                className="py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-[#1550d3] border border-slate-200 hover:border-blue-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px] text-[#1550d3]">edit_square</span>
                <span>แก้ไขข้อมูลโปรไฟล์</span>
              </button>
            )}

            {onOpenChangePhoto && (
              <button
                type="button"
                onClick={onOpenChangePhoto}
                className="py-2.5 px-4 sm:px-5 rounded-2xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px]">account_circle</span>
                <span>เปลี่ยนรูปภาพ</span>
              </button>
            )}
          </div>
        </section>

        {/* 3D Flippable Digital Identity Smart Card */}
        <div className="perspective-1000 w-full max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#1550d3]">badge</span>
              บัตรประจำตัวดิจิทัล (Smart Digital ID)
            </span>
            <button
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className="px-3 py-1.5 rounded-xl bg-white text-[#1550d3] border border-blue-200 text-xs font-semibold shadow-xs flex items-center gap-1.5 hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">3d_rotation</span>
              <span>{isCardFlipped ? 'ดูหน้าบัตร' : 'พลิกหลังบัตร'}</span>
            </button>
          </div>
          {(() => {
            const cardThemeCfg = CARD_THEMES[user.cardTheme || 'obsidian-gold'] || CARD_THEMES['obsidian-gold'];
            return (
              <div
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="relative w-full h-[260px] sm:h-[275px] card-flip-smooth cursor-pointer select-none"
                style={{
                  transformStyle: 'preserve-3d',
                  WebkitTransformStyle: 'preserve-3d',
                  transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  WebkitTransform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front of Card */}
                <div
                  className={`absolute inset-0 w-full h-full bg-gradient-to-br ${cardThemeCfg.bgGradient} rounded-[24px] p-5 sm:p-6 text-white shadow-2xl flex flex-col justify-between border ${cardThemeCfg.borderColor} overflow-hidden`}
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)',
                    WebkitTransform: 'rotateY(0deg)',
                    pointerEvents: isCardFlipped ? 'none' : 'auto',
                    zIndex: isCardFlipped ? 0 : 20,
                  }}
                >
                  <GuillochePatternSvg themeId={user.cardTheme || 'obsidian-gold'} opacity={0.20} />
                  <HologramEmblemSvg themeId={user.cardTheme || 'obsidian-gold'} />

                  <div
                    className={`absolute top-0 right-0 w-60 h-60 ${cardThemeCfg.accentGlow} rounded-full mix-blend-screen filter blur-[75px] opacity-35 pointer-events-none`}
                  />
                  <div className="absolute bottom-0 left-0 w-44 h-44 bg-[#1550d3]/20 rounded-full mix-blend-screen filter blur-[60px] opacity-25 pointer-events-none" />

                  <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-amber-400/60 p-0.5 bg-white/10 backdrop-blur-md shadow-lg shrink-0">
                        <img
                          src={user.avatar || ASSETS.cardAvatar}
                          alt={user.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-[16px] sm:text-[18px] tracking-tight uppercase leading-tight">
                          {user.name}
                        </h3>
                        <div className={`text-[12px] ${cardThemeCfg.textColor} font-medium`}>
                          {user.thaiName}
                        </div>
                        <div className="text-[11px] text-white/70 mt-0.5 font-mono">
                          {user.role === 'student' && `ID: ${user.studentId} • ${user.grade || 'ม.6/1'}`}
                          {user.role === 'teacher' && `รหัสบุคลากร: ${user.studentId} • ${user.position || 'อาจารย์ชำนาญการพิเศษ'}`}
                          {user.role === 'admin' && `รหัสผู้ดูแล: ${user.studentId} • ${user.position || 'ผู้ดูแลระบบไอที'}`}
                          {user.role === 'parent' && `รหัสผู้ปกครอง: ${user.studentId} • ${user.childName ? `ผู้ปกครองของ ${user.childName}` : 'ผู้ปกครอง'}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <SmartChipSvg size={34} isGold={cardThemeCfg.goldOrSilver === 'gold'} />
                      <span className="text-[9px] font-mono font-bold tracking-widest text-white/60">
                        NFC
                      </span>
                    </div>
                  </div>

                  {/* Middle Section */}
                  <div className="relative z-10 bg-black/35 rounded-xl p-3 border border-white/10 flex justify-between items-center backdrop-blur-md shadow-inner">
                    <div>
                      <div className="text-[10px] text-white/60 uppercase tracking-wider">
                        {user.role === 'student' && 'ระดับชั้น / ห้องเรียน'}
                        {user.role === 'teacher' && 'ตำแหน่งหน้าที่'}
                        {user.role === 'admin' && 'ตำแหน่งหน้าที่'}
                        {user.role === 'parent' && 'นักเรียนในความดูแล'}
                      </div>
                      <div className="text-[13px] font-bold text-white truncate max-w-[200px]">
                        {user.role === 'student' && (user.grade || 'มัธยมศึกษาปีที่ 6/1')}
                        {user.role === 'teacher' && (user.position || 'อาจารย์ชำนาญการพิเศษ')}
                        {user.role === 'admin' && (user.position || 'ผู้ดูแลระบบไอทีและเครือข่าย')}
                        {user.role === 'parent' && (user.childName || 'วรวุฒิ เพ็ชรระยา (ม.6/1)')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-white/60 uppercase tracking-wider">
                        {user.role === 'student' && 'สถานะนักเรียน'}
                        {user.role === 'teacher' && 'กลุ่มสาระฯ / สังกัด'}
                        {user.role === 'admin' && 'ฝ่าย / สังกัด'}
                        {user.role === 'parent' && 'สถานะการยืนยัน'}
                      </div>
                      <div className="text-[13px] font-bold flex items-center justify-end">
                        {user.role === 'student' && (
                          <span className="text-[#67fcc6]">
                            {user.dutyStatus || 'กำลังศึกษา (Active)'}
                          </span>
                        )}
                        {user.role === 'teacher' && (
                          <span className="text-white truncate max-w-[150px]">
                            {user.department || 'วิทยาศาสตร์และเทคโนโลยี'}
                          </span>
                        )}
                        {user.role === 'admin' && (
                          <span className="text-white truncate max-w-[150px]">
                            {user.department || 'ศูนย์เทคโนโลยีสารสนเทศ'}
                          </span>
                        )}
                        {user.role === 'parent' && (
                          <span className="text-[#67fcc6]">
                            {user.dutyStatus || 'ยืนยันตัวตนแล้ว'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Card Controls */}
                  <div className="relative z-10 flex justify-between items-center text-[11px] text-white/70 border-t border-white/10 pt-2">
                    <div
                      className="flex items-center gap-1.5 font-semibold"
                      style={{ color: cardThemeCfg.accentColor }}
                    >
                      <span className="material-symbols-outlined text-[16px]">touch_app</span>
                      <span>แตะเพื่อพลิกดูบาร์โค้ด & เวลาตรวจสอบ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ContactlessWaveSvg color={cardThemeCfg.accentColor} />
                    </div>
                  </div>
                </div>

                {/* Back of Card */}
                <div
                  className={`absolute inset-0 w-full h-full bg-gradient-to-br ${cardThemeCfg.bgGradient} rounded-[24px] p-5 sm:p-6 text-white shadow-2xl flex flex-col justify-between border ${cardThemeCfg.borderColor} overflow-hidden`}
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    WebkitTransform: 'rotateY(180deg)',
                    pointerEvents: isCardFlipped ? 'auto' : 'none',
                    zIndex: isCardFlipped ? 20 : 0,
                  }}
                >
                  <GuillochePatternSvg themeId={user.cardTheme || 'obsidian-gold'} opacity={0.16} />

                  <div className="flex justify-between items-center border-b border-white/10 pb-2 relative z-10">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#20C997] animate-pulse"></span>
                      <span className="text-[11px] font-bold tracking-wider text-white/90 uppercase">
                        ACTIVE DIGITAL PASS
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#67fcc6] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>{formattedTime} น.</span>
                    </span>
                  </div>

                  {/* Simulated Barcode */}
                  <div className="bg-white rounded-xl p-3 flex flex-col items-center justify-center text-black shadow-inner relative z-10">
                    <div className="h-10 w-full flex items-center justify-center gap-1">
                      {[4, 2, 6, 1, 8, 3, 5, 2, 7, 3, 5, 2, 8, 4, 2, 6, 1, 9, 3, 2, 7, 4, 5, 3].map(
                        (w, i) => (
                          <div
                            key={i}
                            className="bg-black h-full rounded-xs"
                            style={{ width: `${w * 1.5}px` }}
                          />
                        )
                      )}
                    </div>
                    <span className="font-mono text-[12px] font-bold mt-1 tracking-widest">
                      *{user.studentId}*
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-white/70 pt-1 relative z-10">
                    <div>
                      RFID:{' '}
                      <span
                        className="font-mono font-bold"
                        style={{ color: cardThemeCfg.accentColor }}
                      >
                        {user.rfidCard}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQrScanner();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#1550d3] hover:bg-[#1a53d6] active:scale-95 text-[11px] font-semibold flex items-center gap-1 text-white shadow-xs transition-all cursor-pointer border border-blue-400/40"
                      title="สลับไปกล้องสแกน QR (Re-scan)"
                    >
                      <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
                      <span>Re-scan</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick ID Actions under Card */}
          <div className="flex flex-wrap gap-2.5 mt-3">
            {onOpenShareId && (
              <button
                type="button"
                onClick={onOpenShareId}
                className="flex-1 min-w-[130px] py-2.5 px-3 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">qr_code_2</span>
                <span>แชร์ QR บัตร</span>
              </button>
            )}
            {onOpenIdCardModal && (
              <button
                type="button"
                onClick={onOpenIdCardModal}
                className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-200 shadow-xs active:scale-98 transition-all cursor-pointer"
                title="เปลี่ยนลายบัตรและดูลูกเล่น 3D"
              >
                <span className="material-symbols-outlined text-[17px] text-amber-600">palette</span>
                <span>เลือกลายบัตร</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenQrScanner}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">qr_code_scanner</span>
              <span>กล้องสแกน QR</span>
            </button>
          </div>
        </div>

        {/* Role-Specific Profile Details (Academic for Student, Professional/Contact for Others) */}
        {user.role === 'student' ? (
          <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-4">
            <h3 className="font-bold text-[17px] text-[#121b2e] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1550d3]">school</span>
                ข้อมูลการศึกษา
              </span>
              <button
                onClick={onOpenGpaModal}
                className="text-xs font-semibold text-[#1550d3] hover:underline cursor-pointer"
              >
                ดูใบบันทึกผลการเรียน ➔
              </button>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">เกรดเฉลี่ย (GPAX)</div>
                <div className="text-[18px] font-bold text-[#1550d3]">{user.gpa || '3.92'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">ชั้นเรียน</div>
                <div className="text-[15px] font-bold text-[#121b2e]">{user.room || 'ห้อง 601'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">อีเมลสถานศึกษา</div>
                <div className="text-[13px] font-semibold text-[#121b2e] truncate">
                  {user.email}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">อาจารย์ที่ปรึกษา</div>
                <div className="text-[13px] font-semibold text-[#121b2e] truncate">
                  {user.advisor || 'ดร. สมนึก เจริญศิลป์'}
                </div>
              </div>
            </div>
          </section>
        ) : user.role === 'teacher' ? (
          <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-4">
            <h3 className="font-bold text-[17px] text-[#121b2e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1550d3]">badge</span>
              ข้อมูลบุคลากรทางการศึกษา
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">ตำแหน่ง</div>
                <div className="text-[14px] font-bold text-[#1550d3] truncate">
                  {user.position || 'อาจารย์ชำนาญการ'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">กลุ่มสาระฯ / ภาควิชา</div>
                <div className="text-[13px] font-bold text-[#121b2e] truncate">
                  {user.department || 'วิทยาการคำนวณและ AI'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">ห้องพักอาจารย์</div>
                <div className="text-[13px] font-semibold text-[#121b2e] truncate">
                  {user.officeRoom || 'ห้อง 401 อาคาร 4'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">อีเมลประจำสถาบัน</div>
                <div className="text-[13px] font-semibold text-[#121b2e] truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </section>
        ) : user.role === 'admin' ? (
          <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-4">
            <h3 className="font-bold text-[17px] text-[#121b2e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#5f3add]">admin_panel_settings</span>
              ข้อมูลผู้ดูแลระบบดิจิทัลแคมปัส
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">ตำแหน่ง</div>
                <div className="text-[14px] font-bold text-[#5f3add] truncate">
                  {user.position || 'IT & Campus Operations'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">หน่วยงาน</div>
                <div className="text-[13px] font-bold text-[#121b2e] truncate">
                  {user.department || 'ศูนย์เทคโนโลยีดิจิทัล'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">ห้องควบคุมแม่ข่าย</div>
                <div className="text-[13px] font-semibold text-[#121b2e] truncate">
                  {user.officeRoom || 'Server Room อาคาร 1'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">อีเมลผู้ดูแล</div>
                <div className="text-[13px] font-semibold text-[#121b2e] truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-4">
            <h3 className="font-bold text-[17px] text-[#121b2e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00694d]">family_restroom</span>
              ข้อมูลผู้ปกครอง
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">นักเรียนในความดูแล</div>
                <div className="text-[14px] font-bold text-[#00694d] truncate">
                  {user.childName || 'วรวุฒิ เพ็ชรระยา'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">สถานะบทบาท</div>
                <div className="text-[13px] font-bold text-[#121b2e] truncate">
                  {user.position || 'ผู้ปกครองนักเรียน'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">สมาคม / องค์กร</div>
                <div className="text-[13px] font-semibold text-[#121b2e] truncate">
                  {user.department || 'สมาคมผู้ปกครองและครู'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#f1f3ff]">
                <div className="text-[11px] text-[#737686] font-semibold">อีเมลติดต่อ</div>
                <div className="text-[13px] font-semibold text-[#121b2e] truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Mobile App & Cross-Platform Center */}
        <section className="bg-gradient-to-br from-[#0c1527] to-[#1550d3] rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-blue-950/20 border border-blue-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <span className="material-symbols-outlined text-amber-300 text-lg">phone_iphone</span>
                </span>
                <h3 className="font-bold text-[16px] text-white">ติดตั้งแอปบนมือถือ (Android & iOS)</h3>
              </div>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                ติดตั้งเป็นแอปเต็มรูปแบบบนหน้าจอสมาร์ตโฟน เปิดใช้งานได้ทันที มีระบบแคชออฟไลน์ และสแกนบัตรนักเรียนได้รวดเร็ว
              </p>
            </div>
            {onOpenInstallApp && (
              <button
                type="button"
                onClick={onOpenInstallApp}
                className="py-2.5 px-5 rounded-xl bg-white text-[#0c1527] hover:bg-blue-50 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-blue-600">download</span>
                <span>เปิดศูนย์ติดตั้งแอป</span>
              </button>
            )}
          </div>
        </section>

        {/* App Settings */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-3.5">
          <h3 className="font-bold text-[17px] text-[#121b2e] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1550d3]">settings</span>
            การตั้งค่าแอปพลิเคชัน
          </h3>

          <div className="flex flex-col divide-y divide-slate-100 text-sm">
            {/* Theme Toggle (Light / Dark Mode) */}
            <div className="flex justify-between items-center py-3">
              <div>
                <div className="font-semibold text-[#121b2e] flex items-center gap-1.5">
                  <span>ธีมการแสดงผล (Appearance)</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    {theme === 'dark' ? 'โหมดมืด (Dark)' : 'โหมดสว่าง (Light)'}
                  </span>
                </div>
                <div className="text-xs text-[#737686]">
                  สลับโหมดสว่างหรือโหมดมืดเพื่อความสบายตาและประหยัดพลังงาน
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={theme === 'dark'}
                onClick={onToggleTheme}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1550d3] active:scale-95 ${
                  theme === 'dark' ? 'bg-indigo-600' : 'bg-amber-400'
                }`}
                title={theme === 'dark' ? 'กำลังใช้โหมดมืด (คลิกเพื่อเปลี่ยนเป็นโหมดสว่าง)' : 'กำลังใช้โหมดสว่าง (คลิกเพื่อเปลี่ยนเป็นโหมดมืด)'}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    theme === 'dark' ? 'translate-x-5 text-indigo-900' : 'translate-x-0 text-amber-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                  </span>
                </span>
              </button>
            </div>

            <div className="flex justify-between items-center py-3">
              <div>
                <div className="font-semibold text-[#121b2e]">การแจ้งเตือนแบบพุช</div>
                <div className="text-xs text-[#737686]">เตือนคาบเรียน การบ้าน และคะแนนสอบ</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notificationsEnabled}
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1550d3] active:scale-95 ${
                  notificationsEnabled ? 'bg-[#1550d3]' : 'bg-slate-300'
                }`}
                title={notificationsEnabled ? 'เปิดอยู่ (คลิกเพื่อปิด)' : 'ปิดอยู่ (คลิกเพื่อเปิด)'}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-between items-center py-3">
              <div>
                <div className="font-semibold text-[#121b2e]">NFC / RFID Fast Check-in</div>
                <div className="text-xs text-[#737686]">แตะโทรศัพท์เพื่อเช็กชื่อเข้าห้องเรียน</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={nfcFastCheckIn}
                onClick={() => setNfcFastCheckIn(!nfcFastCheckIn)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1550d3] active:scale-95 ${
                  nfcFastCheckIn ? 'bg-[#1550d3]' : 'bg-slate-300'
                }`}
                title={nfcFastCheckIn ? 'เปิดอยู่ (คลิกเพื่อปิด)' : 'ปิดอยู่ (คลิกเพื่อเปิด)'}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    nfcFastCheckIn ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <div className="font-semibold text-[#121b2e] flex items-center gap-1.5">
                  <span>ระบบล็อกอัตโนมัติ (Auto-Lock Security)</span>
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">verified_user</span>
                </div>
                <div className="text-xs text-[#737686]">ล็อกเซสชันอัตโนมัติเมื่อไม่มีการใช้งาน 15 นาที เพื่อความปลอดภัย</div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>15 นาที (Active)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
            {onLockScreen && (
              <button
                type="button"
                onClick={onLockScreen}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors flex items-center justify-center gap-2 border border-slate-200 cursor-pointer active:scale-98"
                title="ล็อกหน้าจอทันทีเมื่อไม่ได้อยู่หน้าเครื่อง"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-700">lock</span>
                <span>ล็อกหน้าจอทันที (Lock Screen)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSignOut}
              className={`py-3 px-4 rounded-xl bg-red-50 text-[#ba1a1a] hover:bg-red-100 font-semibold text-sm transition-colors flex items-center justify-center gap-2 border border-red-200 cursor-pointer active:scale-98 ${
                !onLockScreen ? 'w-full sm:col-span-2' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>ออกจากระบบ (Sign Out)</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
