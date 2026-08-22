import React from 'react';
import { ASSETS } from '../data/mockData';
import { UserProfile } from '../types';

interface HeaderProps {
  currentTab?: string;
  user: UserProfile;
  unreadNotificationsCount: number;
  isOffline?: boolean;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenAITutor?: () => void;
  onSyncComplete?: (syncedCount: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  unreadNotificationsCount,
  isOffline = !navigator.onLine,
  onOpenSearch,
  onOpenNotifications,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 inset-x-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-[#e8ecf3] shadow-xs">
      <div className="w-full max-w-[1280px] mx-auto h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 gap-2">
        {/* Logo and App Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-xs border border-slate-100/80 shrink-0">
            <img
              src={ASSETS.logo}
              alt="School Nexus Logo"
              referrerPolicy="no-referrer"
              className="h-full w-full object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== ASSETS.fallbackLogo) {
                  target.src = ASSETS.fallbackLogo;
                }
              }}
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="font-bold text-[15px] sm:text-[18px] text-[#121b2e] tracking-tight whitespace-nowrap">
              School Nexus
            </span>
            <span
              className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                user.role === 'admin'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : user.role === 'parent'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : user.role === 'teacher'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-[#00694d] border-emerald-200'
              }`}
            >
              {user.role === 'admin'
                ? 'ผู้ดูแลระบบ'
                : user.role === 'parent'
                ? 'ผู้ปกครอง'
                : user.role === 'teacher'
                ? 'อาจารย์'
                : 'นักเรียน'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={onOpenSearch}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-[#434654] hover:text-[#1550d3] hover:bg-[#1550d3]/5 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="ค้นหา"
            aria-label="Search"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">search</span>
          </button>

          <button
            onClick={onOpenNotifications}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-[#434654] hover:text-[#1550d3] hover:bg-[#1550d3]/5 active:scale-95 transition-all relative shrink-0 cursor-pointer"
            title="การแจ้งเตือน"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">notifications</span>
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          <button
            onClick={onOpenProfile}
            className="relative ml-0.5 active:scale-95 transition-transform group shrink-0 cursor-pointer"
            title={isOffline ? "สถานะ: ออฟไลน์ (Offline)" : "สถานะ: ออนไลน์ (Online)"}
            aria-label="Profile"
          >
            <img
              src={user.avatar || ASSETS.headerAvatar}
              alt={user.name}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-[#dce1ff] shadow-sm hover:ring-[#1550d3] transition-all"
            />
            {/* Online (Green) / Offline (Red) Status Indicator */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white transition-colors duration-300 ${
                isOffline
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                  : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
