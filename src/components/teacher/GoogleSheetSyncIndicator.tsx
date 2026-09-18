import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  pollSpreadsheetForChanges,
  SheetPollResult,
  getGoogleAccessToken,
  extractSpreadsheetId,
} from '../../services/googleSheetsService';

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  status: 'synced_no_change' | 'change_detected' | 'checking' | 'error' | 'manual_sync';
  message: string;
  rowCount?: number;
  sheetTitle?: string;
}

interface GoogleSheetSyncIndicatorProps {
  spreadsheetUrlOrId?: string;
  tabName?: string;
  mode?: 'rubric' | 'schedule' | 'raw';
  isAutoPollEnabled?: boolean;
  pollIntervalSeconds?: number;
  onUpdateDetected?: (result: SheetPollResult) => void;
  onManualSyncTriggered?: () => Promise<void> | void;
  variant?: 'compact' | 'full' | 'floating_badge';
  className?: string;
}

export const GoogleSheetSyncIndicator: React.FC<GoogleSheetSyncIndicatorProps> = ({
  spreadsheetUrlOrId,
  tabName,
  mode = 'raw',
  isAutoPollEnabled = true,
  pollIntervalSeconds = 60,
  onUpdateDetected,
  onManualSyncTriggered,
  variant = 'full',
  className = '',
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(pollIntervalSeconds);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(isAutoPollEnabled);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [lastKnownHash, setLastKnownHash] = useState<string>('');
  const [hasPendingChangeAlert, setHasPendingChangeAlert] = useState<boolean>(false);
  const [lastPollResult, setLastPollResult] = useState<SheetPollResult | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncLogEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check auth
  useEffect(() => {
    getGoogleAccessToken().then((tok) => setIsAuthenticated(Boolean(tok)));
  }, []);

  const cleanId = spreadsheetUrlOrId ? extractSpreadsheetId(spreadsheetUrlOrId) : '';

  const addLogEntry = useCallback(
    (
      status: 'synced_no_change' | 'change_detected' | 'checking' | 'error' | 'manual_sync',
      message: string,
      rowCount?: number,
      sheetTitle?: string
    ) => {
      const newEntry: SyncLogEntry = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status,
        message,
        rowCount,
        sheetTitle,
      };
      setSyncHistory((prev) => [newEntry, ...prev.slice(0, 19)]); // keep latest 20
    },
    []
  );

  // Core function to check for changes
  const executePollCheck = useCallback(async () => {
    if (!cleanId) return;

    setIsChecking(true);
    try {
      const modeType: 'rubric' | 'schedule' | 'raw' =
        mode === 'rubric' || mode === 'schedule' ? mode : 'raw';
      const result = await pollSpreadsheetForChanges(cleanId, lastKnownHash, tabName, modeType);
      const currentTimeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastCheckTime(currentTimeStr);
      setLastPollResult(result);

      if (result.error) {
        addLogEntry('error', `ตรวจสอบไม่สำเร็จ: ${result.error}`);
      } else if (result.hasChanged) {
        setLastKnownHash(result.newHash);
        setHasPendingChangeAlert(true);
        addLogEntry(
          'change_detected',
          `ตรวจพบการแก้ไขในสเปรดชีต! (${result.sheetTitle || 'Google Sheet'}) มีข้อมูล ${result.rowCount} รายการ`,
          result.rowCount,
          result.sheetTitle
        );
        onUpdateDetected?.(result);
      } else {
        if (!lastKnownHash) {
          setLastKnownHash(result.newHash);
        }
        addLogEntry(
          'synced_no_change',
          `ซิงค์ปกติ — ข้อมูลตรงกับ Google Sheets (${result.rowCount} รายการ)`,
          result.rowCount,
          result.sheetTitle
        );
      }
    } catch (err: any) {
      addLogEntry('error', err.message || 'เกิดข้อผิดพลาดในการตรวจสอบ');
    } finally {
      setIsChecking(false);
      setSecondsRemaining(pollIntervalSeconds);
    }
  }, [cleanId, lastKnownHash, tabName, mode, pollIntervalSeconds, onUpdateDetected, addLogEntry]);

  // Polling Interval Effect (Every 1 second countdown; triggers poll at 0)
  useEffect(() => {
    if (!isPollingActive || !cleanId) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          executePollCheck();
          return pollIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPollingActive, cleanId, executePollCheck, pollIntervalSeconds]);

  // Handle manual sync button click
  const handleManualCheck = async () => {
    if (onManualSyncTriggered) {
      setIsChecking(true);
      try {
        await onManualSyncTriggered();
        setSecondsRemaining(pollIntervalSeconds);
      } finally {
        setIsChecking(false);
      }
    } else {
      executePollCheck();
    }
  };

  // Percentage for progress ring (0 -> 100)
  const progressPct = ((pollIntervalSeconds - secondsRemaining) / pollIntervalSeconds) * 100;

  // COMPACT VARIANT (For Top Bar in Teacher Dashboard)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-sm transition-all ${
            hasPendingChangeAlert
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 animate-pulse'
              : isChecking
              ? 'bg-blue-500/20 border-blue-400 text-blue-200'
              : isPollingActive && cleanId
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
              : 'bg-white/10 border-white/20 text-slate-300'
          }`}
          title={
            cleanId
              ? isPollingActive
                ? `ซิงค์อัตโนมัติทุก ${pollIntervalSeconds}s (ตรวจจับในอีก ${secondsRemaining}s)`
                : 'การซิงค์อัตโนมัติถูกหยุดชั่วคราว'
              : 'ยังไม่ได้เชื่อมต่อสเปรดชีต'
          }
        >
          {/* Status Indicator Dot */}
          <div className="relative flex items-center justify-center">
            {isPollingActive && cleanId && !isChecking && (
              <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
            )}
            <span
              className={`w-2 h-2 rounded-full ${
                hasPendingChangeAlert
                  ? 'bg-amber-400'
                  : isChecking
                  ? 'bg-blue-400 animate-spin'
                  : isPollingActive && cleanId
                  ? 'bg-emerald-400'
                  : 'bg-slate-400'
              }`}
            />
          </div>

          {/* Text State */}
          <span className="text-[11px] font-bold whitespace-nowrap">
            {hasPendingChangeAlert ? (
              'พบข้อมูลอัปเดตใหม่!'
            ) : isChecking ? (
              'กำลังตรวจจับ...'
            ) : isPollingActive && cleanId ? (
              `Google Sheet: ซิงค์ทุก ${pollIntervalSeconds}s (${secondsRemaining}s)`
            ) : (
              'Google Sheet พร้อมเชื่อมต่อ'
            )}
          </span>

          {/* Quick Manual Check Button */}
          {cleanId && (
            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="ตรวจหาการเปลี่ยนแปลงเดี๋ยวนี้"
            >
              <span
                className={`material-symbols-outlined text-[14px] ${
                  isChecking ? 'animate-spin' : ''
                }`}
              >
                refresh
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // FULL DETAILED VARIANT (For Google Sheets Manager)
  return (
    <div
      className={`rounded-2xl border transition-all ${
        hasPendingChangeAlert
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 shadow-sm'
          : isChecking
          ? 'bg-blue-50/80 border-blue-200 shadow-xs'
          : isPollingActive && cleanId
          ? 'bg-emerald-50/70 border-emerald-200/90 shadow-xs'
          : 'bg-slate-50 border-slate-200'
      } p-3.5 sm:p-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Status Icon & Details */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Animated Status Avatar */}
          <div className="relative shrink-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs ${
                hasPendingChangeAlert
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : isChecking
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  : isPollingActive && cleanId
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-slate-400 to-slate-600'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  isChecking ? 'animate-spin' : ''
                }`}
              >
                {hasPendingChangeAlert
                  ? 'notifications_active'
                  : isChecking
                  ? 'sync'
                  : isPollingActive && cleanId
                  ? 'autorenew'
                  : 'cloud_off'}
              </span>
            </div>

            {/* Pulsing Live Dot badge */}
            {isPollingActive && cleanId && !isChecking && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
              </span>
            )}
          </div>

          {/* Text Information */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span>สถานะการซิงค์ข้อมูล (Sync Status):</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    hasPendingChangeAlert
                      ? 'bg-amber-200 text-amber-900 border border-amber-300'
                      : isChecking
                      ? 'bg-blue-200 text-blue-900 border border-blue-300'
                      : isPollingActive && cleanId
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {hasPendingChangeAlert
                    ? 'ตรวจพบข้อมูลใหม่ (Updates Detected)'
                    : isChecking
                    ? 'กำลังตรวจหาการเปลี่ยนแปลง...'
                    : isPollingActive && cleanId
                    ? 'ออนไลน์ & ตรวจจับทุก 60 วินาที (Live Polling)'
                    : 'ปิดการตรวจจับชั่วคราว'}
                </span>
              </span>
            </div>

            <p className="text-[11px] text-slate-600 font-medium mt-0.5 truncate flex items-center gap-2">
              {cleanId ? (
                <>
                  <span>
                    ตรวจสอบล่าสุด:{' '}
                    <strong className="text-slate-800">
                      {lastCheckTime || 'ยังไม่ได้ตรวจ'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    รอบถัดไปใน:{' '}
                    <strong
                      className={`font-mono ${
                        secondsRemaining <= 10 ? 'text-amber-600 font-bold' : 'text-blue-600'
                      }`}
                    >
                      {secondsRemaining}s
                    </strong>
                  </span>
                </>
              ) : (
                <span className="text-slate-500">
                  วาง URL สเปรดชีตด้านบนเพื่อเริ่มระบบตรวจจับอัตโนมัติทุก 60 วินาที
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {/* History Button */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            title="ดูประวัติการตรวจสอบย้อนหลัง"
          >
            <span className="material-symbols-outlined text-[15px] text-slate-500">history</span>
            <span>บันทึก ({syncHistory.length})</span>
          </button>

          {/* Toggle Auto-Poll */}
          {cleanId && (
            <button
              type="button"
              onClick={() => setIsPollingActive((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isPollingActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {isPollingActive ? 'pause' : 'play_arrow'}
              </span>
              <span>{isPollingActive ? 'หยุดตรวจ 60s' : 'เริ่มตรวจ 60s'}</span>
            </button>
          )}

          {/* Immediate Sync Button */}
          {cleanId && (
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={isChecking}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isChecking ? 'animate-spin' : ''
                }`}
              >
                refresh
              </span>
              <span>{isChecking ? 'กำลังตรวจ...' : 'ตรวจหาเดี๋ยวนี้'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Pending Change Notification Alert Banner */}
      {hasPendingChangeAlert && (
        <div className="mt-3 p-3 rounded-xl bg-amber-100/90 border border-amber-300 flex items-center justify-between gap-2 text-xs text-amber-950 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-700 text-[18px]">
              mark_chat_unread
            </span>
            <span>
              <strong>พบการอัปเดตใหม่!</strong> ข้อมูลใน Google Sheets มีการเปลี่ยนแปลงและระบบได้ตรวจพบเรียบร้อยแล้ว
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setHasPendingChangeAlert(false);
                handleManualCheck();
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold cursor-pointer transition-all"
            >
              ดึงข้อมูลใหม่ทันที
            </button>
            <button
              type="button"
              onClick={() => setHasPendingChangeAlert(false)}
              className="p-1 rounded-lg hover:bg-amber-200 text-amber-800 text-[11px] cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Sync History Modal */}
      {showHistoryModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-4 sm:p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">history</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">บันทึกประวัติการซิงค์ (Sync Logs)</h3>
                  <p className="text-[11px] text-blue-200">
                    ตรวจจับการเปลี่ยนแปลงอัตโนมัติทุก 60 วินาที
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 divide-y divide-slate-100">
              {syncHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-[36px] text-slate-300 block mb-1">
                    schedule
                  </span>
                  ยังไม่มีประวัติการซิงค์ ระบบจะเริ่มบันทึกเมื่อครบ 60 วินาที
                </div>
              ) : (
                syncHistory.map((item) => (
                  <div key={item.id} className="pt-2 flex items-start gap-2.5 text-xs">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        item.status === 'change_detected'
                          ? 'bg-amber-500 ring-4 ring-amber-100'
                          : item.status === 'error'
                          ? 'bg-rose-500 ring-4 ring-rose-100'
                          : 'bg-emerald-500 ring-4 ring-emerald-100'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono">{item.timestamp}</span>
                        {item.rowCount !== undefined && (
                          <span className="text-slate-500 font-semibold">{item.rowCount} แถว</span>
                        )}
                      </div>
                      <p className="text-slate-800 font-medium mt-0.5 leading-snug">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                รอบถัดไปใน {secondsRemaining} วินาที
              </span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
