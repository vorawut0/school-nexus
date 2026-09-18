import React, { useState } from 'react';
import { RoomBooking } from '../../types';

interface BookingDetailModalProps {
  booking: RoomBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelBooking: (bookingId: string) => void;
  onUnlockDoor?: (bookingId: string) => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  isOpen,
  onClose,
  onCancelBooking,
  onUnlockDoor,
}) => {
  const [unlocking, setUnlocking] = useState<boolean>(false);
  const [unlockedSuccess, setUnlockedSuccess] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  if (!isOpen || !booking) return null;

  const handleSimulateUnlock = () => {
    setUnlocking(true);
    setTimeout(() => {
      setUnlocking(false);
      setUnlockedSuccess(true);
      if (onUnlockDoor) {
        onUnlockDoor(booking.id);
      }
      setTimeout(() => {
        setUnlockedSuccess(false);
      }, 4000);
    }, 1000);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(booking.passCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#121b2e] text-white rounded-[32px] max-w-md w-full shadow-2xl overflow-hidden border border-slate-700 flex flex-col animate-scaleIn">
        {/* Top Header */}
        <div className="p-5 bg-[#18233a] border-b border-slate-700/80 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <span className="material-symbols-outlined text-[22px]">{booking.facilityIcon || 'meeting_room'}</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-white">บัตรผ่านประตูดิจิทัล (Smart Pass)</h3>
              <p className="text-[11px] text-slate-400">ระบบเข้าถึงห้องเรียนอัจฉริยะแบบไร้สัมผัส</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col items-center gap-4">
          {/* Main Pass Container */}
          <div className="w-full bg-gradient-to-br from-[#18233a] to-[#0f172a] p-5 rounded-2xl border border-cyan-500/30 shadow-lg relative overflow-hidden flex flex-col gap-3.5">
            {/* Corner Hologram badge */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-700">
              <div>
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest block">
                  ROOM RESERVATION PASS
                </span>
                <h4 className="font-bold text-base text-white mt-0.5">{booking.roomName}</h4>
                <p className="text-xs text-slate-300">{booking.facilityName}</p>
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  booking.status === 'confirmed'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {booking.status === 'confirmed' ? 'พร้อมเข้าใช้งาน' : 'ยกเลิกแล้ว'}
              </span>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">วันที่จอง</span>
                <span className="font-semibold text-slate-100">{booking.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">ช่วงเวลา</span>
                <span className="font-bold text-cyan-300">{booking.timeSlot}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">ผู้จอง (Student)</span>
                <span className="text-slate-200">{booking.bookedBy}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">จำนวนผู้ร่วมห้อง</span>
                <span className="text-slate-200">{booking.attendeesCount} คน</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 block">วัตถุประสงค์</span>
                <span className="text-slate-200 text-xs">{booking.purpose}</span>
              </div>
            </div>

            {/* Passcode Block */}
            <div className="bg-black/50 p-4 rounded-xl border border-slate-700/80 flex items-center justify-between mt-1">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                  DOOR ACCESS PIN / NFC KEY
                </span>
                <span className="text-2xl font-mono font-bold text-amber-300 tracking-widest">
                  {booking.passCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1 border border-white/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {copiedCode ? 'check' : 'content_copy'}
                </span>
                <span>{copiedCode ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>

            {/* Equipment list if any */}
            {booking.equipment && booking.equipment.length > 0 && (
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-[10px] text-slate-400 font-semibold">อุปกรณ์ที่เปิดใช้งาน:</span>
                <div className="flex flex-wrap gap-1">
                  {booking.equipment.map((eq, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200 text-[10px] border border-blue-500/30"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Door Unlock Simulation Trigger */}
          {booking.status === 'confirmed' && (
            <div className="w-full flex flex-col gap-2">
              {unlockedSuccess ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-scaleIn">
                  <span className="material-symbols-outlined text-[22px] text-emerald-400">lock_open</span>
                  <span>ปลดล็อกประตู {booking.roomName} สำเร็จ! เชิญเข้าห้องได้</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSimulateUnlock}
                  disabled={unlocking}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-2xl shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-[20px] ${unlocking ? 'animate-spin' : ''}`}>
                    {unlocking ? 'sync' : 'contactless'}
                  </span>
                  <span>{unlocking ? 'กำลังส่งสัญญาณ NFC ปลดล็อก...' : 'แตะส่งสัญญาณ NFC ปลดล็อกประตูดิจิทัล (Unlock Door)'}</span>
                </button>
              )}
            </div>
          )}

          {/* Cancel Booking confirmation */}
          {showCancelConfirm ? (
            <div className="w-full bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl flex flex-col gap-2 text-xs animate-fadeIn">
              <span className="text-rose-300 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-base">warning</span>
                คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองห้องนี้?
              </span>
              <p className="text-[11px] text-slate-400">
                เมื่อยกเลิกแล้ว ช่วงเวลานี้จะเปิดว่างให้เพื่อนคนอื่นจองแทนทันที
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold cursor-pointer"
                >
                  ไม่ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCancelBooking(booking.id);
                    setShowCancelConfirm(false);
                    onClose();
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 font-bold cursor-pointer"
                >
                  ยืนยันยกเลิกจอง
                </button>
              </div>
            </div>
          ) : (
            booking.status === 'confirmed' && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 py-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">cancel</span>
                <span>ต้องการยกเลิกการจองห้องนี้</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
