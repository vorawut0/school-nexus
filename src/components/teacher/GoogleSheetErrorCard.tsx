import React, { useState } from 'react';
import { GoogleSheetErrorInfo } from '../../services/googleSheetsService';

interface GoogleSheetErrorCardProps {
  error: GoogleSheetErrorInfo;
  onDismiss?: () => void;
  onSignIn?: () => void;
  onCreateTemplate?: () => void;
  onUseSample?: () => void;
  onRetry?: () => void;
  onChangeTab?: () => void;
  className?: string;
}

export const GoogleSheetErrorCard: React.FC<GoogleSheetErrorCardProps> = ({
  error,
  onDismiss,
  onSignIn,
  onCreateTemplate,
  onUseSample,
  onRetry,
  onChangeTab,
  className = '',
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopyDetails = () => {
    const textToCopy = `School Nexus Google Sheets Error:\nTitle: ${error.title}\nType: ${error.type}\nStatus: ${error.statusCode || 'N/A'}\nMessage: ${error.message}\nSpreadsheet ID: ${error.spreadsheetId || 'N/A'}\nTechnical: ${error.technicalDetails || 'N/A'}`;
    navigator.clipboard?.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Determine theme colors and icon based on error type
  const getTheme = () => {
    switch (error.type) {
      case 'PERMISSION_DENIED_PRIVATE':
        return {
          bg: 'bg-amber-50/90',
          border: 'border-amber-300',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-900 border-amber-300',
          iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
          iconName: 'lock_person',
          accentBtn: 'bg-amber-600 hover:bg-amber-500 text-white',
          secondaryBtn: 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300',
        };
      case 'UNAUTHENTICATED':
        return {
          bg: 'bg-blue-50/90',
          border: 'border-blue-300',
          badgeBg: 'bg-blue-100',
          badgeText: 'text-blue-900 border-blue-300',
          iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-700',
          iconName: 'account_circle',
          accentBtn: 'bg-blue-600 hover:bg-blue-500 text-white',
          secondaryBtn: 'bg-white hover:bg-blue-100 text-blue-900 border-blue-300',
        };
      case 'NOT_FOUND':
        return {
          bg: 'bg-rose-50/90',
          border: 'border-rose-300',
          badgeBg: 'bg-rose-100',
          badgeText: 'text-rose-900 border-rose-300',
          iconBg: 'bg-gradient-to-br from-rose-600 to-red-700',
          iconName: 'search_off',
          accentBtn: 'bg-rose-600 hover:bg-rose-500 text-white',
          secondaryBtn: 'bg-white hover:bg-rose-100 text-rose-900 border-rose-300',
        };
      case 'INVALID_URL':
        return {
          bg: 'bg-orange-50/90',
          border: 'border-orange-300',
          badgeBg: 'bg-orange-100',
          badgeText: 'text-orange-900 border-orange-300',
          iconBg: 'bg-gradient-to-br from-orange-500 to-red-600',
          iconName: 'link_off',
          accentBtn: 'bg-orange-600 hover:bg-orange-500 text-white',
          secondaryBtn: 'bg-white hover:bg-orange-100 text-orange-900 border-orange-300',
        };
      case 'TAB_NOT_FOUND':
        return {
          bg: 'bg-purple-50/90',
          border: 'border-purple-300',
          badgeBg: 'bg-purple-100',
          badgeText: 'text-purple-900 border-purple-300',
          iconBg: 'bg-gradient-to-br from-purple-600 to-indigo-700',
          iconName: 'tab_close',
          accentBtn: 'bg-purple-600 hover:bg-purple-500 text-white',
          secondaryBtn: 'bg-white hover:bg-purple-100 text-purple-900 border-purple-300',
        };
      case 'RATE_LIMIT':
        return {
          bg: 'bg-yellow-50/90',
          border: 'border-yellow-300',
          badgeBg: 'bg-yellow-100',
          badgeText: 'text-yellow-900 border-yellow-300',
          iconBg: 'bg-gradient-to-br from-yellow-500 to-amber-600',
          iconName: 'hourglass_top',
          accentBtn: 'bg-yellow-600 hover:bg-yellow-500 text-white',
          secondaryBtn: 'bg-white hover:bg-yellow-100 text-yellow-900 border-yellow-300',
        };
      case 'EMPTY_DATA':
        return {
          bg: 'bg-teal-50/90',
          border: 'border-teal-300',
          badgeBg: 'bg-teal-100',
          badgeText: 'text-teal-900 border-teal-300',
          iconBg: 'bg-gradient-to-br from-teal-600 to-emerald-700',
          iconName: 'table_rows',
          accentBtn: 'bg-teal-600 hover:bg-teal-500 text-white',
          secondaryBtn: 'bg-white hover:bg-teal-100 text-teal-900 border-teal-300',
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-300',
          badgeBg: 'bg-slate-200',
          badgeText: 'text-slate-800 border-slate-300',
          iconBg: 'bg-gradient-to-br from-slate-600 to-slate-800',
          iconName: 'warning',
          accentBtn: 'bg-slate-800 hover:bg-slate-700 text-white',
          secondaryBtn: 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300',
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      role="alert"
      className={`rounded-3xl border ${theme.border} ${theme.bg} p-5 sm:p-6 shadow-sm transition-all animate-fadeIn ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl ${theme.iconBg} text-white flex items-center justify-center shadow-sm shrink-0`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {theme.iconName}
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${theme.badgeBg} ${theme.badgeText}`}
              >
                {error.statusCode ? `HTTP ${error.statusCode}` : error.type.replace(/_/g, ' ')}
              </span>
              {error.spreadsheetId && (
                <span className="text-[11px] font-mono text-slate-500 bg-white/70 px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[200px]">
                  ID: {error.spreadsheetId}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
              {error.title}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-700 mt-1 leading-relaxed">
              {error.message}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="ปิดการแจ้งเตือน"
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center shadow-2xs transition-all cursor-pointer shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {/* Actionable Steps Checklist */}
      {error.actionableSteps && error.actionableSteps.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-black/5">
          <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px] text-blue-600">lightbulb</span>
            <span>ขั้นตอนแนะนำเพื่อแก้ไข (Actionable Guide):</span>
          </div>
          <div className="space-y-1.5">
            {error.actionableSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 bg-white/70 p-2.5 rounded-xl border border-black/5 text-xs text-slate-800 leading-relaxed font-medium"
              >
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5 pt-2">
        {/* Suggestion 1: Sign in with Google */}
        {onSignIn && (error.type === 'UNAUTHENTICATED' || error.type === 'PERMISSION_DENIED_PRIVATE') && (
          <button
            onClick={onSignIn}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${theme.accentBtn}`}
          >
            <span className="material-symbols-outlined text-[18px]">account_circle</span>
            <span>เชื่อมต่อ / สลับบัญชี Google</span>
          </button>
        )}

        {/* Suggestion 2: Open spreadsheet directly */}
        {error.spreadsheetUrl && error.type === 'PERMISSION_DENIED_PRIVATE' && (
          <a
            href={error.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all border cursor-pointer ${theme.secondaryBtn}`}
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-600">open_in_new</span>
            <span>เปิด Google Sheets เพื่อตั้งค่า "แชร์"</span>
          </a>
        )}

        {/* Suggestion 3: Use Sample URL */}
        {onUseSample && (error.type === 'INVALID_URL' || error.type === 'NOT_FOUND') && (
          <button
            onClick={onUseSample}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all border cursor-pointer ${theme.secondaryBtn}`}
          >
            <span className="material-symbols-outlined text-[18px] text-blue-600">playlist_add_check</span>
            <span>ใส่ URL ตัวอย่างเพื่อทดสอบ</span>
          </button>
        )}

        {/* Suggestion 4: Create Template */}
        {onCreateTemplate && (error.type === 'EMPTY_DATA' || error.type === 'NOT_FOUND' || error.type === 'INVALID_URL') && (
          <button
            onClick={onCreateTemplate}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${theme.accentBtn}`}
          >
            <span className="material-symbols-outlined text-[18px]">add_box</span>
            <span>สร้างแม่แบบใหม่ลง Google Drive</span>
          </button>
        )}

        {/* Suggestion 5: Change Tab */}
        {onChangeTab && error.type === 'TAB_NOT_FOUND' && (
          <button
            onClick={onChangeTab}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${theme.accentBtn}`}
          >
            <span className="material-symbols-outlined text-[18px]">tab</span>
            <span>เลือกแท็บแรกของไฟล์</span>
          </button>
        )}

        {/* Suggestion 6: Retry */}
        {onRetry && (
          <button
            onClick={onRetry}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all border bg-white hover:bg-slate-100 text-slate-800 border-slate-300 cursor-pointer`}
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">refresh</span>
            <span>ลองใหม่อีกครั้ง (Retry)</span>
          </button>
        )}

        {/* Technical Details Toggle */}
        <button
          onClick={() => setShowTechnicalDetails((prev) => !prev)}
          className="ml-auto text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-black/5"
        >
          <span className="material-symbols-outlined text-[15px]">code</span>
          <span>{showTechnicalDetails ? 'ซ่อนข้อมูลเชิงเทคนิค' : 'ดูรายละเอียดเชิงเทคนิค'}</span>
          <span className="material-symbols-outlined text-[14px]">
            {showTechnicalDetails ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {/* Collapsible Technical Details */}
      {showTechnicalDetails && (
        <div className="mt-4 pt-3 border-t border-black/5 animate-fadeIn">
          <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-bold">Technical Diagnostics</span>
              <button
                onClick={handleCopyDetails}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[12px]">
                  {isCopied ? 'check' : 'content_copy'}
                </span>
                <span>{isCopied ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <span className="text-slate-500">Error Type:</span>{' '}
                <span className="text-amber-400 font-bold">{error.type}</span>
              </div>
              <div>
                <span className="text-slate-500">HTTP Status:</span>{' '}
                <span className="text-cyan-400 font-bold">{error.statusCode || 'N/A'}</span>
              </div>
              <div className="col-span-full">
                <span className="text-slate-500">Spreadsheet ID:</span>{' '}
                <span className="text-emerald-400">{error.spreadsheetId || 'None / Not parsed'}</span>
              </div>
              <div className="col-span-full break-all">
                <span className="text-slate-500">Raw Message:</span>{' '}
                <span className="text-rose-300">{error.technicalDetails || error.message}</span>
              </div>
              <div className="col-span-full text-slate-500 text-[10px] mt-1">
                Timestamp: {new Date().toISOString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
