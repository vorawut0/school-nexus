import React, { useState } from 'react';
import { MOCK_FACILITIES, MOCK_DIGITAL_TWIN } from '../data/mockData';
import { Facility, DigitalTwinNode, RoomBooking } from '../types';
import { CampusPulseTab } from './modals/CampusPulseModal';
import { BookingDetailModal } from './modals/BookingDetailModal';

interface CampusViewProps {
  roomBookings: RoomBooking[];
  onOpenFacilityModal: (facility: Facility) => void;
  onOpenNodeModal: (node: DigitalTwinNode) => void;
  onOpenCampusMap: () => void;
  onOpenCampusPulse?: (tab?: CampusPulseTab) => void;
  onCancelBooking: (bookingId: string) => void;
  onUnlockDoor?: (bookingId: string) => void;
}

export const CampusView: React.FC<CampusViewProps> = ({
  roomBookings,
  onOpenFacilityModal,
  onOpenNodeModal,
  onOpenCampusMap,
  onOpenCampusPulse,
  onCancelBooking,
  onUnlockDoor,
}) => {
  const [activeTab, setActiveTab] = useState<'facilities' | 'my_bookings' | 'digital_twin'>('facilities');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<RoomBooking | null>(null);

  // Active confirmed bookings
  const activeBookings = roomBookings.filter((b) => b.status === 'confirmed');

  const filteredFacilities =
    filterCategory === 'all'
      ? MOCK_FACILITIES
      : filterCategory === 'lab'
      ? MOCK_FACILITIES.filter((f) => f.category.includes('คอมพิวเตอร์') || f.category.includes('วิทยาศาสตร์'))
      : filterCategory === 'library'
      ? MOCK_FACILITIES.filter((f) => f.category.includes('สมุด'))
      : filterCategory === 'studio'
      ? MOCK_FACILITIES.filter((f) => f.category.includes('สตูดิโอ') || f.category.includes('ศิลปะ'))
      : MOCK_FACILITIES;

  const getStatusBadge = (status: string, label: string) => {
    switch (status) {
      case 'open':
      case 'available':
        return (
          <div className="flex items-center gap-1.5 bg-[#20C997]/12 px-2.5 py-1 rounded-full border border-[#20C997]/25">
            <div className="w-2 h-2 rounded-full bg-[#20C997] animate-pulse" />
            <span className="text-[11px] font-bold text-[#00694d] uppercase tracking-wider">
              {label}
            </span>
          </div>
        );
      case 'busy':
        return (
          <div className="flex items-center gap-1.5 bg-[#FFB800]/15 px-2.5 py-1 rounded-full border border-[#FFB800]/30">
            <div className="w-2 h-2 rounded-full bg-[#FFB800]" />
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              {label}
            </span>
          </div>
        );
      case 'closed':
      default:
        return (
          <div className="flex items-center gap-1.5 bg-[#ba1a1a]/10 px-2.5 py-1 rounded-full border border-[#ba1a1a]/20">
            <div className="w-2 h-2 rounded-full bg-[#ba1a1a]" />
            <span className="text-[11px] font-bold text-[#ba1a1a] uppercase tracking-wider">
              {label}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col w-full relative pb-28 sm:pb-32 pt-4 sm:pt-6 px-3.5 sm:px-6 max-w-[1280px] mx-auto min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-5 sm:gap-7">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#121b2e] leading-snug tracking-tight">
              ดิจิทัลแคมปัส (Smart Campus & Room Booking)
            </h1>
            <p className="text-[#434654] text-xs sm:text-sm">
              แผนผังอาคาร ระบบจองห้องเรียนอัจฉริยะ และมอนิเตอร์สถานะ IoT แบบ Real-time
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              onClick={onOpenCampusMap}
              className="text-[#1550d3] text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 hover:bg-blue-50 bg-white px-3 py-2 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">map</span>
              <span>แผนผัง 3D</span>
            </button>

            {/* Quick trigger for popular room booking (CS Lab / Library) */}
            <button
              onClick={() => onOpenFacilityModal(MOCK_FACILITIES[2])}
              className="bg-[#1550d3] hover:bg-[#1a53d6] text-white text-xs sm:text-[13px] font-bold flex items-center gap-1.5 px-3.5 py-2 rounded-xl sm:rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              <span>จองห้องด่วน</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Active Bookings Widget */}
          <div
            onClick={() => setActiveTab('my_bookings')}
            className={`rounded-2xl p-5 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:-translate-y-1 transition-all border cursor-pointer ${
              activeTab === 'my_bookings'
                ? 'bg-[#1550d3] text-white border-[#1550d3] shadow-md'
                : 'bg-gradient-to-br from-[#e0e7ff] to-[#eef2ff] text-[#121b2e] border-white/80'
            }`}
          >
            <div className="flex justify-between items-center z-10">
              <span className={`material-symbols-outlined text-[28px] ${activeTab === 'my_bookings' ? 'text-white' : 'text-[#1550d3]'}`}>
                meeting_room
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'my_bookings' ? 'bg-white/20 text-white' : 'bg-[#1550d3]/10 text-[#1550d3]'}`}>
                {activeBookings.length > 0 ? `${activeBookings.length} ห้องที่จองไว้` : 'ยังไม่มีการจอง'}
              </span>
            </div>
            <span className="text-[28px] sm:text-[34px] font-bold mt-1 z-10 leading-tight">
              {activeBookings.length}
            </span>
            <span className={`text-[12px] font-medium z-10 ${activeTab === 'my_bookings' ? 'text-blue-100' : 'text-[#434654]'}`}>
              รายการจองห้องของฉัน ➔
            </span>
          </div>

          <div
            onClick={() => onOpenCampusPulse && onOpenCampusPulse('students')}
            className="bg-[#e9edff]/70 hover:bg-[#e9edff] rounded-2xl p-5 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:-translate-y-1 transition-transform border border-white/60 cursor-pointer"
            title="ดูสถิตินักเรียนใน Campus Pulse"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#1550d3]/10 to-transparent pointer-events-none" />
            <div className="flex justify-between items-center z-10">
              <span className="material-symbols-outlined text-[#1550d3] text-[28px] fill-1">
                groups
              </span>
              <span className="text-[10px] font-bold text-[#1550d3] opacity-0 group-hover:opacity-100 transition-opacity">
                ดูสถิติ ➔
              </span>
            </div>
            <span className="text-[28px] sm:text-[34px] font-bold text-[#121b2e] mt-1 z-10 leading-tight">
              4,201
            </span>
            <span className="text-[12px] font-medium text-[#434654] z-10">
              นักเรียนในแคมปัส
            </span>
          </div>

          <div
            onClick={() => onOpenCampusPulse && onOpenCampusPulse('online')}
            className="bg-[#e9edff]/70 hover:bg-[#e9edff] rounded-2xl p-5 shadow-sm flex flex-col gap-1 relative overflow-hidden group hover:-translate-y-1 transition-transform border border-white/60 cursor-pointer"
            title="ดูสถานะเครือข่าย IoT & Online ใน Campus Pulse"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#008562]/10 to-transparent pointer-events-none" />
            <div className="flex justify-between items-center z-10">
              <span className="material-symbols-outlined text-[#008562] text-[28px] fill-1">
                sensors
              </span>
              <span className="text-[10px] font-bold text-[#008562] opacity-0 group-hover:opacity-100 transition-opacity">
                ดูสถิติ ➔
              </span>
            </div>
            <span className="text-[28px] sm:text-[34px] font-bold text-[#121b2e] mt-1 z-10 leading-tight">
              92%
            </span>
            <span className="text-[12px] font-medium text-[#434654] z-10">
              สถานะเครือข่าย IoT
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('facilities')}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'facilities'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-[#737686] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">domain</span>
            <span>อาคารและห้องเรียนทั้งหมด</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_bookings')}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap relative ${
              activeTab === 'my_bookings'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-[#737686] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
            <span>รายการจองห้องของฉัน</span>
            {activeBookings.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#1550d3] text-white text-[11px] font-bold flex items-center justify-center">
                {activeBookings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('digital_twin')}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'digital_twin'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-[#737686] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">radar</span>
            <span>ระบบจำลอง IoT (Digital Twin)</span>
          </button>
        </div>

        {/* SECTION 1: FACILITIES & ROOM BOOKING DIRECTORY */}
        {activeTab === 'facilities' && (
          <section className="flex flex-col gap-4 animate-fadeIn">
            {/* Category Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterCategory === 'all'
                    ? 'bg-[#121b2e] text-white'
                    : 'bg-white text-[#434654] hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ทั้งหมด ({MOCK_FACILITIES.length})
              </button>
              <button
                onClick={() => setFilterCategory('lab')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterCategory === 'lab'
                    ? 'bg-[#121b2e] text-white'
                    : 'bg-white text-[#434654] hover:bg-slate-100 border border-slate-200'
                }`}
              >
                💻 ห้องแล็บ & คอมพิวเตอร์
              </button>
              <button
                onClick={() => setFilterCategory('library')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterCategory === 'library'
                    ? 'bg-[#121b2e] text-white'
                    : 'bg-white text-[#434654] hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📚 หอสมุด & Silent Pods
              </button>
              <button
                onClick={() => setFilterCategory('studio')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterCategory === 'studio'
                    ? 'bg-[#121b2e] text-white'
                    : 'bg-white text-[#434654] hover:bg-slate-100 border border-slate-200'
                }`}
              >
                🎨 สตูดิโอสร้างสรรค์
              </button>
            </div>

            {/* Facilities Cards Grid */}
            <div className="grid grid-cols-1 gap-4">
              {filteredFacilities.map((facility) => {
                const facilityActiveBookings = activeBookings.filter(
                  (b) => b.facilityId === facility.id
                );
                const roomsCount = facility.rooms?.length || facility.activeRooms || 0;

                return (
                  <div
                    key={facility.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 border border-slate-200/80 flex flex-col gap-4"
                  >
                    {/* Top Row: Icon + Name + Badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1550d3]/10 to-[#1550d3]/5 text-[#1550d3] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#1550d3]/20 shadow-xs">
                          <span className="material-symbols-outlined text-[30px] fill-1">
                            {facility.icon}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#121b2e] group-hover:text-[#1550d3] transition-colors">
                            {facility.name}
                          </h3>
                          <p className="text-[13px] text-[#434654] mt-0.5">{facility.category}</p>
                        </div>
                      </div>

                      {getStatusBadge(facility.status, facility.statusLabel)}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#434654] leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {facility.description}
                    </p>

                    {/* Rooms Preview Carousel / List */}
                    {facility.rooms && facility.rooms.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider">
                          ห้องที่เปิดให้จองในอาคารนี้ ({facility.rooms.length} ห้อง):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {facility.rooms.map((room) => (
                            <div
                              key={room.id}
                              onClick={() => onOpenFacilityModal(facility)}
                              className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#1550d3]/5 border border-slate-200 hover:border-[#1550d3]/40 transition-all cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <span className="font-bold text-xs text-[#121b2e] block truncate">
                                  {room.name}
                                </span>
                                <span className="text-[10px] text-[#737686] block">
                                  {room.floor} • จุ {room.capacity} คน
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-[#1550d3] shrink-0">
                                จอง ➔
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats & Actions Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-1">
                      <div className="flex items-center gap-4 text-xs text-[#434654]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-[#1550d3]">meeting_room</span>
                          <b>{roomsCount}</b> ห้องบริการ
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">groups</span>
                          <b>{facility.occupancy || 0}</b> / {facility.capacity || 100} คน
                        </span>
                        {facility.temperature && (
                          <span className="hidden sm:flex items-center gap-1 text-[11px]">
                            <span className="material-symbols-outlined text-[15px] text-cyan-600">thermostat</span>
                            {facility.temperature}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {facilityActiveBookings.length > 0 && (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ คุณมี {facilityActiveBookings.length} คิวจอง
                          </span>
                        )}
                        <button
                          onClick={() => onOpenFacilityModal(facility)}
                          className="px-4 py-2 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                          <span>เปิดดูและจองห้อง</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: MY ACTIVE BOOKINGS */}
        {activeTab === 'my_bookings' && (
          <section className="flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#121b2e]">
                  บัตรคิวและรายการจองห้องของฉัน (My Reservations)
                </h2>
                <p className="text-xs text-[#434654]">
                  แสดงรหัสเปิดประตู ดิจิทัลพาส และประวัติการจองทั้งหมด
                </p>
              </div>
              <button
                onClick={() => onOpenFacilityModal(MOCK_FACILITIES[2])}
                className="px-3.5 py-1.5 rounded-xl bg-[#1550d3] text-white text-xs font-bold hover:bg-[#1a53d6] flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>จองห้องเพิ่ม</span>
              </button>
            </div>

            {roomBookings.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-[#1550d3] flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">meeting_room</span>
                </div>
                <h3 className="text-base font-bold text-[#121b2e]">ยังไม่มีรายการจองห้อง</h3>
                <p className="text-xs text-[#434654] max-w-sm">
                  คุณสามารถเลือกห้องแล็บคอมพิวเตอร์ หอสมุด หรือสตูดิโอ และจองเวลาใช้งานเพื่อรับ Smart Pass เข้าห้องได้ทันที
                </p>
                <button
                  onClick={() => {
                    setActiveTab('facilities');
                    onOpenFacilityModal(MOCK_FACILITIES[2]);
                  }}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#1550d3] text-white font-bold text-xs hover:bg-[#1a53d6] transition-all cursor-pointer shadow-md"
                >
                  เริ่มจองห้องตอนนี้
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roomBookings.map((booking) => {
                  const isConfirmed = booking.status === 'confirmed';

                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between gap-4 hover:shadow-md transition-all relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#1550d3]/10 text-[#1550d3] flex items-center justify-center border border-[#1550d3]/20">
                            <span className="material-symbols-outlined text-[24px]">
                              {booking.facilityIcon || 'meeting_room'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#1550d3] uppercase tracking-wider">
                              {booking.facilityName}
                            </span>
                            <h4 className="font-bold text-base text-[#121b2e] leading-tight">
                              {booking.roomName}
                            </h4>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isConfirmed ? 'ยืนยันแล้ว ✓' : 'ยกเลิกแล้ว'}
                        </span>
                      </div>

                      {/* Details Box */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-[#737686] block">วันที่</span>
                          <span className="font-bold text-[#121b2e]">{booking.date}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#737686] block">ช่วงเวลา</span>
                          <span className="font-bold text-[#1550d3]">{booking.timeSlot}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-200/60">
                          <span className="text-[10px] text-[#737686] block">วัตถุประสงค์</span>
                          <span className="text-[#434654] truncate block">{booking.purpose}</span>
                        </div>
                      </div>

                      {/* Passcode & Door Unlock */}
                      <div className="bg-[#121b2e] text-white p-3.5 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-semibold text-cyan-300 block uppercase">
                            รหัสเปิดประตูดิจิทัล (Passcode)
                          </span>
                          <span className="text-lg font-mono font-bold text-amber-300 tracking-wider">
                            {booking.passCode}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedBookingForPass(booking)}
                          className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-white/10"
                        >
                          <span className="material-symbols-outlined text-[15px]">badge</span>
                          <span>ดู Smart Pass</span>
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <span className="text-[11px] text-[#737686]">จองเมื่อ {booking.bookedAt}</span>
                        {isConfirmed && (
                          <button
                            onClick={() => onCancelBooking(booking.id)}
                            className="text-rose-600 hover:text-rose-700 hover:underline font-semibold cursor-pointer"
                          >
                            ยกเลิกการจอง
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* SECTION 3: DIGITAL TWIN IoT */}
        {activeTab === 'digital_twin' && (
          <section className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-[#273044] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden text-[#edf0ff] border border-slate-700/60">
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              />

              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[12px] font-bold text-[#d9e2fc] tracking-widest uppercase">
                    สถานะโหนด IoT สด (LIVE NODE MAP)
                  </span>
                  <span className="material-symbols-outlined text-[#b5c4ff] animate-spin text-[22px] [animation-duration:8s]">
                    radar
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {MOCK_DIGITAL_TWIN.map((node) => {
                    const isOptimal = node.status === 'optimal';
                    const isAlert = node.status === 'alert';

                    return (
                      <div
                        key={node.id}
                        onClick={() => onOpenNodeModal(node)}
                        className="bg-white/10 hover:bg-white/15 rounded-2xl p-3.5 flex items-center justify-between backdrop-blur-md border border-white/10 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[20px]">
                              {node.icon}
                            </span>
                          </div>
                          <div>
                            <span className="text-[14px] font-bold text-white block">
                              {node.code}
                            </span>
                            <span className="text-[11px] text-white/60">{node.type}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-white/80">
                            {node.statusText}
                          </span>
                          <div
                            className={`w-3 h-3 rounded-full ${
                              isOptimal
                                ? 'bg-[#20C997] shadow-[0_0_10px_rgba(32,201,151,0.8)]'
                                : isAlert
                                ? 'bg-[#FF4F4F] shadow-[0_0_10px_rgba(255,79,79,0.8)] animate-pulse'
                                : 'bg-[#FFB800] shadow-[0_0_10px_rgba(255,184,0,0.8)]'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#20C997]"></div>
                <span className="text-[12px] font-medium text-[#434654]">ปกติ (Optimal)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]"></div>
                <span className="text-[12px] font-medium text-[#434654]">เฝ้าระวัง (Warning)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF4F4F]"></div>
                <span className="text-[12px] font-medium text-[#434654]">แจ้งเตือน (Alert)</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Booking Pass Modal */}
      <BookingDetailModal
        booking={selectedBookingForPass}
        isOpen={Boolean(selectedBookingForPass)}
        onClose={() => setSelectedBookingForPass(null)}
        onCancelBooking={(id) => {
          onCancelBooking(id);
          setSelectedBookingForPass(null);
        }}
        onUnlockDoor={onUnlockDoor}
      />
    </div>
  );
};
