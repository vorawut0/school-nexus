import React from 'react';
import { UserRole } from '../types';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingTasksCount?: number;
  userRole?: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  pendingTasksCount = 0,
  userRole = 'student',
}) => {
  let tabs = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: 'dashboard' },
    { id: 'campus', label: 'แคมปัส', icon: 'school' },
    { id: 'learning', label: 'การเรียน', icon: 'menu_book' },
    { id: 'assignments', label: 'การบ้าน', icon: 'assignment', badge: pendingTasksCount },
    { id: 'profile', label: 'โปรไฟล์', icon: 'account_circle' },
  ];

  if (userRole === 'teacher') {
    tabs = [
      { id: 'dashboard', label: 'ภาพรวมสอน', icon: 'analytics' },
      { id: 'teacher-classes', label: 'ห้องเรียน', icon: 'co_present' },
      { id: 'teacher-attendance', label: 'เช็กชื่อคาบ', icon: 'fact_check' },
      { id: 'teacher-grading', label: 'ตรวจงาน', icon: 'rate_review', badge: 2 },
      { id: 'profile', label: 'ข้อมูลอาจารย์', icon: 'badge' },
    ];
  } else if (userRole === 'admin') {
    tabs = [
      { id: 'dashboard', label: 'ศูนย์บัญชาการ', icon: 'space_dashboard' },
      { id: 'admin-users', label: 'จัดการผู้ใช้', icon: 'manage_accounts' },
      { id: 'campus', label: 'ระบบ IoT', icon: 'sensors' },
      { id: 'admin-logs', label: 'ความปลอดภัย', icon: 'security' },
      { id: 'profile', label: 'สิทธิ์ผู้ดูแล', icon: 'shield_person' },
    ];
  } else if (userRole === 'parent') {
    tabs = [
      { id: 'dashboard', label: 'ภาพรวมบุตร', icon: 'dashboard' },
      { id: 'parent-attendance', label: 'การเข้าเรียน', icon: 'how_to_reg' },
      { id: 'parent-wallet', label: 'บัตร & ค่าอาหาร', icon: 'account_balance_wallet' },
      { id: 'parent-tasks', label: 'ติดตามการบ้าน', icon: 'fact_check', badge: 1 },
      { id: 'profile', label: 'โปรไฟล์', icon: 'account_circle' },
    ];
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 w-full bg-white/95 backdrop-blur-xl border-t border-[#e8ecf3] shadow-[0_-4px_20px_rgba(23,32,51,0.04)] pb-safe">
      <div className="w-full max-w-[720px] mx-auto h-16 sm:h-18 flex justify-around items-center px-2 sm:px-4">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 w-14 sm:w-16 h-14 rounded-xl transition-all duration-200 relative cursor-pointer ${
                isActive
                  ? 'text-[#1550d3] bg-[#1550d3]/10 font-semibold scale-105 shadow-sm'
                  : 'text-[#434654] hover:text-[#1550d3] hover:bg-[#1550d3]/5 active:scale-95'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className={`material-symbols-outlined text-[23px] transition-transform ${
                    isActive ? 'fill-1 scale-110' : ''
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 600" } : undefined}
                >
                  {tab.icon}
                </span>

                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 bg-[#ba1a1a] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium leading-none tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
