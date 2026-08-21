import React, { useState, useEffect } from 'react';
import { ASSETS } from '../data/mockData';
import { UserProfile, UserRole } from '../types';
import {
  registerNewUser,
  signInUser,
  signInWithGoogle,
  requestPasswordReset,
  removeStoredAccount,
  getDomainHelpMessage,
  DomainHelpMessage,
} from '../services/firebaseService';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  isAutoLocked?: boolean;
  lockedUser?: UserProfile | null;
  onClearAutoLock?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  isAutoLocked = false,
  lockedUser = null,
  onClearAutoLock,
}) => {
  // Main view mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    if (lockedUser?.role) return lockedUser.role;
    try {
      const savedRole = localStorage.getItem('sn_last_role') as UserRole;
      if (savedRole && ['student', 'teacher', 'admin', 'parent'].includes(savedRole)) {
        return savedRole;
      }
    } catch {
      // ignore
    }
    return 'student';
  });

  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sn_remember_me') !== 'false';
    } catch {
      return true;
    }
  });

  const rolesConfig: { role: UserRole; label: string; icon: string }[] = [
    { role: 'student', label: 'นักเรียน', icon: 'school' },
    { role: 'teacher', label: 'ครูอาจารย์', icon: 'person' },
    { role: 'admin', label: 'ผู้ดูแลระบบ', icon: 'admin_panel_settings' },
    { role: 'parent', label: 'ผู้ปกครอง', icon: 'family_restroom' },
  ];

  // Sign In form states - strictly scoped to each individual role
  const [identifier, setIdentifier] = useState<string>(() => {
    if (lockedUser) {
      return lockedUser.studentId || lockedUser.email || '';
    }
    try {
      const initialRole = (localStorage.getItem('sn_last_role') as UserRole) || 'student';
      const saved = localStorage.getItem(`sn_remembered_id_${initialRole}`);
      return saved || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Sync lockedUser changes if auto-locked while on screen
  React.useEffect(() => {
    if (lockedUser) {
      if (lockedUser.role) setSelectedRole(lockedUser.role);
      const userIdent = lockedUser.studentId || lockedUser.email || '';
      if (userIdent) setIdentifier(userIdent);
    }
  }, [lockedUser]);

  // Sign Up / Registration form states
  const [regThaiName, setRegThaiName] = useState<string>('');
  const [regEngName, setRegEngName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regId, setRegId] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [regGrade, setRegGrade] = useState<string>('มัธยมศึกษาปีที่ 6/1');
  const [regRoom, setRegRoom] = useState<string>('ห้อง 601');
  const [regMajor, setRegMajor] = useState<string>('วิทยาศาสตร์-คณิตศาสตร์-คอมพิวเตอร์');
  const [regDepartment, setRegDepartment] = useState<string>('กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี');
  const [regPosition, setRegPosition] = useState<string>('ครูผู้สอน');
  const [regChildName, setRegChildName] = useState<string>('');
  const [regRfid, setRegRfid] = useState<string>(`NFC-SN-${Math.floor(1000 + Math.random() * 9000)}-2026`);
  const [regAvatar, setRegAvatar] = useState<string>(ASSETS.headerAvatar);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);

  // UI & Feedback states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [showItHelp, setShowItHelp] = useState<boolean>(false);
  const [domainHelpInfo, setDomainHelpInfo] = useState<DomainHelpMessage | null>(null);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetSent, setResetSent] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    try {
      localStorage.setItem('sn_last_role', role);
      const savedForThisRole = localStorage.getItem(`sn_remembered_id_${role}`);
      if (savedForThisRole) {
        setIdentifier(savedForThisRole);
      } else {
        setIdentifier('');
      }
      setPassword('');
    } catch {
      // ignore
    }
  };

  // Sign In Handler connected to Firebase
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showToast('กรุณากรอกอีเมลหรือรหัสประจำตัว', 'error');
      return;
    }
    setIsLoading(true);

    try {
      const result = await signInUser(identifier, password, selectedRole);
      setIsLoading(false);

      if (result.success && result.user) {
        try {
          localStorage.setItem('sn_last_role', selectedRole);
          if (rememberMe) {
            localStorage.setItem(`sn_remembered_id_${selectedRole}`, identifier.trim());
            localStorage.setItem('sn_remember_me', 'true');
          } else {
            localStorage.removeItem(`sn_remembered_id_${selectedRole}`);
            localStorage.setItem('sn_remember_me', 'false');
          }
        } catch {
          // ignore
        }
        // If user is registered under a different role, automatically adjust and inform
        if (result.user.role && result.user.role !== selectedRole) {
          setSelectedRole(result.user.role);
        }
        onLoginSuccess(result.user);
      } else {
        showToast(result.error || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูล', 'error');
      }
    } catch {
      setIsLoading(false);
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  // Registration Handler connected to Firebase
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regThaiName.trim()) {
      showToast('กรุณาระบุชื่อ-นามสกุลภาษาไทย', 'error');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      showToast('กรุณากรอกอีเมลที่ถูกต้อง', 'error');
      return;
    }
    if (regPassword.length < 6) {
      showToast('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'error');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      showToast('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน', 'error');
      return;
    }
    if (selectedRole === 'admin' && regEmail.trim().toLowerCase() !== 'vorawutphetrai17@gmail.com') {
      showToast('สิทธิ์ผู้ดูแลระบบ (Admin) สงวนไว้เฉพาะอีเมล vorawutphetrai17@gmail.com เท่านั้น', 'error');
      return;
    }

    if (!acceptTerms) {
      showToast('กรุณายอมรับเงื่อนไขการให้บริการ', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Remove any previous account tied to this email or studentId across all roles to guarantee single unique account
      if (regEmail.trim()) {
        removeStoredAccount(regEmail.trim());
      }
      if (regId.trim()) {
        removeStoredAccount(regId.trim());
      }

      const result = await registerNewUser({
        name: regEngName.trim() || regThaiName.trim(),
        thaiName: regThaiName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: selectedRole,
        studentId: regId.trim() || undefined,
        grade: selectedRole === 'student' ? regGrade : undefined,
        room: selectedRole === 'student' ? regRoom : undefined,
        major: selectedRole === 'student' ? regMajor : undefined,
        position: selectedRole === 'teacher' || selectedRole === 'admin' ? regPosition : undefined,
        department: selectedRole === 'teacher' || selectedRole === 'admin' ? regDepartment : undefined,
        rfidCard: regRfid,
        avatar: regAvatar,
      });

      setIsLoading(false);

      if (result.success && result.user) {
        try {
          localStorage.setItem('sn_last_role', selectedRole);
          localStorage.setItem(`sn_remembered_id_${selectedRole}`, result.user.studentId || result.user.email);
        } catch {
          // ignore
        }
        showToast('ลงทะเบียนและบันทึกลงระบบสำเร็จ!', 'success');
        onLoginSuccess(result.user);
      } else {
        showToast(result.error || 'เกิดข้อผิดพลาดในการลงทะเบียน', 'error');
      }
    } catch {
      setIsLoading(false);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลไปยังฐานข้อมูล', 'error');
    }
  };

  // Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setDomainHelpInfo(null);
    const res = await signInWithGoogle();
    setIsLoading(false);
    if (res.success && res.user) {
      try {
        localStorage.setItem('sn_last_role', res.user.role);
        localStorage.setItem(`sn_remembered_id_${res.user.role}`, res.user.email || res.user.studentId);
      } catch {
        // ignore
      }
      showToast(`เข้าสู่ระบบด้วย Google สำเร็จ: ${res.user.name}`, 'success');
      onLoginSuccess(res.user);
    } else if (res.notRegistered) {
      // Prompt user to register first with this Google email
      showToast(res.error || 'อีเมลนี้ยังไม่ได้ลงทะเบียน กรุณากรอกข้อมูลเพื่อลงทะเบียนก่อนเข้าสู่ระบบ', 'error');
      setAuthMode('signup');
      if (res.googleEmail) setRegEmail(res.googleEmail);
      if (res.googleName) {
        setRegThaiName(res.googleName);
        setRegEngName(res.googleName);
      }
      if (res.googlePhoto) {
        setRegAvatar(res.googlePhoto);
      }
    } else {
      const help = getDomainHelpMessage(res.error);
      if (help) {
        setDomainHelpInfo(help);
        showToast('Google OAuth มีข้อจำกัดด้านโดเมนความปลอดภัย', 'error');
      } else if (res.error && res.error !== 'ยกเลิกการเลือกบัญชี Google') {
        showToast(res.error, 'error');
      }
    }
  };

  // Reset Password Handler
  const handleResetPassword = async () => {
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      showToast('กรุณากรอกอีเมลที่ถูกต้อง', 'error');
      return;
    }
    const res = await requestPasswordReset(resetEmail);
    if (res.success) {
      setResetSent(true);
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f9f9ff] text-[#121b2e] flex flex-col justify-between items-center px-4 pt-6 sm:pt-8 pb-8 font-['Noto_Sans_Thai',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-[#121b2e] text-white border-emerald-500/40'
              : 'bg-[#ba1a1a] text-white border-red-400'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toastMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Background Ambient Blobs */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-[#1550d3]/10 blur-3xl mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-[#7857f8]/12 blur-3xl mix-blend-multiply"></div>
      </div>

      {/* Campus Background Silhouette */}
      <div
        className="absolute bottom-0 inset-x-0 h-72 bg-cover bg-top opacity-20 z-0 pointer-events-none"
        style={{
          backgroundImage: `url('${ASSETS.campusBg}')`,
          maskImage: 'linear-gradient(to top, black 30%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 100%)',
        }}
      />

      {/* Top Header Status Bar */}
      <div className="w-full max-w-lg flex justify-between items-center z-10 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white p-0.5 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
            <img
              src={ASSETS.logo}
              alt="Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== ASSETS.fallbackLogo) {
                  target.src = ASSETS.fallbackLogo;
                }
              }}
            />
          </div>
          <span className="text-xs font-bold tracking-widest text-[#121b2e] uppercase">
            SCHOOL NEXUS
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#1550d3] bg-white/90 px-3 py-1 rounded-full border border-blue-100 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#20C997] animate-pulse"></span>
          <span>Firebase Cloud Online</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-lg bg-[#e9edff]/80 backdrop-blur-2xl rounded-[32px] p-5 sm:p-7 shadow-2xl relative z-10 flex flex-col items-center border border-white/80">
        
        {/* Security Gate Notice */}
        <div className="w-full mb-4 px-3.5 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center gap-2.5 text-xs text-blue-950 font-medium">
          <span className="material-symbols-outlined text-[20px] text-[#1550d3] shrink-0">verified_user</span>
          <div className="leading-tight">
            <span className="font-bold text-[#1550d3] block">ระบบความปลอดภัยสถานศึกษา (Mandatory Auth Gate)</span>
            <span className="text-[11px] text-[#434654]">ทุกอุปกรณ์จำเป็นต้องเข้าสู่ระบบก่อนเริ่มใช้งานเว็บแอปทุกครั้ง</span>
          </div>
        </div>

        {/* Auth Mode Toggle Tabs (Sign In vs Register) */}
        <div className="w-full bg-white/90 p-1 rounded-2xl flex mb-5 shadow-xs border border-slate-200/60">
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
              authMode === 'signin'
                ? 'bg-[#1550d3] text-white shadow-md'
                : 'text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[19px]">login</span>
            <span>เข้าสู่ระบบ</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
              authMode === 'signup'
                ? 'bg-[#1550d3] text-white shadow-md'
                : 'text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[19px]">person_add</span>
            <span>ลงทะเบียนบัญชีใหม่</span>
          </button>
        </div>

        {/* Role Selection Tabs */}
        <div className="w-full mb-4">
          <label className="text-[11px] font-bold text-[#737686] uppercase tracking-wider block mb-1.5 px-1 flex items-center justify-between">
            <span>{authMode === 'signin' ? 'เลือกล็อคอินตามบทบาท (Role) *' : 'เลือกบทบาทที่ต้องการลงทะเบียน (Role) *'}</span>
            <span className="text-[10px] text-blue-600 font-semibold lowercase">
              {authMode === 'signin' ? 'เลือกบทบาทของบัญชี' : 'กำหนดสิทธิ์การใช้งาน'}
            </span>
          </label>
          <div className="grid grid-cols-4 gap-1.5 bg-[#e1e8ff] p-1 rounded-2xl">
            {rolesConfig.map((item) => {
              const isSelected = selectedRole === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleRoleSelect(item.role)}
                  className={`py-2 px-1 rounded-xl text-[12px] sm:text-[13px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-[#1550d3] shadow-md scale-102 ring-2 ring-blue-500/20'
                      : 'text-[#434654] hover:text-[#121b2e] hover:bg-white/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span className="truncate w-full text-center">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-Lock Alert Banner */}
        {isAutoLocked && (
          <div className="w-full mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex flex-col gap-2.5 animate-fadeIn shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">lock_clock</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-900">ล็อกระบบอัตโนมัติ (Auto-Locked)</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-900 font-bold">
                    ความปลอดภัย 15 นาที
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ไม่มีการใช้งานเกิน 15 นาที ระบบจึงล็อกหน้าจอเพื่อปกป้องข้อมูลส่วนบุคคลของคุณ กรุณากรอกรหัสผ่านเพื่อปลดล็อกเข้าใช้งานต่อ
                </p>
              </div>
            </div>

            {lockedUser && (
              <div className="flex items-center justify-between pt-2.5 mt-0.5 border-t border-amber-500/20 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={lockedUser.avatar || ASSETS.headerAvatar}
                    alt={lockedUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-400/60 shrink-0"
                  />
                  <div className="truncate">
                    <span className="font-bold text-slate-800">
                      {lockedUser.thaiName || lockedUser.name}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                      ({lockedUser.studentId || lockedUser.email})
                    </span>
                  </div>
                </div>
                {onClearAutoLock && (
                  <button
                    type="button"
                    onClick={onClearAutoLock}
                    className="text-[#1550d3] hover:text-[#1242b3] font-bold text-[11px] hover:underline cursor-pointer shrink-0 ml-2"
                  >
                    สลับบัญชีอื่น ➔
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Domain Restriction Graceful Guidance Banner */}
        {domainHelpInfo && (
          <div className="w-full mb-4 p-4 rounded-2xl bg-amber-50/95 border border-amber-200 text-amber-950 shadow-xs backdrop-blur-sm animate-fadeIn">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 text-xl shrink-0 mt-0.5">
                domain_disabled
              </span>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-900 mb-1">
                  {domainHelpInfo.title}
                </h4>
                <p className="text-[11px] text-amber-800 leading-relaxed mb-1.5">
                  {domainHelpInfo.message}
                </p>
                <p className="text-[10px] text-amber-700/90 leading-relaxed mb-3">
                  {domainHelpInfo.tierInfo} • {domainHelpInfo.suggestedAction}
                </p>
                <div className="flex flex-wrap gap-2">
                  {domainHelpInfo.alternativeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setDomainHelpInfo(null);
                        if (opt.actionType === 'signin_password') {
                          setAuthMode('signin');
                          const inputEl = document.getElementById('identifier') as HTMLInputElement;
                          if (inputEl) inputEl.focus();
                        } else if (opt.actionType === 'signup_new') {
                          setAuthMode('signup');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        opt.actionType === 'signin_password'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                          : 'bg-white hover:bg-amber-100 border border-amber-300 text-amber-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {opt.actionType === 'signin_password' ? 'login' : 'person_add'}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDomainHelpInfo(null)}
                className="text-amber-500 hover:text-amber-700 text-sm font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ----------------- SIGN IN FORM ----------------- */}
        {authMode === 'signin' ? (
          <form onSubmit={handleSignIn} className="w-full flex flex-col gap-3.5">
            {/* Header Text */}
            <div className="text-center mb-1">
              <h2 className="text-[22px] font-bold text-[#121b2e]">
                {isAutoLocked ? 'ปลดล็อกเพื่อเข้าใช้งานต่อ' : 'ยินดีต้อนรับกลับสู่ระบบ'}
              </h2>
              <p className="text-[13px] text-[#434654]">
                {isAutoLocked
                  ? 'กรอกรหัสผ่านของบัญชีเพื่อปลดล็อกเซสชัน'
                  : 'เข้าใช้งานระบบสารสนเทศและดิจิทัลแคมปัส'}
              </p>
            </div>

            {/* Email / Student ID Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737686] group-focus-within:text-[#1550d3] transition-colors">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-white text-[#121b2e] placeholder:text-[#737686] text-[14px] rounded-2xl py-3 pl-11 pr-4 shadow-xs border border-transparent focus:border-[#1550d3]/30 focus:outline-none focus:ring-3 focus:ring-[#1550d3]/15 transition-all"
                placeholder={
                  selectedRole === 'student'
                    ? 'รหัสนักเรียน หรือ อีเมล (เช่น 66040217)'
                    : selectedRole === 'teacher'
                    ? 'รหัสประจำตัวครู หรือ อีเมล (เช่น T-55104)'
                    : selectedRole === 'admin'
                    ? 'รหัสผู้ดูแลระบบ หรือ อีเมล (เช่น ADM-001)'
                    : 'รหัสประจำตัวผู้ปกครอง หรือ อีเมล (เช่น P-66040217)'
                }
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737686] group-focus-within:text-[#1550d3] transition-colors">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white text-[#121b2e] placeholder:text-[#737686] text-[14px] rounded-2xl py-3 pl-11 pr-11 shadow-xs border border-transparent focus:border-[#1550d3]/30 focus:outline-none focus:ring-3 focus:ring-[#1550d3]/15 transition-all"
                placeholder="รหัสผ่าน"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#737686] hover:text-[#1550d3] transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                <span className="material-symbols-outlined text-[19px]">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1550d3] border-slate-300 focus:ring-[#1550d3] accent-[#1550d3]"
                />
                <span className="text-[12px] text-[#434654]">จดจำฉันในอุปกรณ์นี้</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-[12px] text-[#1550d3] font-bold hover:underline transition-colors cursor-pointer"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            {/* Sign In Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1550d3] text-white rounded-2xl py-3.5 mt-1 font-bold text-[15px] shadow-lg shadow-[#1550d3]/25 hover:bg-[#1a53d6] hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังเชื่อมต่อฐานข้อมูล...</span>
                </div>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <span className="material-symbols-outlined text-[19px]">arrow_forward</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-300/60"></div>
              <span className="flex-shrink mx-3 text-[11px] font-semibold text-[#737686] uppercase">หรือ</span>
              <div className="flex-grow border-t border-slate-300/60"></div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white text-[#121b2e] rounded-2xl py-3 px-4 font-semibold text-[13px] border border-slate-200 shadow-xs hover:bg-slate-50 hover:shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>ลงชื่อเข้าใช้ด้วย Google Workspace</span>
            </button>

            {/* Need Account Box CTA */}
            <div className="mt-1 p-3 rounded-2xl bg-white/80 border border-blue-100 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 text-xs text-[#434654]">
                <span className="material-symbols-outlined text-[#1550d3] text-[18px]">how_to_reg</span>
                <span>ยังไม่มีบัญชีผู้ใช้งานในระบบ?</span>
              </div>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="text-xs font-bold text-[#1550d3] hover:text-[#103eb0] hover:underline cursor-pointer"
              >
                ลงทะเบียนที่นี่ ➔
              </button>
            </div>
          </form>
        ) : (
          /* ----------------- SIGN UP / REGISTRATION FORM ----------------- */
          <form onSubmit={handleSignUp} className="w-full flex flex-col gap-3.5">
            <div className="text-center mb-1">
              <h2 className="text-[20px] font-bold text-[#121b2e]">
                ลงทะเบียนบัญชี {rolesConfig.find((r) => r.role === selectedRole)?.label} ใหม่
              </h2>
              <p className="text-[12px] text-[#434654]">
                สร้างโปรไฟล์ เชื่อมต่อบัตรดิจิทัล Smart Pass และบันทึกลง Firestore
              </p>
            </div>

            {/* Thai Name */}
            <div>
              <label className="text-[11px] font-bold text-[#434654] block mb-1">
                ชื่อ-นามสกุล (ภาษาไทย) *
              </label>
              <input
                type="text"
                value={regThaiName}
                onChange={(e) => setRegThaiName(e.target.value)}
                placeholder={
                  selectedRole === 'student'
                    ? 'เช่น นายกิตติศักดิ์ พงศ์ไพศาล'
                    : selectedRole === 'teacher'
                    ? 'เช่น อ.ดร.กานต์ดา มุ่งมั่น'
                    : selectedRole === 'admin'
                    ? 'เช่น นายสมเกียรติ สิทธิคุณ (ผู้ดูแลระบบ)'
                    : 'เช่น นายวรเทพ เพ็ชรระยา (ผู้ปกครอง)'
                }
                className="w-full bg-white text-[#121b2e] placeholder:text-[#737686] text-[13px] rounded-xl py-2.5 px-3.5 shadow-xs border border-slate-200 focus:border-[#1550d3] focus:outline-none"
                required
              />
            </div>

            {/* English Name & ID Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#434654] block mb-1">
                  Full Name (English)
                </label>
                <input
                  type="text"
                  value={regEngName}
                  onChange={(e) => setRegEngName(e.target.value)}
                  placeholder={
                    selectedRole === 'student'
                      ? 'KITTISAK PONGPAISAL'
                      : selectedRole === 'teacher'
                      ? 'DR. KANDA MUNGMUN'
                      : selectedRole === 'admin'
                      ? 'SOMKIAT SITTHIKUN'
                      : 'WORATHEP PHETRAI'
                  }
                  className="w-full bg-white text-[#121b2e] placeholder:text-[#737686] text-[13px] rounded-xl py-2.5 px-3.5 shadow-xs border border-slate-200 focus:border-[#1550d3] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#434654] block mb-1">
                  {selectedRole === 'student'
                    ? 'รหัสนักเรียน (Student ID)'
                    : selectedRole === 'teacher'
                    ? 'รหัสประจำตัวครู (Teacher ID)'
                    : selectedRole === 'admin'
                    ? 'รหัสประจำตัวผู้ดูแลระบบ (Admin ID)'
                    : 'รหัสประจำตัวผู้ปกครอง (Parent ID)'}
                </label>
                <input
                  type="text"
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  placeholder={
                    selectedRole === 'student'
                      ? 'เช่น 66040299'
                      : selectedRole === 'teacher'
                      ? 'เช่น T-55201'
                      : selectedRole === 'admin'
                      ? 'เช่น ADM-001'
                      : 'เช่น P-66040217'
                  }
                  className="w-full bg-white text-[#121b2e] placeholder:text-[#737686] text-[13px] rounded-xl py-2.5 px-3.5 shadow-xs border border-slate-200 focus:border-[#1550d3] focus:outline-none"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-[11px] font-bold text-[#434654] block mb-1">
                อีเมลสำหรับเข้าสู่ระบบ *
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@schoolnexus.ac.th"
                className="w-full bg-white text-[#121b2e] placeholder:text-[#737686] text-[13px] rounded-xl py-2.5 px-3.5 shadow-xs border border-slate-200 focus:border-[#1550d3] focus:outline-none"
                required
              />
            </div>

            {/* Role Specific Fields */}
            {selectedRole === 'student' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#434654] block mb-1">ระดับชั้น</label>
                  <select
                    value={regGrade}
                    onChange={(e) => setRegGrade(e.target.value)}
                    className="w-full bg-white text-[#121b2e] text-[13px] rounded-xl py-2.5 px-3 shadow-xs border border-slate-200 focus:border-[#1550d3] focus:outline-none"
                  >
                    <option value="มัธยมศึกษาปีที่ 6/1">ม.6/1 (วิทย์-คอม)</option>
                    <option value="มัธยมศึกษาปีที่ 6/2">ม.6/2 (วิทย์-คณิต)</option>
                    <option value="มัธยมศึกษาปีที่ 5/1">ม.5/1 (วิทย์-คอม)</option>
                    <option value="มัธยมศึกษาปีที่ 4/1">ม.4/1 (EP AI)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#434654] block mb-1">ห้องเรียนประจำ</label>
                  <input
                    type="text"
                    value={regRoom}
                    onChange={(e) => setRegRoom(e.target.value)}
                    placeholder="ห้อง 601"
                    className="w-full bg-white text-[#121b2e] text-[13px] rounded-xl py-2.5 px-3 shadow-xs border border-slate-200 focus:border-[#1550d3] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {(selectedRole === 'teacher' || selectedRole === 'admin') && (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#434654] block mb-1">กลุ่มสาระ / แผนก</label>
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    placeholder="กลุ่มสาระวิทยาศาสตร์ฯ"
                    className="w-full bg-white text-[#121b2e] text-[13px] rounded-xl py-2.5 px-3 shadow-xs border border-slate-200 focus:border-[#1550d3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#434654] block mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={regPosition}
                    onChange={(e) => setRegPosition(e.target.value)}
                    placeholder="ครูชำนาญการ"
                    className="w-full bg-white text-[#121b2e] text-[13px] rounded-xl py-2.5 px-3 shadow-xs border border-slate-200 focus:border-[#1550d3] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {selectedRole === 'parent' && (
              <div>
                <label className="text-[11px] font-bold text-[#434654] block mb-1">
                  ชื่อหรือรหัสนักเรียนในความดูแล
                </label>
                <input
                  type="text"
                  value={regChildName}
                  onChange={(e) => setRegChildName(e.target.value)}
                  placeholder="เช่น 66040217 หรือ วรวุฒิ เพ็ชรระยา"
                  className="w-full bg-white text-[#121b2e] text-[13px] rounded-xl py-2.5 px-3.5 shadow-xs border border-slate-200 focus:border-[#1550d3] focus:outline-none"
                />
              </div>
            )}

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="relative">
                <label className="text-[11px] font-bold text-[#434654] block mb-1">รหัสผ่าน (6+ ตัวอักษร) *</label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="ตั้งรหัสผ่าน"
                  className="w-full bg-white text-[#121b2e] text-[13px] rounded-xl py-2.5 pl-3 pr-9 shadow-xs border border-slate-200 focus:border-[#1550d3] focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute bottom-2.5 right-2.5 text-[#737686] hover:text-[#1550d3]"
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {showRegPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#434654] block mb-1">ยืนยันรหัสผ่าน *</label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="พิมพ์ซ้ำอีกครั้ง"
                  className={`w-full bg-white text-[#121b2e] text-[13px] rounded-xl py-2.5 px-3 shadow-xs border focus:outline-none ${
                    regConfirmPassword && regPassword !== regConfirmPassword
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-200 focus:border-[#1550d3]'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Smart NFC Card ID Generation Badge */}
            <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1550d3] text-[20px]">nfc</span>
                <div>
                  <div className="text-[11px] font-bold text-[#121b2e]">Smart Pass RFID Key</div>
                  <div className="text-[11px] font-mono text-[#737686]">{regRfid}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRegRfid(`NFC-SN-${Math.floor(1000 + Math.random() * 9000)}-2026`)}
                className="text-[11px] text-[#1550d3] font-bold hover:underline"
              >
                สุ่มรหัสใหม่
              </button>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-2 cursor-pointer select-none px-1">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-[#1550d3] border-slate-300 focus:ring-[#1550d3] accent-[#1550d3]"
              />
              <span className="text-[12px] text-[#434654] leading-tight">
                ฉันยอมรับเงื่อนไขการใช้งานระบบ และยินยอมให้จัดเก็บข้อมูลโปรไฟล์ใน Cloud Firestore
              </span>
            </label>

            {/* Register Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1550d3] text-white rounded-2xl py-3.5 mt-1 font-bold text-[15px] shadow-lg shadow-[#1550d3]/25 hover:bg-[#1a53d6] hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึกลง Firebase...</span>
                </div>
              ) : (
                <>
                  <span>สร้างบัญชีและเริ่มต้นใช้งาน</span>
                  <span className="material-symbols-outlined text-[19px]">person_check</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* IT Support Help Link */}
        <div className="mt-5 text-center">
          <p className="text-[12px] text-[#434654]">
            พบปัญหาการใช้งานหรือลืมรหัสผ่าน?{' '}
            <button
              type="button"
              onClick={() => setShowItHelp(true)}
              className="text-[#1550d3] font-bold hover:underline cursor-pointer"
            >
              ติดต่อฝ่าย IT Support
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#121b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1550d3]">lock_reset</span>
                รีเซ็ตรหัสผ่านผ่าน Firebase
              </h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {resetSent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-[#20C997]/15 text-[#008562] flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                </div>
                <h4 className="font-bold text-lg text-[#121b2e] mb-1">ส่งลิงก์รีเซ็ตสำเร็จ</h4>
                <p className="text-xs text-[#434654] mb-4">
                  ระบบได้ส่งลิงก์กู้คืนรหัสผ่านไปยัง <span className="font-semibold text-[#121b2e]">{resetEmail || 'อีเมลของคุณ'}</span> เรียบร้อยแล้ว กรุณาตรวจสอบกล่องข้อความ
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                  }}
                  className="w-full py-3 bg-[#1550d3] text-white rounded-xl font-bold cursor-pointer"
                >
                  เข้าใจแล้ว
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-[#434654] mb-4">
                  กรอกอีเมลสถานศึกษาของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
                </p>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@schoolnexus.ac.th"
                  className="w-full bg-[#f1f3ff] text-[#121b2e] p-3 rounded-xl text-sm mb-4 border border-transparent focus:border-[#1550d3] focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleResetPassword}
                    className="flex-1 py-2.5 bg-[#1550d3] text-white rounded-xl font-bold hover:bg-[#1a53d6] cursor-pointer"
                  >
                    ส่งคำขอ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IT Support Modal */}
      {showItHelp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#121b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1550d3]">support_agent</span>
                ศูนย์ช่วยเหลือฝ่าย IT
              </h3>
              <button
                onClick={() => setShowItHelp(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-2.5 text-xs text-[#434654] mb-5">
              <div className="p-3 bg-[#f1f3ff] rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-[#1550d3]">call</span>
                <div>
                  <div className="font-bold text-[#121b2e]">สายด่วนศูนย์คอมพิวเตอร์</div>
                  <div>02-999-8888 ต่อ 101-105 (08:00 - 17:00 น.)</div>
                </div>
              </div>
              <div className="p-3 bg-[#f1f3ff] rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-[#1550d3]">mail</span>
                <div>
                  <div className="font-bold text-[#121b2e]">อีเมลฝ่ายสนับสนุน</div>
                  <div>helpdesk@schoolnexus.ac.th</div>
                </div>
              </div>
              <div className="p-3 bg-[#f1f3ff] rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-[#1550d3]">location_on</span>
                <div>
                  <div className="font-bold text-[#121b2e]">ห้องบริการไอที (On-site)</div>
                  <div>อาคารอำนวยการ ชั้น 2 ห้อง Service Center 204</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowItHelp(false)}
              className="w-full py-3 bg-[#1550d3] text-white rounded-xl font-bold cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
