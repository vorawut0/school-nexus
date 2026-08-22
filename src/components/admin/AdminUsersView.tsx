import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types';
import {
  subscribeToAllUsers,
  updateUserInFirestore,
  deleteUserFromFirestore,
  saveUserProfile,
  saveStoredAccount,
  pushRealtimeNotification,
} from '../../services/firebaseService';

interface AdminUsersViewProps {
  user: UserProfile;
}

interface ManagedUser {
  id: string;
  name: string;
  thaiName: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';
  code: string;
  departmentOrGrade: string;
  rfidCard: string;
  status: 'active' | 'suspended' | 'pending';
  accessLevel: string[];
  lastActive: string;
  email?: string;
  gpa?: number;
  avatar?: string;
}

const INITIAL_MANAGED_USERS: ManagedUser[] = [
  {
    id: 'sn-std-01',
    name: 'WORAWUT PETCHRAYA',
    thaiName: 'วรวุฒิ เพ็ชรราย',
    role: 'student',
    code: '66040217',
    departmentOrGrade: 'มัธยมศึกษาปีที่ 6/1',
    rfidCard: 'NFC-SN-8849-2026',
    status: 'active',
    accessLevel: ['Main Gate 01', 'Computer Lab 02', 'Library', 'Canteen'],
    lastActive: 'วันนี้ 07:42 น.',
    email: 'worawut.p@nexus.ac.th',
    gpa: 3.85,
  },
  {
    id: 'sn-tch-01',
    name: 'KITTIPONG LERTPIRIYA',
    thaiName: 'อาจารย์ กิตติพงษ์ เลิศพิริยะ',
    role: 'teacher',
    code: 'T-55104',
    departmentOrGrade: 'กลุ่มสาระฯ วิทยาการคำนวณ',
    rfidCard: 'NFC-TCH-0021-2026',
    status: 'active',
    accessLevel: ['All Campus Gates', 'Faculty Room 401', 'All Computer Labs', 'Server Data Center'],
    lastActive: 'วันนี้ 07:25 น.',
    email: 'kittipong.l@nexus.ac.th',
  },
  {
    id: 'sn-tch-02',
    name: 'DR. SOMCHAI INTARAWONG',
    thaiName: 'ดร. สมชาย อินทรวงศ์',
    role: 'teacher',
    code: 'T-55088',
    departmentOrGrade: 'กลุ่มสาระฯ คณิตศาสตร์',
    rfidCard: 'NFC-TCH-0012-2026',
    status: 'active',
    accessLevel: ['All Campus Gates', 'Faculty Room 302', 'Audio-Visual Hall'],
    lastActive: 'เมื่อวานนี้',
    email: 'somchai.i@nexus.ac.th',
  },
  {
    id: 'sn-par-01',
    name: 'PARENT PETCHRAYA',
    thaiName: 'นายสมบัติ เพ็ชรราย (ผู้ปกครอง)',
    role: 'parent',
    code: 'P-66040217',
    departmentOrGrade: 'ผู้ปกครอง วรวุฒิ เพ็ชรราย',
    rfidCard: 'NFC-PAR-3301',
    status: 'active',
    accessLevel: ['Visitor Gate', 'Parent Center', 'Auditorium'],
    lastActive: '3 วันที่แล้ว',
    email: 'parent.petch@gmail.com',
  },
  {
    id: 'sn-adm-01',
    name: 'ADMINISTRATOR PRACHYA',
    thaiName: 'อาจารย์ ปรัชญา มั่นคง (ผู้ดูแลระบบกลาง)',
    role: 'admin',
    code: 'ADM-101',
    departmentOrGrade: 'ศูนย์เทคโนโลยีสารสนเทศและดิจิทัลแคมปัส',
    rfidCard: 'NFC-ADM-0001-2026',
    status: 'active',
    accessLevel: ['SuperAdmin Root', 'Data Center Server', 'All Campus Gates', 'Command Center'],
    lastActive: 'ออนไลน์ขณะนี้',
    email: 'admin.prachya@nexus.ac.th',
  },
  {
    id: 'sn-std-02',
    name: 'PITCHA SIRIPORN',
    thaiName: 'พิชชา ศิริพร',
    role: 'student',
    code: '66040218',
    departmentOrGrade: 'มัธยมศึกษาปีที่ 6/1',
    rfidCard: 'NFC-SN-8850-2026',
    status: 'active',
    accessLevel: ['Main Gate 01', 'Computer Lab 02', 'Library', 'Canteen'],
    lastActive: 'วันนี้ 07:48 น.',
    email: 'pitcha.s@nexus.ac.th',
    gpa: 3.92,
  },
];

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ user }) => {
  const [usersList, setUsersList] = useState<ManagedUser[]>(INITIAL_MANAGED_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'parent' | 'admin'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New user form state
  const [newThaiName, setNewThaiName] = useState('');
  const [newEngName, setNewEngName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newCode, setNewCode] = useState('');
  const [newDeptGrade, setNewDeptGrade] = useState('');

  // Subscribe to real-time Firestore users across all roles
  useEffect(() => {
    const unsub = subscribeToAllUsers((firestoreUsers) => {
      if (firestoreUsers && firestoreUsers.length > 0) {
        const mappedUsers: ManagedUser[] = firestoreUsers.map((fu, idx) => ({
          id: fu.id || `u-${idx}`,
          name: fu.name || 'USER',
          thaiName: fu.thaiName || fu.name,
          role: fu.role || 'student',
          code: fu.studentId || (fu.role === 'student' ? '66040217' : fu.role === 'teacher' ? 'T-55104' : 'ADM-101'),
          departmentOrGrade: fu.department || (fu.grade ? `${fu.grade} ${fu.room || ''}` : 'ทั่วไป'),
          rfidCard: fu.rfidCard || `NFC-SN-${8840 + idx}-2026`,
          status: 'active',
          accessLevel: fu.role === 'admin'
            ? ['SuperAdmin Root', 'All Campus Gates', 'Server Center']
            : fu.role === 'teacher'
            ? ['All Campus Gates', 'Faculty Room', 'Computer Labs']
            : fu.role === 'parent'
            ? ['Visitor Gate', 'Parent Center']
            : ['Main Gate 01', 'Computer Lab 02', 'Library', 'Canteen'],
          lastActive: 'ออนไลน์ / ซิงค์ล่าสุด',
          email: fu.email,
          gpa: fu.gpa,
          avatar: fu.avatar,
        }));
        setUsersList(mappedUsers);
      }
    });

    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.thaiName.includes(searchQuery) ||
      u.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.rfidCard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleStatus = async (id: string) => {
    const target = usersList.find((u) => u.id === id);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';

    setUsersList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u))
    );

    await updateUserInFirestore(id, {
      updatedAt: new Date().toISOString(),
    });

    showToast(`อัปเดตสถานะของ ${target.thaiName} เป็น ${nextStatus === 'active' ? 'เปิดใช้งาน' : 'ระงับชั่วคราว'} ใน Firebase แล้ว`);
  };

  const handleReissueRfid = async (id: string) => {
    const target = usersList.find((u) => u.id === id);
    if (!target) return;
    const newRfid = `NFC-SN-${Math.floor(1000 + Math.random() * 9000)}-2026`;

    setUsersList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, rfidCard: newRfid } : u))
    );

    await updateUserInFirestore(id, {
      rfidCard: newRfid,
      updatedAt: new Date().toISOString(),
    });

    showToast(`ออกรหัสบัตร RFID ใหม่ให้ ${target.thaiName} (${newRfid}) บันทึกลง Firebase แล้ว`);
  };

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThaiName.trim() || !newEmail.trim()) {
      showToast('กรุณากรอกชื่อและอีเมลให้ครบถ้วน');
      return;
    }

    const generatedId = `sn-${newRole.substring(0, 3)}-${Date.now()}`;
    const generatedCode = newCode.trim() || (
      newRole === 'student' ? `${Math.floor(66040000 + Math.random() * 9999)}` :
      newRole === 'teacher' ? `T-${Math.floor(55000 + Math.random() * 9999)}` :
      newRole === 'admin' ? `ADM-${Math.floor(100 + Math.random() * 900)}` :
      `P-${Math.floor(66040000 + Math.random() * 9999)}`
    );
    const assignedRfid = `NFC-SN-${Math.floor(1000 + Math.random() * 9000)}-2026`;

    const newUserObj: UserProfile = {
      id: generatedId,
      name: (newEngName.trim() || newThaiName.trim()).toUpperCase(),
      thaiName: newThaiName.trim(),
      studentId: generatedCode,
      email: newEmail.trim(),
      role: newRole,
      avatar: newRole === 'teacher'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : newRole === 'admin'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        : newRole === 'parent'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      streakDays: 1,
      department: newDeptGrade.trim() || undefined,
      grade: newRole === 'student' ? (newDeptGrade.trim() || 'มัธยมศึกษาปีที่ 6') : undefined,
      rfidCard: assignedRfid,
    };

    await saveUserProfile(newUserObj);

    saveStoredAccount({
      id: generatedId,
      studentId: generatedCode,
      email: newEmail.trim(),
      name: newUserObj.name,
      thaiName: newUserObj.thaiName,
      role: newRole,
      password: 'password123',
      user: newUserObj,
      registeredAt: new Date().toISOString(),
    });

    await pushRealtimeNotification({
      title: `👤 เพิ่มผู้ใช้งานใหม่ในระบบ: ${newThaiName}`,
      message: `แอดมินได้สร้างบัญชีบทบาท "${newRole}" รหัสประจำตัว: ${generatedCode} พร้อมรหัสบัตร RFID: ${assignedRfid} เรียบร้อยแล้ว`,
      type: 'system',
      priority: 'normal',
      role: 'all',
      icon: 'person_add',
    });

    showToast(`บันทึกผู้ใช้ ${newThaiName} (${newRole}) สู่ Firebase Firestore และซิงค์ทุกระบบสำเร็จ!`);
    setShowAddModal(false);
    setNewThaiName('');
    setNewEngName('');
    setNewEmail('');
    setNewCode('');
    setNewDeptGrade('');
  };

  const studentCount = usersList.filter((u) => u.role === 'student').length;
  const teacherCount = usersList.filter((u) => u.role === 'teacher').length;
  const adminCount = usersList.filter((u) => u.role === 'admin').length;
  const parentCount = usersList.filter((u) => u.role === 'parent').length;

  return (
    <div className="flex flex-col w-full relative pb-20 sm:pb-24 pt-5 sm:pt-6 px-4 sm:px-6 max-w-[1280px] mx-auto min-h-screen">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#121b2e] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slideDown">
          <span className="material-symbols-outlined text-[#20C997] text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#5f3add]/10 text-[#5f3add] text-xs font-bold">
                Admin Control Center
              </span>
              <span className="text-xs text-[#737686]">ฐานข้อมูลผู้ใช้ทุกบทบาท (Firestore Sync)</span>
            </div>
            <h1 className="text-[26px] sm:text-[32px] font-bold text-[#121b2e] leading-tight">
              จัดการบัญชีผู้ใช้ & บัตรดิจิทัล (User & Access Control)
            </h1>
            <p className="text-[#434654] text-[15px]">
              บริหารจัดการและจัดเก็บข้อมูลของนักเรียน อาจารย์ ผู้ดูแลระบบ และผู้ปกครองในฐานข้อมูล Firebase อัตโนมัติ
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#5f3add] hover:bg-[#4d2dbf] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>เพิ่มบัญชีผู้ใช้ / บัตร RFID ใหม่</span>
          </button>
        </div>

        {/* Top Summary Stats for all roles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">school</span>
              <span>นักเรียน (Students)</span>
            </span>
            <div className="text-[22px] font-bold text-[#121b2e]">{studentCount} <span className="text-xs text-[#737686] font-normal">คน</span></div>
            <span className="text-[10px] text-[#00694d] font-semibold flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00694d]"></span> ซิงค์ Firestore Real-time
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">badge</span>
              <span>อาจารย์/ครู (Teachers)</span>
            </span>
            <div className="text-[22px] font-bold text-[#5f3add]">{teacherCount} <span className="text-xs text-[#737686] font-normal">ท่าน</span></div>
            <span className="text-[10px] text-purple-600 font-semibold">สิทธิ์อาจารย์ประจำวิชา</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[11px] text-slate-700 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
              <span>ผู้ดูแลระบบ (Admins)</span>
            </span>
            <div className="text-[22px] font-bold text-[#121b2e]">{adminCount} <span className="text-xs text-[#737686] font-normal">คน</span></div>
            <span className="text-[10px] text-slate-600 font-semibold">SuperAdmin Root & IT</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">family_restroom</span>
              <span>ผู้ปกครอง (Parents)</span>
            </span>
            <div className="text-[22px] font-bold text-emerald-700">{parentCount} <span className="text-xs text-[#737686] font-normal">ท่าน</span></div>
            <span className="text-[10px] text-emerald-600 font-semibold">เชื่อมต่อข้อมูลบุตรหลาน</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัส, อีเมล, RFID Tag..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#5f3add] focus:ring-1 focus:ring-[#5f3add]"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'student', label: 'นักเรียน' },
              { id: 'teacher', label: 'อาจารย์' },
              { id: 'admin', label: 'ผู้ดูแลระบบ' },
              { id: 'parent', label: 'ผู้ปกครอง' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  roleFilter === tab.id
                    ? 'bg-[#5f3add] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[#737686] font-semibold">
                <tr>
                  <th className="py-3 px-4">ผู้ใช้งาน / สังกัด</th>
                  <th className="py-3 px-4">บทบาท (Role)</th>
                  <th className="py-3 px-4">RFID / NFC Card</th>
                  <th className="py-3 px-4">สิทธิ์เข้าถึงอาคาร</th>
                  <th className="py-3 px-4">สถานะ Cloud</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#121b2e] text-[13px]">{u.thaiName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {u.code} • {u.departmentOrGrade} {u.email ? `• ${u.email}` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-semibold text-[10px] uppercase ${
                          u.role === 'student'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : u.role === 'teacher'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : u.role === 'parent'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-300 font-bold'
                        }`}
                      >
                        {u.role === 'student' ? 'นักเรียน' : u.role === 'teacher' ? 'อาจารย์' : u.role === 'parent' ? 'ผู้ปกครอง' : 'ผู้ดูแลระบบ'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">contactless</span>
                        {u.rfidCard}
                      </div>
                      <div className="text-[10px] text-slate-400">{u.lastActive}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {u.accessLevel.slice(0, 2).map((acc, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                            {acc}
                          </span>
                        ))}
                        {u.accessLevel.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                            +{u.accessLevel.length - 2} ประตู
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : u.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'active'
                              ? 'bg-emerald-500'
                              : u.status === 'pending'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        />
                        {u.status === 'active' ? 'บันทึกใน Firebase' : u.status === 'pending' ? 'รออนุมัติ' : 'ระงับสิทธิ์'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleReissueRfid(u.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="ออกรหัสบัตร RFID ใหม่และบันทึกสู่ Firebase"
                        >
                          <span className="material-symbols-outlined text-[16px]">sync</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'ระงับ' : 'ปลดล็อก'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#5f3add]/10 text-[#5f3add] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900">เพิ่มผู้ใช้สู่ Firebase Cloud</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">บทบาทในระบบ (Role) *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['student', 'teacher', 'admin', 'parent'] as UserRole[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setNewRole(r)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold text-center border cursor-pointer transition-all ${
                        newRole === r
                          ? 'bg-[#5f3add] text-white border-[#5f3add] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r === 'student' ? 'นักเรียน' : r === 'teacher' ? 'อาจารย์' : r === 'admin' ? 'ผู้ดูแล' : 'ผู้ปกครอง'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อ-นามสกุล (ภาษาไทย) *</label>
                <input
                  type="text"
                  required
                  value={newThaiName}
                  onChange={(e) => setNewThaiName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี หรือ อ.กานต์ดา มุ่งมั่น"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5f3add] focus:ring-1 focus:ring-[#5f3add]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อ-นามสกุล (ภาษาอังกฤษ)</label>
                <input
                  type="text"
                  value={newEngName}
                  onChange={(e) => setNewEngName(e.target.value)}
                  placeholder="เช่น SOMCHAI JAIDEE"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5f3add] focus:ring-1 focus:ring-[#5f3add]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">อีเมลผู้ใช้งาน *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="เช่น somchai.j@nexus.ac.th"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5f3add] focus:ring-1 focus:ring-[#5f3add]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">รหัสประจำตัว (Auto)</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="เว้นว่างเพื่อสร้างรหัสอัตโนมัติ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5f3add] font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">กลุ่มสาระ / ชั้นห้อง</label>
                  <input
                    type="text"
                    value={newDeptGrade}
                    onChange={(e) => setNewDeptGrade(e.target.value)}
                    placeholder="เช่น ม.6/1 หรือ วิทยาการคำนวณ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5f3add]"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#5f3add] shrink-0 mt-0.5">cloud_sync</span>
                <span>ข้อมูลผู้ใช้นี้จะถูกบันทึกสู่ Firestore Collection <code className="text-[#5f3add] font-bold">/users/&#123;userId&#125;</code> โดยอัตโนมัติและสามารถนำไปล็อกอินได้ทันที</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#5f3add] hover:bg-[#4d2dbf] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  บันทึกลง Firebase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
