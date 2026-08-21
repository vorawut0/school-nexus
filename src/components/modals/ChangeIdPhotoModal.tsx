import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../../types';
import { ASSETS } from '../../data/mockData';
import { CARD_THEMES, GuillochePatternSvg, SmartChipSvg, HologramEmblemSvg } from '../common/SmartIdCardGraphics';
import { compressImageFile } from '../../utils/imageUtils';

interface ChangeIdPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaveAvatar: (newAvatarUrl: string) => void;
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

export const ChangeIdPhotoModal: React.FC<ChangeIdPhotoModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveAvatar,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string>(user.avatar || ASSETS.cardAvatar);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedPhoto(user.avatar || ASSETS.cardAvatar);
      setZoomLevel(1);
      setSavedSuccess(false);
      setIsProcessing(false);
    }
  }, [isOpen, user.avatar]);

  if (!isOpen) return null;

  const cardThemeCfg = CARD_THEMES[user.cardTheme || 'obsidian-gold'] || CARD_THEMES['obsidian-gold'];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessing(true);
        const compressed = await compressImageFile(file);
        setSelectedPhoto(compressed);
        setZoomLevel(1);
      } catch (err) {
        console.warn('Image processing fallback:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        setIsProcessing(true);
        const compressed = await compressImageFile(file);
        setSelectedPhoto(compressed);
        setZoomLevel(1);
      } catch (err) {
        console.warn('Image drop processing fallback:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    onSaveAvatar(selectedPhoto);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[32px] max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-5 sm:p-7 animate-scaleIn relative my-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1550d3] flex items-center justify-center border border-blue-200 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">account_circle</span>
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-[#121b2e] leading-tight">
                เปลี่ยนรูปโปรไฟล์ (Profile Photo)
              </h3>
              <p className="text-xs text-[#737686]">
                เปลี่ยนรูปโปรไฟล์ของคุณ โดยรูปนี้จะซิงค์และแสดงบนบัตรดิจิทัลโดยอัตโนมัติ
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

        {/* Live Preview: Profile Avatar + Card Preview */}
        <div className="mb-4">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>ตัวอย่างผลลัพธ์ที่จะแสดงในระบบและบนบัตรดิจิทัล</span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              ซิงค์อัตโนมัติ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
            {/* Profile Avatar with Prominent (+) Plus Button */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`bg-slate-50 border rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all ${
                isDragging ? 'border-[#1550d3] bg-blue-50/60 ring-2 ring-[#1550d3]/30' : 'border-slate-200'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">
                รูปโปรไฟล์ (แตะเพื่อเปลี่ยน)
              </span>

              {/* Avatar Circle with (+) Button overlay */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-22 h-22 rounded-full ring-3 ring-[#1550d3]/30 shadow-md cursor-pointer group bg-slate-200 transition-all hover:ring-[#1550d3]/60"
                title="คลิกเพื่อเลือกไฟล์รูปภาพใหม่"
              >
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img
                    src={selectedPhoto}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                </div>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                  <span className="material-symbols-outlined text-[24px]">add</span>
                  <span className="text-[9px] font-bold">เปลี่ยนรูป</span>
                </div>

                {/* Prominent (+) Plus Button Badge */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#1550d3] hover:bg-[#1242b3] active:scale-95 text-white flex items-center justify-center shadow-lg ring-3 ring-white transition-all">
                  <span className="material-symbols-outlined text-[20px] font-bold">add</span>
                </div>
              </div>

              {/* Action button beneath avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-[#1550d3] text-xs font-bold transition-all cursor-pointer active:scale-95 border border-blue-200/60 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px]">add_photo_alternate</span>
                <span>เลือกรูปใหม่ (+)</span>
              </button>
            </div>

            {/* Smart ID Card Preview */}
            <div
              className={`sm:col-span-2 relative rounded-[20px] overflow-hidden bg-gradient-to-br ${cardThemeCfg.bgGradient} text-white shadow-md p-3.5 border ${cardThemeCfg.borderColor} flex flex-col justify-between`}
            >
              <GuillochePatternSvg themeId={user.cardTheme || 'obsidian-gold'} opacity={0.20} />
              <HologramEmblemSvg themeId={user.cardTheme || 'obsidian-gold'} />

              <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                การแสดงผลบนบัตรดิจิทัล (Smart ID Card)
              </span>

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-13 h-13 rounded-xl overflow-hidden ring-2 ring-amber-400/80 p-0.5 bg-white/10 backdrop-blur-md shadow-sm shrink-0">
                    <img
                      src={selectedPhoto}
                      alt="Card Photo"
                      className="w-full h-full object-cover rounded-lg"
                      style={{ transform: `scale(${zoomLevel})` }}
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white uppercase leading-tight">
                      {user.name}
                    </h4>
                    <div className={`text-[11px] ${cardThemeCfg.textColor} font-medium`}>
                      {user.thaiName}
                    </div>
                    <div className="text-[10px] text-white/70 font-mono">
                      ID: {user.studentId}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <SmartChipSvg size={28} isGold={cardThemeCfg.goldOrSilver === 'gold'} />
                  <span className="text-[8px] font-mono font-bold tracking-widest text-white/60">
                    NFC
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preset School Avatars Quick Select */}
        <div className="mt-1">
          <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
            <span>หรือเลือกรูปโปรไฟล์ทางการของสถาบัน</span>
            <span className="text-slate-400 font-normal">แตะเพื่อเลือก</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_AVATARS.map((avatar) => {
              const isSelected = selectedPhoto === avatar.url;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    setSelectedPhoto(avatar.url);
                    setZoomLevel(1);
                  }}
                  className={`p-1 rounded-xl border transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? 'border-[#1550d3] bg-blue-50/70 ring-2 ring-[#1550d3]/30 scale-105 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  title={avatar.label}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100">
                    <img
                      src={avatar.url}
                      alt={avatar.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 truncate w-full text-center">
                    {avatar.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Zoom Adjustment Slider */}
        <div className="mt-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-500 text-[18px]">zoom_in</span>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>ปรับระดับการซูมรูปภาพ</span>
              <span>{Math.round(zoomLevel * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="2"
              step="0.05"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-full accent-[#1550d3] cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
          >
            รีเซ็ต
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={savedSuccess}
            className="px-6 py-2.5 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75"
          >
            <span className="material-symbols-outlined text-[18px]">
              {savedSuccess ? 'check_circle' : 'save'}
            </span>
            <span>{savedSuccess ? 'บันทึกรูปโปรไฟล์แล้ว!' : 'บันทึกรูปโปรไฟล์'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
