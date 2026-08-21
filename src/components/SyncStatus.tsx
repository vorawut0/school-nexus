import React, { useState, useEffect } from 'react';
import {
  getPendingOfflineQueue,
  getPendingOfflineQueueCount,
  syncOfflineQueueToFirestore,
  OfflineQueueItem,
} from '../services/firebaseService';

interface SyncStatusProps {
  isOffline?: boolean;
  onSyncComplete?: (syncedCount: number) => void;
  className?: string;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  isOffline = !navigator.onLine,
  onSyncComplete,
  className = '',
}) => {
  const [pendingCount, setPendingCount] = useState<number>(() => getPendingOfflineQueueCount());
  const [pendingItems, setPendingItems] = useState<OfflineQueueItem[]>(() => getPendingOfflineQueue());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  // Refresh pending count on events and intervals
  const refreshQueue = () => {
    const items = getPendingOfflineQueue();
    setPendingItems(items);
    setPendingCount(items.length);
  };

  useEffect(() => {
    refreshQueue();

    const handleQueueChange = () => {
      refreshQueue();
    };

    window.addEventListener('sn_offline_queue_changed', handleQueueChange);
    window.addEventListener('online', refreshQueue);
    window.addEventListener('offline', refreshQueue);

    const interval = setInterval(refreshQueue, 5000);

    return () => {
      window.removeEventListener('sn_offline_queue_changed', handleQueueChange);
      window.removeEventListener('online', refreshQueue);
      window.removeEventListener('offline', refreshQueue);
      clearInterval(interval);
    };
  }, []);

  // Handle manual sync trigger
  const handleManualSync = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isSyncing) return;

    if (isOffline) {
      setSyncStatus('error');
      setStatusMessage('ไม่สามารถซิงค์ได้เนื่องจากอุปกรณ์อยู่ในสถานะออฟไลน์');
      setTimeout(() => setSyncStatus('idle'), 4000);
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');
    setStatusMessage('กำลังเชื่อมต่อและซิงค์ข้อมูลกับ Firestore...');

    try {
      const res = await syncOfflineQueueToFirestore();
      refreshQueue();
      setIsSyncing(false);

      if (res.syncedCount > 0) {
        setSyncStatus('success');
        setStatusMessage(`ซิงค์ข้อมูลสำเร็จเรียบร้อยแล้ว (${res.syncedCount} รายการ)`);
        if (onSyncComplete) {
          onSyncComplete(res.syncedCount);
        }
      } else if (res.totalRemaining === 0) {
        setSyncStatus('success');
        setStatusMessage('ข้อมูลเป็นเวอร์ชันล่าสุดตรงกับ Firestore แล้ว');
      } else {
        setSyncStatus('error');
        setStatusMessage('มีบางรายการยังซิงค์ไม่สำเร็จ ระบบจะเก็บไว้ลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      setIsSyncing(false);
      setSyncStatus('error');
      setStatusMessage(`การซิงค์ล้มเหลว: ${err?.message || 'โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'}`);
    }

    setTimeout(() => {
      setSyncStatus('idle');
    }, 5000);
  };

  return (
    <>
      {/* Compact Sync Status Widget Indicator */}
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={() => setShowDrawer(true)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 ${
            pendingCount > 0
              ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-300'
              : isOffline
              ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
              : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100/90'
          }`}
          title={
            pendingCount > 0
              ? `มี ${pendingCount} รายการรอการซิงค์ไปยัง Firestore (คลิกเพื่อดูและซิงค์ข้อมูล)`
              : isOffline
              ? 'สถานะ: ออฟไลน์ (ข้อมูลจะถูกบันทึกในเครื่องก่อน)'
              : 'สถานะการเชื่อมต่อ Firestore: ซิงค์ล่าสุดสมบูรณ์'
          }
        >
          {/* Status Icon */}
          <div className="relative flex items-center justify-center">
            {isSyncing ? (
              <span className="material-symbols-outlined text-[16px] text-blue-600 animate-spin">
                sync
              </span>
            ) : pendingCount > 0 ? (
              <span className="material-symbols-outlined text-[16px] text-amber-600 animate-pulse">
                cloud_upload
              </span>
            ) : isOffline ? (
              <span className="material-symbols-outlined text-[16px] text-rose-600">
                cloud_off
              </span>
            ) : (
              <span className="material-symbols-outlined text-[16px] text-emerald-600">
                cloud_done
              </span>
            )}

            {/* Notification Badge if Pending */}
            {pendingCount > 0 && !isSyncing && (
              <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] bg-amber-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center px-0.5 shadow-2xs">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </div>

          {/* Label */}
          <span className="hidden sm:inline text-[11px]">
            {isSyncing
              ? 'กำลังซิงค์...'
              : pendingCount > 0
              ? `รอซิงค์ (${pendingCount})`
              : isOffline
              ? 'ออฟไลน์'
              : 'Firestore Sync'}
          </span>
        </button>

        {/* Quick Sync Action Button if Pending items exist */}
        {pendingCount > 0 && !isOffline && (
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="hidden sm:flex p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-90 cursor-pointer disabled:opacity-50 items-center justify-center shrink-0"
            title="กดเพื่อซิงค์ข้อมูลไปยัง Firestore ทันที"
          >
            <span className={`material-symbols-outlined text-[14px] ${isSyncing ? 'animate-spin' : ''}`}>
              sync
            </span>
          </button>
        )}
      </div>

      {/* Detailed Sync Modal / Slide Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
                    isOffline
                      ? 'bg-rose-100 text-rose-600'
                      : pendingCount > 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">
                    {isOffline ? 'cloud_off' : pendingCount > 0 ? 'cloud_sync' : 'cloud_done'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-[#121b2e] text-base sm:text-lg">สถานะการซิงค์ข้อมูล</h3>
                  <p className="text-xs text-slate-500">
                    {isOffline
                      ? 'ระบบกำลังทำงานในโหมด Offline (บันทึกในเครื่อง)'
                      : 'เชื่อมต่อกับ Cloud Firestore เรียบร้อย'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Status Message Notification */}
            {statusMessage && (
              <div
                className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 ${
                  syncStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100'
                    : syncStatus === 'error'
                    ? 'bg-rose-50 text-rose-800 border-b border-rose-100'
                    : 'bg-blue-50 text-blue-800 border-b border-blue-100'
                }`}
              >
                <span className="material-symbols-outlined text-base shrink-0">
                  {syncStatus === 'success'
                    ? 'check_circle'
                    : syncStatus === 'error'
                    ? 'error'
                    : 'info'}
                </span>
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Body Info & Queue List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
              {/* Network Status Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isOffline ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {isOffline ? 'สถานะ: ขาดการเชื่อมต่ออินเทอร์เน็ต' : 'สถานะ: ออนไลน์พร้อมซิงค์ข้อมูล'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isOffline
                        ? 'การแก้ไขการบ้าน, บันทึกการจอง, และ Log จะรออยู่ในคิวออฟไลน์'
                        : 'การส่งข้อมูลแบบ Real-time และ Manual Sync พร้อมใช้งาน'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Queue Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    รายการรอการซิงค์ ({pendingCount})
                  </span>
                  {pendingCount > 0 && (
                    <span className="text-[11px] text-amber-600 font-medium">
                      บันทึกใน Local Storage แล้ว
                    </span>
                  )}
                </div>

                {pendingItems.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                    <span className="material-symbols-outlined text-3xl text-emerald-500 mb-1">
                      verified
                    </span>
                    <p className="text-xs font-bold text-slate-700">ไม่มีข้อมูลค้างในคิว</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      การบ้าน, บันทึก Log และการจองทั้งหมดซิงค์กับ Firestore ครบถ้วนแล้ว
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {pendingItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-amber-700 text-base shrink-0">
                            {item.type.includes('assignment')
                              ? 'assignment'
                              : item.type.includes('booking')
                              ? 'meeting_room'
                              : item.type.includes('log')
                              ? 'receipt_long'
                              : 'sync'}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">
                              {item.description || item.type}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(item.timestamp).toLocaleTimeString('th-TH')}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                onClick={() => handleManualSync()}
                disabled={isSyncing || isOffline || pendingCount === 0}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-base ${isSyncing ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลตอนนี้'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
