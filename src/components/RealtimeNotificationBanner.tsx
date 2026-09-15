import React, { useEffect, useState } from 'react';
import { NotificationItem, UserRole } from '../types';
import { formatRealtimeNotificationTime } from '../services/firebaseService';

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
    const duration = 6000;
    const startTime = Date.now();

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    const dismissTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(dismissTimer);
    };
  }, [notification?.id, onClose]);

  if (!notification) return null;

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

  return (
    <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[100] max-w-sm w-[calc(100vw-1.5rem)] sm:w-[330px] animate-slideInRightToast pointer-events-auto">
      <div
        onClick={() => {
          if (onMarkAsRead) onMarkAsRead(notification.id);
          onOpenDrawer();
          onClose();
        }}
        className="group relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden transition-all cursor-pointer p-2 sm:p-2.5 flex items-center gap-2.5 ring-1 ring-black/5"
      >
        {/* Compact Icon */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#1550d3]/10 to-[#7857f8]/10 border border-[#1550d3]/20 flex items-center justify-center shrink-0 text-[#1550d3] dark:text-blue-400">
          <span className="material-symbols-outlined text-[17px] sm:text-[19px]">
            {getIcon(notification.type, notification.icon)}
          </span>
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <h4 className="text-[11.5px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {notification.title}
            </h4>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0 ml-auto font-mono">
              {formatRealtimeNotificationTime(notification.timestamp, notification.time)}
            </span>
          </div>
          <p className="text-[10.5px] sm:text-[11px] text-slate-600 dark:text-slate-300 truncate mt-1">
            {notification.message}
          </p>
        </div>

        {/* Inline Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-5 h-5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer text-xs"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>

        {/* Slim countdown bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-[#1550d3] to-emerald-500 transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
