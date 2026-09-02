import React, { useState, useEffect } from 'react';
import { NotificationItem, UserRole } from '../../types';
import { formatRealtimeNotificationTime } from '../../services/firebaseService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  currentUserRole?: UserRole;
  onMarkAllAsRead: () => void;
  onMarkAsRead?: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  onClearNotifications: () => void;
  onTriggerSimulatedNotification?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  currentUserRole = 'student',
  onMarkAllAsRead,
  onMarkAsRead,
  onDeleteNotification,
  onClearNotifications,
  onTriggerSimulatedNotification,
}) => {
  const [filterRole, setFilterRole] = useState<'all' | 'my_role' | 'unread'>('all');
  const [browserPushEnabled, setBrowserPushEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [, setClockTick] = useState(0);

  // Live timer ticker to refresh dynamic elapsed times every 5 seconds
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setClockTick((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserPushEnabled(permission === 'granted');
      if (permission === 'granted') {
        new Notification('School Nexus Real-time Notifications', {
          body: 'เปิดการแจ้งเตือนแบบเรียลไทม์สำเร็จ พร้อมรับข่าวสารและอัปเดตทันที!',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleTriggerTest = async () => {
    if (onTriggerSimulatedNotification) {
      setIsSimulating(true);
      await onTriggerSimulatedNotification();
      setTimeout(() => setIsSimulating(false), 800);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((item) => {
    if (filterRole === 'unread') return !item.read;
    if (filterRole === 'my_role') {
      return !item.role || item.role === 'all' || item.role === currentUserRole;
    }
    return true;
  });

  const getRoleBadge = (role?: UserRole | 'all') => {
    switch (role) {
      case 'teacher':
        return { label: 'อาจารย์', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'admin':
        return { label: 'ผู้ดูแลระบบ', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'parent':
        return { label: 'ผู้ปกครอง', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'student':
        return { label: 'นักเรียน', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: 'ทั่วไป', color: 'bg-slate-100 text-slate-600 border-slate-200' };
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
        return 'notifications';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slideLeft border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-[#f9f9ff]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1550d3]/10 text-[#1550d3] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#121b2e] flex items-center gap-2">
                  <span>การแจ้งเตือนเรียลไทม์</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  เชื่อมต่อ Firestore Live Listener เรียบร้อย
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Close notifications"
            >
              ✕
            </button>
          </div>

          {/* Quick Simulation Action Bar */}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleTriggerTest}
              disabled={isSimulating}
              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#1550d3] to-[#2b7fff] text-white text-[12px] font-bold shadow-xs hover:shadow hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] ${isSimulating ? 'animate-spin' : ''}`}>
                {isSimulating ? 'sync' : 'bolt'}
              </span>
              <span>{isSimulating ? 'กำลังส่งข้อมูล...' : 'ส่งแจ้งเตือนสดทดสอบ (Live Push)'}</span>
            </button>

            {!browserPushEnabled && typeof window !== 'undefined' && 'Notification' in window && (
              <button
                onClick={handleRequestPushPermission}
                className="py-1.5 px-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                title="เปิดการแจ้งเตือนบนเบราว์เซอร์"
              >
                <span className="material-symbols-outlined text-[15px] text-amber-600">notifications_paused</span>
                <span className="hidden sm:inline">เปิด Web Push</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/60">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filterRole === 'all'
                  ? 'bg-[#1550d3] text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              ทั้งหมด ({notifications.length})
            </button>

            <button
              onClick={() => setFilterRole('my_role')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                filterRole === 'my_role'
                  ? 'bg-[#1550d3] text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              เฉพาะบทบาทฉัน
            </button>

            <button
              onClick={() => setFilterRole('unread')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterRole === 'unread'
                  ? 'bg-[#1550d3] text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>ยังไม่อ่าน</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-black">
                {notifications.filter((n) => !n.read).length}
              </span>
            </button>
          </div>
        </div>

        {/* Action toolbar */}
        <div className="flex justify-between items-center px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={onMarkAllAsRead}
            className="text-[#1550d3] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">done_all</span>
            <span>อ่านทั้งหมดแล้ว</span>
          </button>
          <button
            onClick={onClearNotifications}
            className="text-slate-500 hover:text-red-600 cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
            <span>ล้างการแจ้งเตือน</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">
                notifications_off
              </span>
              <p className="text-sm font-medium">ไม่มีการแจ้งเตือนใหม่ในหมวดนี้</p>
              <p className="text-xs text-slate-400 mt-1">
                คลิกปุ่ม &quot;ส่งแจ้งเตือนสดทดสอบ&quot; เพื่อทดสอบระบบเรียลไทม์ได้ทันที
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const badge = getRoleBadge(item.role);
              return (
                <div
                  key={item.id}
                  className={`p-4 flex gap-3 transition-colors relative group ${
                    !item.read ? 'bg-[#1550d3]/5 font-medium' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0 text-[#1550d3]">
                    <span className="material-symbols-outlined text-[20px]">
                      {getIcon(item.type, item.icon)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-[13px] font-bold text-[#121b2e] leading-snug">
                          {item.title}
                        </h4>
                        {item.role && item.role !== 'all' && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${badge.color}`}>
                            {badge.label}
                          </span>
                        )}
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-[#1550d3]" />
                        )}
                      </div>
                      <span className="text-[11px] text-[#737686] shrink-0 ml-2 font-medium">
                        {formatRealtimeNotificationTime(item.timestamp, item.time)}
                      </span>
                    </div>

                    <p className="text-xs text-[#434654] mt-1 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Quick action buttons */}
                    <div className="mt-2 flex items-center gap-2">
                      {!item.read && onMarkAsRead && (
                        <button
                          onClick={() => onMarkAsRead(item.id)}
                          className="text-[11px] text-[#1550d3] hover:underline font-semibold cursor-pointer"
                        >
                          ทำเครื่องหมายว่าอ่านแล้ว
                        </button>
                      )}
                      {onDeleteNotification && (
                        <button
                          onClick={() => onDeleteNotification(item.id)}
                          className="text-[11px] text-slate-400 hover:text-red-600 font-semibold cursor-pointer ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ลบ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
