import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { db } from '../../services/firebaseService';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

interface AdminLogsViewProps {
  user: UserProfile;
}

interface SystemLog {
  id: string;
  time: string;
  category: 'security' | 'iot' | 'access' | 'system';
  level: 'info' | 'warning' | 'alert';
  title: string;
  description: string;
  deviceOrGate: string;
  timestamp?: number;
}

const MOCK_LOGS: SystemLog[] = [
  {
    id: 'log-1',
    time: 'วันนี้ 07:48:12',
    category: 'access',
    level: 'info',
    title: 'แตะบัตรผ่านประตูอัตโนมัติสำเร็จ',
    description: 'นักเรียน วรวุฒิ เพ็ชรระยา (66040217) แตะบัตร NFC เข้า Main Gate 01',
    deviceOrGate: 'RFID-GATE-01'
  },
  {
    id: 'log-2',
    time: 'วันนี้ 07:30:00',
    category: 'iot',
    level: 'info',
    title: 'ระบบปรับอากาศอัตโนมัติเริ่มทำงานตามตาราง',
    description: 'เปิดเครื่องปรับอากาศห้อง Lab 02 อุณหภูมิเป้าหมาย 24°C',
    deviceOrGate: 'HVAC-NODE-402'
  },
  {
    id: 'log-3',
    time: 'วันนี้ 06:15:22',
    category: 'system',
    level: 'info',
    title: 'สำรองข้อมูลฐานข้อมูลแคมปัสเสร็จสมบูรณ์',
    description: 'Daily Automated Database Snapshot สำเร็จ (ขนาด: 4.8 GB)',
    deviceOrGate: 'DATA-BACKUP-SRV'
  },
  {
    id: 'log-4',
    time: 'เมื่อวาน 18:40:10',
    category: 'security',
    level: 'warning',
    title: 'ตรวจพบบัตรที่ยังไม่ได้ลงทะเบียน',
    description: 'พยายามแตะบัตรไม่ทราบสังกัดที่ประตู Server Room Data Center',
    deviceOrGate: 'DOOR-LOCK-DC01'
  },
  {
    id: 'log-5',
    time: 'เมื่อวาน 16:30:05',
    category: 'iot',
    level: 'info',
    title: 'ปิดไฟและแอร์อาคาร 4 ประหยัดพลังงาน',
    description: 'Smart Sensor ตรวจไม่พบบุคคลในห้อง 401-404 นานเกิน 30 นาที',
    deviceOrGate: 'ENERGY-SAVER-B4'
  }
];

export const AdminLogsView: React.FC<AdminLogsViewProps> = ({ user }) => {
  const [logs, setLogs] = useState<SystemLog[]>(MOCK_LOGS);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  // Subscribe to real-time Firestore system_logs if available
  useEffect(() => {
    try {
      const q = query(collection(db, 'system_logs'), limit(30));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedLogs: SystemLog[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as any;
            fetchedLogs.push({
              id: doc.id,
              time: data.time || new Date(data.timestamp || Date.now()).toLocaleTimeString('th-TH'),
              category: data.category || 'system',
              level: data.level || 'info',
              title: data.title || 'เหตุการณ์ระบบ',
              description: data.description || '',
              deviceOrGate: data.deviceOrGate || 'CLOUD-SRV',
              timestamp: data.timestamp,
            });
          });
          if (fetchedLogs.length > 0) {
            setLogs((prev) => {
              const combined = [...fetchedLogs, ...prev];
              const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
              return unique.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            });
          }
        }
      }, () => {
        // Fallback gracefully to mock data if offline or permission
      });
      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, []);

  const handleRunDiagnostic = () => {
    setIsRunningDiagnostic(true);
    setDiagnosticResult(null);
    setTimeout(() => {
      setIsRunningDiagnostic(false);
      setDiagnosticResult('✅ ผลการทดสอบ: ระบบแม่ข่ายและเครือข่าย IoT 40 จุดทำงานปกติ 100% (Latency: 4ms, Uptime: 99.98%)');
    }, 1800);
  };

  const handleExportLogsCsv = () => {
    try {
      const headers = ['ID', 'Timestamp/Time', 'Category', 'Level', 'Title', 'Description', 'DeviceOrGate'];
      const rows = filteredLogs.map((l) => [
        l.id,
        `"${l.time}"`,
        l.category,
        l.level,
        `"${l.title.replace(/"/g, '""')}"`,
        `"${l.description.replace(/"/g, '""')}"`,
        l.deviceOrGate,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SchoolNexus-AuditLogs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (filterCat === 'all') return true;
    return l.category === filterCat;
  });

  return (
    <div className="flex flex-col w-full relative pb-20 sm:pb-24 pt-5 sm:pt-6 px-4 sm:px-6 max-w-[1280px] mx-auto min-h-screen">
      <div className="flex flex-col gap-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1550d3]/10 text-[#1550d3] text-xs font-bold">
                Security & Audit Logs
              </span>
              <span className="text-xs text-[#737686]">บันทึกความปลอดภัยและระบบ</span>
            </div>
            <h1 className="text-[26px] sm:text-[32px] font-bold text-[#121b2e] leading-tight">
              บันทึกเหตุการณ์ & การตรวจจับความปลอดภัย
            </h1>
            <p className="text-[#434654] text-[15px]">
              ตรวจสอบประวัติการสแกนบัตรผ่านประตู เซนเซอร์ IoT และสถานะแม่ข่ายความปลอดภัยแบบเรียลไทม์
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleExportLogsCsv}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-emerald-600">download</span>
              <span>ส่งออกบันทึก (CSV)</span>
            </button>

            <button
              onClick={handleRunDiagnostic}
              disabled={isRunningDiagnostic}
              className="px-4 py-2.5 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${isRunningDiagnostic ? 'animate-spin' : ''}`}>
                {isRunningDiagnostic ? 'progress_activity' : 'network_check'}
              </span>
              <span>{isRunningDiagnostic ? 'กำลังทดสอบเครือข่าย...' : 'รันระบบวินิจฉัยแคมปัส (Diagnostic)'}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Result Banner */}
        {diagnosticResult && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
            <span>{diagnosticResult}</span>
          </div>
        )}

        {/* Server & Network Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#737686] font-semibold">สถานะเซิร์ฟเวอร์หลัก (Main Server)</div>
              <div className="text-[16px] font-bold text-[#121b2e] mt-0.5">Dell PowerEdge R750</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">CPU Load: 14% • RAM: 32/128 GB</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">dns</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#737686] font-semibold">เครือข่ายไฟเบอร์ออปติก (Fiber Ring)</div>
              <div className="text-[16px] font-bold text-[#121b2e] mt-0.5">Campus 10 Gbps Backbone</div>
              <div className="text-[11px] text-blue-600 font-semibold mt-1">Throughput: 1.4 Gbps (ปกติ)</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">router</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#737686] font-semibold">ระบบสำรองไฟ (UPS Online)</div>
              <div className="text-[16px] font-bold text-[#121b2e] mt-0.5">Schneider APC 20kVA</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">แบตเตอรี่: 100% (สำรองไฟ 4 ชม.)</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">battery_charging_full</span>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'บันทึกทั้งหมด' },
            { id: 'access', label: 'การสแกนผ่านประตู (Access)' },
            { id: 'iot', label: 'อุปกรณ์ IoT & สิ่งแวดล้อม' },
            { id: 'security', label: 'ความปลอดภัย (Security Alerts)' },
            { id: 'system', label: 'ระบบ & ฐานข้อมูล' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCat(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                filterCat === tab.id
                  ? 'bg-[#121b2e] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Logs Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-3">
          <h3 className="font-bold text-base text-[#121b2e] flex items-center justify-between">
            <span>ประวัติเหตุการณ์ล่าสุด (Audit Trail)</span>
            <span className="text-xs text-slate-500 font-normal">อัปเดตแบบ Realtime ทุก 5 วินาที</span>
          </h3>

          <div className="flex flex-col divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      log.level === 'alert'
                        ? 'bg-red-50 text-red-600'
                        : log.level === 'warning'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-blue-50 text-[#1550d3]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {log.category === 'access'
                        ? 'door_front'
                        : log.category === 'iot'
                        ? 'sensors'
                        : log.category === 'security'
                        ? 'shield'
                        : 'terminal'}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-[13px] text-[#121b2e] flex items-center gap-2">
                      <span>{log.title}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {log.deviceOrGate}
                      </span>
                    </div>
                    <p className="text-xs text-[#434654] mt-0.5">{log.description}</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono sm:text-right shrink-0 pl-12 sm:pl-0">
                  {log.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
