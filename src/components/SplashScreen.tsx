import React, { useEffect, useState } from 'react';
import { ASSETS } from '../data/mockData';

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDuration = 550,
}) => {
  const [progress, setProgress] = useState(35);
  const [statusText, setStatusText] = useState('กำลังเชื่อมต่อระบบ School Nexus...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [logoImgError, setLogoImgError] = useState(false);

  const handleInstantSkip = () => {
    setIsFadingOut(true);
    if (onFinish) onFinish();
  };

  useEffect(() => {
    // Stage 1: Initializing fast
    const timer1 = setTimeout(() => {
      setProgress(65);
      setStatusText('โหลดข้อมูลดิจิทัล & ตารางเรียน...');
    }, 120);

    // Stage 2: Connecting
    const timer2 = setTimeout(() => {
      setProgress(90);
      setStatusText('เชื่อมต่อ Firebase & Smart Campus...');
    }, 280);

    // Stage 3: Ready
    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('ระบบพร้อมเข้าใช้งาน');
    }, 450);

    // Stage 4: Fade out and finish
    const timer4 = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 200);
    }, minDuration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [minDuration, onFinish]);

  return (
    <div
      onClick={handleInstantSkip}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-gradient-to-b from-[#0a1120] via-[#0c172e] to-[#12234e] text-white p-6 transition-all duration-250 select-none cursor-pointer ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)',
      }}
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#1550d3]/25 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-72 h-72 bg-[#5f3add]/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

      {/* Top security/version badge */}
      <div className="relative z-10 flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] text-slate-300 font-medium tracking-wide">
        <span className="w-2 h-2 rounded-full bg-[#20C997] animate-pulse" />
        <span>SCHOOL NEXUS OS • v2.6 SMART CAMPUS</span>
      </div>

      {/* Center: Official School Logo & Branding */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-4">
        {/* Animated Emblem / Logo container */}
        <div className="relative mb-6 group">
          {/* Glowing ring animation */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#1550d3] via-[#38bdf8] to-[#5f3add] rounded-3xl blur-xl opacity-55 animate-pulse" />
          
          {/* Logo Container */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] bg-gradient-to-br from-[#0c1527] via-[#102554] to-[#1550d3] p-1.5 shadow-2xl border border-white/25 flex items-center justify-center overflow-hidden">
            {!logoImgError && ASSETS.logo ? (
              <img
                src={ASSETS.logo}
                alt="School Nexus Logo"
                className="w-full h-full object-cover rounded-[22px]"
                onError={() => setLogoImgError(true)}
              />
            ) : (
              <svg
                viewBox="0 0 512 512"
                className="w-full h-full p-1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="splashGradGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ca8a04" />
                  </linearGradient>
                  <linearGradient id="splashGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                </defs>

                <circle
                  cx="256"
                  cy="256"
                  r="190"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="2.5"
                  strokeDasharray="10 8"
                />
                <circle
                  cx="256"
                  cy="256"
                  r="230"
                  fill="none"
                  stroke="rgba(56,189,248,0.2)"
                  strokeWidth="2"
                />

                {/* Graduation Cap */}
                <g>
                  <path
                    d="M 256 120 L 416 195 L 256 270 L 96 195 Z"
                    fill="url(#splashGradCyan)"
                    stroke="#ffffff"
                    strokeWidth="6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 160 238 L 160 300 C 160 340 352 340 352 300 L 352 238"
                    fill="#0e234e"
                    stroke="url(#splashGradCyan)"
                    strokeWidth="5"
                  />
                  <path
                    d="M 256 195 Q 380 210 395 285"
                    fill="none"
                    stroke="url(#splashGradGold)"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <circle cx="395" cy="290" r="11" fill="url(#splashGradGold)" />
                </g>

                {/* Smart Digital Pass Card shape */}
                <g transform="translate(256, 380)">
                  <rect
                    x="-100"
                    y="-45"
                    width="200"
                    height="90"
                    rx="18"
                    fill="#ffffff"
                    fillOpacity="0.95"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                  />
                  <rect
                    x="-82"
                    y="-22"
                    width="40"
                    height="44"
                    rx="7"
                    fill="url(#splashGradGold)"
                  />
                  <line
                    x1="-30"
                    y1="-14"
                    x2="65"
                    y2="-14"
                    stroke="#0f172a"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <line
                    x1="-30"
                    y1="2"
                    x2="40"
                    y2="2"
                    stroke="#64748b"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="-30"
                    y1="16"
                    x2="75"
                    y2="16"
                    stroke="#0284c7"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                  />
                  <circle cx="70" cy="-22" r="5" fill="#22c55e" />
                </g>
              </svg>
            )}
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span>SCHOOL</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#60a5fa] to-[#a78bfa]">
            NEXUS
          </span>
        </h1>
        <p className="text-xs sm:text-sm font-semibold tracking-widest text-slate-300 uppercase mt-1">
          Smart Campus & Learning Hub
        </p>
        <p className="text-[12px] text-slate-400 mt-2 font-normal">
          ระบบบริหารจัดการโรงเรียนอัจฉริยะและการเรียนรู้ดิจิทัล
        </p>
      </div>

      {/* Bottom: Progress Bar and Status */}
      <div className="relative z-10 w-full max-w-xs flex flex-col items-center gap-3">
        {/* Progress bar */}
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-[#38bdf8] via-[#1550d3] to-[#7857f8] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Message */}
        <div className="flex items-center justify-between w-full text-[11px] text-slate-400">
          <span className="truncate pr-2">{statusText}</span>
          <span className="font-mono font-bold text-cyan-400">{progress}%</span>
        </div>

        {/* Skip button for instant entry */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleInstantSkip();
          }}
          className="mt-1 text-[11px] text-slate-300 hover:text-white px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>เข้าสู่ระบบทันที</span>
          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
        </button>

        {/* Offline indicator if applicable */}
        {!navigator.onLine && (
          <div className="text-[10px] text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/30">
            <span className="material-symbols-outlined text-[12px]">cloud_off</span>
            <span>โหมดออฟไลน์: กำลังโหลดข้อมูลแคชในอุปกรณ์</span>
          </div>
        )}
      </div>
    </div>
  );
};

