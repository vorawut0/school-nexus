import React, { useState, useEffect } from 'react';
import { Facility, FacilityRoom, RoomBooking, UserProfile } from '../../types';

interface FacilityModalProps {
  facility: Facility | null;
  user: UserProfile;
  isOpen?: boolean;
  onClose: () => void;
  onConfirmBooking: (booking: Omit<RoomBooking, 'id' | 'bookedAt' | 'status'>) => void;
  existingBookings?: RoomBooking[];
  onOpenCampusMap?: () => void;
}

const TIME_SLOTS = [
  { id: 'ts-1', label: '08:30 - 10:30 น.', start: '08:30', end: '10:30', period: 'ช่วงเช้า (Morning)' },
  { id: 'ts-2', label: '10:30 - 12:30 น.', start: '10:30', end: '12:30', period: 'ช่วงสาย (Late Morning)' },
  { id: 'ts-3', label: '13:00 - 15:00 น.', start: '13:00', end: '15:00', period: 'ช่วงบ่าย (Afternoon)' },
  { id: 'ts-4', label: '15:30 - 17:30 น.', start: '15:30', end: '17:30', period: 'ช่วงเย็น (Late Afternoon)' },
  { id: 'ts-5', label: '18:00 - 20:00 น.', start: '18:00', end: '20:00', period: 'ช่วงค่ำ (Evening Study)' },
];

export const FacilityModal: React.FC<FacilityModalProps> = ({
  facility,
  user,
  onClose,
  onConfirmBooking,
  existingBookings = [],
  onOpenCampusMap,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'book' | 'history'>('book');
  
  // Booking Form States
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [dateType, setDateType] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('ts-3');
  const [purpose, setPurpose] = useState<string>('ทำโครงงานวิชาการกลุ่ม');
  const [attendeesCount, setAttendeesCount] = useState<number>(4);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  
  // UI states
  const [bookingSuccess, setBookingSuccess] = useState<RoomBooking | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Set default room when facility changes
  useEffect(() => {
    if (facility && facility.rooms && facility.rooms.length > 0) {
      setSelectedRoomId(facility.rooms[0].id);
      if (facility.rooms[0].equipment && facility.rooms[0].equipment.length > 0) {
        setSelectedEquipment(facility.rooms[0].equipment.slice(0, 2));
      }
    }
    setBookingSuccess(null);
  }, [facility]);

  if (!facility) return null;

  const currentRooms = facility.rooms || [];
  const selectedRoom = currentRooms.find((r) => r.id === selectedRoomId) || currentRooms[0];
  const selectedSlot = TIME_SLOTS.find((s) => s.id === selectedSlotId) || TIME_SLOTS[2];

  // Formatted date string
  const getFormattedDate = () => {
    const today = new Date();
    if (dateType === 'today') {
      return `วันนี้ (${today.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    }
    if (dateType === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return `พรุ่งนี้ (${tomorrow.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    }
    const [y, m, d] = customDate.split('-');
    return `${parseInt(d, 10)}/${parseInt(m, 10)}/${parseInt(y, 10) + 543}`;
  };

  const handleToggleEquipment = (eq: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    // Generate smart passcode and QR payload
    const randomPass = 'NX-' + Math.floor(1000 + Math.random() * 9000);
    const dateStr = getFormattedDate();
    const qrPayload = `SN-BOOKING-${selectedRoom.code}-${randomPass}-${Date.now().toString().slice(-6)}`;

    const newBookingData = {
      facilityId: facility.id,
      facilityName: facility.name,
      facilityIcon: facility.icon,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      roomCode: selectedRoom.code,
      date: dateStr,
      timeSlot: selectedSlot.label,
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
      purpose: purpose.trim() || 'ใช้งานพื้นที่การเรียนรู้และการทำโครงงาน',
      attendeesCount: attendeesCount,
      equipment: selectedEquipment,
      passCode: randomPass,
      qrValue: qrPayload,
      bookedBy: user.thaiName || user.name,
      unlocked: false,
    };

    onConfirmBooking(newBookingData);

    const completeBooking: RoomBooking = {
      ...newBookingData,
      id: 'bk-' + Date.now(),
      status: 'confirmed',
      bookedAt: 'เมื่อสักครู่',
    };

    setBookingSuccess(completeBooking);
  };

  const facilityBookings = existingBookings.filter(
    (b) => b.facilityId === facility.id && b.status !== 'cancelled'
  );

  const handleCopyPasscode = () => {
    if (bookingSuccess) {
      navigator.clipboard?.writeText(bookingSuccess.passCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-scaleIn my-auto max-h-[92vh]">
        {/* Header Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#121b2e] to-[#1e2f52] text-white flex justify-between items-start shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(#1550d3_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
          
          <div className="flex items-center gap-3.5 z-10">
            <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md text-cyan-300 flex items-center justify-center border border-white/20 shadow-inner">
              <span className="material-symbols-outlined text-[30px] fill-1">{facility.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {facility.name}
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{facility.category}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex border-b border-slate-200 bg-[#f9f9ff] px-5 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('book');
              setBookingSuccess(null);
            }}
            className={`pb-2.5 px-3.5 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'book'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-[#737686] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">calendar_add_on</span>
            <span>จองห้องใช้งาน (Book Room)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3.5 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-[#737686] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">sensors</span>
            <span>ข้อมูลและสถิติสด</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3.5 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ml-auto ${
              activeTab === 'history'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-[#737686] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">bookmark_check</span>
            <span>การจองที่นี่ ({facilityBookings.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          {/* TAB 1: Booking Success Screen */}
          {bookingSuccess ? (
            <div className="flex flex-col items-center gap-4 py-2 animate-scaleIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50 border border-emerald-500/30">
                <span className="material-symbols-outlined text-[36px]">verified</span>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-[#121b2e]">จองห้องสำเร็จเรียบร้อย!</h3>
                <p className="text-xs text-[#434654] mt-1">
                  ระบบได้บันทึกการจองและสร้าง <b>บัตรผ่านประตูดิจิทัล (Smart Pass)</b> ให้คุณแล้ว
                </p>
              </div>

              {/* Digital Pass Card */}
              <div className="w-full bg-gradient-to-br from-[#121b2e] to-[#1e2f52] text-white p-5 rounded-3xl shadow-xl border border-slate-700/60 relative overflow-hidden flex flex-col gap-3.5">
                <div className="flex justify-between items-start pb-3 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                      CAMPUS DIGITAL ACCESS PASS
                    </span>
                    <h4 className="font-bold text-base text-white mt-0.5">{bookingSuccess.roomName}</h4>
                    <span className="text-xs text-slate-300">{bookingSuccess.facilityName}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                    ยืนยันแล้ว ✓
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">วันที่จอง</span>
                    <span className="font-semibold text-slate-200">{bookingSuccess.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ช่วงเวลา</span>
                    <span className="font-bold text-cyan-300">{bookingSuccess.timeSlot}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ผู้จอง</span>
                    <span className="text-slate-200">{bookingSuccess.bookedBy} ({bookingSuccess.attendeesCount} คน)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">วัตถุประสงค์</span>
                    <span className="text-slate-300 truncate block">{bookingSuccess.purpose}</span>
                  </div>
                </div>

                {/* Passcode & Door Unlock Code */}
                <div className="mt-1 bg-black/40 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      รหัสเปิดประตูดิจิทัล (DOOR PASSCODE)
                    </span>
                    <span className="text-xl font-mono font-bold text-amber-300 tracking-widest">
                      {bookingSuccess.passCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPasscode}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {copiedCode ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCode ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/5 p-2 rounded-xl">
                  <span className="material-symbols-outlined text-cyan-400 text-base">contactless</span>
                  <span>สามารถแตะบัตรนักเรียน RFID / สแกน QR หน้าห้องเพื่อเปิดประตูอัตโนมัติ</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex gap-2">
                <button
                  type="button"
                  onClick={() => setBookingSuccess(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#121b2e] font-bold text-xs transition-colors cursor-pointer"
                >
                  จองห้องอื่นเพิ่ม
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
                >
                  เสร็จสิ้น / ปิดหน้าต่าง
                </button>
              </div>
            </div>
          ) : activeTab === 'book' ? (
            /* TAB 1: Booking Form */
            <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
              {/* Step 1: Select Room */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#121b2e] uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#1550d3] text-white flex items-center justify-center text-[10px]">1</span>
                    เลือกห้องที่ต้องการใช้งาน
                  </span>
                  <span className="text-[11px] text-[#737686] font-normal">
                    {currentRooms.length} ห้องในอาคารนี้
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentRooms.map((room) => {
                    const isSelected = room.id === selectedRoomId;
                    const isAvailable = room.status === 'available';

                    return (
                      <div
                        key={room.id}
                        onClick={() => {
                          setSelectedRoomId(room.id);
                          if (room.equipment && room.equipment.length > 0) {
                            setSelectedEquipment(room.equipment.slice(0, 2));
                          }
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'border-[#1550d3] bg-[#1550d3]/5 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-1">
                            <span className="font-bold text-xs text-[#121b2e] block truncate">
                              {room.name}
                            </span>
                            <span className="text-[10px] text-[#737686] block font-mono">
                              รหัส: {room.code} • {room.floor}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isAvailable ? 'ว่าง' : 'คนเยอะ'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-[10px] text-[#434654]">
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[13px]">person</span>
                            จุ {room.capacity} คน
                          </span>
                          {room.specs?.screen && (
                            <span className="flex items-center gap-0.5 truncate">
                              <span className="material-symbols-outlined text-[13px]">tv</span>
                              {room.specs.screen}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Date & Time Slot */}
              <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-bold text-[#121b2e] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#1550d3] text-white flex items-center justify-center text-[10px]">2</span>
                  เลือกวันที่และช่วงเวลา
                </label>

                {/* Date Selector Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDateType('today')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      dateType === 'today'
                        ? 'bg-[#1550d3] text-white border-[#1550d3] shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-[#434654] border-slate-200'
                    }`}
                  >
                    📅 วันนี้ (Today)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateType('tomorrow')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      dateType === 'tomorrow'
                        ? 'bg-[#1550d3] text-white border-[#1550d3] shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-[#434654] border-slate-200'
                    }`}
                  >
                    ☀️ พรุ่งนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateType('custom')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      dateType === 'custom'
                        ? 'bg-[#1550d3] text-white border-[#1550d3] shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-[#434654] border-slate-200'
                    }`}
                  >
                    🗓️ เลือกวันเอง
                  </button>
                </div>

                {dateType === 'custom' && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#1550d3]"
                  />
                )}

                {/* Time Slots Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = slot.id === selectedSlotId;
                    return (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-[#1550d3] bg-[#1550d3]/5 text-[#1550d3]'
                            : 'border-slate-200 hover:border-slate-300 text-[#434654] bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">schedule</span>
                          <div>
                            <span className="font-bold text-xs block">{slot.label}</span>
                            <span className="text-[10px] text-[#737686]">{slot.period}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[#1550d3] text-[18px]">
                            check_circle
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Purpose & Attendees */}
              <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-bold text-[#121b2e] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#1550d3] text-white flex items-center justify-center text-[10px]">3</span>
                  วัตถุประสงค์และจำนวนผู้ร่วมใช้งาน
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="เช่น ติววิชาฟิสิกส์, ทำโปรเจกต์หุ่นยนต์..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#1550d3]"
                      required
                    />
                  </div>

                  <div>
                    <select
                      value={attendeesCount}
                      onChange={(e) => setAttendeesCount(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#1550d3]"
                    >
                      {Array.from({ length: Math.min(selectedRoom?.capacity || 20, 20) }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          👥 {n} คน
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Equipment Checklist */}
              {selectedRoom?.equipment && selectedRoom.equipment.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-[#434654] uppercase">
                    อุปกรณ์ที่ต้องการเปิดใช้งานอัตโนมัติ (Smart IoT Setup):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoom.equipment.map((eq) => {
                      const isChecked = selectedEquipment.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => handleToggleEquipment(eq)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                            isChecked
                              ? 'bg-blue-50 text-[#1550d3] border-blue-200 font-semibold'
                              : 'bg-slate-50 text-[#737686] border-slate-200'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isChecked ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                          <span>{eq}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#1550d3] hover:bg-[#1a53d6] text-white rounded-2xl font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                  <span>ยืนยันการจองห้อง {selectedRoom?.name}</span>
                </button>
              </div>
            </form>
          ) : activeTab === 'info' ? (
            /* TAB 2: Facility Telemetry & Info */
            <div className="flex flex-col gap-4">
              <div className="text-xs text-[#434654] leading-relaxed bg-[#f1f3ff] p-4 rounded-2xl border border-blue-100">
                {facility.description || 'ศูนย์ปฏิบัติการและพื้นที่การเรียนรู้ดิจิทัลอัจฉริยะ'}
              </div>

              {/* Environmental Telemetry Grid */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="material-symbols-outlined text-[#1550d3] text-xl block">
                    thermostat
                  </span>
                  <span className="text-[10px] font-semibold text-[#737686] uppercase block mt-0.5">
                    อุณหภูมิเฉลี่ย
                  </span>
                  <span className="text-sm font-bold text-[#121b2e] block">
                    {facility.temperature || '23.5°C'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="material-symbols-outlined text-[#00694d] text-xl block">
                    air
                  </span>
                  <span className="text-[10px] font-semibold text-[#737686] uppercase block mt-0.5">
                    อากาศ (AQI)
                  </span>
                  <span className="text-sm font-bold text-[#121b2e] block">
                    {facility.airQuality || 'AQI 15'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="material-symbols-outlined text-[#7857f8] text-xl block">
                    wifi
                  </span>
                  <span className="text-[10px] font-semibold text-[#737686] uppercase block mt-0.5">
                    Wi-Fi Load
                  </span>
                  <span className="text-sm font-bold text-[#121b2e] block">
                    {facility.wifiLoad || '60%'}
                  </span>
                </div>
              </div>

              {/* Occupancy Progress */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#434654]">ความหนาแน่นของผู้ใช้งานปัจจุบัน</span>
                  <span className="font-bold text-[#121b2e]">
                    {facility.occupancy || 120} / {facility.capacity || 200} คน
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#1550d3] h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((facility.occupancy || 120) / (facility.capacity || 200)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Campus Map Link */}
              {onOpenCampusMap && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCampusMap();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#1550d3] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">map</span>
                  <span>ดูตำแหน่งอาคารบนแผนผังแคมปัสแบบ 3D</span>
                </button>
              )}
            </div>
          ) : (
            /* TAB 3: History & Bookings for this facility */
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-[#121b2e] uppercase tracking-wider">
                รายการจองที่อยู่ในอาคารนี้ ({facilityBookings.length} รายการ)
              </span>

              {facilityBookings.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-3xl">
                    event_busy
                  </span>
                  <p className="text-xs text-slate-500">ยังไม่มีประวัติการจองห้องในอาคารนี้</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('book')}
                    className="mt-1 px-4 py-1.5 rounded-xl bg-[#1550d3] text-white text-xs font-semibold hover:bg-[#1a53d6] cursor-pointer"
                  >
                    เริ่มจองห้องเลย
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {facilityBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-xs text-[#121b2e]">{b.roomName}</h4>
                          <p className="text-[11px] text-[#737686]">{b.date} • {b.timeSlot}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          {b.status === 'confirmed' ? 'ยืนยันแล้ว' : b.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                        <span className="text-[11px] text-[#434654]">
                          รหัสผ่าน: <b className="font-mono text-[#1550d3]">{b.passCode}</b>
                        </span>
                        <span className="text-[10px] text-slate-500">จองเมื่อ {b.bookedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
