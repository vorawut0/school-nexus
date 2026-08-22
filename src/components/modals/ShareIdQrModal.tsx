import React, { useState, useEffect } from 'react';
import { ASSETS } from '../../data/mockData';
import { UserProfile } from '../../types';

interface ShareIdQrModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner?: () => void;
}

export const ShareIdQrModal: React.FC<ShareIdQrModalProps> = ({
  user,
  isOpen,
  onClose,
  onOpenScanner,
}) => {
  const [includeGpa, setIncludeGpa] = useState<boolean>(true);
  const [includeStatus, setIncludeStatus] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'preview'>('qr');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const publicVerificationUrl = `https://schoolnexus.ac.th/verify/student/${user.studentId}`;

  // Deterministic 21x21 QR matrix generated based on user ID and public metadata
  const generateQrMatrix = () => {
    const size = 25;
    const matrix: boolean[][] = Array(size)
      .fill(false)
      .map(() => Array(size).fill(false));

    // Seed based on student ID string
    let seed = 0;
    for (let i = 0; i < user.studentId.length; i++) {
      seed = (seed * 31 + user.studentId.charCodeAt(i)) % 100000;
    }

    // Helper: Finder Pattern (7x7 with inner 3x3)
    const drawFinderPattern = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[startY + r][startX + c] = true;
          } else {
            matrix[startY + r][startX + c] = false;
          }
        }
      }
    };

    // Draw 3 standard corner finder patterns
    drawFinderPattern(0, 0); // Top-left
    drawFinderPattern(size - 7, 0); // Top-right
    drawFinderPattern(0, size - 7); // Bottom-left

    // Timing lines
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Fill data area pseudorandomly with deterministic hash
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder areas
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= size - 8) ||
          (r >= size - 8 && c < 8) ||
          (r === 6 || c === 6)
        ) {
          continue;
        }

        // Leave center 5x5 for logo
        const center = Math.floor(size / 2);
        if (Math.abs(r - center) <= 2 && Math.abs(c - center) <= 2) {
          matrix[r][c] = false;
          continue;
        }

        const pseudoVal = Math.sin(seed + r * 13 + c * 37) * 10000;
        matrix[r][c] = pseudoVal - Math.floor(pseudoVal) > 0.48;
      }
    }

    return { size, matrix };
  };

  const { size: qrSize, matrix: qrMatrix } = generateQrMatrix();

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(publicVerificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadBadge = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[32px] max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-scaleIn my-auto"
      >
        {/* Header with explicit close cross button */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1550d3] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#121b2e]">แชร์ QR บัตรประจำตัว</h3>
              <p className="text-[11px] text-[#737686]">Share My ID as QR Code</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างแชร์ QR"
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/80 hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition-all cursor-pointer border border-slate-300/60 active:scale-95 shadow-xs"
            title="กดกากบาทเพื่อปิด (Esc)"
          >
            <span className="text-xs font-bold hidden sm:inline">ปิด</span>
            <span className="material-symbols-outlined text-[18px] font-bold">close</span>
          </button>
        </div>

        {/* Tab switch (QR vs Public Preview) */}
        <div className="px-5 pt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-[#1550d3] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">qr_code</span>
            <span>QR Code บัตร</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-[#1550d3] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>ตัวอย่างโปรไฟล์สาธารณะ</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex flex-col items-center">
          {activeTab === 'qr' ? (
            <div className="w-full flex flex-col items-center">
              {/* QR Badge Card */}
              <div
                id="digital-qr-badge"
                className="w-full bg-gradient-to-b from-[#121b2e] via-[#1a253d] to-[#0f172a] rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col items-center relative overflow-hidden border border-slate-700/60"
              >
                {/* Glow effects */}
                <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#1550d3] rounded-full blur-3xl opacity-30 pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#7857f8] rounded-full blur-3xl opacity-30 pointer-events-none" />

                {/* Identity Header */}
                <div className="w-full flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                  <img
                    src={user.avatar || ASSETS.cardAvatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-400/40 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">
                      {user.role === 'student' ? 'STUDENT IDENTIFIER' : 'NEXUS IDENTITY'}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-white truncate">
                      {user.name}
                    </h4>
                    <p className="text-xs text-slate-300 truncate">{user.thaiName}</p>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-white/10 text-cyan-300 text-[10px] font-mono font-bold">
                    {user.studentId}
                  </div>
                </div>

                {/* Styled Vector QR Code Display */}
                <div className="p-3 bg-white rounded-2xl shadow-2xl relative group flex items-center justify-center">
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${qrSize}, minmax(0, 1fr))`,
                      width: '180px',
                      height: '180px',
                    }}
                  >
                    {qrMatrix.map((row, rIdx) =>
                      row.map((cell, cIdx) => (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`${
                            cell ? 'bg-[#121b2e]' : 'bg-transparent'
                          } transition-colors duration-200`}
                        />
                      ))
                    )}
                  </div>

                  {/* Centered Logo Badge */}
                  <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center p-1">
                    <img
                      src={ASSETS.logo}
                      alt="Nexus Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Scan Instructions */}
                <div className="mt-4 text-center">
                  <span className="text-xs text-slate-300 font-medium block">
                    ยื่นหน้าจอนี้ให้เพื่อนหรืออาจารย์สแกน
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    เพื่อเพิ่มเพื่อน, ยืนยันสิทธิ์เข้าห้อง หรือเช็กชื่อกิจกรรม
                  </p>
                </div>
              </div>

              {/* Privacy / Display Preferences */}
              <div className="w-full bg-slate-50 rounded-2xl p-3.5 mt-3 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-600 uppercase block mb-2">
                  ข้อมูลที่แสดงเมื่อผู้อื่นสแกน (Public Data)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                    <input
                      type="checkbox"
                      checked={includeGpa}
                      onChange={(e) => setIncludeGpa(e.target.checked)}
                      className="rounded text-[#1550d3] focus:ring-[#1550d3] w-4 h-4"
                    />
                    <span>แสดงผลการเรียน (GPA)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                    <input
                      type="checkbox"
                      checked={includeStatus}
                      onChange={(e) => setIncludeStatus(e.target.checked)}
                      className="rounded text-[#1550d3] focus:ring-[#1550d3] w-4 h-4"
                    />
                    <span>แสดงสถานะนักเรียน (Active)</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons (Copy, Download, Scan) */}
              <div className="w-full grid grid-cols-2 gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 active:scale-98"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copied ? 'check_circle' : 'content_copy'}
                  </span>
                  <span>{copied ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์โปรไฟล์'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBadge}
                  className="py-2.5 px-3 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-98"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {downloaded ? 'done_all' : 'download'}
                  </span>
                  <span>{downloaded ? 'บันทึกรูปบัตรสำเร็จ' : 'บันทึกรูปภาพ QR'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Preview of Public Profile when Scanned */
            <div className="w-full flex flex-col gap-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[18px]">info</span>
                <span>นี่คือหน้าโปรไฟล์สาธารณะที่ผู้อื่นจะเห็นเมื่อสแกน QR Code ของคุณ</span>
              </div>

              {/* Public Profile Card */}
              <div className="bg-white rounded-2xl border-2 border-blue-500/20 p-5 shadow-lg flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Verified Identity</span>
                </div>

                <img
                  src={user.avatar || ASSETS.cardAvatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-blue-50 shadow-md mb-3"
                />

                <h4 className="font-bold text-base text-[#121b2e]">{user.name}</h4>
                <p className="text-xs text-slate-500 font-medium">{user.thaiName}</p>

                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1550d3] font-mono text-xs font-bold">
                  <span>ID:</span>
                  <span>{user.studentId}</span>
                </div>

                <div className="w-full grid grid-cols-2 gap-2 mt-4 text-left text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {user.role === 'student' ? (
                    <>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ระดับชั้น / ห้อง</span>
                        <span className="font-semibold text-slate-800">{user.grade || 'ม.6/1'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">แผนการเรียน</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {user.studyTrack || 'วิทยาศาสตร์-คณิตศาสตร์'}
                        </span>
                      </div>
                      {includeGpa && (
                        <div>
                          <span className="text-slate-400 block text-[10px]">GPAX</span>
                          <span className="font-bold text-emerald-600">
                            {user.gpa ? user.gpa.toFixed(2) : '3.92'}
                          </span>
                        </div>
                      )}
                      {includeStatus && (
                        <div>
                          <span className="text-slate-400 block text-[10px]">สถานะนักเรียน</span>
                          <span className="font-bold text-emerald-600">
                            {user.dutyStatus || 'กำลังศึกษา (Active)'}
                          </span>
                        </div>
                      )}
                      <div className="col-span-2 pt-1 border-t border-slate-200/60">
                        <span className="text-slate-400 block text-[10px]">อาจารย์ที่ปรึกษา</span>
                        <span className="font-medium text-slate-700">{user.advisor || 'ดร. สมนึก เจริญศิลป์'}</span>
                      </div>
                    </>
                  ) : user.role === 'teacher' ? (
                    <>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ตำแหน่ง</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {user.position || 'อาจารย์ชำนาญการพิเศษ'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">กลุ่มสาระฯ</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {user.department || 'วิทยาศาสตร์และเทคโนโลยี'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ห้องพักอาจารย์</span>
                        <span className="font-medium text-slate-700 truncate block">
                          {user.officeRoom || 'ห้อง 401 อาคาร 4'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">สถานะปฏิบัติงาน</span>
                        <span className="font-bold text-emerald-600">
                          {user.dutyStatus || 'ปฏิบัติการสอน (Active)'}
                        </span>
                      </div>
                    </>
                  ) : user.role === 'admin' ? (
                    <>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ตำแหน่งหน้าที่</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {user.position || 'ผู้ดูแลระบบไอที'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">หน่วยงาน</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {user.department || 'ศูนย์เทคโนโลยีสารสนเทศ'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">สถานที่ปฏิบัติงาน</span>
                        <span className="font-medium text-slate-700 truncate block">
                          {user.officeRoom || 'Server Room อาคาร 1'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">สถานะระบบ</span>
                        <span className="font-bold text-emerald-600">
                          {user.dutyStatus || 'ปฏิบัติหน้าที่ (Active)'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">นักเรียนในความดูแล</span>
                        <span className="font-semibold text-slate-800">
                          {user.childName || 'วรวุฒิ เพ็ชรราย (ม.6/1)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">สังกัด</span>
                        <span className="font-medium text-slate-700 truncate block">
                          {user.department || 'สมาคมผู้ปกครองและครู'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">สถานะการยืนยัน</span>
                        <span className="font-bold text-emerald-600">
                          {user.dutyStatus || 'ยืนยันตัวตนแล้ว (Verified)'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenScanner();
                    }}
                    className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                    <span>เปิดกล้องสแกนเพื่อทดสอบสแกนบัตรคนอื่น</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bottom Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            <span>ปิดหน้าต่างแชร์ QR (Exit)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
