import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../../types';
import {
  signInWithGoogleSheets,
  getGoogleAccessToken,
  fetchRubricFromSheet,
  exportRubricToSpreadsheet,
  getSpreadsheetMetadata,
  readSheetRange,
  extractSpreadsheetId,
  saveRubricToFirestore,
  subscribeToFirestoreRubrics,
  subscribeToGoogleSheetConnections,
  deleteGoogleSheetConnectionFromFirestore,
  exportFirestoreGradesToGoogleSheet,
  exportAttendanceToGoogleSheet,
  classifyGoogleSheetError,
  GoogleSheetErrorInfo,
  AssignmentRubric,
  GoogleSheetMetadata,
  GoogleSheetConnection,
  SheetPollResult,
} from '../../services/googleSheetsService';
import { GoogleSheetErrorCard } from './GoogleSheetErrorCard';
import { GoogleSheetSyncIndicator } from './GoogleSheetSyncIndicator';

interface GoogleSheetsManagerProps {
  user: UserProfile;
  onApplyRubricToGrading?: (rubric: AssignmentRubric) => void;
  onActiveSheetChanged?: (url: string) => void;
  className?: string;
}

type ModeType = 'grades' | 'attendance' | 'rubric' | 'linked_sheets';

interface StudentGradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  subjectCode: string;
  subjectTitle: string;
  assignmentTitle: string;
  score: number;
  maxScore: number;
  gradeLabel: string;
  status: 'graded' | 'pending';
  feedback?: string;
  submittedAt: string;
}

interface StudentAttendanceRecord {
  studentId: string;
  studentName: string;
  classroom: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  checkInTime?: string;
  note?: string;
}

// Initial robust dataset of real student grades and submissions
const INITIAL_STUDENT_GRADES: StudentGradeRecord[] = [
  {
    id: 'sg-1',
    studentId: '66041001',
    studentName: 'วรวุฒิ เพ็ชรราย',
    classroom: 'ม.6/1',
    subjectCode: 'ว33281',
    subjectTitle: 'AI & Robotics',
    assignmentTitle: 'โครงงานโมเดล Deep Learning จำแนกภาพ CNN',
    score: 19.5,
    maxScore: 20,
    gradeLabel: 'ดีเยี่ยม (4)',
    status: 'graded',
    feedback: 'โมเดลมี Accuracy สูงถึง 94% และเขียนรายงานการทดลองได้ละเอียดมาก',
    submittedAt: 'วันนี้ 09:12 น.',
  },
  {
    id: 'sg-2',
    studentId: '66040188',
    studentName: 'ณัฐพล ศิริพันธ์ (กันต์)',
    classroom: 'ม.6/1',
    subjectCode: 'ว33281',
    subjectTitle: 'AI & Robotics',
    assignmentTitle: 'โครงงานโมเดล Deep Learning จำแนกภาพ CNN',
    score: 18.0,
    maxScore: 20,
    gradeLabel: 'ดีเยี่ยม (4)',
    status: 'graded',
    feedback: 'ออกแบบสถาปัตยกรรม CNN ได้ถูกต้อง มี Confusion Matrix ครบถ้วน',
    submittedAt: 'วันนี้ 07:15 น.',
  },
  {
    id: 'sg-3',
    studentId: '66040233',
    studentName: 'ฉัตรชัย พรหมศิริ',
    classroom: 'ม.6/2',
    subjectCode: 'ว33282',
    subjectTitle: 'Web Development',
    assignmentTitle: 'แล็บการเขียนโปรแกรม REST API ด้วย Python FastAPI',
    score: 14.0,
    maxScore: 15,
    gradeLabel: 'ดีมาก (3.5)',
    status: 'graded',
    feedback: 'โค้ดมีโครงสร้างสะอาด มีเอกสาร OpenAPI สวยงามและจัดการ Exception ได้ดีมาก',
    submittedAt: '17 ส.ค. 18:20 น.',
  },
  {
    id: 'sg-4',
    studentId: '66040105',
    studentName: 'กวินทร์ รัตนโชติ',
    classroom: 'ม.6/2',
    subjectCode: 'ว33282',
    subjectTitle: 'Web Development',
    assignmentTitle: 'แล็บการเขียนโปรแกรม REST API ด้วย Python FastAPI',
    score: 13.5,
    maxScore: 15,
    gradeLabel: 'ดีมาก (3.5)',
    status: 'graded',
    feedback: 'ใช้งาน Pydantic Schemas ได้ถูกต้อง เชื่อมต่อฐานข้อมูลได้ราบรื่น',
    submittedAt: '17 ส.ค. 19:40 น.',
  },
  {
    id: 'sg-5',
    studentId: '66040112',
    studentName: 'สุภาวดี รักเรียน',
    classroom: 'ม.6/1',
    subjectCode: 'ว33281',
    subjectTitle: 'AI & Robotics',
    assignmentTitle: 'โครงงานโมเดล Deep Learning จำแนกภาพ CNN',
    score: 17.5,
    maxScore: 20,
    gradeLabel: 'ดีมาก (3.5)',
    status: 'graded',
    feedback: 'ผลการ Train Model ดีมาก มีการบันทึก Loss Graph ชัดเจน',
    submittedAt: 'วันนี้ 08:30 น.',
  },
  {
    id: 'sg-6',
    studentId: '66040144',
    studentName: 'กิตติศักดิ์ พัฒนา',
    classroom: 'ม.6/1',
    subjectCode: 'ว33281',
    subjectTitle: 'AI & Robotics',
    assignmentTitle: 'โครงงานโมเดล Deep Learning จำแนกภาพ CNN',
    score: 15.0,
    maxScore: 20,
    gradeLabel: 'ดี (3)',
    status: 'graded',
    feedback: 'ควรเพิ่มขั้นตอน Data Augmentation เพื่อลด Overfitting',
    submittedAt: 'วันนี้ 08:45 น.',
  },
  {
    id: 'sg-7',
    studentId: '66040199',
    studentName: 'นริศรา มีสุข',
    classroom: 'ม.6/2',
    subjectCode: 'ว33282',
    subjectTitle: 'Web Development',
    assignmentTitle: 'แล็บการเขียนโปรแกรม REST API ด้วย Python FastAPI',
    score: 15.0,
    maxScore: 15,
    gradeLabel: 'ดีเยี่ยม (4)',
    status: 'graded',
    feedback: 'สมบูรณ์แบบ มีระบบ JWT Authentication และ Unit Test ครบถ้วน',
    submittedAt: '17 ส.ค. 20:10 น.',
  },
  {
    id: 'sg-8',
    studentId: '66040210',
    studentName: 'ธนกฤต มั่งมี',
    classroom: 'ม.6/2',
    subjectCode: 'ว33282',
    subjectTitle: 'Web Development',
    assignmentTitle: 'แล็บการเขียนโปรแกรม REST API ด้วย Python FastAPI',
    score: 12.0,
    maxScore: 15,
    gradeLabel: 'ดี (3)',
    status: 'graded',
    feedback: 'ทำงานได้ตามโจทย์หลัก ควรเพิ่ม Error Handling ใน Endpoint ข้อมูลผู้ใช้',
    submittedAt: '17 ส.ค. 21:05 น.',
  },
];

const INITIAL_ATTENDANCE: StudentAttendanceRecord[] = [
  { studentId: '66041001', studentName: 'วรวุฒิ เพ็ชรราย', classroom: 'ม.6/1', status: 'present', checkInTime: '08:12 น.', note: 'สแกน QR ประตูหน้า' },
  { studentId: '66040188', studentName: 'ณัฐพล ศิริพันธ์ (กันต์)', classroom: 'ม.6/1', status: 'present', checkInTime: '08:15 น.', note: 'สแกน QR ประตูหน้า' },
  { studentId: '66040112', studentName: 'สุภาวดี รักเรียน', classroom: 'ม.6/1', status: 'present', checkInTime: '08:18 น.', note: 'สแกน QR ประตูหน้า' },
  { studentId: '66040144', studentName: 'กิตติศักดิ์ พัฒนา', classroom: 'ม.6/1', status: 'late', checkInTime: '08:38 น.', note: 'มาสาย (การจราจรติดขัด)' },
  { studentId: '66040233', studentName: 'ฉัตรชัย พรหมศิริ', classroom: 'ม.6/2', status: 'present', checkInTime: '08:10 น.', note: 'สแกน QR ประตูหน้า' },
  { studentId: '66040105', studentName: 'กวินทร์ รัตนโชติ', classroom: 'ม.6/2', status: 'late', checkInTime: '08:42 น.', note: 'มาสาย 12 นาที' },
  { studentId: '66040199', studentName: 'นริศรา มีสุข', classroom: 'ม.6/2', status: 'present', checkInTime: '08:05 น.', note: 'สแกน QR ประตูหน้า' },
  { studentId: '66040210', studentName: 'ธนกฤต มั่งมี', classroom: 'ม.6/2', status: 'leave', note: 'ลาป่วย มีใบรับรองแพทย์' },
];

export const GoogleSheetsManager: React.FC<GoogleSheetsManagerProps> = ({
  user,
  onApplyRubricToGrading,
  onActiveSheetChanged,
  className = '',
}) => {
  // Mode Selection: 'grades' is the direct default focus
  const [selectedMode, setSelectedMode] = useState<ModeType>('grades');
  
  // Sheet URL state & Customization
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customSheetTitle, setCustomSheetTitle] = useState<string>('');
  const [showExistingSheetInput, setShowExistingSheetInput] = useState<boolean>(false);

  // Data State
  const [studentGrades, setStudentGrades] = useState<StudentGradeRecord[]>(INITIAL_STUDENT_GRADES);
  const [attendanceList, setAttendanceList] = useState<StudentAttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [editingScoreValue, setEditingScoreValue] = useState<string>('');

  // Status & Auth
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [errorInfo, setErrorInfo] = useState<GoogleSheetErrorInfo | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [lastExportedSheet, setLastExportedSheet] = useState<{ title: string; url: string; rows: number } | null>(null);

  // Rubrics & Firestore Sync
  const [loadedRubric, setLoadedRubric] = useState<AssignmentRubric | null>(null);
  const [savedFirestoreRubrics, setSavedFirestoreRubrics] = useState<AssignmentRubric[]>([]);
  const [linkedConnections, setLinkedConnections] = useState<GoogleSheetConnection[]>([]);
  const [autoSyncToFirestore, setAutoSyncToFirestore] = useState<boolean>(true);

  // Check auth & Subscribe to Firestore
  useEffect(() => {
    getGoogleAccessToken().then((token) => {
      setIsAuthenticated(Boolean(token));
    });

    const unsubRubrics = subscribeToFirestoreRubrics((rubrics) => {
      setSavedFirestoreRubrics(rubrics);
    });

    const unsubConnections = subscribeToGoogleSheetConnections((connections) => {
      setLinkedConnections(connections);
    });

    return () => {
      unsubRubrics();
      unsubConnections();
    };
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Google OAuth sign-in trigger
  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      setErrorInfo(null);
      await signInWithGoogleSheets();
      setIsAuthenticated(true);
      showNotification('เชื่อมต่อบัญชี Google Workspace สำเร็จแล้ว!');
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('cancelled-popup-request')
      ) {
        console.log('Google Sign-In popup closed by user.');
        showNotification('ยกเลิกการเข้าสู่ระบบ (หน้าต่างเข้าสู่ระบบถูกปิด)');
      } else {
        console.error('Google Sign-In failed:', err);
        const classified = classifyGoogleSheetError(err, sheetUrl);
        setErrorInfo(classified);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Filtered Student Grades
  const filteredGrades = useMemo(() => {
    return studentGrades.filter((s) => {
      const matchClass = selectedClassFilter === 'all' || s.classroom === selectedClassFilter;
      const matchSubject = selectedSubjectFilter === 'all' || s.subjectCode === selectedSubjectFilter;
      const matchSearch =
        !searchQuery ||
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.includes(searchQuery) ||
        s.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSubject && matchSearch;
    });
  }, [studentGrades, selectedClassFilter, selectedSubjectFilter, searchQuery]);

  // Grade Statistics Summary
  const stats = useMemo(() => {
    const total = filteredGrades.length;
    if (total === 0) return { total: 0, avg: '0', max: 0, min: 0, passCount: 0, passPct: 0 };

    let sum = 0;
    let max = -Infinity;
    let min = Infinity;
    let passCount = 0;

    filteredGrades.forEach((g) => {
      sum += g.score;
      if (g.score > max) max = g.score;
      if (g.score < min) min = g.score;
      if (g.score >= g.maxScore * 0.5) passCount++;
    });

    const avg = (sum / total).toFixed(2);
    const passPct = Math.round((passCount / total) * 100);

    return { total, avg, max: max === -Infinity ? 0 : max, min: min === Infinity ? 0 : min, passCount, passPct };
  }, [filteredGrades]);

  // Edit single student score on the fly
  const handleSaveInlineScore = (id: string) => {
    const val = parseFloat(editingScoreValue);
    if (isNaN(val) || val < 0) {
      setEditingScoreId(null);
      return;
    }

    setStudentGrades((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const clamped = Math.min(val, item.maxScore);
          const pct = (clamped / item.maxScore) * 100;
          let gradeLabel = 'ปรับปรุง (1)';
          if (pct >= 80) gradeLabel = 'ดีเยี่ยม (4)';
          else if (pct >= 75) gradeLabel = 'ดีมาก (3.5)';
          else if (pct >= 70) gradeLabel = 'ดี (3)';
          else if (pct >= 65) gradeLabel = 'ค่อนข้างดี (2.5)';
          else if (pct >= 60) gradeLabel = 'ปานกลาง (2)';
          else if (pct >= 50) gradeLabel = 'ผ่านเกณฑ์ (1)';

          return { ...item, score: clamped, gradeLabel };
        }
        return item;
      })
    );
    setEditingScoreId(null);
  };

  // =========================================================================
  // CORE 1-CLICK ACTION: DIRECT EXPORT STUDENT GRADES TO GOOGLE SHEETS
  // =========================================================================
  const handleDirectExportGradesToSheets = async () => {
    try {
      setIsLoading(true);
      setErrorInfo(null);

      const targetTitle =
        customSheetTitle.trim() ||
        `สมุดบันทึกคะแนน_${selectedSubjectFilter !== 'all' ? selectedSubjectFilter : 'รวมวิชา'}_${selectedClassFilter !== 'all' ? selectedClassFilter : 'ทุกห้อง'}_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}`;

      const payload = filteredGrades.map((g) => ({
        studentId: g.studentId,
        studentName: g.studentName,
        score: g.score,
        maxScore: g.maxScore,
        grade: g.gradeLabel,
        feedback: g.feedback || (g.status === 'graded' ? 'ตรวจแล้ว' : 'รอตรวจ'),
        status: g.status,
        submittedAt: g.submittedAt,
      }));

      const res = await exportFirestoreGradesToGoogleSheet(
        targetTitle,
        selectedSubjectFilter !== 'all' ? selectedSubjectFilter : 'CS-GRADE',
        payload
      );

      setLastExportedSheet({
        title: res.title,
        url: res.spreadsheetUrl,
        rows: res.exportedRowsCount,
      });

      setSheetUrl(res.spreadsheetUrl);
      onActiveSheetChanged?.(res.spreadsheetUrl);
      showNotification(`✅ ส่งออกรายชื่อและคะแนนนักเรียน ${res.exportedRowsCount} คนไปยัง Google Sheets สำเร็จแล้ว!`);
    } catch (err: any) {
      console.error('Export grades error:', err);
      const classified = classifyGoogleSheetError(err, sheetUrl);
      setErrorInfo(classified);
    } finally {
      setIsLoading(false);
    }
  };

  // Export to CSV directly for instant offline usage
  const handleExportCSV = () => {
    const headers = [
      'ลำดับ',
      'รหัสนักเรียน',
      'ชื่อ-นามสกุล',
      'ห้องเรียน',
      'รหัสวิชา',
      'ชื่อวิชา',
      'หัวข้องาน',
      'คะแนนที่ได้',
      'คะแนนเต็ม',
      'คิดเป็นร้อยละ (%)',
      'ผลประเมิน/เกรด',
      'ข้อคิดเห็นอาจารย์',
      'เวลาส่งงาน',
    ];

    const rows = filteredGrades.map((g, idx) => [
      idx + 1,
      `"${g.studentId}"`,
      `"${g.studentName}"`,
      `"${g.classroom}"`,
      `"${g.subjectCode}"`,
      `"${g.subjectTitle}"`,
      `"${g.assignmentTitle}"`,
      g.score,
      g.maxScore,
      ((g.score / g.maxScore) * 100).toFixed(1),
      `"${g.gradeLabel}"`,
      `"${g.feedback || '-'}"`,
      `"${g.submittedAt}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `สมุดคะแนน_${selectedSubjectFilter !== 'all' ? selectedSubjectFilter : 'สรุป'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('📥 ดาวน์โหลดไฟล์คะแนน CSV เรียบร้อยแล้ว');
  };

  // Direct 1-Click Export Attendance to Google Sheets
  const handleDirectExportAttendance = async () => {
    try {
      setIsLoading(true);
      setErrorInfo(null);

      const todayStr = new Date().toLocaleDateString('th-TH');
      const res = await exportAttendanceToGoogleSheet(
        todayStr,
        selectedClassFilter !== 'all' ? selectedClassFilter : 'ทุกห้องเรียน',
        attendanceList.map((a) => ({
          studentId: a.studentId,
          studentName: a.studentName,
          status: a.status,
          checkInTime: a.checkInTime,
          note: a.note,
        }))
      );

      setLastExportedSheet({
        title: res.title,
        url: res.spreadsheetUrl,
        rows: res.exportedRowsCount,
      });

      setSheetUrl(res.spreadsheetUrl);
      onActiveSheetChanged?.(res.spreadsheetUrl);
      showNotification(`✅ ส่งออกบันทึกการเช็กชื่อ ${res.exportedRowsCount} รายการไปยัง Google Sheets แล้ว!`);
    } catch (err: any) {
      console.error('Export attendance error:', err);
      const classified = classifyGoogleSheetError(err, sheetUrl);
      setErrorInfo(classified);
    } finally {
      setIsLoading(false);
    }
  };

  // Create Rubric Template
  const handleCreateRubricTemplate = async () => {
    try {
      setIsLoading(true);
      setErrorInfo(null);
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
        'เกณฑ์ประเมินโครงงานวิทยาศาสตร์และเทคโนโลยี',
        'CS33201',
        sampleCriteria
      );

      const newRubric: AssignmentRubric = {
        id: `rubric-${res.spreadsheetId}`,
        title: 'เกณฑ์ประเมินโครงงานวิทยาศาสตร์และเทคโนโลยี',
        subjectCode: 'CS33201',
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        sheetName: 'เกณฑ์การประเมิน',
        totalMaxScore: 100,
        criteria: sampleCriteria,
        authorId: user.id,
        authorName: user.thaiName || user.name,
      };

      await saveRubricToFirestore(newRubric, user);
      setLoadedRubric(newRubric);
      setSheetUrl(res.spreadsheetUrl);
      showNotification(`สร้างสเปรดชีตเกณฑ์ Rubric บน Google Drive และซิงค์เข้า Firebase สำเร็จ!`);
    } catch (err: any) {
      console.error('Create rubric template error:', err);
      const classified = classifyGoogleSheetError(err, sheetUrl);
      setErrorInfo(classified);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      await deleteGoogleSheetConnectionFromFirestore(id);
      showNotification('ลบการเชื่อมต่อสเปรดชีตเรียบร้อยแล้ว');
    } catch (err: any) {
      const classified = classifyGoogleSheetError(err);
      setErrorInfo(classified);
    }
  };

  return (
    <div className={`bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm transition-all ${className}`}>
      {/* Toast Banner */}
      {successToast && (
        <div className="fixed top-4 right-3 sm:right-6 z-[90] bg-emerald-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 text-xs font-semibold animate-slideInRightToast max-w-[calc(100vw-24px)] sm:max-w-md pointer-events-auto">
          <span className="material-symbols-outlined text-emerald-400 text-[20px] shrink-0">task_alt</span>
          <span className="flex-1 leading-snug">{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-300 hover:text-white cursor-pointer shrink-0 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[26px]">table_chart</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                ส่งออกคะแนนและรายชื่อนักเรียนสู่ Google Sheets
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Google Sheets API Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ส่งออกคะแนนเก็บ รายชื่อนักเรียน และผลการประเมินไปยัง Google Sheets ได้ในคลิกเดียว พร้อมระบบซิงค์สดกับ Cloud Firestore
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Google บัญชีเชื่อมต่อแล้ว</span>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isAuthenticating ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Google'}</span>
            </button>
          )}

          {/* Primary Quick Export CTA in Header */}
          <button
            onClick={handleDirectExportGradesToSheets}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="สร้างสเปรดชีตสมุดคะแนนและรายชื่อนักเรียนบน Google Sheets ทันที"
          >
            <span className="material-symbols-outlined text-[17px]">send_to_mobile</span>
            <span>{isLoading ? 'กำลังส่งออก...' : 'ส่งออกคะแนนลง Sheets'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="ดาวน์โหลดเป็นไฟล์ CSV เปิดใน Excel"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Streamlined Mode Selector Tabs */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedMode('grades');
              setErrorInfo(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedMode === 'grades'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">grade</span>
            <span>สมุดคะแนน & รายชื่อนักเรียน ({studentGrades.length})</span>
          </button>

          <button
            onClick={() => {
              setSelectedMode('attendance');
              setErrorInfo(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedMode === 'attendance'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">how_to_reg</span>
            <span>บันทึกการเช็กชื่อ ({attendanceList.length})</span>
          </button>

          <button
            onClick={() => {
              setSelectedMode('rubric');
              setErrorInfo(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedMode === 'rubric'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">fact_check</span>
            <span>เกณฑ์ประเมิน Rubric</span>
          </button>

          <button
            onClick={() => {
              setSelectedMode('linked_sheets');
              setErrorInfo(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedMode === 'linked_sheets'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">hub</span>
            <span>ชีตที่เชื่อมต่อ ({linkedConnections.length})</span>
          </button>
        </div>

        {/* Auto Sync Toggle */}
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 text-slate-700 font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSyncToFirestore}
              onChange={(e) => setAutoSyncToFirestore(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span>บันทึกประวัติการส่งออกลง Cloud Firestore</span>
          </label>
        </div>
      </div>

      {/* Success Notification Banner with Direct Link to Google Sheets */}
      {lastExportedSheet && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-[20px]">check</span>
            </div>
            <div>
              <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <span>ส่งออกข้อมูล {lastExportedSheet.rows} รายการไปยัง Google Sheets เรียบร้อยแล้ว</span>
              </div>
              <div className="text-[11px] text-emerald-800 mt-0.5 truncate max-w-lg">
                ไฟล์: {lastExportedSheet.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={lastExportedSheet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <span>เปิดดูใน Google Sheets</span>
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            </a>
            <button
              onClick={() => setLastExportedSheet(null)}
              className="p-2 rounded-xl hover:bg-emerald-100 text-emerald-700 cursor-pointer"
              title="ปิดการแจ้งเตือน"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error Info Card */}
      {errorInfo && (
        <GoogleSheetErrorCard
          error={errorInfo}
          onDismiss={() => setErrorInfo(null)}
          onSignIn={handleGoogleSignIn}
          onRetry={handleDirectExportGradesToSheets}
          className="mt-4"
        />
      )}

      {/* =========================================================================
          TAB 1: STUDENT GRADES & NAMES (FOCUSED DIRECT WORKFLOW)
          ========================================================================= */}
      {selectedMode === 'grades' && (
        <div className="mt-6 space-y-5 animate-fadeIn">
          {/* Quick Filters & Controls Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Classroom Filter */}
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500">ห้องเรียน:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                >
                  <option value="all">ทุกห้องเรียน</option>
                  <option value="ม.6/1">ม.6/1</option>
                  <option value="ม.6/2">ม.6/2</option>
                </select>
              </div>

              {/* Subject Filter */}
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500">รายวิชา:</span>
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                >
                  <option value="all">ทุกรายวิชา</option>
                  <option value="ว33281">ว33281 AI & Robotics</option>
                  <option value="ว33282">ว33282 Web Development</option>
                </select>
              </div>

              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-3 top-2.5 material-symbols-outlined text-[16px] text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อนักเรียน, รหัสประจำตัว..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Direct Export Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDirectExportGradesToSheets}
                disabled={isLoading || filteredGrades.length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[17px]">
                  {isLoading ? 'hourglass_top' : 'table_view'}
                </span>
                <span>{isLoading ? 'กำลังสร้างสเปรดชีต...' : '🚀 ส่งออกคะแนนลง Google Sheets ทันที'}</span>
              </button>
            </div>
          </div>

          {/* Quick Statistics Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500">จำนวนนักเรียน</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{stats.total} คน</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div className="text-[11px] font-bold text-emerald-800">คะแนนเฉลี่ย</div>
              <div className="text-xl font-black text-emerald-700 mt-0.5">{stats.avg} คะแนน</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
              <div className="text-[11px] font-bold text-blue-800">คะแนนสูงสุด - ต่ำสุด</div>
              <div className="text-xl font-black text-blue-700 mt-0.5">
                {stats.max} / {stats.min}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200">
              <div className="text-[11px] font-bold text-purple-800">ผ่านเกณฑ์ (≥50%)</div>
              <div className="text-xl font-black text-purple-700 mt-0.5">
                {stats.passCount} คน ({stats.passPct}%)
              </div>
            </div>
          </div>

          {/* Live Table Preview of Student Names and Grades */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">preview</span>
                <span>ตารางคะแนนและรายชื่อนักเรียนที่จะถูกส่งออก ({filteredGrades.length} รายการ)</span>
              </div>
              <span className="text-[11px] text-slate-400">คลิกที่คะแนนเพื่อแก้ไขก่อนส่งออกได้</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3.5 w-12 text-center">ลำดับ</th>
                    <th className="py-3 px-3.5 w-28">รหัสนักเรียน</th>
                    <th className="py-3 px-3.5 min-w-[160px]">ชื่อ-นามสกุล</th>
                    <th className="py-3 px-3.5 w-20 text-center">ห้องเรียน</th>
                    <th className="py-3 px-3.5 min-w-[180px]">หัวข้องาน/แบบทดสอบ</th>
                    <th className="py-3 px-3.5 w-28 text-center">คะแนนที่ได้</th>
                    <th className="py-3 px-3.5 w-20 text-center">ร้อยละ (%)</th>
                    <th className="py-3 px-3.5 w-28 text-center">ผลประเมิน</th>
                    <th className="py-3 px-3.5 min-w-[200px]">ข้อเสนอแนะอาจารย์</th>
                    <th className="py-3 px-3.5 w-24 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredGrades.map((sub, idx) => {
                    const pct = Math.round((sub.score / sub.maxScore) * 100);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-700">{sub.studentId}</td>
                        <td className="py-3 px-3.5 font-bold text-slate-900">{sub.studentName}</td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {sub.classroom}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-800 line-clamp-1">{sub.assignmentTitle}</div>
                          <div className="text-[10px] text-slate-400">{sub.subjectCode} • {sub.subjectTitle}</div>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {editingScoreId === sub.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max={sub.maxScore}
                                value={editingScoreValue}
                                onChange={(e) => setEditingScoreValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlineScore(sub.id);
                                  if (e.key === 'Escape') setEditingScoreId(null);
                                }}
                                autoFocus
                                className="w-16 py-1 px-1.5 rounded-lg border-2 border-emerald-500 text-center font-black text-xs text-slate-900"
                              />
                              <button
                                onClick={() => handleSaveInlineScore(sub.id)}
                                className="text-emerald-600 hover:text-emerald-700 font-bold text-xs p-1"
                              >
                                ✓
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingScoreId(sub.id);
                                setEditingScoreValue(String(sub.score));
                              }}
                              className="px-2 py-1 rounded-lg hover:bg-slate-100 font-black text-emerald-700 text-sm cursor-pointer transition-all flex items-center justify-center gap-1 mx-auto"
                              title="คลิกเพื่อแก้ไขคะแนน"
                            >
                              <span>{sub.score}</span>
                              <span className="text-[10px] font-normal text-slate-400">/{sub.maxScore}</span>
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-700">{pct}%</td>
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              pct >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : pct >= 60
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {sub.gradeLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 text-[11px] leading-snug">
                          {sub.feedback || '-'}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            พร้อมส่งออก
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ATTENDANCE EXPORT (DIRECT & CLEAN)
          ========================================================================= */}
      {selectedMode === 'attendance' && (
        <div className="mt-6 space-y-5 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">how_to_reg</span>
                <span>ส่งออกบันทึกการเช็กชื่อประจำวัน (Daily Attendance) ไปยัง Google Sheets</span>
              </h3>
              <p className="text-xs text-emerald-800/80 mt-0.5">
                ส่งออกสถิติการเข้าเรียน (มาเรียน, สาย, ลาป่วย, ขาดเรียน) ของนักเรียนทุกคนพร้อมเวลาสแกนเข้าห้อง
              </p>
            </div>

            <button
              onClick={handleDirectExportAttendance}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <span className="material-symbols-outlined text-[17px]">output</span>
              <span>ส่งออกบันทึกเวลาเรียนลง Sheets</span>
            </button>
          </div>

          {/* Attendance Table Preview */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">ลำดับ</th>
                  <th className="py-3 px-4 w-28">รหัสนักเรียน</th>
                  <th className="py-3 px-4 min-w-[180px]">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-4 w-24 text-center">ห้องเรียน</th>
                  <th className="py-3 px-4 w-32 text-center">สถานะการเข้าเรียน</th>
                  <th className="py-3 px-4 w-28 text-center">เวลาเช็กชื่อ</th>
                  <th className="py-3 px-4 min-w-[200px]">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {attendanceList.map((att, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{att.studentId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{att.studentName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {att.classroom}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          att.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : att.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : att.status === 'leave'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {att.status === 'present'
                          ? '✓ มาเรียน'
                          : att.status === 'late'
                          ? '⏱ มาสาย'
                          : att.status === 'leave'
                          ? '📝 ลา'
                          : '✕ ขาด'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-medium">{att.checkInTime || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{att.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: RUBRICS MANAGEMENT
          ========================================================================= */}
      {selectedMode === 'rubric' && (
        <div className="mt-6 space-y-6 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">fact_check</span>
                <span>เกณฑ์การประเมินผล Rubric Matrix</span>
              </h3>
              <p className="text-xs text-blue-800/80 mt-0.5">
                สร้างสเปรดชีตเกณฑ์ Rubric บน Google Drive หรือเลือกใช้เกณฑ์ที่ซิงค์อยู่ใน Firebase Firestore
              </p>
            </div>

            <button
              onClick={handleCreateRubricTemplate}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <span className="material-symbols-outlined text-[17px]">add_box</span>
              <span>สร้าง Rubric แม่แบบบน Google Sheets</span>
            </button>
          </div>

          {/* Loaded Rubric Details */}
          {loadedRubric && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{loadedRubric.title}</h4>
                  <p className="text-xs text-slate-500">
                    เต็ม {loadedRubric.totalMaxScore} คะแนน • {loadedRubric.criteria.length} เกณฑ์ประเมิน
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (onApplyRubricToGrading) onApplyRubricToGrading(loadedRubric);
                    showNotification(`นำเกณฑ์ "${loadedRubric.title}" ไปใช้กับการตรวจงานแล้ว`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>นำเกณฑ์ไปใช้ตรวจงาน</span>
                </button>
              </div>

              {/* Rubric Criteria Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4 min-w-[180px]">เกณฑ์การประเมิน</th>
                      <th className="py-3 px-4 min-w-[220px]">คำอธิบาย</th>
                      <th className="py-3 px-4 w-24 text-center">คะแนนเต็ม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loadedRubric.criteria.map((crit, idx) => (
                      <tr key={crit.id || idx} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{crit.name}</td>
                        <td className="py-3 px-4 text-slate-600">{crit.description}</td>
                        <td className="py-3 px-4 text-center font-black text-blue-600">{crit.maxScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Firestore Saved Rubrics */}
          {savedFirestoreRubrics.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-500 text-[18px]">local_fire_department</span>
                <span>เกณฑ์ Rubrics ที่บันทึกอยู่ใน Firebase Firestore ({savedFirestoreRubrics.length} ชุด)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedFirestoreRubrics.map((rubric) => (
                  <div
                    key={rubric.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{rubric.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        เต็ม {rubric.totalMaxScore} คะแนน • {rubric.criteria?.length || 0} เกณฑ์
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setLoadedRubric(rubric);
                        if (onApplyRubricToGrading) onApplyRubricToGrading(rubric);
                        showNotification(`โหลดเกณฑ์ "${rubric.title}" เรียบร้อยแล้ว`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer shrink-0 shadow-2xs"
                    >
                      เลือกใช้
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: LINKED GOOGLE SHEETS
          ========================================================================= */}
      {selectedMode === 'linked_sheets' && (
        <div className="mt-6 space-y-4 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">hub</span>
              <span>รายการ Google Sheets ทั้งหมดที่เชื่อมต่อในระบบ ({linkedConnections.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              เข้าถึงไฟล์สเปรดชีตที่สร้างขึ้นบน Google Drive ของคุณได้โดยตรง
            </p>
          </div>

          {linkedConnections.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 text-center">
              <span className="material-symbols-outlined text-slate-400 text-[32px] mb-2">table_view</span>
              <p className="text-xs font-bold text-slate-600">ยังไม่มีสเปรดชีตที่เชื่อมต่อ</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                เมื่อคุณกดปุ่ม "ส่งออกคะแนนลง Sheets" ลิงก์สเปรดชีตจะปรากฏที่นี่โดยอัตโนมัติ
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">ชื่อสเปรดชีต</th>
                    <th className="py-3 px-4">ประเภทข้อมูล</th>
                    <th className="py-3 px-4">ซิงค์ล่าสุด</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {linkedConnections.map((conn) => (
                    <tr key={conn.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-[18px]">table_chart</span>
                          <span>{conn.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {conn.type === 'rubric' ? 'เกณฑ์ Rubric' : 'สมุดบันทึกคะแนน'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(conn.lastSyncedAt).toLocaleString('th-TH')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          ✓ เชื่อมต่อแล้ว
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <a
                          href={conn.spreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <span>เปิดดู</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </a>
                        <button
                          onClick={() => handleDeleteConnection(conn.id)}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold inline-flex items-center cursor-pointer"
                          title="ลบ"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
