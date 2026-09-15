import { UserProfile } from '../types';

export interface TranscriptCourse {
  code: string;
  name: string;
  credit: number;
  grade: string;
}

export interface TranscriptSemester {
  semester: string;
  courses: TranscriptCourse[];
}

export interface TranscriptData {
  schoolNameTh: string;
  schoolNameEn: string;
  ministryTh: string;
  documentType: string;
  documentNo: string;
  studentName: string;
  studentEngName: string;
  studentId: string;
  nationalId: string;
  birthDate: string;
  admissionDate: string;
  completionDate: string;
  curriculumTrack: string;
  avatarUrl?: string;
  totalCredits: number;
  gpax: string;
  honors: string;
  moralityAssessment: string;
  registrarName: string;
  directorName: string;
  issueDate: string;
  semesters: TranscriptSemester[];
}

export function getDefaultTranscriptData(user: UserProfile): TranscriptData {
  const studentName = user.thaiName || 'นายวรวุฒิ เพ็ชรราย';
  const studentEngName = user.name || 'Mr. Vorawut Phetrai';
  const studentId = user.studentId || '66041001';
  const gpa = (user.gpa || 3.92).toFixed(2);

  const semesters: TranscriptSemester[] = [
    {
      semester: 'ภาคเรียนที่ 1 / 2564 (ม.4)',
      courses: [
        { code: 'ท31101', name: 'ภาษาไทย 1', credit: 1.0, grade: '4.0' },
        { code: 'ค31101', name: 'คณิตศาสตร์พื้นฐาน 1', credit: 1.5, grade: '4.0' },
        { code: 'ว31101', name: 'วิทยาศาสตร์กายภาพ 1', credit: 1.5, grade: '3.5' },
        { code: 'ส31101', name: 'สังคมศึกษา 1', credit: 1.0, grade: '4.0' },
        { code: 'อ31101', name: 'ภาษาอังกฤษพื้นฐาน 1', credit: 1.0, grade: '4.0' },
        { code: 'ว31281', name: 'การเขียนโปรแกรมคอมพิวเตอร์เบื้องต้น', credit: 1.5, grade: '4.0' },
      ],
    },
    {
      semester: 'ภาคเรียนที่ 2 / 2564 (ม.4)',
      courses: [
        { code: 'ท31102', name: 'ภาษาไทย 2', credit: 1.0, grade: '3.5' },
        { code: 'ค31102', name: 'คณิตศาสตร์พื้นฐาน 2', credit: 1.5, grade: '4.0' },
        { code: 'ว31201', name: 'ฟิสิกส์ 1', credit: 2.0, grade: '4.0' },
        { code: 'ว31221', name: 'เคมี 1', credit: 1.5, grade: '3.5' },
        { code: 'อ31102', name: 'ภาษาอังกฤษ 2', credit: 1.0, grade: '4.0' },
        { code: 'ว31282', name: 'โครงสร้างข้อมูลและอัลกอริทึม', credit: 1.5, grade: '4.0' },
      ],
    },
    {
      semester: 'ภาคเรียนที่ 1 / 2565 (ม.5)',
      courses: [
        { code: 'ค32201', name: 'คณิตศาสตร์ขั้นสูง 1', credit: 2.0, grade: '4.0' },
        { code: 'ว32202', name: 'ฟิสิกส์ 2 (กลศาสตร์ & คลื่น)', credit: 2.0, grade: '4.0' },
        { code: 'ว32283', name: 'ระบบเครือข่ายและ Cloud Computing', credit: 1.5, grade: '4.0' },
        { code: 'อ32201', name: 'ภาษาอังกฤษเชิงวิชาการ', credit: 1.5, grade: '4.0' },
        { code: 'ส32101', name: 'ประวัติศาสตร์สากล', credit: 1.0, grade: '3.5' },
        { code: 'ง32101', name: 'การดำรงชีวิตและนวัตกรรม', credit: 1.0, grade: '4.0' },
      ],
    },
    {
      semester: 'ภาคเรียนที่ 2 / 2565 (ม.5)',
      courses: [
        { code: 'ค32202', name: 'แคลคูลัสและพีชคณิตเชิงเส้น', credit: 2.0, grade: '4.0' },
        { code: 'ว32284', name: 'การพัฒนาเว็บแอปพลิเคชัน Full-Stack', credit: 1.5, grade: '4.0' },
        { code: 'ว32242', name: 'ชีววิทยาประยุกต์และพันธุศาสตร์', credit: 1.5, grade: '3.5' },
        { code: 'อ32202', name: 'การนำเสนอและการสื่อสารสากล', credit: 1.0, grade: '4.0' },
        { code: 'ศ32101', name: 'ศิลปะดิจิทัลและการออกแบบ UI/UX', credit: 1.0, grade: '4.0' },
      ],
    },
    {
      semester: 'ภาคเรียนที่ 1 / 2566 (ม.6)',
      courses: [
        { code: 'ว33281', name: 'ปัญญาประดิษฐ์และการเรียนรู้ของเครื่อง (AI & ML)', credit: 2.0, grade: '4.0' },
        { code: 'ว33282', name: 'วิทยาการหุ่นยนต์และระบบอัตโนมัติ', credit: 1.5, grade: '4.0' },
        { code: 'ค33201', name: 'สถิติศาสตร์และการวิเคราะห์ข้อมูล', credit: 2.0, grade: '4.0' },
        { code: 'อ33201', name: 'ภาษาอังกฤษสำหรับการศึกษาต่อ', credit: 1.5, grade: '4.0' },
        { code: 'ส33101', name: 'เศรษฐศาสตร์และสังคมดิจิทัล', credit: 1.0, grade: '4.0' },
      ],
    },
    {
      semester: 'ภาคเรียนที่ 2 / 2566 (ม.6 - ปัจจุบัน)',
      courses: [
        { code: 'ว33289', name: 'โครงงานนวัตกรรมปัญญาประดิษฐ์ (Capstone Project)', credit: 2.5, grade: '4.0' },
        { code: 'ว33290', name: 'จริยธรรม AI และความมั่นคงไซเบอร์', credit: 1.5, grade: '4.0' },
        { code: 'ค33202', name: 'คณิตศาสตร์สำหรับวิทยาศาสตร์ข้อมูล', credit: 2.0, grade: '4.0' },
        { code: 'อ33202', name: 'การเขียนเชิงวิชาการภาษาอังกฤษ', credit: 1.5, grade: '4.0' },
      ],
    },
  ];

  return {
    schoolNameTh: 'โรงเรียนสาธิตนวัตกรรมดิจิทัล School Nexus (Smart Campus Academy)',
    schoolNameEn: 'School Nexus Demonstration Smart Campus Academy',
    ministryTh: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน กระทรวงศึกษาธิการ',
    documentType: 'ระเบียนแสดงผลการเรียนหลักสูตรการศึกษาขั้นพื้นฐาน (ปพ.1 : พ)',
    documentNo: `SN-66/${studentId}-A`,
    studentName,
    studentEngName,
    studentId,
    nationalId: '1-1004-99881-22-3',
    birthDate: '17 มีนาคม 2551',
    admissionDate: '16 พฤษภาคม 2564',
    completionDate: '31 มีนาคม 2567',
    curriculumTrack: 'วิทยาศาสตร์ - ปัญญาประดิษฐ์และเทคโนโลยี (Sci-Tech & AI)',
    avatarUrl: user.avatar,
    totalCredits: 84.5,
    gpax: gpa,
    honors: 'เกียรตินิยมอันดับ 1 (First-Class Honors)',
    moralityAssessment: 'ผ่านระดับดีเยี่ยม (Excellent)',
    registrarName: 'นางกนกวรรณ จันทร์ประเสริฐ',
    directorName: 'ดร.สมเกียรติ สว่างอารมณ์',
    issueDate: new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    semesters,
  };
}

/**
 * Generates an official print/PDF export window styled with CSS @page A4 formatting.
 * Automatically initiates window.print() so the user can Save as PDF with high fidelity.
 */
export function exportTranscriptAsPdf(data: TranscriptData): void {
  const printWindow = window.open('', '_blank', 'width=950,height=1050');
  if (!printWindow) {
    // If pop-up is blocked, trigger fallback print on the current window
    window.print();
    return;
  }

  const avatarImgHtml = data.avatarUrl
    ? `<img src="${data.avatarUrl}" alt="Photo" class="student-photo" crossorigin="anonymous" />`
    : `<div class="photo-placeholder">รูปถ่ายนักเรียน<br>ขนาด 1.5 นิ้ว</div>`;

  const semesterTablesHtml = data.semesters
    .map(
      (sem) => `
      <div class="sem-box">
        <div class="sem-header">
          <span>${sem.semester}</span>
          <span>ภาคปกติ</span>
        </div>
        <table class="course-table">
          <thead>
            <tr>
              <th style="width: 18%;">รหัสวิชา</th>
              <th style="width: 58%;">ชื่อรายวิชา</th>
              <th style="width: 12%; text-align: center;">นก.</th>
              <th style="width: 12%; text-align: center;">เกรด</th>
            </tr>
          </thead>
          <tbody>
            ${sem.courses
              .map(
                (c) => `
              <tr>
                <td class="font-mono">${c.code}</td>
                <td class="course-name">${c.name}</td>
                <td class="text-center font-mono">${c.credit.toFixed(1)}</td>
                <td class="text-center font-bold font-mono">${c.grade}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
    )
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>ปพ.1 - ${data.studentName} (${data.studentId})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@400;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Sarabun', 'Noto Sans Thai', sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11.5px;
      line-height: 1.45;
    }
    .page-container {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
      padding: 4px;
    }
    .doc-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }
    .doc-no {
      text-align: right;
      font-size: 10px;
      font-weight: 600;
      color: #334155;
    }
    .doc-no-sub {
      font-size: 9px;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
    }
    .garuda-wrapper {
      text-align: center;
      margin-bottom: 2px;
    }
    .garuda-emblem {
      width: 46px;
      height: 46px;
      display: inline-block;
    }
    .header-titles {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
    }
    .header-titles h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.2px;
      color: #020617;
    }
    .header-titles h2 {
      margin: 2px 0 0 0;
      font-size: 12.5px;
      font-weight: 700;
      color: #1e293b;
    }
    .header-titles p {
      margin: 1px 0 0 0;
      font-size: 10.5px;
      color: #475569;
    }
    .student-info-grid {
      display: flex;
      gap: 14px;
      padding: 8px 0;
      border-bottom: 1px solid #cbd5e1;
      margin-bottom: 10px;
    }
    .student-info-details {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 14px;
      font-size: 11px;
    }
    .info-item {
      display: flex;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
      width: 120px;
      flex-shrink: 0;
    }
    .info-value {
      font-weight: 700;
      color: #0f172a;
      flex: 1;
    }
    .student-photo-box {
      width: 76px;
      height: 96px;
      border: 1px solid #94a3b8;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      flex-shrink: 0;
    }
    .student-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-placeholder {
      font-size: 9px;
      text-align: center;
      color: #94a3b8;
      padding: 4px;
    }
    .section-title {
      font-size: 11.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      border-bottom: 1px solid #94a3b8;
      padding-bottom: 3px;
      margin-bottom: 8px;
    }
    .semester-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .sem-box {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 4px 6px;
      background: #fbfcfe;
    }
    .sem-header {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 10px;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
      margin-bottom: 3px;
    }
    .course-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .course-table th {
      border-bottom: 1px solid #cbd5e1;
      color: #475569;
      font-weight: 600;
      padding: 1.5px 2px;
      text-align: left;
    }
    .course-table td {
      padding: 1.5px 2px;
      border-bottom: 1px dashed #f1f5f9;
      vertical-align: top;
    }
    .course-table tr:last-child td {
      border-bottom: none;
    }
    .course-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }
    .text-center { text-align: center; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .font-bold { font-weight: 700; }
    
    .summary-card {
      border: 1.5px solid #0f172a;
      border-radius: 4px;
      padding: 8px 12px;
      background: #f8fafc;
      display: grid;
      grid-template-columns: 1fr 1.2fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .summary-col {
      border-right: 1px solid #cbd5e1;
      padding-right: 10px;
    }
    .summary-col:last-child {
      border-right: none;
      padding-right: 0;
    }
    .summary-label {
      font-size: 9.5px;
      color: #475569;
      display: block;
      margin-bottom: 2px;
    }
    .summary-val-lg {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
      font-family: 'JetBrains Mono', monospace;
    }
    .gpax-val {
      font-size: 20px;
      font-weight: 900;
      color: #1e3a8a;
      font-family: 'JetBrains Mono', monospace;
    }
    .badge-honors {
      display: inline-block;
      font-size: 9.5px;
      font-weight: 700;
      background: #fef3c7;
      color: #92400e;
      padding: 1px 5px;
      border-radius: 3px;
      margin-left: 6px;
    }

    .footer-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr 1.2fr;
      gap: 12px;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      align-items: flex-end;
    }
    .qr-box {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .qr-img {
      width: 62px;
      height: 62px;
      border: 1px solid #94a3b8;
      border-radius: 4px;
      padding: 2px;
    }
    .qr-text {
      font-size: 8px;
      color: #64748b;
      margin-top: 2px;
      font-family: 'JetBrains Mono', monospace;
    }
    .sig-line {
      border-top: 1px dotted #475569;
      margin-top: 28px;
      padding-top: 3px;
      font-size: 10px;
    }
    .sig-name {
      font-weight: 700;
      color: #0f172a;
    }
    .sig-title {
      font-size: 9px;
      color: #64748b;
    }
    .seal-box {
      position: relative;
    }
    .seal-stamp {
      position: absolute;
      top: -16px;
      right: 12px;
      width: 58px;
      height: 58px;
      border: 1.5px solid rgba(225, 29, 72, 0.45);
      border-radius: 50%;
      color: rgba(225, 29, 72, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 7.5px;
      font-weight: 800;
      text-transform: uppercase;
      transform: rotate(-12deg);
      pointer-events: none;
    }

    /* Print toolbar at top of the window */
    .screen-toolbar {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: white;
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .btn-download {
      background: #10b981;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-download:hover {
      background: #059669;
    }
    @media print {
      .screen-toolbar {
        display: none !important;
      }
      body {
        background: #ffffff;
      }
      .page-container {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="screen-toolbar">
      <div style="font-weight: 700; font-size: 13px;">
        📄 ตัวอย่างแบบ ปพ.1 : พ (Official Transcript PDF)
      </div>
      <div>
        <button class="btn-download" onclick="window.print()">
          🖨️ ดาวน์โหลดเป็นไฟล์ PDF / พิมพ์
        </button>
      </div>
    </div>

    <!-- Document Header -->
    <div class="doc-top-bar">
      <div></div>
      <div class="garuda-wrapper">
        <svg class="garuda-emblem" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" stroke="#0f172a" stroke-width="2.5" fill="#f8fafc" />
          <path d="M50 16 L56 34 L76 34 L60 46 L66 64 L50 52 L34 64 L40 46 L24 34 L44 34 Z" fill="#0f172a" />
          <circle cx="50" cy="46" r="8" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        </svg>
      </div>
      <div class="doc-no">
        <div>แบบ ปพ.1 : พ</div>
        <div class="doc-no-sub">${data.documentNo}</div>
      </div>
    </div>

    <div class="header-titles">
      <h1>${data.documentType}</h1>
      <h2>${data.schoolNameTh}</h2>
      <p>${data.ministryTh}</p>
    </div>

    <!-- Student Information -->
    <div class="student-info-grid">
      <div class="student-info-details">
        <div class="info-item">
          <span class="info-label">ชื่อ - นามสกุล:</span>
          <span class="info-value">${data.studentName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Name - Surname:</span>
          <span class="info-value">${data.studentEngName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">เลขประจำตัวนักเรียน:</span>
          <span class="info-value font-mono">${data.studentId}</span>
        </div>
        <div class="info-item">
          <span class="info-label">เลขประจำตัวประชาชน:</span>
          <span class="info-value font-mono">${data.nationalId}</span>
        </div>
        <div class="info-item">
          <span class="info-label">วัน/เดือน/ปีเกิด:</span>
          <span class="info-value">${data.birthDate}</span>
        </div>
        <div class="info-item">
          <span class="info-label">แผนการเรียน:</span>
          <span class="info-value">${data.curriculumTrack}</span>
        </div>
        <div class="info-item">
          <span class="info-label">เข้าเรียนเมื่อ:</span>
          <span class="info-value">${data.admissionDate}</span>
        </div>
        <div class="info-item">
          <span class="info-label">สำเร็จการศึกษาเมื่อ:</span>
          <span class="info-value">${data.completionDate}</span>
        </div>
      </div>
      <div class="student-photo-box">
        ${avatarImgHtml}
      </div>
    </div>

    <!-- Academic Records -->
    <div class="section-title">ผลสัมฤทธิ์ทางการเรียนตลอดหลักสูตร (Academic Records)</div>
    <div class="semester-grid">
      ${semesterTablesHtml}
    </div>

    <!-- Summary Box -->
    <div class="summary-card">
      <div class="summary-col">
        <span class="summary-label">หน่วยกิตสะสมรวม (Credits):</span>
        <div class="summary-val-lg">${data.totalCredits.toFixed(1)} <span style="font-size: 11px; font-weight: normal;">นก.</span></div>
        <span style="font-size: 8.5px; color: #16a34a; font-weight: 600;">✓ ครบตามโครงสร้างหลักสูตร</span>
      </div>
      <div class="summary-col">
        <span class="summary-label">การประเมินคุณลักษณะ & กิจกรรม:</span>
        <div style="font-size: 11px; font-weight: 700; color: #15803d; margin-top: 3px;">
          ✓ ${data.moralityAssessment}
        </div>
        <span style="font-size: 8.5px; color: #64748b;">กิจกรรมพัฒนาผู้เรียน: ผ่านครบถ้วน</span>
      </div>
      <div>
        <span class="summary-label">เกรดเฉลี่ยสะสม (GPAX):</span>
        <div style="display: flex; align-items: baseline;">
          <span class="gpax-val">${data.gpax}</span>
          <span class="badge-honors">เกียรตินิยม</span>
        </div>
        <span style="font-size: 8.5px; color: #b45309; font-weight: 600;">${data.honors}</span>
      </div>
    </div>

    <!-- Signatures & Verification -->
    <div class="footer-signatures">
      <div class="qr-box">
        <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://school-nexus.internal/verify/transcript/${data.studentId}" alt="Verify QR" />
        <span class="qr-text">สแกนตรวจสอบเอกสารจริง</span>
        <span class="qr-text" style="font-size: 7px; color: #94a3b8;">DIGITAL SIGNED HASH</span>
      </div>

      <div>
        <div style="font-style: italic; font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 2px;">
          ${data.registrarName}
        </div>
        <div class="sig-line">
          <div class="sig-name">(${data.registrarName})</div>
          <div class="sig-title">นายทะเบียนโรงเรียน</div>
        </div>
      </div>

      <div class="seal-box">
        <div class="seal-stamp">
          School Nexus<br>Official Seal
        </div>
        <div style="font-style: italic; font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 2px;">
          ${data.directorName}
        </div>
        <div class="sig-line">
          <div class="sig-name">(${data.directorName})</div>
          <div class="sig-title">ผู้อำนวยการสถานศึกษา</div>
          <div style="font-size: 8px; color: #94a3b8; margin-top: 1px;">วันที่ออกเอกสาร: ${data.issueDate}</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Prompt to print immediately after loading
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
