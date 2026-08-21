import React, { useState, useEffect } from 'react';
import { UserProfile, RoomBooking } from '../../types';
import { ASSETS } from '../../data/mockData';
import {
  subscribeToAllUsers,
  pushRealtimeNotification,
  addSystemLogInFirestore,
  getLocalCache,
} from '../../services/firebaseService';

interface AdminDashboardProps {
  user: UserProfile;
  onNavigateTab: (tab: string) => void;
  onOpenDigitalIdModal: () => void;
  onOpenQrScanner: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onNavigateTab,
  onOpenDigitalIdModal,
  onOpenQrScanner,
}) => {
  const [totalUsers, setTotalUsers] = useState<number>(1248);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(412);
  const [studentCount, setStudentCount] = useState<number>(1120);
  const [teacherCount, setTeacherCount] = useState<number>(85);
  const [parentCount, setParentCount] = useState<number>(38);
  const [adminCount, setAdminCount] = useState<number>(5);

  const [emergencyLockdownActive, setEmergencyLockdownActive] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [iotStatus, setIotStatus] = useState<'normal' | 'optimized' | 'standby'>('normal');

  // Broadcast Announcement State
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'students' | 'teachers' | 'parents'>('all');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);

  // Real-time user stats subscription
  useEffect(() => {
    const unsub = subscribeToAllUsers((users) => {
      if (users && users.length > 0) {
        setTotalUsers(users.length);
        setStudentCount(users.filter((u) => u.role === 'student').length);
        setTeacherCount(users.filter((u) => u.role === 'teacher').length);
        setParentCount(users.filter((u) => u.role === 'parent').length);
        setAdminCount(users.filter((u) => u.role === 'admin').length);
        setActiveUsersCount(Math.max(1, Math.round(users.length * 0.82)));
      }
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleEmergencyLockdown = () => {
    const nextState = !emergencyLockdownActive;
    setEmergencyLockdownActive(nextState);
    if (nextState) {
      showToast('⚠️ สั่งล็อกประตูดิจิทัลและเปิดสัญญาณเตือนความปลอดภัยทุกจุดทั่วแคมปัส');
      addSystemLogInFirestore({
        title: 'Emergency Lockdown Activated',
        description: `ผู้ดูแลระบบ ${user.thaiName} สั่งการปิดล็อกฉุกเฉินทั่วโรงเรียน`,
        category: 'security',
        level: 'alert',
        deviceOrGate: 'ALL-GATES-MASTER',
      });
    } else {
      showToast('✅ ปลดล็อกระบบรักษาความปลอดภัย คืนสถานะการทำงานปกติทุกจุด');
      addSystemLogInFirestore({
        title: 'Emergency Lockdown Deactivated',
        description: `ผู้ดูแลระบบ ${user.thaiName} ยกเลิกการล็อกฉุกเฉิน ระบบกลับสู่ปกติ`,
        category: 'security',
        level: 'info',
        deviceOrGate: 'ALL-GATES-MASTER',
      });
    }
  };

  const handleRefreshSystem = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('🔄 ซิงค์สถานะ Cloud Firestore, ประตู RFID และโหนด IoT ทั้งหมดเรียบร้อย');
    }, 1000);
  };

  const handleExportBackupSnapshot = () => {
    try {
      const allUsers = getLocalCache<any[]>('nexus_all_users', []);
      const assignments = getLocalCache<any[]>('assignments', []);
      const roomBookings = getLocalCache<any[]>('roomBookings', []);
      const notifications = getLocalCache<any[]>('notifications', []);

      const backupData = {
        app: 'School Nexus Comprehensive ERP',
        backupTimestamp: new Date().toISOString(),
        exportedBy: {
          name: user.thaiName,
          id: user.id,
          role: user.role,
        },
        collections: {
          users: allUsers,
          assignments,
          roomBookings,
          notifications,
          systemHealth: {
            uptime: '99.98%',
            iotNodes: 42,
            rfidGates: 12,
            activeMode: iotStatus,
          },
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SchoolNexus-Backup-Snapshot-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('📥 ดาวน์โหลดไฟล์ Snapshot ฐานข้อมูล JSON สำเร็จเรียบร้อย');
      addSystemLogInFirestore({
        title: 'Database Backup Exported',
        description: `ผู้ดูแลระบบ ${user.thaiName} ส่งออกไฟล์ Database Snapshot`,
        category: 'system',
        level: 'info',
        deviceOrGate: 'CLOUD-FIRESTORE',
      });
    } catch (err) {
      console.error(err);
      showToast('⚠️ ไม่สามารถดาวน์โหลด Snapshot ได้');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast('กรุณากรอกหัวข้อและข้อความประกาศ');
      return;
    }

    setIsBroadcasting(true);
    try {
      await pushRealtimeNotification({
        title: `📢 ${broadcastTitle.trim()}`,
        message: broadcastMessage.trim(),
        type: 'announcement',
        role: broadcastTarget === 'all' ? 'all' : (broadcastTarget as any),
        priority: 'high',
        icon: 'campaign',
      });

      addSystemLogInFirestore({
        title: `Broadcast Announcement: ${broadcastTitle}`,
        description: `ส่งประกาศถึง ${broadcastTarget === 'all' ? 'ทุกคนในโรงเรียน' : broadcastTarget}`,
        category: 'system',
        level: 'info',
        deviceOrGate: 'CENTRAL-BROADCAST',
      });

      setIsBroadcasting(false);
      setShowBroadcastModal(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      showToast('🚀 ส่งประกาศด่วนแบบเรียลไทม์ถึงผู้ใช้เป้าหมายเรียบร้อยแล้ว');
    } catch (err) {
      setIsBroadcasting(false);
      showToast('เกิดข้อผิดพลาดในการกระจายข้อความ');
    }
  };

  return (
    <div className="flex flex-col w-full relative pb-20 sm:pb-24 pt-5 sm:pt-6 px-4 sm:px-6 max-w-[1280px] mx-auto min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#121b2e] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slideDown">
          <span className="material-symbols-outlined text-[#20C997] text-[18px]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-col gap-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#0d162a] via-[#132347] to-[#1e1b4b] text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-full bg-blue-500/10 blur-3xl pointer-events-none" />
          
          <div className="flex items-start sm:items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0e172a] rounded-[14px] flex items-center justify-center">
                <span className="material-symbols-outlined text-[30px] text-indigo-400">admin_panel_settings</span>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-400/30">
                  SuperAdmin Root Control
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Firebase DB: Online (3ms)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                ศูนย์บัญชาการระบบอัจฉริยะ (Command & Control)
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                ยินดีต้อนรับ {user.thaiName} • รหัสบุคลากร {user.studentId || 'ADM-101'} • สิทธิ์สูงสุด Tier-1
              </p>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="flex items-center gap-2 flex-wrap relative z-10">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">campaign</span>
              <span>ส่งประกาศด่วน (Broadcast)</span>
            </button>

            <button
              onClick={handleRefreshSystem}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>sync</span>
              <span>{isRefreshing ? 'กำลังซิงค์...' : 'รีเฟรชระบบ'}</span>
            </button>

            <button
              onClick={onOpenQrScanner}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
              <span>สแกนตรวจสอบบัตร</span>
            </button>

            <button
              onClick={handleToggleEmergencyLockdown}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                emergencyLockdownActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 animate-pulse'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {emergencyLockdownActive ? 'lock_open' : 'lock'}
              </span>
              <span>{emergencyLockdownActive ? 'ปลดล็อกเหตุฉุกเฉิน' : 'สั่งปิดล็อกทุกประตูฉุกเฉิน'}</span>
            </button>
          </div>
        </div>

        {/* Emergency Banner if active */}
        {emergencyLockdownActive && (
          <div className="p-4 rounded-2xl bg-red-600/10 border-2 border-red-500 text-red-700 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-600 text-[28px]">warning</span>
              <div>
                <div className="font-bold text-sm">ระบบความปลอดภัยสั่งการล็อกประตูอัตโนมัติ (Lockdown Mode Active)</div>
                <div className="text-xs text-red-600/90">สิทธิ์ผ่านประตูจำกัดเฉพาะบัตร Master Security Admin และเจ้าหน้าที่กู้ภัยเท่านั้น</div>
              </div>
            </div>
            <button
              onClick={handleToggleEmergencyLockdown}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 shrink-0 cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        )}

        {/* Top 4 Core Metrics for System Admin */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            onClick={() => onNavigateTab('admin-users')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">บัญชีผู้ใช้ในระบบทั้งหมด</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[18px]">group</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalUsers.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-indigo-600 font-bold">ม.6 ({studentCount})</span>
              <span>•</span>
              <span className="text-purple-600 font-bold">ครู ({teacherCount})</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold">ผู้ปกครอง ({parentCount})</span>
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('campus')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">สถานะโหนด IoT & ประตู</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[18px]">sensors</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600">42 / 42</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>พร้อมทำงาน 100% (HVAC & Door)</span>
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('admin-logs')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">การสแกนผ่านประตูวันนี้</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[18px]">contactless</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">1,894</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 font-bold">สำเร็จ 99.8%</span>
              <span>(แตะผิดจุด 3 ครั้ง)</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">พลังงานแสงอาทิตย์ Solar</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">solar_power</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600">84.5 <span className="text-sm font-semibold text-slate-500">kWh</span></div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1">
              ประหยัดไฟ 32% ของเป้าหมาย
            </div>
          </div>
        </div>

        {/* 2-Column Administrative Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Real-time Infrastructure & Actions */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Quick Administration Hub */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-[22px]">tune</span>
                  <h2 className="font-bold text-slate-900 text-base">แผงควบคุมและงานด่วนของผู้ดูแลระบบ</h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">เข้าถึงฟังก์ชันได้โดยตรง</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => onNavigateTab('admin-users')}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-300 text-left transition-all group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-700">จัดการผู้ใช้ทุกบทบาท</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">นักเรียน, ครู, ผู้ปกครอง, แอดมิน</div>
                </button>

                <button
                  onClick={() => onNavigateTab('campus')}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/80 hover:border-blue-300 text-left transition-all group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">apartment</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">ผังแคมปัส 3D & Digital Twin</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">สถานะห้อง อาคาร และ IoT Node</div>
                </button>

                <button
                  onClick={() => onNavigateTab('admin-logs')}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50/80 border border-slate-200/80 hover:border-purple-300 text-left transition-all group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">security</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-purple-700">บันทึกเหตุการณ์ความปลอดภัย</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Audit Logs & Access History</div>
                </button>

                <button
                  onClick={() => {
                    const next = iotStatus === 'normal' ? 'optimized' : iotStatus === 'optimized' ? 'standby' : 'normal';
                    setIotStatus(next);
                    showToast(`สลับโหมดพลังงานแคมปัสเป็น: ${next === 'optimized' ? 'ประหยัดพลังงานอัจฉริยะ (Eco-IoT)' : next === 'standby' ? 'โหมดเตรียมพร้อมปิดทำการ' : 'โหมดการเรียนการสอนปกติ'}`);
                  }}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 text-left transition-all group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">energy_savings_leaf</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">โหมดพลังงาน: {iotStatus}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">ควบคุม HVAC และแสงสว่างอัตโนมัติ</div>
                </button>

                <button
                  onClick={onOpenDigitalIdModal}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200/80 hover:border-amber-300 text-left transition-all group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-amber-700">บัตรผู้ดูแล Master NFC</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">รหัส {user.rfidCard} สิทธิ์ Master</div>
                </button>

                <button
                  onClick={handleExportBackupSnapshot}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50/80 border border-slate-200/80 hover:border-rose-300 text-left transition-all group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">cloud_download</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-rose-700">สำรองฐานข้อมูล Snapshot</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">ดาวน์โหลด JSON Real-time Backup</div>
                </button>
              </div>
            </div>

            {/* Live Access Gate Stream */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[22px]">nest_doorbell_visitor</span>
                  <h2 className="font-bold text-slate-900 text-base">การแตะบัตรผ่านประตูอัตโนมัติ (Live Gate Traffic)</h2>
                </div>
                <button
                  onClick={() => onNavigateTab('admin-logs')}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  ดูทั้งหมด
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  { name: 'วรวุฒิ เพ็ชรระยา', role: 'นักเรียน ม.6/1', gate: 'Main Gate 01 (RFID)', time: '07:48:12', status: 'ผ่านสำเร็จ' },
                  { name: 'อ. กิตติพงษ์ เลิศพิริยะ', role: 'อาจารย์กลุ่มสาระฯ วิทย์', gate: 'Faculty Room 401', time: '07:25:04', status: 'ผ่านสำเร็จ' },
                  { name: 'พิชชา ศิริพร', role: 'นักเรียน ม.6/1', gate: 'Main Gate 01 (RFID)', time: '07:48:50', status: 'ผ่านสำเร็จ' },
                  { name: 'นายสมบัติ เพ็ชรระยา', role: 'ผู้ปกครอง', gate: 'Visitor Gate (Security)', time: '08:10:15', status: 'ผ่านสำเร็จ' },
                  { name: 'ไม่ทราบรหัสบัตร (Tag Unknown)', role: 'บุคคลภายนอก', gate: 'Server Data Center', time: '06:40:02', status: 'ปฏิเสธการเข้า (Denied)' },
                ].map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        item.status.includes('ปฏิเสธ') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        <span className="material-symbols-outlined text-[18px]">
                          {item.status.includes('ปฏิเสธ') ? 'block' : 'check'}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500">{item.role} • {item.gate}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`font-semibold text-[11px] ${
                        item.status.includes('ปฏิเสธ') ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {item.status}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.time} น.</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Server Health, Security & Admin Spec */}
          <div className="flex flex-col gap-6">
            
            {/* Server & Database Health Widget */}
            <div className="bg-gradient-to-br from-slate-900 to-[#121c33] text-white p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col gap-4 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400 text-[20px]">dns</span>
                  <span className="font-bold text-sm">School Nexus Core Server</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Uptime 99.98%
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>CPU Core Load</span>
                    <span className="font-mono text-indigo-300">18.4%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[18.4%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>RAM Memory Allocation</span>
                    <span className="font-mono text-purple-300">2.4 / 8.0 GB</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full w-[30%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Cloud Firestore Quota Usage</span>
                    <span className="font-mono text-emerald-300">1.2% (Healthy)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[12%]" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-[11px] text-slate-300 flex items-start gap-2 mt-1">
                <span className="material-symbols-outlined text-indigo-400 text-[16px] shrink-0 mt-0.5">verified_user</span>
                <span>ระบบเข้ารหัส AES-256 เชื่อมโยงกับ Google Cloud Datacenter ในภูมิภาค asia-east1</span>
              </div>
            </div>

            {/* Role Access Control Breakdown */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">admin_panel_settings</span>
                <h3 className="font-bold text-slate-900 text-sm">การกระจายสิทธิ์ในระบบ (RBAC Matrix)</h3>
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">school</span>
                    <span className="font-bold text-blue-950">นักเรียน (Students)</span>
                  </div>
                  <span className="font-mono font-bold text-blue-700">{studentCount} บัญชี</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/70 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600 text-[18px]">badge</span>
                    <span className="font-bold text-purple-950">อาจารย์ (Teachers)</span>
                  </div>
                  <span className="font-mono font-bold text-purple-700">{teacherCount} บัญชี</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">family_restroom</span>
                    <span className="font-bold text-emerald-950">ผู้ปกครอง (Parents)</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">{parentCount} บัญชี</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 border border-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-800 text-[18px]">admin_panel_settings</span>
                    <span className="font-bold text-slate-950">ผู้ดูแลระบบ (SuperAdmin)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{adminCount} บัญชี</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Broadcast Announcement Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-blue-300">campaign</span>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">กระจายประกาศด่วน (Live Broadcast)</h3>
                  <p className="text-xs text-blue-200">ส่งแจ้งเตือนแบบ Real-time Push สู่ทุกคนในแอปพลิเคชัน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendBroadcast} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">กลุ่มผู้รับเป้าหมาย</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'all', label: 'ทุกคนในระบบ', icon: 'groups' },
                    { id: 'students', label: 'นักเรียน', icon: 'school' },
                    { id: 'teachers', label: 'อาจารย์', icon: 'badge' },
                    { id: 'parents', label: 'ผู้ปกครอง', icon: 'family_restroom' },
                  ].map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => setBroadcastTarget(target.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        broadcastTarget === target.id
                          ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{target.icon}</span>
                      <span className="text-[11px]">{target.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">หัวข้อประกาศด่วน *</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="เช่น แจ้งกำหนดการกิจกรรมวันวิชาการ หรือ แจ้งเตือนเหตุด่วน"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">รายละเอียดข้อความ *</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={4}
                  placeholder="ระบุข้อความประกาศที่ต้องการส่งตรงถึงหน้าจอผู้ใช้..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                  required
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-blue-600 shrink-0 mt-0.5">info</span>
                <span>ประกาศนี้จะถูกส่งขึ้นระบบ Cloud Firestore และแสดงเป็นแบนเนอร์แจ้งเตือนเด้งสดทันทีบนหน้าจอของผู้ใช้ทุกคน</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting || !broadcastTitle.trim() || !broadcastMessage.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-base ${isBroadcasting ? 'animate-spin' : ''}`}>
                    {isBroadcasting ? 'sync' : 'send'}
                  </span>
                  <span>{isBroadcasting ? 'กำลังส่งประกาศ...' : 'ส่งประกาศทันที'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
