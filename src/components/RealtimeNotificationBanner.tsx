import React, { useEffect, useState } from 'react';
import { NotificationItem, UserRole } from '../types';

interface RealtimeNotificationBannerProps {
  notification: NotificationItem | null;
  currentUserRole: UserRole;
  onClose: () => void;
  onOpenDrawer: () => void;
  onMarkAsRead?: (id: string) => void;
}

export const RealtimeNotificationBanner: React.FC<RealtimeNotificationBannerProps> = ({
  notification,
  currentUserRole,
  onClose,
  onOpenDrawer,
  onMarkAsRead,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return;

    setProgress(100);
    const interval = 50;
    const duration = 6000;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const getRoleBadge = (role?: UserRole | 'all') => {
    switch (role) {
      case 'teacher':
        return { label: 'อาจารย์', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'admin':
        return { label: 'ผู้ดูแลระบบ', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'parent':
        return { label: 'ผู้ปกครอง', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'student':
        return { label: 'นักเรียน', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: 'ระบบรวม', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const getIcon = (type: NotificationItem['type'], customIcon?: string) => {
    if (customIcon) return customIcon;
    switch (type) {
      case 'assignment':
        return 'assignment';
      case 'grade':
        return 'stars';
      case 'class':
        return 'schedule';
      case 'security':
        return 'security';
      case 'attendance':
        return 'how_to_reg';
      case 'iot':
        return 'sensors';
      case 'payment':
        return 'payments';
      default:
        return 'notifications_active';
    }
  };

  const badge = getRoleBadge(notification.role);

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-96 animate-slideInDown pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden ring-1 ring-black/5 hover:shadow-3xl transition-all">
        {/* Top bar with real-time beacon */}
        <div className="bg-gradient-to-r from-slate-900 to-[#1550d3] px-3.5 py-1.5 flex items-center justify-between text-white text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-wide">การแจ้งเตือนสด (Live Realtime)</span>
          </div>
          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Body content */}
        <div className="p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1550d3]/10 to-[#7857f8]/10 border border-[#1550d3]/20 flex items-center justify-center shrink-0 text-[#1550d3] shadow-xs">
            <span className="material-symbols-outlined text-[22px]">
              {getIcon(notification.type, notification.icon)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-[13px] font-bold text-slate-900 truncate">
                {notification.title}
              </h4>
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                {notification.time}
              </span>
            </div>
            <p className="text-[12px] text-slate-600 mt-1 leading-snug line-clamp-2">
              {notification.message}
            </p>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  if (onMarkAsRead) onMarkAsRead(notification.id);
                  onOpenDrawer();
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-[#1550d3] hover:bg-[#1242b0] text-white text-[11px] font-bold transition-all active:scale-95 shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>เปิดดูการแจ้งเตือน</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>

              <button
                onClick={() => {
                  if (onMarkAsRead) onMarkAsRead(notification.id);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
              >
                รับทราบ
              </button>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>

        {/* Progress bar countdown */}
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-[#1550d3] to-emerald-500 transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
