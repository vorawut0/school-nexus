import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types';
import { ASSETS } from '../../data/mockData';
import {
  CARD_THEMES,
  GuillochePatternSvg,
  SmartChipSvg,
  HologramEmblemSvg,
} from '../common/SmartIdCardGraphics';
import { saveUserProfile } from '../../services/firebaseService';
import { compressImageFile } from '../../utils/imageUtils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => void;
}

export const PRESET_AVATARS = [
  {
    id: 'avatar-student-male',
    label: 'นักเรียนชาย',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'avatar-student-female',
    label: 'นักเรียนหญิง',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'avatar-student-academic',
    label: 'นักเรียนแว่น',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'avatar-teacher-male',
    label: 'อาจารย์ชาย',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'avatar-teacher-female',
    label: 'อาจารย์หญิง',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'avatar-school-crest',
    label: 'ตราสถาบัน',
    url: '/icons/icon.svg',
  },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveProfile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<UserProfile>({ ...user });
  const [activeTab, setActiveTab] = useState<'info' | 'photo' | 'card_theme'>('info');
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when user prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ ...user });
      setSaveSuccess(false);
      setErrorMessage(null);
      setIsSaving(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const currentTheme = CARD_THEMES[formData.cardTheme || 'obsidian-gold'] || CARD_THEMES['obsidian-gold'];

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        setFormData((prev) => ({ ...prev, avatar: compressed }));
      } catch (err) {
        console.warn('File upload fallback:', err);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const compressed = await compressImageFile(file);
        setFormData((prev) => ({ ...prev, avatar: compressed }));
      } catch (err) {
        console.warn('Drop upload fallback:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await saveUserProfile(formData);
      onSaveProfile(formData);
      setSaveSuccess(true);
      setIsSaving(false);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 750);
    } catch (error: any) {
      console.error('Manual save error:', error);
      setIsSaving(false);
      setErrorMessage(error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[32px] max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-5 sm:p-7 animate-scaleIn relative my-auto max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1550d3] flex items-center justify-center border border-blue-200 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg sm:text-xl text-[#121b2e] leading-tight">
                  แก้ไขข้อมูลโปรไฟล์ (Edit Profile)
                </h3>
              </div>
              <p className="text-xs text-[#737686]">
                แก้ไขข้อมูลแล้วกดปุ่ม "บันทึกข้อมูล" ด้านล่างเพื่ออัปเดตข้อมูลและบัตรดิจิทัล
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer border border-slate-200"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'info'
                ? 'bg-white text-[#1550d3] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">badge</span>
            <span>ข้อมูลส่วนตัว</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-white text-[#1550d3] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            <span>เปลี่ยนรูปโปรไฟล์</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('card_theme')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'card_theme'
                ? 'bg-white text-[#1550d3] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">palette</span>
            <span>ลายบัตรดิจิทัล</span>
          </button>
        </div>

        {/* Scrollable Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 mt-4 space-y-4 flex-1">
          {/* TAB 1: Profile Info */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Name and Thai Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ-นามสกุล (ภาษาอังกฤษ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="เช่น Vorawut Phetrai"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#1550d3] focus:ring-2 focus:ring-[#1550d3]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ-นามสกุล (ภาษาไทย) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.thaiName}
                    onChange={(e) => handleInputChange('thaiName', e.target.value)}
                    placeholder="เช่น วรวุฒิ เพ็ชรราย"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#1550d3] focus:ring-2 focus:ring-[#1550d3]/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* ID & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.role === 'student'
                      ? 'รหัสนักเรียน (Student ID)'
                      : formData.role === 'teacher'
                      ? 'รหัสประจำตัวครู (Teacher ID)'
                      : formData.role === 'admin'
                      ? 'รหัสประจำตัวผู้ดูแลระบบ (Admin ID)'
                      : 'รหัสประจำตัวผู้ปกครอง (Parent ID)'}
                  </label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => handleInputChange('studentId', e.target.value)}
                    placeholder={
                      formData.role === 'student'
                        ? 'เช่น 66040217'
                        : formData.role === 'teacher'
                        ? 'เช่น T-55104'
                        : formData.role === 'admin'
                        ? 'เช่น ADM-001'
                        : 'เช่น P-66040217'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-mono font-semibold text-slate-800 focus:bg-white focus:border-[#1550d3] focus:ring-2 focus:ring-[#1550d3]/20 outline-none transition-all"
                  />
                  <span className="text-[10px] text-slate-600 block mt-1 font-medium">
                    * เมื่อเปลี่ยนรหัสนี้ คุณจะต้องใช้รหัสใหม่นี้ในการเข้าสู่ระบบครั้งถัดไป
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อีเมลสถานศึกษา (School Email)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="name@schoolnexus.ac.th"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#1550d3] focus:ring-2 focus:ring-[#1550d3]/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Role Specific Fields */}
              {formData.role === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ระดับชั้น</label>
                    <input
                      type="text"
                      value={formData.grade || ''}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      placeholder="เช่น ม.6/1"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#1550d3] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ห้องเรียน</label>
                    <input
                      type="text"
                      value={formData.room || ''}
                      onChange={(e) => handleInputChange('room', e.target.value)}
                      placeholder="เช่น ห้อง 601"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#1550d3] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">สายการเรียน</label>
                    <input
                      type="text"
                      value={formData.major || ''}
                      onChange={(e) => handleInputChange('major', e.target.value)}
                      placeholder="เช่น วิทย์-คณิต (AI)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#1550d3] outline-none"
                    />
                  </div>
                </div>
              )}

              {(formData.role === 'teacher' || formData.role === 'admin') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={formData.position || ''}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="เช่น อาจารย์ชำนาญการพิเศษ"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#1550d3] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">กลุ่มสาระ / ฝ่าย</label>
                    <input
                      type="text"
                      value={formData.department || ''}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="เช่น วิทยาการคอมพิวเตอร์"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#1550d3] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ห้องทำงาน</label>
                    <input
                      type="text"
                      value={formData.officeRoom || ''}
                      onChange={(e) => handleInputChange('officeRoom', e.target.value)}
                      placeholder="เช่น ห้อง 401 อาคาร 4"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#1550d3] outline-none"
                    />
                  </div>
                </div>
              )}

              {formData.role === 'parent' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    นักเรียนในความดูแล (Child Name)
                  </label>
                  <input
                    type="text"
                    value={formData.childName || ''}
                    onChange={(e) => handleInputChange('childName', e.target.value)}
                    placeholder="เช่น วรวุฒิ เพ็ชรราย (ม.6/1)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#1550d3] outline-none"
                  />
                </div>
              )}

              {/* RFID Card ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสชิป RFID / NFC ประจำบัตร
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.rfidCard}
                    onChange={(e) => handleInputChange('rfidCard', e.target.value)}
                    placeholder="HEX-4091A-88"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-mono font-semibold text-slate-800 focus:bg-white focus:border-[#1550d3] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        'rfidCard',
                        `SN-${Math.floor(10000 + Math.random() * 90000).toString(16).toUpperCase()}`
                      )
                    }
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    สุ่มรหัสใหม่
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Photo Upload & Preset Selection */}
          {activeTab === 'photo' && (
            <div className="space-y-4">
              {/* Current Preview with (+) Button */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                className={`rounded-2xl p-4 border transition-all flex flex-col sm:flex-row items-center gap-4 ${
                  isDragging
                    ? 'border-[#1550d3] bg-blue-50/60 ring-2 ring-[#1550d3]/30'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Avatar with (+) badge */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-22 h-22 rounded-2xl ring-4 ring-[#1550d3]/20 shadow-md shrink-0 bg-white cursor-pointer group"
                  title="คลิกเพื่อเลือกไฟล์รูปภาพใหม่"
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden">
                    <img
                      src={formData.avatar || ASSETS.cardAvatar}
                      alt="Current Avatar"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                    <span className="material-symbols-outlined text-[24px]">add</span>
                    <span className="text-[9px] font-bold">เปลี่ยนรูป</span>
                  </div>

                  {/* (+) Plus Button Badge */}
                  <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#1550d3] hover:bg-[#1242b3] active:scale-95 text-white flex items-center justify-center shadow-md ring-2 ring-white transition-all">
                    <span className="material-symbols-outlined text-[18px] font-bold">add</span>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-bold text-sm text-slate-800">รูปประจำตัวปัจจุบัน</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    แตะที่เครื่องหมาย (+) หรือรูปภาพเพื่อเลือกรูปใหม่จากเครื่องของคุณ
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-[#1550d3] text-white text-xs font-bold shadow-xs hover:bg-[#1242b3] cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>เลือกรูปใหม่ (+)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Preset School Avatars */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  หรือเลือกจากรูปโปรไฟล์ตัวอย่างของสถาบัน (Preset Avatars)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {PRESET_AVATARS.map((avatar) => {
                    const isSelected = formData.avatar === avatar.url;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => handleInputChange('avatar', avatar.url)}
                        className={`group p-1.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'border-[#1550d3] bg-blue-50/60 ring-2 ring-[#1550d3]/30 scale-103'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-xs">
                          <img
                            src={avatar.url}
                            alt={avatar.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                          {avatar.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Card Theme Selection */}
          {activeTab === 'card_theme' && (
            <div className="space-y-4">
              {/* Card Live Preview */}
              <div
                className={`relative rounded-[22px] overflow-hidden bg-gradient-to-br ${currentTheme.bgGradient} text-white shadow-xl p-4 sm:p-5 border ${currentTheme.borderColor}`}
              >
                <GuillochePatternSvg themeId={formData.cardTheme || 'obsidian-gold'} opacity={0.20} />
                <HologramEmblemSvg themeId={formData.cardTheme || 'obsidian-gold'} />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-13 h-13 rounded-xl overflow-hidden ring-2 ring-amber-400/80 p-0.5 bg-white/10 backdrop-blur-md shadow-sm shrink-0">
                      <img
                        src={formData.avatar || ASSETS.cardAvatar}
                        alt="Card Avatar"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white uppercase leading-tight">
                        {formData.name}
                      </h4>
                      <div className={`text-[11px] ${currentTheme.textColor} font-medium`}>
                        {formData.thaiName}
                      </div>
                      <div className="text-[10px] text-white/70 font-mono">
                        ID: {formData.studentId}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <SmartChipSvg size={30} isGold={currentTheme.goldOrSilver === 'gold'} />
                    <span className="text-[8px] font-mono font-bold tracking-widest text-white/60">
                      NFC
                    </span>
                  </div>
                </div>
              </div>

              {/* Theme Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  เลือกลายบัตรดิจิทัล (Smart Card Theme)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(CARD_THEMES).map(([themeKey, themeCfg]) => {
                    const isSelected = (formData.cardTheme || 'obsidian-gold') === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => handleInputChange('cardTheme', themeKey)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[#1550d3] bg-blue-50/50 ring-2 ring-[#1550d3]/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${themeCfg.bgGradient} border ${themeCfg.borderColor} shadow-xs shrink-0`}
                          />
                          <div>
                            <div className="font-bold text-xs text-slate-900">{themeCfg.name}</div>
                            <div className="text-[10px] text-slate-500">{themeCfg.accentColor}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[#1550d3] text-[20px]">
                            check_circle
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              {isSaving && (
                <span className="text-blue-600 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                  กำลังบันทึกข้อมูล...
                </span>
              )}
              {saveSuccess && (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  บันทึกข้อมูลและอัปเดตบัตรสำเร็จ!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving || saveSuccess}
                className="px-6 py-2.5 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {saveSuccess ? 'check_circle' : isSaving ? 'sync' : 'save'}
                </span>
                <span>
                  {saveSuccess ? 'บันทึกเรียบร้อย!' : isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
