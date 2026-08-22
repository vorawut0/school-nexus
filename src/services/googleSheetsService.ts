import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../firebase';
import { ScheduleItem } from '../types';

/**
 * Google Workspace OAuth Scopes configured for Google Sheets & Drive integration
 */
export const SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

export interface RubricLevel {
  label: string; // e.g. "ดีเยี่ยม (4)", "ดี (3)", "พอใช้ (2)", "ปรับปรุง (1)"
  score: number;
  description: string;
}

export interface AssignmentRubricCriteria {
  id: string;
  name: string;
  description: string;
  weightPercent?: number;
  maxScore: number;
  levels?: RubricLevel[];
}

export interface AssignmentRubric {
  id: string;
  title: string;
  subjectCode?: string;
  subjectTitle?: string;
  spreadsheetId?: string;
  sheetName?: string;
  spreadsheetUrl?: string;
  totalMaxScore: number;
  criteria: AssignmentRubricCriteria[];
  generalInstructions?: string;
  lastSyncedAt?: string;
}

export interface GoogleSheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: {
    sheetId: number;
    title: string;
    index: number;
    rowCount?: number;
    columnCount?: number;
  }[];
}

export interface GoogleDriveSpreadsheetFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface ScheduleExportResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  exportedRowsCount: number;
  createdAt: string;
}

// In-memory token cache (Do NOT store in localStorage or sessionStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Create configured GoogleAuthProvider with all required Sheets & Drive scopes
function getGoogleSheetsProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  SHEETS_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({
    prompt: 'consent',
    access_type: 'offline',
  });
  return provider;
}

/**
 * Initialize Google Auth State listener.
 * Clears access token on logout, and notifies caller.
 */
export function initGoogleAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
): () => void {
  return onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      if (cachedAccessToken) {
        onAuthSuccess?.(currentUser, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
}

/**
 * Trigger Google Sign-in with Sheets & Drive OAuth Scopes.
 * Must be triggered by user gesture (button click).
 */
export async function signInWithGoogleSheets(): Promise<{
  user: User;
  accessToken: string;
}> {
  try {
    isSigningIn = true;
    const provider = getGoogleSheetsProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('ไม่สามารถรับ Access Token จาก Google OAuth ได้ กรุณาลองใหม่อีกครั้ง');
    }

    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    console.error('[GoogleSheetsService] Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Get current in-memory access token or request user to log in
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

/**
 * Manually set the in-memory access token
 */
export function setCachedAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

/**
 * Helper to ensure an access token is available before calling Google APIs
 */
async function requireAccessToken(): Promise<string> {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('NO_TOKEN: กรุณาเชื่อมต่อบัญชี Google (Sign in with Google) เพื่อใช้งาน Google Sheets API');
  }
  return token;
}

/**
 * Extract Spreadsheet ID from standard Google Sheets URLs or raw ID string.
 * Supports:
 * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
 * - https://docs.google.com/spreadsheets/u/0/d/SPREADSHEET_ID/...
 * - raw SPREADSHEET_ID
 */
export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/* =========================================================================
   GOOGLE SHEETS CORE APIS
   ========================================================================= */

/**
 * Fetch spreadsheet metadata (title, list of sheet tabs, sheet IDs)
 * Best Practice: Always call this first to get actual sheet tab names instead of hardcoding "Sheet1".
 */
export async function getSpreadsheetMetadata(spreadsheetId: string): Promise<GoogleSheetMetadata> {
  const token = await requireAccessToken();
  const cleanId = extractSpreadsheetId(spreadsheetId);

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=spreadsheetId,properties.title,spreadsheetUrl,sheets.properties`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `ไม่สามารถดึงข้อมูลสเปรดชีตได้ (HTTP ${res.status})`);
  }

  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId ?? 0,
    title: s.properties?.title ?? 'Sheet1',
    index: s.properties?.index ?? 0,
    rowCount: s.properties?.gridProperties?.rowCount,
    columnCount: s.properties?.gridProperties?.columnCount,
  }));

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
    sheets,
  };
}

/**
 * Read values from a specific sheet range (e.g. "Sheet1!A1:Z100" or "Rubrics!A1:F50")
 */
export async function readSheetRange(
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const token = await requireAccessToken();
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const encodedRange = encodeURIComponent(range);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}?valueRenderOption=FORMATTED_VALUE`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `เกิดข้อผิดพลาดในการอ่านข้อมูลช่วง ${range} (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Create a new blank or named Google Spreadsheet
 */
export async function createSpreadsheet(
  title: string,
  sheetTitles: string[] = ['Sheet1']
): Promise<GoogleSheetMetadata> {
  const token = await requireAccessToken();

  const payload = {
    properties: {
      title: title || 'School Nexus Spreadsheet',
    },
    sheets: sheetTitles.map((tabTitle) => ({
      properties: {
        title: tabTitle,
      },
    })),
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `ไม่สามารถสร้างสเปรดชีตใหม่ได้ (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || title,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId ?? 0,
      title: s.properties?.title ?? 'Sheet1',
      index: s.properties?.index ?? 0,
    })),
  };
}

/**
 * Write or update values in a specific range
 */
export async function updateSheetValues(
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<{ updatedRows: number; updatedColumns: number; updatedCells: number }> {
  const token = await requireAccessToken();
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const encodedRange = encodeURIComponent(range);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `ไม่สามารถบันทึกข้อมูลลง Google Sheet ได้ (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    updatedRows: data.updatedRows || 0,
    updatedColumns: data.updatedColumns || 0,
    updatedCells: data.updatedCells || 0,
  };
}

/**
 * List user's Google Sheets from Google Drive
 */
export async function listUserSpreadsheets(pageSize: number = 20): Promise<GoogleDriveSpreadsheetFile[]> {
  const token = await requireAccessToken();

  const query = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
  const fields = 'files(id,name,mimeType,modifiedTime,webViewLink,iconLink)';
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=${pageSize}&orderBy=modifiedTime desc&fields=${encodeURIComponent(fields)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || 'ไม่สามารถดึงรายการไฟล์สเปรดชีตจาก Google Drive ได้');
  }

  const data = await res.json();
  return data.files || [];
}

/* =========================================================================
   FEATURE 1: ASSIGNMENT RUBRIC IMPORT & SYNC
   ========================================================================= */

/**
 * Fetch and parse Assignment Rubric from a Google Sheet.
 * Dynamically resolves the sheet tab name without assuming "Sheet1".
 *
 * Expected structure in Google Sheet:
 * - Row 1: Header / Title (e.g. "เกณฑ์การให้คะแนน (Rubric): โครงงานวิทยาศาสตร์")
 * - Row 2: Table Columns: [เกณฑ์การประเมิน (Criteria), คำอธิบาย, คะแนนเต็ม, ดีเยี่ยม (4), ดี (3), พอใช้ (2), ปรับปรุง (1)]
 * - Row 3+: Criteria entries
 */
export async function fetchRubricFromSheet(
  spreadsheetIdOrUrl: string,
  specifiedSheetName?: string
): Promise<AssignmentRubric> {
  const cleanId = extractSpreadsheetId(spreadsheetIdOrUrl);
  if (!cleanId) {
    throw new Error('กรุณาระบุ Google Spreadsheet ID หรือ URL ที่ถูกต้อง');
  }

  // 1. Fetch metadata to discover tabs
  const meta = await getSpreadsheetMetadata(cleanId);
  if (!meta.sheets.length) {
    throw new Error('ไม่พบแท็บข้อมูลในสเปรดชีตนี้');
  }

  // Determine target sheet tab name
  const targetSheetName = specifiedSheetName
    ? meta.sheets.find((s) => s.title.toLowerCase() === specifiedSheetName.toLowerCase())?.title || meta.sheets[0].title
    : meta.sheets.find((s) => s.title.toLowerCase().includes('rubric') || s.title.toLowerCase().includes('เกณฑ์'))?.title || meta.sheets[0].title;

  // 2. Read values from target tab
  const range = `'${targetSheetName}'!A1:Z60`;
  const rawRows = await readSheetRange(cleanId, range);

  if (!rawRows || rawRows.length < 2) {
    throw new Error(`แท็บ '${targetSheetName}' ไม่มีข้อมูลหรือมีแถวน้อยเกินไปสำหรับการแปลงเป็นเกณฑ์ประเมิน (Rubric)`);
  }

  const rubricTitle = rawRows[0]?.[0] || meta.title;
  let headerRowIndex = 1;

  // Locate the header row containing "Criteria", "เกณฑ์", "หัวข้อ", or "คะแนน"
  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    const rowStr = (rawRows[i] || []).join(' ').toLowerCase();
    if (rowStr.includes('เกณฑ์') || rowStr.includes('criteria') || rowStr.includes('หัวข้อ') || rowStr.includes('คะแนน')) {
      headerRowIndex = i;
      break;
    }
  }

  const headerRow = rawRows[headerRowIndex] || [];
  const criteriaList: AssignmentRubricCriteria[] = [];
  let totalCalculatedScore = 0;

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || !row[0] || String(row[0]).trim() === '') continue;

    const criterionName = String(row[0]).trim();
    // Stop if we hit a summary/total row
    if (criterionName.includes('รวม') || criterionName.toLowerCase().includes('total')) {
      continue;
    }

    const description = String(row[1] || '').trim();
    const rawScore = parseFloat(row[2]) || 10;
    const maxScore = isNaN(rawScore) ? 10 : rawScore;
    totalCalculatedScore += maxScore;

    // Parse levels if provided in columns D, E, F, G...
    const levels: RubricLevel[] = [];
    if (row.length > 3) {
      for (let c = 3; c < row.length; c++) {
        const levelText = String(row[c] || '').trim();
        if (levelText) {
          const colHeader = String(headerRow[c] || `ระดับ ${c - 2}`);
          // Calculate proportional score for this level
          const levelFraction = (row.length - c) / Math.max(row.length - 3, 1);
          levels.push({
            label: colHeader,
            score: Math.round(maxScore * levelFraction * 10) / 10,
            description: levelText,
          });
        }
      }
    }

    criteriaList.push({
      id: `crit-${r}`,
      name: criterionName,
      description: description || `การประเมินด้าน ${criterionName}`,
      maxScore,
      levels: levels.length > 0 ? levels : undefined,
    });
  }

  if (criteriaList.length === 0) {
    // Fallback default criterion if format is non-standard
    criteriaList.push({
      id: 'crit-default',
      name: 'การประเมินคุณภาพผลงานโดยรวม',
      description: 'ประเมินความถูกต้อง สมบูรณ์ และความคิดสร้างสรรค์',
      maxScore: 100,
    });
    totalCalculatedScore = 100;
  }

  return {
    id: `rubric-${cleanId}`,
    title: rubricTitle,
    spreadsheetId: cleanId,
    sheetName: targetSheetName,
    spreadsheetUrl: meta.spreadsheetUrl,
    totalMaxScore: totalCalculatedScore,
    criteria: criteriaList,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Create a formatted Rubric template spreadsheet directly in teacher's Google Sheets
 */
export async function exportRubricToSpreadsheet(
  assignmentTitle: string,
  subjectCode: string,
  criteria: AssignmentRubricCriteria[]
): Promise<ScheduleExportResult> {
  const sheetTitle = `เกณฑ์ประเมิน_${subjectCode || 'RUBRIC'}_${assignmentTitle.slice(0, 20)}`;
  const created = await createSpreadsheet(sheetTitle, ['Rubric_Criteria']);
  const targetTab = 'Rubric_Criteria';

  const rows: any[][] = [
    [`เกณฑ์การประเมิน (Rubric): ${assignmentTitle}`, '', '', '', '', ''],
    ['รหัสวิชา:', subjectCode || '-', 'สร้างเมื่อ:', new Date().toLocaleString('th-TH'), '', ''],
    [''],
    ['เกณฑ์การประเมิน (Criteria)', 'คำอธิบาย (Description)', 'คะแนนเต็ม (Max)', 'ดีเยี่ยม (4)', 'ดี (3)', 'พอใช้ (2)', 'ปรับปรุง (1)'],
  ];

  let totalScore = 0;
  criteria.forEach((c) => {
    totalScore += c.maxScore;
    rows.push([
      c.name,
      c.description,
      c.maxScore,
      c.levels?.[0]?.description || 'ทำได้ถูกต้องครบถ้วน สมบูรณ์แบบทุกขั้นตอน',
      c.levels?.[1]?.description || 'ทำได้ถูกต้องตามเกณฑ์หลัก มีข้อบกพร่องเล็กน้อย',
      c.levels?.[2]?.description || 'ทำได้บางส่วน ต้องได้รับคำแนะนำเพิ่มเติม',
      c.levels?.[3]?.description || 'ยังไม่เป็นไปตามเกณฑ์ ต้องปรับปรุงแก้ไข',
    ]);
  });

  rows.push(['']);
  rows.push(['คะแนนรวมทั้งสิ้น', '', totalScore, '', '', '', '']);

  await updateSheetValues(created.spreadsheetId, `'${targetTab}'!A1:G${rows.length}`, rows);

  return {
    success: true,
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl: created.spreadsheetUrl,
    title: created.title,
    exportedRowsCount: rows.length,
    createdAt: new Date().toISOString(),
  };
}

/* =========================================================================
   FEATURE 2: CLASS SCHEDULE EXPORT & IMPORT
   ========================================================================= */

/**
 * Export Class Timetable / Schedule directly to Google Sheets with styled tabular format.
 */
export async function exportScheduleToSpreadsheet(
  scheduleDays: { dayName: string; dayId: string; items: ScheduleItem[] }[],
  customTitle?: string
): Promise<ScheduleExportResult> {
  const title = customTitle || `ตารางเรียนและตารางสอน_SchoolNexus_${new Date().getFullYear()}`;
  const created = await createSpreadsheet(title, ['ตารางเรียน']);
  const targetTab = 'ตารางเรียน';

  const rows: any[][] = [
    ['ตารางเรียน / ตารางสอน - ระบบ School Nexus Smart Campus', '', '', '', '', '', '', ''],
    ['ส่งออกจากระบบเมื่อ:', new Date().toLocaleString('th-TH'), 'สถานะ:', 'ใช้งานจริง (Active)', '', '', '', ''],
    [''],
    ['วัน (Day)', 'คาบที่', 'เวลา (Time)', 'รหัสวิชา (Code)', 'ชื่อวิชา (Subject Title)', 'ห้องเรียน (Room)', 'อาคาร (Building)', 'อาจารย์ผู้สอน (Instructor)', 'ประเภท (Category)'],
  ];

  let totalItemsCount = 0;

  scheduleDays.forEach((dayGroup) => {
    if (dayGroup.items.length === 0) {
      rows.push([dayGroup.dayName, '-', '-', '-', 'ไม่มีตารางเรียนในวันนี้', '-', '-', '-', '-']);
      return;
    }

    dayGroup.items.forEach((item, index) => {
      totalItemsCount++;
      rows.push([
        index === 0 ? dayGroup.dayName : '', // Show day name once per group for cleaner look
        item.periodNumber || index + 1,
        item.time || `${item.startTime} - ${item.endTime}`,
        item.subjectCode || '-',
        item.title || '-',
        item.room || '-',
        item.building || '-',
        item.instructor || '-',
        item.category === 'core' ? 'วิชาบังคับหลัก' : item.category === 'elective' ? 'วิชาเลือก' : item.category === 'lab' ? 'ปฏิบัติการ (Lab)' : 'กิจกรรม',
      ]);
    });
    // Visual separator row between days
    rows.push(['']);
  });

  await updateSheetValues(created.spreadsheetId, `'${targetTab}'!A1:I${rows.length}`, rows);

  return {
    success: true,
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl: created.spreadsheetUrl,
    title: created.title,
    exportedRowsCount: totalItemsCount,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Import and parse schedule items from an existing Google Sheet.
 */
export async function importScheduleFromSpreadsheet(
  spreadsheetIdOrUrl: string,
  specifiedSheetName?: string
): Promise<{ dayName: string; items: ScheduleItem[] }[]> {
  const cleanId = extractSpreadsheetId(spreadsheetIdOrUrl);
  if (!cleanId) {
    throw new Error('กรุณาระบุ Google Spreadsheet ID หรือ URL ที่ถูกต้อง');
  }

  const meta = await getSpreadsheetMetadata(cleanId);
  const targetTab = specifiedSheetName || meta.sheets[0]?.title || 'Sheet1';
  const rawRows = await readSheetRange(cleanId, `'${targetTab}'!A1:I100`);

  if (!rawRows || rawRows.length < 2) {
    throw new Error('ไม่พบข้อมูลตารางเรียนในสเปรดชีตนี้');
  }

  // Find header row index
  let headerIndex = 0;
  for (let i = 0; i < Math.min(rawRows.length, 6); i++) {
    const rowStr = (rawRows[i] || []).join(' ').toLowerCase();
    if (rowStr.includes('วัน') || rowStr.includes('เวลา') || rowStr.includes('รหัสวิชา') || rowStr.includes('subject')) {
      headerIndex = i;
      break;
    }
  }

  const groupedDays: { [day: string]: ScheduleItem[] } = {
    'วันจันทร์': [],
    'วันอังคาร': [],
    'วันพุธ': [],
    'วันพฤหัสบดี': [],
    'วันศุกร์': [],
  };

  let currentDay = 'วันจันทร์';

  for (let r = headerIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0 || row.every((c: any) => !c || String(c).trim() === '')) continue;

    // Day column
    if (row[0] && String(row[0]).trim() !== '') {
      currentDay = String(row[0]).trim();
    }

    const timeStr = String(row[2] || row[1] || '08:30 - 09:20').trim();
    const subjectCode = String(row[3] || row[2] || '').trim();
    const title = String(row[4] || row[3] || 'วิชาการเรียน').trim();
    const room = String(row[5] || row[4] || 'Lab 101').trim();
    const building = String(row[6] || row[5] || 'อาคาร 1').trim();
    const instructor = String(row[7] || row[6] || 'อาจารย์ประจำวิชา').trim();

    if (!subjectCode && !title) continue;

    const times = timeStr.split('-').map((t) => t.trim());
    const startTime = times[0] || '08:30';
    const endTime = times[1] || '09:20';

    const item: ScheduleItem = {
      id: `imported-${r}-${Date.now()}`,
      time: timeStr,
      startTime,
      endTime,
      title,
      subjectCode,
      room,
      building,
      instructor,
      status: 'upcoming',
    };

    if (!groupedDays[currentDay]) {
      groupedDays[currentDay] = [];
    }
    groupedDays[currentDay].push(item);
  }

  return Object.entries(groupedDays).map(([dayName, items]) => ({
    dayName,
    items,
  }));
}
