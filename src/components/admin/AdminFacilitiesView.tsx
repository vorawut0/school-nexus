import React, { useState } from 'react';
import { UserProfile, RoomBooking, Facility, DigitalTwinNode } from '../../types';
import { MOCK_FACILITIES, MOCK_DIGITAL_TWIN } from '../../data/mockData';
import { CampusPulseTab } from '../modals/CampusPulseModal';

interface AdminFacilitiesViewProps {
  user: UserProfile;
  roomBookings: RoomBooking[];
  onOpenFacilityModal: (facility: Facility) => void;
  onOpenNodeModal: (node: DigitalTwinNode) => void;
  onOpenCampusMap: () => void;
  onOpenCampusPulse?: (tab?: CampusPulseTab) => void;
  onCancelBooking: (bookingId: string) => void;
  onUnlockDoor?: (bookingId: string) => void;
}

export const AdminFacilitiesView: React.FC<AdminFacilitiesViewProps> = ({
  user,
  roomBookings,
  onOpenFacilityModal,
  onOpenNodeModal,
  onOpenCampusMap,
  onOpenCampusPulse,
  onCancelBooking,
  onUnlockDoor,
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'approvals' | 'iot_mesh'>('rooms');
  const [facilities, setFacilities] = useState<Facility[]>(MOCK_FACILITIES);
  const [bookingsList, setBookingsList] = useState<RoomBooking[]>(roomBookings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleRoomStatus = (facilityId: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === 'open' ? 'busy' : currentStatus === 'busy' ? 'closed' : 'open';
    const nextLabel =
      nextStatus === 'open'
        ? 'เปิดให้บริการ'
        : nextStatus === 'busy'
        ? 'กำลังใช้งาน'
        : 'ปิดซ่อมบำรุง';

    setFacilities((prev) =>
      prev.map((f) => (f.id === facilityId ? { ...f, status: nextStatus, statusLabel: nextLabel } : f))
    );
    showToast(`เปลี่ยนสถานะห้องเป็น: "${nextLabel}" เรียบร้อย`);
  };

  const handleRemoteDoorUnlock = (facilityName: string) => {
    showToast(`🔓 ส่งสัญญาณปลดล็อกประตูดิจิทัล "${facilityName}" สำเร็จ`);
  };

  const handleApproveBooking = (bookingId: string) => {
    setBookingsList((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed' } : b))
    );
    showToast('✅ อนุมัติการขอใช้สถานที่เรียบร้อยแล้ว');
  };

  const handleRejectBooking = (bookingId: string) => {
    setBookingsList((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    );
    onCancelBooking(bookingId);
    showToast('❌ ปฏิเสธ/ยกเลิกคำขอใช้ห้องเรียบร้อย');
  };

  const filteredFacilities = facilities.filter((f) => {
    if (filterCategory === 'all') return true;
    return f.category.includes(filterCategory);
  });

  return (
    <div className="flex flex-col w-full relative pb-20 sm:pb-24 pt-5 sm:pt-6 px-4 sm:px-6 max-w-[1280px] mx-auto min-h-screen">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-3 sm:right-6 z-[90] bg-[#121b2e] text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-slideInRightToast max-w-[calc(100vw-24px)] sm:max-w-md pointer-events-auto">
          <span className="material-symbols-outlined text-[#20C997] text-[18px] shrink-0">verified</span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                Facility & IoT Management
              </span>
              <span className="text-xs text-slate-500">ระบบจัดการอาคาร สถานที่ และอุปกรณ์ IoT ส่วนกลาง</span>
            </div>
            <h1 className="text-[24px] sm:text-[30px] font-black text-slate-900 leading-tight">
              ศูนย์ควบคุมอาคาร สถานที่ & เซนเซอร์ IoT
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              ควบคุมสถานะห้องเรียน สั่งการเปิด-ปิดประตูดิจิทัล ตรวจสอบคำขอใช้สถานที่ และมอนิเตอร์เซนเซอร์อัจฉริยะ
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenCampusMap}
              className="text-[#1550d3] text-xs font-bold flex items-center gap-1.5 hover:bg-blue-50 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">map</span>
              <span>ผังแคมปัส 3D</span>
            </button>

            {onOpenCampusPulse && (
              <button
                onClick={() => onOpenCampusPulse('energy')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                <span>Telemetry พลังงาน & อากาศ</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Summary Stats for Admin */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-500">ห้องและอาคารทั้งหมด</span>
              <span className="material-symbols-outlined text-indigo-600 text-[20px]">apartment</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{facilities.length} ศูนย์</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              เปิดให้บริการ {facilities.filter((f) => f.status === 'open').length} จุด
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-500">คำขอใช้ห้องจากครู/นักเรียน</span>
              <span className="material-symbols-outlined text-blue-600 text-[20px]">fact_check</span>
            </div>
            <div className="text-2xl font-black text-blue-600">{bookingsList.length} รายการ</div>
            <div className="text-[11px] text-slate-500 mt-1">
              อนุมัติแล้ว {bookingsList.filter((b) => b.status === 'confirmed').length} รายการ
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-500">โหนด IoT เฝ้าระวัง</span>
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">sensors</span>
            </div>
            <div className="text-2xl font-black text-emerald-600">{MOCK_DIGITAL_TWIN.length} โหนด</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              ออนไลน์ 100% (HVAC, PM2.5, RFID)
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-500">ระบบล็อกประตูดิจิทัล</span>
              <span className="material-symbols-outlined text-amber-600 text-[20px]">lock</span>
            </div>
            <div className="text-2xl font-black text-amber-600">Smart Access</div>
            <div className="text-[11px] text-slate-500 mt-1">
              รองรับ Master NFC & Remote Unlock
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">meeting_room</span>
            <span>จัดการสถานะห้อง & ประตู ({facilities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
            <span>ตรวจสอบและอนุมัติการใช้ห้อง ({bookingsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('iot_mesh')}
            className={`px-4 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'iot_mesh'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">sensors</span>
            <span>สถานะเซนเซอร์ IoT ({MOCK_DIGITAL_TWIN.length})</span>
          </button>
        </div>

        {/* TAB 1: ROOMS MANAGEMENT & MASTER CONTROLS */}
        {activeTab === 'rooms' && (
          <div className="flex flex-col gap-4">
            {/* Filter by Category */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">หมวดหมู่:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'คอมพิวเตอร์', label: 'ห้องปฏิบัติการ' },
                    { id: 'สมุด', label: 'หอสมุด' },
                    { id: 'ศิลปะ', label: 'สตูดิโอ' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setFilterCategory(c.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        filterCategory === c.id
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>💡 สลับสถานะห้องเพื่อเปิด/ปิด หรือสั่งปลดล็อกประตูดิจิทัลจากระยะไกล</span>
              </div>
            </div>

            {/* Room List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFacilities.map((fac) => {
                const isOpen = fac.status === 'open';
                const isBusy = fac.status === 'busy';

                return (
                  <div
                    key={fac.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="p-4 sm:p-5 flex flex-col gap-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[22px]">{fac.icon}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight">{fac.name}</h3>
                            <div className="text-xs text-slate-500">{fac.category}</div>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                            isOpen
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isBusy
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {fac.statusLabel}
                        </span>
                      </div>

                      {/* Room Specs */}
                      <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                        <div>
                          <span className="text-slate-400 text-[10px] block">ความจุ</span>
                          <span className="font-semibold text-slate-800">{fac.capacity || 40} คน</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">อุณหภูมิ</span>
                          <span className="font-semibold text-slate-800">{fac.temperature || '24.0°C'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">อากาศ AQI</span>
                          <span className="font-semibold text-emerald-600">{fac.airQuality || 'AQI 15'}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">{fac.description}</p>
                    </div>

                    {/* Admin Actions Bar */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleRoomStatus(fac.id, fac.status)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 active:scale-95 transition-all cursor-pointer"
                        title="เปลี่ยนสถานะห้อง"
                      >
                        สลับสถานะ
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenFacilityModal(fac)}
                          className="px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-indigo-600 text-xs font-bold transition-colors"
                        >
                          ดูห้องย่อย
                        </button>
                        <button
                          onClick={() => handleRemoteDoorUnlock(fac.name)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">lock_open</span>
                          <span>ปลดล็อก</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: APPROVALS & USAGE LOGS */}
        {activeTab === 'approvals' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">รายการขอใช้สถานที่และห้องเรียนทั่วทั้งโรงเรียน</h3>
                <p className="text-xs text-slate-500">ตรวจสอบสิทธิ์การจองของครูและนักเรียน อนุมัติหรือยกเลิกการเข้าใช้งาน</p>
              </div>
            </div>

            {bookingsList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                ไม่มีรายการขอใช้ห้องในขณะนี้
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {bookingsList.map((b) => (
                  <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <span className="material-symbols-outlined text-[22px]">
                          {b.status === 'confirmed' ? 'check_circle' : 'schedule'}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{b.roomName}</div>
                        <div className="text-slate-500 mt-0.5">
                          ผู้ขอใช้: <span className="font-semibold text-slate-800">{b.bookedBy || 'สมาชิกในโรงเรียน'}</span> • {b.date} ({b.timeSlot})
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          วัตถุประสงค์: {b.purpose} • รหัสปลดล็อก: <span className="font-mono font-bold text-indigo-600">{b.passCode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {b.status === 'confirmed' ? (
                        <button
                          onClick={() => handleRejectBooking(b.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 active:scale-95 transition-all cursor-pointer"
                        >
                          ยกเลิกสิทธิ์
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApproveBooking(b.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
                          >
                            อนุมัติคำขอ
                          </button>
                          <button
                            onClick={() => handleRejectBooking(b.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all cursor-pointer"
                          >
                            ปฏิเสธ
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: IOT SENSOR MESH */}
        {activeTab === 'iot_mesh' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_DIGITAL_TWIN.map((node) => (
              <div
                key={node.id}
                onClick={() => onOpenNodeModal(node)}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-indigo-600">{node.code}</span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {node.statusText}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{node.type}</h4>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl my-3">
                    <div>
                      <span className="text-slate-400 text-[10px] block">อุณหภูมิ:</span>
                      <span className="font-bold text-slate-800">{node.temp}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">กำลังไฟฟ้า:</span>
                      <span className="font-bold text-indigo-600">{node.power}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-bold">
                  <span>ดูเซนเซอร์ {node.devices} อุปกรณ์ ➔</span>
                  <span className="material-symbols-outlined text-[16px]">sensors</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
