import React, { useState, useEffect } from 'react';
import { UserProfile, ScheduleItem } from '../../types';
import {
  signInWithGoogleSheets,
  getGoogleAccessToken,
  fetchRubricFromSheet,
  importScheduleFromSpreadsheet,
  exportRubricToSpreadsheet,
  exportScheduleToSpreadsheet,
  getSpreadsheetMetadata,
  readSheetRange,
  extractSpreadsheetId,
  AssignmentRubric,
  GoogleSheetMetadata,
} from '../../services/googleSheetsService';
import { WEEKLY_TEACHER_SCHEDULE } from '../../data/mockData';

interface GoogleSheetsManagerProps {
  user: UserProfile;
  onApplyRubricToGrading?: (rubric: AssignmentRubric) => void;
  onScheduleImported?: (scheduleDays: { dayName: string; items: ScheduleItem[] }[]) => void;
  className?: string;
}

type ModeType = 'rubric' | 'schedule' | 'raw';

// Sample spreadsheet template URLs for immediate testing
const SAMPLE_URLS = {
  rubric: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
  schedule: 'https://docs.google.com/spreadsheets/d/1cRhZp9eN0e0T5w4R6m7_EXAMPLE_TEACHER_SCHEDULE/edit',
};

export const GoogleSheetsManager: React.FC<GoogleSheetsManagerProps> = ({
  user,
  onApplyRubricToGrading,
  onScheduleImported,
  className = '',
}) => {
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<ModeType>('rubric');
  const [selectedTabName, setSelectedTabName] = useState<string>('');
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  
  // State management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Loaded data state
  const [loadedRubric, setLoadedRubric] = useState<AssignmentRubric | null>(null);
  const [loadedSchedule, setLoadedSchedule] = useState<{ dayName: string; items: ScheduleItem[] }[] | null>(null);
  const [loadedRawData, setLoadedRawData] = useState<{ header: string[]; rows: any[][] } | null>(null);
  const [metadata, setMetadata] = useState<GoogleSheetMetadata | null>(null);

  // Filter for schedule tab
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<string>('all');
  // Search within raw table
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Check auth status on mount
  useEffect(() => {
    getGoogleAccessToken().then((token) => {
      setIsAuthenticated(Boolean(token));
    });
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Google OAuth sign-in trigger
  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      setErrorMessage(null);
      await signInWithGoogleSheets();
      setIsAuthenticated(true);
      showNotification('เชื่อมต่อกับ Google Workspace สำเร็จแล้ว!');
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setErrorMessage(err.message || 'ไม่สามารถเชื่อมต่อ Google Workspace ได้');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Fetch sheet metadata and tab list when URL changes
  const handleInspectMetadata = async (urlToInspect: string) => {
    const cleanId = extractSpreadsheetId(urlToInspect);
    if (!cleanId) return;

    try {
      const meta = await getSpreadsheetMetadata(cleanId);
      setMetadata(meta);
      const tabNames = meta.sheets.map((s) => s.title);
      setAvailableTabs(tabNames);
      if (tabNames.length > 0 && !selectedTabName) {
        setSelectedTabName(tabNames[0]);
      }
    } catch (err) {
      // Non-fatal if metadata query fails before auth
      console.debug('Failed to pre-fetch metadata:', err);
    }
  };

  // Main data fetch handler
  const handleFetchData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sheetUrl.trim()) {
      setErrorMessage('กรุณาระบุ Google Sheet URL หรือ Spreadsheet ID');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const cleanId = extractSpreadsheetId(sheetUrl);
      if (!cleanId) {
        throw new Error('รูปแบบ URL ของ Google Sheets ไม่ถูกต้อง');
      }

      // 1. Fetch metadata
      let currentMeta = metadata;
      try {
        currentMeta = await getSpreadsheetMetadata(cleanId);
        setMetadata(currentMeta);
        const tabs = currentMeta.sheets.map((s) => s.title);
        setAvailableTabs(tabs);
      } catch {
        // Continue if meta fetch throws but direct read might work
      }

      // 2. Fetch specific mode data
      if (selectedMode === 'rubric') {
        const rubricData = await fetchRubricFromSheet(cleanId, selectedTabName || undefined);
        setLoadedRubric(rubricData);
        setLoadedSchedule(null);
        setLoadedRawData(null);
        showNotification(`นำเข้าเกณฑ์ประเมิน "${rubricData.title}" (${rubricData.criteria.length} หัวข้อ) สำเร็จ!`);
      } else if (selectedMode === 'schedule') {
        const scheduleData = await importScheduleFromSpreadsheet(cleanId, selectedTabName || undefined);
        setLoadedSchedule(scheduleData);
        setLoadedRubric(null);
        setLoadedRawData(null);
        const totalItems = scheduleData.reduce((sum, d) => sum + d.items.length, 0);
        showNotification(`นำเข้าตารางสอน (${totalItems} คาบเรียน) สำเร็จ!`);
        if (onScheduleImported) {
          onScheduleImported(scheduleData);
        }
      } else {
        // Raw Mode
        const targetTab = selectedTabName || (currentMeta?.sheets[0]?.title ?? 'Sheet1');
        const rawValues = await readSheetRange(cleanId, `'${targetTab}'!A1:Z100`);
        if (rawValues.length === 0) {
          throw new Error(`ไม่พบข้อมูลในชีต '${targetTab}'`);
        }
        setLoadedRawData({
          header: rawValues[0]?.map((col) => String(col || '')) || [],
          rows: rawValues.slice(1),
        });
        setLoadedRubric(null);
        setLoadedSchedule(null);
        showNotification(`ดึงข้อมูลตาราง (${rawValues.length} แถว) สำเร็จ!`);
      }
    } catch (err: any) {
      console.error('Fetch Google Sheets failed:', err);
      const isAuthError = err.message?.includes('NO_TOKEN') || err.message?.includes('401') || err.message?.includes('Google');
      if (isAuthError && !isAuthenticated) {
        setErrorMessage('กรุณากดปุ่ม "เชื่อมต่อ Google" เพื่ออนุญาตสิทธิ์เข้าถึง Google Sheets');
      } else {
        setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheets');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quick export demo rubric template
  const handleCreateRubricTemplate = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const sampleCriteria = [
        {
          id: 'c-1',
          name: 'ความถูกต้องและสมบูรณ์ของเนื้อหา (Content Accuracy)',
          description: 'ประเมินความถูกต้องตามหลักวิชาการ ครอบคลุมประเด็นสำคัญ และอ้างอิงแหล่งข้อมูลที่เชื่อถือได้',
          maxScore: 30,
          levels: [
            { label: 'ดีเยี่ยม (30)', score: 30, description: 'เนื้อหาถูกต้องสมบูรณ์แบบ มีการวิเคราะห์เชิงลึกและอ้างอิงชัดเจน' },
            { label: 'ดี (24)', score: 24, description: 'เนื้อหาถูกต้องเป็นส่วนใหญ่ ครอบคลุมประเด็นสำคัญเกือบทั้งหมด' },
            { label: 'พอใช้ (18)', score: 18, description: 'เนื้อหาถูกต้องบางส่วน ขาดรายละเอียดสำคัญในบางจุด' },
            { label: 'ปรับปรุง (10)', score: 10, description: 'เนื้อหามีข้อผิดพลาดหลายจุด ต้องปรับปรุงแก้ไข' },
          ],
        },
        {
          id: 'c-2',
          name: 'ความคิดสร้างสรรค์และนวัตกรรม (Creativity & Innovation)',
          description: 'ประเมินการประยุกต์ใช้ความคิดสร้างสรรค์ การแก้ปัญหาด้วยมุมมองใหม่ หรือการต่อยอดนวัตกรรม',
          maxScore: 25,
          levels: [
            { label: 'ดีเยี่ยม (25)', score: 25, description: 'มีความคิดริเริ่มสร้างสรรค์โดดเด่น แปลกใหม่ และประยุกต์ใช้ได้จริง' },
            { label: 'ดี (20)', score: 20, description: 'มีความคิดสร้างสรรค์และมีการนำเสนอที่น่าสนใจ' },
            { label: 'พอใช้ (15)', score: 15, description: 'มีแนวคิดทั่วไป มีการดัดแปลงจากแบบเดิมเล็กน้อย' },
            { label: 'ปรับปรุง (8)', score: 8, description: 'ขาดความแปลกใหม่ คัดลอกรูปแบบเดิมโดยตรง' },
          ],
        },
        {
          id: 'c-3',
          name: 'การออกแบบและระเบียบรูปเล่ม (Design & Structure)',
          description: 'โครงสร้างการนำเสนอ ความเป็นระเบียบเรียบร้อย และการจัดรูปแบบตามมาตรฐาน',
          maxScore: 25,
          levels: [
            { label: 'ดีเยี่ยม (25)', score: 25, description: 'รูปเล่มสวยงาม การจัดวางเป็นระเบียบ อ่านง่าย ไวยากรณ์ถูกต้องทั้งหมด' },
            { label: 'ดี (20)', score: 20, description: 'รูปเล่มเรียบร้อยดี มีข้อบกพร่องเล็กน้อยที่ไม่กระทบสาระสำคัญ' },
            { label: 'พอใช้ (15)', score: 15, description: 'รูปเล่มค่อนข้างไม่เป็นระเบียบ มีการจัดวางที่ยังไม่สม่ำเสมอ' },
            { label: 'ปรับปรุง (8)', score: 8, description: 'ขาดความเป็นระเบียบ ไม่ตรงตามข้อกำหนดของชิ้นงาน' },
          ],
        },
        {
          id: 'c-4',
          name: 'การตรงต่อเวลาและการส่งงาน (Punctuality)',
          description: 'ส่งงานตรงตามกำหนดเวลาและปฏิบัติตามข้อกำหนดการส่งมอบ',
          maxScore: 20,
        },
      ];

      const res = await exportRubricToSpreadsheet(
        'โครงงานวิทยาศาสตร์และเทคโนโลยี 2569',
        'CS33201',
        sampleCriteria
      );

      setSheetUrl(res.spreadsheetUrl);
      showNotification(`สร้างสเปรดชีตเกณฑ์ประเมิน "${res.title}" บน Google Drive เรียบร้อยแล้ว!`);
      // Auto fetch created sheet
      await handleFetchData();
    } catch (err: any) {
      console.error('Create rubric template error:', err);
      setErrorMessage(err.message || 'ไม่สามารถสร้างสเปรดชีตแม่แบบเกณฑ์ประเมินได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick export current teacher schedule to Google Sheets
  const handleExportScheduleToSheets = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const scheduleDays = [
        { dayName: 'วันจันทร์', dayId: 'mon', items: WEEKLY_TEACHER_SCHEDULE.mon },
        { dayName: 'วันอังคาร', dayId: 'tue', items: WEEKLY_TEACHER_SCHEDULE.tue },
        { dayName: 'วันพุธ', dayId: 'wed', items: WEEKLY_TEACHER_SCHEDULE.wed },
        { dayName: 'วันพฤหัสบดี', dayId: 'thu', items: WEEKLY_TEACHER_SCHEDULE.thu },
        { dayName: 'วันศุกร์', dayId: 'fri', items: WEEKLY_TEACHER_SCHEDULE.fri },
      ];

      const res = await exportScheduleToSpreadsheet(
        scheduleDays,
        `ตารางสอน_${user.thaiName || user.name}_ภาคเรียน1-2569`
      );

      setSheetUrl(res.spreadsheetUrl);
      showNotification(`ส่งออกตารางสอนไปยัง Google Sheets (${res.exportedRowsCount} คาบ) สำเร็จ!`);
    } catch (err: any) {
      console.error('Export schedule error:', err);
      setErrorMessage(err.message || 'ไม่สามารถส่งออกตารางสอนไปยัง Google Sheets ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRubric = () => {
    if (!loadedRubric) return;
    if (onApplyRubricToGrading) {
      onApplyRubricToGrading(loadedRubric);
    }
    showNotification(`นำเกณฑ์ "${loadedRubric.title}" ไปใช้กับการตรวจงานเรียบร้อยแล้ว`);
  };

  // Filtered schedule list
  const filteredScheduleDays = loadedSchedule
    ? selectedScheduleDay === 'all'
      ? loadedSchedule
      : loadedSchedule.filter((d) => d.dayName.includes(selectedScheduleDay))
    : [];

  // Filtered raw rows
  const filteredRawRows = loadedRawData
    ? loadedRawData.rows.filter((row) =>
        searchQuery
          ? row.some((cell) => String(cell).toLowerCase().includes(searchQuery.toLowerCase()))
          : true
      )
    : [];

  return (
    <div className={`bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm transition-all ${className}`}>
      {/* Toast Banner */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 text-xs font-semibold animate-slideDown max-w-md">
          <span className="material-symbols-outlined text-emerald-300 text-[20px]">task_alt</span>
          <span className="flex-1 leading-snug">{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs border border-emerald-200 shrink-0">
            <span className="material-symbols-outlined text-[24px]">table_chart</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                ศูนย์เชื่อมต่อ Google Sheets (Live Data Sync)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                Google Workspace API
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ดึงเกณฑ์การให้คะแนน (Rubric), ตารางสอน, หรือตารางข้อมูลจากสเปรดชีตมาแสดงผลแบบ Real-time
            </p>
          </div>
        </div>

        {/* Auth / Connection Status */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Google เชื่อมต่อแล้ว</span>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isAuthenticating ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อบัญชี Google'}</span>
            </button>
          )}

          {/* Quick Create Buttons Dropdown / Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCreateRubricTemplate}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="สร้างสเปรดชีตแม่แบบเกณฑ์ประเมินใหม่บน Google Drive"
            >
              <span className="material-symbols-outlined text-[16px]">add_box</span>
              <span className="hidden sm:inline">สร้าง Rubric แม่แบบ</span>
            </button>

            <button
              onClick={handleExportScheduleToSheets}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="ส่งออกตารางสอนปัจจุบันไปยัง Google Sheets"
            >
              <span className="material-symbols-outlined text-[16px]">file_upload</span>
              <span className="hidden sm:inline">ส่งออกตารางสอน</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedMode('rubric');
              setErrorMessage(null);
            }}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedMode === 'rubric'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">fact_check</span>
            <span>เกณฑ์ประเมิน (Rubrics)</span>
          </button>

          <button
            onClick={() => {
              setSelectedMode('schedule');
              setErrorMessage(null);
            }}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedMode === 'schedule'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            <span>ตารางสอน (Schedules)</span>
          </button>

          <button
            onClick={() => {
              setSelectedMode('raw');
              setErrorMessage(null);
            }}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedMode === 'raw'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grid_on</span>
            <span>ตารางทั่วไป (Custom Sheet)</span>
          </button>
        </div>

        {/* Sample URL Quick Inserter */}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span className="font-semibold">ทดลองใส่ URL:</span>
          <button
            type="button"
            onClick={() => {
              setSheetUrl(SAMPLE_URLS.rubric);
              handleInspectMetadata(SAMPLE_URLS.rubric);
            }}
            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
          >
            ตัวอย่างเกณฑ์ Rubric
          </button>
          <button
            type="button"
            onClick={() => {
              setSheetUrl(SAMPLE_URLS.schedule);
              handleInspectMetadata(SAMPLE_URLS.schedule);
            }}
            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
          >
            ตัวอย่างตารางสอน
          </button>
        </div>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleFetchData} className="mt-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-3 text-slate-400 material-symbols-outlined text-[18px]">
              link
            </span>
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => {
                setSheetUrl(e.target.value);
                handleInspectMetadata(e.target.value);
              }}
              placeholder="วาง Google Sheets URL (เช่น https://docs.google.com/spreadsheets/d/.../edit) หรือ Spreadsheet ID"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white text-xs sm:text-sm font-medium text-slate-900 outline-none transition-all"
            />
            {sheetUrl && (
              <button
                type="button"
                onClick={() => {
                  setSheetUrl('');
                  setMetadata(null);
                  setAvailableTabs([]);
                  setLoadedRubric(null);
                  setLoadedSchedule(null);
                  setLoadedRawData(null);
                }}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sheet Tab Picker if metadata discovered */}
          {availableTabs.length > 0 && (
            <select
              value={selectedTabName}
              onChange={(e) => setSelectedTabName(e.target.value)}
              className="py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              {availableTabs.map((tab) => (
                <option key={tab} value={tab}>
                  แท็บ: {tab}
                </option>
              ))}
            </select>
          )}

          {/* Fetch Data Button */}
          <button
            type="submit"
            disabled={isLoading || !sheetUrl.trim()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                <span>กำลังดึงข้อมูล...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">sync</span>
                <span>ดึงข้อมูลจากชีต</span>
              </>
            )}
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 cursor-pointer"
              >
                เข้าสู่ระบบ Google ทันที
              </button>
            )}
          </div>
        )}
      </form>

      {/* =========================================================================
          RESULT SECTION 1: RUBRIC DATA TABLE
          ========================================================================= */}
      {loadedRubric && selectedMode === 'rubric' && (
        <div className="mt-6 space-y-4 animate-fadeIn">
          {/* Rubric Header Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  Rubric Matrix
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  แท็บ: {loadedRubric.sheetName || 'Sheet1'} • {loadedRubric.criteria.length} เกณฑ์ประเมิน
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{loadedRubric.title}</h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right sm:border-r border-slate-200 pr-3 mr-1">
                <div className="text-[10px] text-slate-500 uppercase font-bold">คะแนนเต็มรวม</div>
                <div className="text-xl font-black text-blue-700">{loadedRubric.totalMaxScore} คะแนน</div>
              </div>

              {loadedRubric.spreadsheetUrl && (
                <a
                  href={loadedRubric.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 shadow-2xs"
                  title="เปิดดูใน Google Sheets"
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">open_in_new</span>
                </a>
              )}

              <button
                onClick={handleApplyRubric}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>นำเกณฑ์ไปใช้ตรวจงาน</span>
              </button>
            </div>
          </div>

          {/* Responsive Rubric Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                  <th className="py-3 px-4 min-w-[180px]">เกณฑ์การประเมิน (Criteria)</th>
                  <th className="py-3 px-4 min-w-[220px]">คำอธิบายเกณฑ์ (Description)</th>
                  <th className="py-3 px-4 w-24 text-center">คะแนนเต็ม</th>
                  <th className="py-3 px-4 min-w-[340px]">ระดับคะแนน (Scoring Levels)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loadedRubric.criteria.map((crit, idx) => (
                  <tr key={crit.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{crit.name}</td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed">{crit.description}</td>
                    <td className="py-3.5 px-4 text-center font-black text-blue-600 text-sm">
                      {crit.maxScore}
                    </td>
                    <td className="py-3.5 px-4">
                      {crit.levels && crit.levels.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {crit.levels.map((lvl, lIdx) => (
                            <div
                              key={lIdx}
                              className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]"
                            >
                              <div className="font-bold text-slate-800 flex items-center justify-between mb-0.5">
                                <span>{lvl.label}</span>
                                <span className="text-blue-600 font-extrabold">{lvl.score} คะแนน</span>
                              </div>
                              <div className="text-slate-500 text-[10px] leading-tight line-clamp-2">
                                {lvl.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">ประเมินตามคะแนนจริง 0 - {crit.maxScore}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          RESULT SECTION 2: CLASS SCHEDULE DATA TABLE
          ========================================================================= */}
      {loadedSchedule && selectedMode === 'schedule' && (
        <div className="mt-6 space-y-4 animate-fadeIn">
          {/* Schedule Filter and Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
            <div>
              <h3 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-purple-600">calendar_today</span>
                <span>ตารางสอนที่นำเข้าจาก Google Sheets</span>
              </h3>
              <p className="text-xs text-purple-800/80 mt-0.5">
                รวมทั้งหมด {loadedSchedule.reduce((sum, d) => sum + d.items.length, 0)} คาบเรียนในรอบสัปดาห์
              </p>
            </div>

            {/* Day Filter Pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-purple-200">
              {['all', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์'].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedScheduleDay(day)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedScheduleDay === day
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {day === 'all' ? 'ทั้งหมด' : day}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">วัน (Day)</th>
                  <th className="py-3 px-4">เวลา (Time)</th>
                  <th className="py-3 px-4">รหัสวิชา</th>
                  <th className="py-3 px-4 min-w-[180px]">ชื่อรายวิชา</th>
                  <th className="py-3 px-4">ห้องเรียน/อาคาร</th>
                  <th className="py-3 px-4">อาจารย์ผู้สอน</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredScheduleDays.map((dayGroup) =>
                  dayGroup.items.length === 0 ? null : (
                    dayGroup.items.map((item, itemIdx) => (
                      <tr key={item.id || `${dayGroup.dayName}-${itemIdx}`} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {itemIdx === 0 ? (
                            <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 text-[11px]">
                              {dayGroup.dayName}
                            </span>
                          ) : (
                            <span className="text-slate-300">”</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{item.time}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                            {item.subjectCode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.title}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {item.room} {item.building ? `(${item.building})` : ''}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{item.instructor || '-'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            พร้อมใช้งาน
                          </span>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          RESULT SECTION 3: RAW CUSTOM SPREADSHEET TABLE
          ========================================================================= */}
      {loadedRawData && selectedMode === 'raw' && (
        <div className="mt-6 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ข้อมูลตาราง: {metadata?.title || 'Google Sheet'} ({loadedRawData.rows.length} แถว)
              </h3>
              <p className="text-xs text-slate-500">แสดงผลโครงสร้างตารางข้อมูลตามช่วงข้อมูลที่กำหนด</p>
            </div>

            {/* Quick Search within table */}
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-2.5 material-symbols-outlined text-[16px] text-slate-400">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาในตาราง..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center text-slate-400 font-bold">#</th>
                  {loadedRawData.header.map((col, cIdx) => (
                    <th key={cIdx} className="py-3 px-4 font-bold text-slate-700 whitespace-nowrap">
                      {col || `คอลัมน์ ${cIdx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRawRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 text-center font-bold text-slate-400">{rIdx + 1}</td>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-4 text-slate-700 whitespace-nowrap">
                        {String(cell ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State placeholder */}
      {!loadedRubric && !loadedSchedule && !loadedRawData && !isLoading && (
        <div className="mt-6 p-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[28px]">format_list_bulleted_add</span>
          </div>
          <h4 className="text-sm font-bold text-slate-700">ยังไม่มีการโหลดข้อมูลจาก Google Sheets</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            ระบุ URL สเปรดชีตของคุณด้านบน หรือกดปุ่ม <strong>"สร้าง Rubric แม่แบบ"</strong> เพื่อสร้างชีตตัวอย่างเกณฑ์ประเมินบน Google Drive ของคุณทันที
          </p>
        </div>
      )}
    </div>
  );
};
