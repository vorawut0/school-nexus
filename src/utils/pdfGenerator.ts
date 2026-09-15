import { UserProfile } from '../types';

export interface TranscriptCourse {
  code: string;
  name: string;
  credit: number;
  grade: string;
}

export interface TranscriptSemester {
  semester: string;
  semesterThYear: string;
  courses: TranscriptCourse[];
}

export interface LearningAreaSummary {
  no: number;
  name: string;
  basicCredit: number;
  additionalCredit: number;
  totalCredit: number;
  gpa: string;
}

export interface TranscriptData {
  schoolNameTh: string;
  schoolNameEn: string;
  schoolSubDistrict: string;
  schoolDistrict: string;
  schoolProvince: string;
  educationArea: string;
  ministryTh: string;
  documentType: string;
  documentCode: string;
  documentBookNo: string;
  documentSheetNo: string;
  documentNo: string;
  studentName: string;
  studentEngName: string;
  gender: string;
  studentId: string;
  studentIdThai: string;
  nationalId: string;
  birthDateTh: string;
  birthDateEn: string;
  nationality: string;
  ethnicity: string;
  religion: string;
  fatherName: string;
  motherName: string;
  guardianName: string;
  guardianRelation: string;
  admissionDate: string;
  admissionGrade: string;
  completionDate: string;
  completionReason: string;
  curriculumTrack: string;
  avatarUrl?: string;
  totalBasicCredits: number;
  totalAdditionalCredits: number;
  totalCredits: number;
  gpax: string;
  gpaxThai: string;
  honors: string;
  moralityAssessment: string;
  analyticalAssessment: string;
  activityGuidance: string;
  activityStudent: string;
  activitySocial: string;
  graduationStatus: string;
  registrarName: string;
  directorName: string;
  issueDate: string;
  issueDateThai: string;
  semesters: TranscriptSemester[];
  learningAreas: LearningAreaSummary[];
}

export function toThaiNumerals(numStr: string | number): string {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(numStr).replace(/[0-9]/g, (d) => thaiDigits[parseInt(d, 10)]);
}

export function getDefaultTranscriptData(user: UserProfile): TranscriptData {
  const studentName = user.thaiName || 'นายวรวุฒิ เพ็ชรราย';
  const studentEngName = user.name || 'Mr. Vorawut Phetrai';
  const studentId = user.studentId || '66041001';
  const gpaNum = user.gpa || 3.92;
  const gpax = gpaNum.toFixed(2);
  const gpaxThai = toThaiNumerals(gpax);

  const semesters: TranscriptSemester[] = [
    {
      semester: 'มัธยมศึกษาปีที่ ๔ ภาคเรียนที่ ๑',
      semesterThYear: 'ปีการศึกษา ๒๕๖๔',
      courses: [
        { code: 'ท31101', name: 'ภาษาไทย 1', credit: 1.0, grade: '4.0' },
        { code: 'ค31101', name: 'คณิตศาสตร์พื้นฐาน 1', credit: 1.5, grade: '4.0' },
        { code: 'ว31101', name: 'วิทยาศาสตร์กายภาพ 1', credit: 1.5, grade: '3.5' },
        { code: 'ส31101', name: 'สังคมศึกษา 1', credit: 1.0, grade: '4.0' },
        { code: 'พ31101', name: 'สุขศึกษาและพลศึกษา 1', credit: 0.5, grade: '4.0' },
        { code: 'ศ31101', name: 'ทัศนศิลป์ 1', credit: 0.5, grade: '4.0' },
        { code: 'ง31101', name: 'การงานอาชีพ 1', credit: 0.5, grade: '4.0' },
        { code: 'อ31101', name: 'ภาษาอังกฤษพื้นฐาน 1', credit: 1.0, grade: '4.0' },
        { code: 'ว31281', name: 'การเขียนโปรแกรมคอมพิวเตอร์', credit: 1.5, grade: '4.0' },
        { code: 'ค31201', name: 'คณิตศาสตร์เพิ่มเติม 1', credit: 1.5, grade: '4.0' },
      ],
    },
    {
      semester: 'มัธยมศึกษาปีที่ ๔ ภาคเรียนที่ ๒',
      semesterThYear: 'ปีการศึกษา ๒๕๖๔',
      courses: [
        { code: 'ท31102', name: 'ภาษาไทย 2', credit: 1.0, grade: '3.5' },
        { code: 'ค31102', name: 'คณิตศาสตร์พื้นฐาน 2', credit: 1.5, grade: '4.0' },
        { code: 'ว31201', name: 'ฟิสิกส์ 1', credit: 2.0, grade: '4.0' },
        { code: 'ว31221', name: 'เคมี 1', credit: 1.5, grade: '3.5' },
        { code: 'ส31102', name: 'ประวัติศาสตร์ไทย 1', credit: 0.5, grade: '4.0' },
        { code: 'พ31102', name: 'สุขศึกษาและพลศึกษา 2', credit: 0.5, grade: '4.0' },
        { code: 'ศ31102', name: 'ดนตรีและนาฏศิลป์ 1', credit: 0.5, grade: '4.0' },
        { code: 'อ31102', name: 'ภาษาอังกฤษ 2', credit: 1.0, grade: '4.0' },
        { code: 'ว31282', name: 'โครงสร้างข้อมูลและอัลกอริทึม', credit: 1.5, grade: '4.0' },
        { code: 'ค31202', name: 'คณิตศาสตร์เพิ่มเติม 2', credit: 1.5, grade: '4.0' },
      ],
    },
    {
      semester: 'มัธยมศึกษาปีที่ ๕ ภาคเรียนที่ ๑',
      semesterThYear: 'ปีการศึกษา ๒๕๖๕',
      courses: [
        { code: 'ท32101', name: 'ภาษาไทย 3', credit: 1.0, grade: '4.0' },
        { code: 'ค32101', name: 'คณิตศาสตร์พื้นฐาน 3', credit: 1.5, grade: '4.0' },
        { code: 'ว32202', name: 'ฟิสิกส์ 2 (กลศาสตร์ & คลื่น)', credit: 2.0, grade: '4.0' },
        { code: 'ว32222', name: 'เคมี 2 (จลนพลศาสตร์)', credit: 1.5, grade: '4.0' },
        { code: 'ว32283', name: 'ระบบเครือข่ายและคลาวด์', credit: 1.5, grade: '4.0' },
        { code: 'ส32101', name: 'ประวัติศาสตร์สากล', credit: 1.0, grade: '3.5' },
        { code: 'พ32101', name: 'สุขศึกษาและพลศึกษา 3', credit: 0.5, grade: '4.0' },
        { code: 'อ32101', name: 'ภาษาอังกฤษ 3', credit: 1.0, grade: '4.0' },
        { code: 'อ32201', name: 'ภาษาอังกฤษเชิงวิชาการ', credit: 1.5, grade: '4.0' },
        { code: 'ค32201', name: 'คณิตศาสตร์ขั้นสูง 1', credit: 1.5, grade: '4.0' },
      ],
    },
    {
      semester: 'มัธยมศึกษาปีที่ ๕ ภาคเรียนที่ ๒',
      semesterThYear: 'ปีการศึกษา ๒๕๖๕',
      courses: [
        { code: 'ท32102', name: 'ภาษาไทย 4', credit: 1.0, grade: '3.5' },
        { code: 'ค32102', name: 'คณิตศาสตร์พื้นฐาน 4', credit: 1.5, grade: '4.0' },
        { code: 'ค32202', name: 'แคลคูลัสและพีชคณิตเชิงเส้น', credit: 2.0, grade: '4.0' },
        { code: 'ว32284', name: 'การพัฒนาเว็บ Full-Stack', credit: 1.5, grade: '4.0' },
        { code: 'ว32242', name: 'ชีววิทยาประยุกต์และพันธุศาสตร์', credit: 1.5, grade: '3.5' },
        { code: 'ส32102', name: 'สังคมศึกษา 2 (เศรษฐศาสตร์)', credit: 1.0, grade: '4.0' },
        { code: 'พ32102', name: 'สุขศึกษาและพลศึกษา 4', credit: 0.5, grade: '4.0' },
        { code: 'ศ32101', name: 'ศิลปะดิจิทัลและ UI/UX', credit: 1.0, grade: '4.0' },
        { code: 'อ32102', name: 'ภาษาอังกฤษ 4', credit: 1.0, grade: '4.0' },
        { code: 'อ32202', name: 'การนำเสนอและการสื่อสารสากล', credit: 1.0, grade: '4.0' },
      ],
    },
    {
      semester: 'มัธยมศึกษาปีที่ ๖ ภาคเรียนที่ ๑',
      semesterThYear: 'ปีการศึกษา ๒๕๖๖',
      courses: [
        { code: 'ท33101', name: 'ภาษาไทย 5', credit: 1.0, grade: '4.0' },
        { code: 'ค33101', name: 'คณิตศาสตร์พื้นฐาน 5', credit: 1.0, grade: '4.0' },
        { code: 'ว33281', name: 'ปัญญาประดิษฐ์ (AI & ML)', credit: 2.0, grade: '4.0' },
        { code: 'ว33282', name: 'วิทยาการหุ่นยนต์และ IoT', credit: 1.5, grade: '4.0' },
        { code: 'ค33201', name: 'สถิติศาสตร์และการวิเคราะห์ข้อมูล', credit: 2.0, grade: '4.0' },
        { code: 'ส33101', name: 'หน้าที่พลเมืองและกฎหมายดิจิทัล', credit: 1.0, grade: '4.0' },
        { code: 'พ33101', name: 'สุขศึกษาและพลศึกษา 5', credit: 0.5, grade: '4.0' },
        { code: 'ง33101', name: 'เทคโนโลยีและนวัตกรรมธุรกิจ', credit: 1.0, grade: '4.0' },
        { code: 'อ33101', name: 'ภาษาอังกฤษ 5', credit: 1.0, grade: '4.0' },
        { code: 'อ33201', name: 'ภาษาอังกฤษสำหรับการศึกษาต่อ', credit: 1.5, grade: '4.0' },
      ],
    },
    {
      semester: 'มัธยมศึกษาปีที่ ๖ ภาคเรียนที่ ๒',
      semesterThYear: 'ปีการศึกษา ๒๕๖๖',
      courses: [
        { code: 'ท33102', name: 'ภาษาไทย 6', credit: 1.0, grade: '4.0' },
        { code: 'ค33102', name: 'คณิตศาสตร์พื้นฐาน 6', credit: 1.0, grade: '4.0' },
        { code: 'ว33289', name: 'โครงงานนวัตกรรม AI (Capstone)', credit: 2.5, grade: '4.0' },
        { code: 'ว33290', name: 'จริยธรรม AI และความมั่นคงไซเบอร์', credit: 1.5, grade: '4.0' },
        { code: 'ค33202', name: 'คณิตศาสตร์สำหรับ Data Science', credit: 2.0, grade: '4.0' },
        { code: 'ส33102', name: 'เศรษฐศาสตร์สากลและสังคมดิจิทัล', credit: 1.0, grade: '4.0' },
        { code: 'พ33102', name: 'สุขศึกษาและพลศึกษา 6', credit: 0.5, grade: '4.0' },
        { code: 'อ33102', name: 'ภาษาอังกฤษ 6', credit: 1.0, grade: '4.0' },
        { code: 'อ33202', name: 'การเขียนเชิงวิชาการภาษาอังกฤษ', credit: 1.5, grade: '4.0' },
      ],
    },
  ];

  const learningAreas: LearningAreaSummary[] = [
    { no: 1, name: 'ภาษาไทย', basicCredit: 6.0, additionalCredit: 0.0, totalCredit: 6.0, gpa: '3.75' },
    { no: 2, name: 'คณิตศาสตร์', basicCredit: 6.0, additionalCredit: 7.0, totalCredit: 13.0, gpa: '4.00' },
    { no: 3, name: 'วิทยาศาสตร์และเทคโนโลยี', basicCredit: 6.0, additionalCredit: 21.0, totalCredit: 27.0, gpa: '3.92' },
    { no: 4, name: 'สังคมศึกษา ศาสนา และวัฒนธรรม', basicCredit: 6.0, additionalCredit: 0.0, totalCredit: 6.0, gpa: '3.90' },
    { no: 5, name: 'สุขศึกษาและพลศึกษา', basicCredit: 3.0, additionalCredit: 0.0, totalCredit: 3.0, gpa: '4.00' },
    { no: 6, name: 'ศิลปะ', basicCredit: 3.0, additionalCredit: 0.0, totalCredit: 3.0, gpa: '4.00' },
    { no: 7, name: 'การงานอาชีพ', basicCredit: 3.0, additionalCredit: 0.0, totalCredit: 3.0, gpa: '4.00' },
    { no: 8, name: 'ภาษาต่างประเทศ', basicCredit: 6.0, additionalCredit: 6.5, totalCredit: 12.5, gpa: '4.00' },
  ];

  return {
    schoolNameTh: 'โรงเรียนสาธิตนวัตกรรมดิจิทัล School Nexus',
    schoolNameEn: 'School Nexus Demonstration Smart Campus Academy',
    schoolSubDistrict: 'ตำบลบางเขน',
    schoolDistrict: 'อำเภอเมืองนนทบุรี',
    schoolProvince: 'จังหวัดนนทบุรี',
    educationArea: 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานนทบุรี',
    ministryTh: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน กระทรวงศึกษาธิการ',
    documentType: 'ระเบียนแสดงผลการเรียนหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน',
    documentCode: 'แบบ ปพ.๑ : พ',
    documentBookNo: '๖๖๐๑',
    documentSheetNo: '๐๐๔๒',
    documentNo: `SN-66/${studentId}-A`,
    studentName,
    studentEngName,
    gender: 'ชาย',
    studentId,
    studentIdThai: toThaiNumerals(studentId),
    nationalId: '1-1004-99881-22-3',
    birthDateTh: '๑๗ มีนาคม พ.ศ. ๒๕๕๑',
    birthDateEn: '17 March 2008',
    nationality: 'ไทย',
    ethnicity: 'ไทย',
    religion: 'พุทธ',
    fatherName: 'นายประเสริฐ เพ็ชรราย',
    motherName: 'นางมาลี เพ็ชรราย',
    guardianName: 'นายประเสริฐ เพ็ชรราย',
    guardianRelation: 'บิดา',
    admissionDate: '๑๖ พฤษภาคม ๒๕๖๔',
    admissionGrade: 'มัธยมศึกษาปีที่ ๔',
    completionDate: '๓๑ มีนาคม ๒๕๖๗',
    completionReason:
      'สำเร็จการศึกษาตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช ๒๕๕๑ (ฉบับปรับปรุง ๒๕๖๐) ชั้นมัธยมศึกษาปีที่ ๖',
    curriculumTrack: 'วิทยาศาสตร์ - ปัญญาประดิษฐ์และเทคโนโลยี (Sci-Tech & AI Track)',
    avatarUrl: user.avatar,
    totalBasicCredits: 41.0,
    totalAdditionalCredits: 43.5,
    totalCredits: 84.5,
    gpax,
    gpaxThai,
    honors: 'เกียรตินิยมอันดับ 1 (First-Class Honors)',
    moralityAssessment: 'ดีเยี่ยม (๓)',
    analyticalAssessment: 'ดีเยี่ยม (๓)',
    activityGuidance: 'ผ่าน',
    activityStudent: 'ผ่าน',
    activitySocial: 'ผ่าน',
    graduationStatus: 'ได้รับการตัดสินให้สำเร็จการศึกษาตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน ระดับมัธยมศึกษาตอนปลาย',
    registrarName: 'นางกนกวรรณ จันทร์ประเสริฐ',
    directorName: 'ดร.สมเกียรติ สว่างอารมณ์',
    issueDate: '31 มีนาคม 2567',
    issueDateThai: '๓๑ มีนาคม พ.ศ. ๒๕๖๗',
    semesters,
    learningAreas,
  };
}

/**
 * Authentic Royal Thai Government Garuda Emblem (SVG Path)
 */
export const OFFICIAL_GARUDA_SVG = `
<svg viewBox="0 0 500 500" class="garuda-svg" xmlns="http://www.w3.org/2000/svg">
  <g fill="#881337" stroke="#4c0519" stroke-width="1.2">
    <!-- Crown (ชฎา / มงกุฎ) -->
    <path d="M250 35 L254 75 L266 90 L250 85 L234 90 L246 75 Z" />
    <path d="M250 85 L260 115 L268 135 L250 130 L232 135 L240 115 Z" />
    <circle cx="250" cy="30" r="4" fill="#881337" />
    <path d="M243 130 L257 130 L262 145 L238 145 Z" />
    
    <!-- Face / Beak (พระพักตร์ / จะงอยปาก) -->
    <path d="M238 145 Q250 142 262 145 Q268 160 250 178 Q232 160 238 145 Z" />
    <path d="M245 160 Q250 174 255 160 Z" fill="#4c0519" />
    <circle cx="244" cy="152" r="2.5" fill="#fff" />
    <circle cx="256" cy="152" r="2.5" fill="#fff" />
    <!-- Ear ornaments (กรรเจียกจร) -->
    <path d="M235 146 Q215 150 220 162 Q232 160 236 154 Z" />
    <path d="M265 146 Q285 150 280 162 Q268 160 264 154 Z" />

    <!-- Torso (พระอุระและลำตัว) -->
    <path d="M236 178 L264 178 L272 230 Q250 240 228 230 Z" />
    <!-- Chest sash & ornaments -->
    <path d="M238 185 Q250 195 262 185 L260 198 Q250 210 240 198 Z" fill="#9f1239" />
    <path d="M234 225 Q250 235 266 225 L268 245 Q250 255 232 245 Z" />

    <!-- Right Wings (ปีกขวาของครุฑ - ซ้ายมือผู้ชม) -->
    <path d="M235 180 C200 160 140 130 95 110 C85 135 105 160 140 185 C95 180 75 205 110 230 C75 235 70 265 115 285 C80 295 85 330 135 335 C100 350 120 380 165 375 C140 395 170 415 210 395 C190 415 220 425 240 405 L232 230 Z" />
    
    <!-- Left Wings (ปีกซ้ายของครุฑ - ขวามือผู้ชม) -->
    <path d="M265 180 C300 160 360 130 405 110 C415 135 395 160 360 185 C405 180 425 205 390 230 C425 235 430 265 385 285 C420 295 415 330 365 335 C400 350 380 380 335 375 C360 395 330 415 290 395 C310 415 280 425 260 405 L268 230 Z" />

    <!-- Detailed Wing Feathers Lines -->
    <path d="M120 135 Q170 170 225 195" fill="none" stroke="#ffe4e6" stroke-width="2" />
    <path d="M100 185 Q160 210 220 225" fill="none" stroke="#ffe4e6" stroke-width="2" />
    <path d="M110 240 Q165 255 220 255" fill="none" stroke="#ffe4e6" stroke-width="2" />
    <path d="M380 135 Q330 170 275 195" fill="none" stroke="#ffe4e6" stroke-width="2" />
    <path d="M400 185 Q340 210 280 225" fill="none" stroke="#ffe4e6" stroke-width="2" />
    <path d="M390 240 Q335 255 280 255" fill="none" stroke="#ffe4e6" stroke-width="2" />

    <!-- Outstretched Arms (พระกรสองข้าง) -->
    <path d="M236 185 C205 190 170 200 145 220 C140 210 155 195 185 182 C205 174 225 174 236 178 Z" />
    <path d="M264 185 C295 190 330 200 355 220 C360 210 345 195 315 182 C295 174 275 174 264 178 Z" />
    <!-- Hands & Talons (พระหัตถ์) -->
    <circle cx="140" cy="225" r="7" />
    <circle cx="360" cy="225" r="7" />

    <!-- Waist & Lower Body (ผ้านุ่ง สนับเพลา หางครุฑ) -->
    <path d="M228 245 L272 245 L285 300 L250 330 L215 300 Z" />
    <path d="M242 245 L258 245 L255 325 L245 325 Z" fill="#4c0519" />
    <!-- Tail (หางนก) -->
    <path d="M240 330 L250 380 L260 330 Q250 340 240 330 Z" fill="#9f1239" />
    <path d="M230 335 L250 410 L270 335 Q250 355 230 335 Z" fill="#881337" opacity="0.8" />

    <!-- Legs & Talons (พระชงฆ์ และกรงเล็บเท้า) -->
    <path d="M225 290 Q205 325 200 360 C190 365 195 375 210 375 C220 375 225 365 225 350 L235 300 Z" />
    <path d="M275 290 Q295 325 300 360 C310 365 305 375 290 375 C280 375 275 365 275 350 L265 300 Z" />
  </g>
</svg>
`;

/**
 * Official School Red Seal Stamp (SVG)
 */
export const OFFICIAL_SEAL_STAMP_SVG = `
<svg viewBox="0 0 200 200" class="seal-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <path id="sealCircleOuter" d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" />
    <path id="sealCircleInner" d="M 100, 100 m -58, 0 a 58,58 0 1,1 116,0 a 58,58 0 1,1 -116,0" />
  </defs>
  <!-- Outer Circles -->
  <circle cx="100" cy="100" r="92" stroke="#dc2626" stroke-width="3.5" fill="none" stroke-dasharray="0" />
  <circle cx="100" cy="100" r="85" stroke="#dc2626" stroke-width="1.2" fill="none" />
  <circle cx="100" cy="100" r="60" stroke="#dc2626" stroke-width="1.5" fill="none" />
  <circle cx="100" cy="100" r="54" stroke="#dc2626" stroke-width="0.8" stroke-dasharray="2,2" fill="none" />

  <!-- Curved Text along circle -->
  <text fill="#dc2626" font-size="9.5" font-family="'Sarabun', sans-serif" font-weight="800" letter-spacing="1.5px">
    <textPath href="#sealCircleOuter" startOffset="50%" text-anchor="middle">
      โรงเรียนสาธิตนวัตกรรมดิจิทัล • SCHOOL NEXUS
    </textPath>
  </text>
  <text fill="#dc2626" font-size="8" font-family="'Sarabun', sans-serif" font-weight="700" letter-spacing="1px">
    <textPath href="#sealCircleInner" startOffset="50%" text-anchor="middle">
      ★ สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน ★
    </textPath>
  </text>

  <!-- Center Emblem (Dharmachakra / School Torch / Lotus) -->
  <g transform="translate(70, 70) scale(0.6)" stroke="#dc2626" fill="#dc2626" stroke-width="2">
    <circle cx="50" cy="50" r="35" fill="none" stroke="#dc2626" stroke-width="4" />
    <circle cx="50" cy="50" r="10" fill="#dc2626" />
    <!-- 8 Spokes of Dharmachakra Wheel -->
    <line x1="50" y1="15" x2="50" y2="85" stroke="#dc2626" stroke-width="3" />
    <line x1="15" y1="50" x2="85" y2="50" stroke="#dc2626" stroke-width="3" />
    <line x1="25" y1="25" x2="75" y2="75" stroke="#dc2626" stroke-width="3" />
    <line x1="75" y1="25" x2="25" y2="75" stroke="#dc2626" stroke-width="3" />
    <polygon points="50,2 54,12 46,12" />
    <polygon points="50,98 54,88 46,88" />
    <polygon points="2,50 12,54 12,46" />
    <polygon points="98,50 88,54 88,46" />
  </g>

  <!-- Bottom Date / Code -->
  <text x="100" y="172" fill="#dc2626" font-size="7.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">
    EST. 2564 • OFFICIAL SEAL
  </text>
</svg>
`;

/**
 * Format 13-digit Thai national ID into distinct boxed cells
 */
function renderNationalIdBoxes(nationalId: string): string {
  const cleanId = nationalId.replace(/[^0-9]/g, '');
  const digits = cleanId.split('');
  // Groups: 1 - 4 - 5 - 2 - 1
  const groups = [
    digits.slice(0, 1),
    digits.slice(1, 5),
    digits.slice(5, 10),
    digits.slice(10, 12),
    digits.slice(12, 13),
  ];

  return `
    <div class="national-id-container">
      <span class="nid-label">เลขประจำตัวประชาชน:</span>
      <div class="nid-boxes-wrapper">
        ${groups
          .map(
            (grp, gIdx) => `
          <div class="nid-group">
            ${grp.map((d) => `<div class="nid-digit-box">${d}</div>`).join('')}
          </div>
          ${gIdx < groups.length - 1 ? '<span class="nid-hyphen">-</span>' : ''}
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

/**
 * Generates an authentic, official Thai Government Transcript (แบบ ปพ.1 : พ).
 * Exactly replicates the physical document with page 1 (front) and page 2 (back).
 */
export function exportTranscriptAsPdf(data: TranscriptData): void {
  const printWindow = window.open('', '_blank', 'width=1000,height=1100');
  if (!printWindow) {
    window.print();
    return;
  }

  // Split semesters: Semesters 1-4 on Page 1 (Front), Semesters 5-6 on Page 2 (Back)
  const frontSemesters = data.semesters.slice(0, 4);
  const backSemesters = data.semesters.slice(4, 6);

  const renderSemesterTable = (sem: TranscriptSemester) => `
    <div class="sem-table-box">
      <div class="sem-table-title">
        <span class="sem-name-th">${sem.semester}</span>
        <span class="sem-year-th">${sem.semesterThYear}</span>
      </div>
      <table class="official-course-table">
        <thead>
          <tr>
            <th class="col-code">รหัสวิชา</th>
            <th class="col-name">รายวิชา</th>
            <th class="col-credit">หน่วยกิต</th>
            <th class="col-grade">ผลการเรียน</th>
          </tr>
        </thead>
        <tbody>
          ${sem.courses
            .map(
              (c) => `
            <tr>
              <td class="col-code">${c.code}</td>
              <td class="col-name">${c.name}</td>
              <td class="col-credit">${c.credit.toFixed(1)}</td>
              <td class="col-grade">${c.grade}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="sem-sum-label">จำนวนหน่วยกิต / ผลการเรียนเฉลี่ยภาคเรียนนี้</td>
            <td class="sem-sum-credit">${sem.courses.reduce((acc, cur) => acc + cur.credit, 0).toFixed(1)}</td>
            <td class="sem-sum-gpa">4.00</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  const learningAreasRows = data.learningAreas
    .map(
      (la) => `
    <tr>
      <td class="text-center">${toThaiNumerals(la.no)}</td>
      <td class="la-name">${la.name}</td>
      <td class="text-center">${la.basicCredit.toFixed(1)}</td>
      <td class="text-center">${la.additionalCredit.toFixed(1)}</td>
      <td class="text-center font-bold">${la.totalCredit.toFixed(1)}</td>
      <td class="text-center font-bold">${la.gpa}</td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>ปพ.1 : พ - ${data.studentName} (${data.studentId})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 6mm 7mm 6mm 7mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Sarabun', Tahoma, sans-serif;
      color: #0b1329;
      background: #e2e8f0;
      font-size: 11px;
      line-height: 1.35;
      -webkit-font-smoothing: antialiased;
    }

    /* Top Action Bar for Viewer */
    .screen-control-bar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #0f172a;
      color: white;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    .screen-control-bar h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-print-action {
      background: #10b981;
      hover: background: #059669;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    .btn-print-action:hover {
      background: #059669;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #334155;
      color: white;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 8px;
    }
    .btn-secondary:hover {
      background: #475569;
    }

    .pages-wrapper {
      padding: 18px 0 40px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    /* Physical A4 Sheet Container */
    .a4-sheet {
      width: 210mm;
      min-height: 297mm;
      height: 297mm;
      background: #ffffff;
      padding: 7mm 9mm 7mm 9mm;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Authentic Security Guilloche Double Border */
    .official-border-frame {
      border: 3.5px solid #14532d;
      height: 100%;
      padding: 2.5mm;
      position: relative;
      display: flex;
      flex-direction: column;
      background: #fffdfa;
    }
    .official-border-inner {
      border: 1px solid #166534;
      height: 100%;
      padding: 3mm 4mm;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    /* Corner Rosettes / Decorative Thai Corner Lines */
    .corner-decor {
      position: absolute;
      width: 16px;
      height: 16px;
      border-color: #14532d;
      pointer-events: none;
    }
    .corner-tl { top: -1px; left: -1px; border-top: 3px double #14532d; border-left: 3px double #14532d; }
    .corner-tr { top: -1px; right: -1px; border-top: 3px double #14532d; border-right: 3px double #14532d; }
    .corner-bl { bottom: -1px; left: -1px; border-bottom: 3px double #14532d; border-left: 3px double #14532d; }
    .corner-br { bottom: -1px; right: -1px; border-bottom: 3px double #14532d; border-right: 3px double #14532d; }

    /* Watermark in background */
    .watermark-layer {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 320px;
      height: 320px;
      opacity: 0.045;
      pointer-events: none;
      z-index: 0;
    }
    .watermark-layer svg {
      width: 100%;
      height: 100%;
    }

    .content-layer {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* Top Metadata (Right Corner) */
    .header-top-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2px;
    }
    .header-top-left {
      font-size: 9.5px;
      color: #334155;
      font-weight: 500;
    }
    .header-top-right {
      text-align: right;
      font-size: 10.5px;
      line-height: 1.3;
    }
    .doc-code-badge {
      font-weight: 800;
      font-size: 12.5px;
      color: #0f172a;
    }
    .doc-numbers {
      font-size: 10px;
      color: #1e293b;
    }

    /* Garuda and Main Titles */
    .garuda-header-block {
      text-align: center;
      margin-top: -6px;
      margin-bottom: 3px;
    }
    .garuda-container {
      width: 44px;
      height: 44px;
      margin: 0 auto 2px auto;
    }
    .garuda-svg {
      width: 100%;
      height: 100%;
    }
    .main-doc-title {
      font-size: 14.5px;
      font-weight: 800;
      color: #090e1a;
      letter-spacing: -0.2px;
      margin: 0;
      line-height: 1.25;
    }
    .sub-doc-title {
      font-size: 12.5px;
      font-weight: 700;
      color: #1e293b;
      margin: 1px 0 0 0;
    }
    .transcript-en-label {
      font-size: 9.5px;
      font-weight: 700;
      color: #475569;
      letter-spacing: 1px;
      margin-top: 1px;
    }
    .school-location-text {
      font-size: 10px;
      font-weight: 600;
      color: #1e293b;
      margin: 1px 0 0 0;
    }
    .ministry-text {
      font-size: 9.5px;
      color: #475569;
      margin: 0;
    }

    /* National ID boxes */
    .national-id-container {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-top: 1px;
    }
    .nid-label {
      font-size: 9.5px;
      color: #1e293b;
      font-weight: 600;
    }
    .nid-boxes-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .nid-group {
      display: inline-flex;
      border-left: 1px solid #0f172a;
    }
    .nid-digit-box {
      width: 12px;
      height: 14px;
      border: 1px solid #0f172a;
      border-left: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      background: #ffffff;
    }
    .nid-hyphen {
      font-size: 10px;
      font-weight: bold;
      color: #334155;
    }

    /* Student Information Grid */
    .student-dossier-box {
      border: 1px solid #94a3b8;
      border-radius: 2px;
      padding: 4px 6px;
      margin: 3px 0 6px 0;
      display: flex;
      gap: 8px;
      background: #ffffff;
    }
    .student-dossier-left {
      flex: 1;
      font-size: 10.2px;
      line-height: 1.38;
    }
    .dossier-row {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 1.5px;
    }
    .dossier-item {
      display: flex;
      align-items: baseline;
      margin-right: 12px;
    }
    .dossier-label {
      color: #475569;
      font-weight: 500;
      margin-right: 4px;
      white-space: nowrap;
    }
    .dossier-val {
      color: #090e1a;
      font-weight: 700;
    }
    .dossier-dotted {
      border-bottom: 1px dotted #64748b;
      padding-bottom: 0.5px;
    }

    .student-photo-wrapper {
      width: 68px;
      height: 86px;
      flex-shrink: 0;
      position: relative;
    }
    .student-photo-frame {
      width: 100%;
      height: 100%;
      border: 1px solid #64748b;
      border-radius: 2px;
      overflow: hidden;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .student-photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-corner-stamp {
      position: absolute;
      bottom: -6px;
      right: -6px;
      width: 44px;
      height: 44px;
      pointer-events: none;
      opacity: 0.85;
    }

    /* Semester Grid (Front: 4 semesters, Back: 2 semesters) */
    .semesters-duo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      flex: 1;
    }
    .sem-table-box {
      border: 1px solid #94a3b8;
      border-radius: 2px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      margin-bottom: 4px;
    }
    .sem-table-title {
      background: #f1f5f9;
      border-bottom: 1px solid #94a3b8;
      padding: 2px 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .official-course-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.2px;
      line-height: 1.25;
    }
    .official-course-table th {
      border-bottom: 1px solid #94a3b8;
      border-right: 1px solid #e2e8f0;
      background: #fafafa;
      color: #334155;
      font-weight: 600;
      padding: 1.5px 3px;
      text-align: left;
    }
    .official-course-table th:last-child {
      border-right: none;
    }
    .official-course-table td {
      padding: 1px 3px;
      border-bottom: 1px solid #f1f5f9;
      border-right: 1px solid #f1f5f9;
      color: #0f172a;
    }
    .official-course-table td:last-child {
      border-right: none;
    }
    .col-code { width: 18%; font-family: 'JetBrains Mono', monospace; font-size: 8.8px; }
    .col-name { width: 56%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 145px; }
    .col-credit { width: 13%; text-align: center; font-family: 'JetBrains Mono', monospace; }
    .col-grade { width: 13%; text-align: center; font-weight: 700; font-family: 'JetBrains Mono', monospace; }

    .official-course-table tfoot td {
      background: #f8fafc;
      border-top: 1px solid #94a3b8;
      font-weight: 700;
      font-size: 8.8px;
      padding: 2px 3px;
    }
    .sem-sum-label { text-align: right; color: #475569; }
    .sem-sum-credit { text-align: center; font-family: 'JetBrains Mono', monospace; }
    .sem-sum-gpa { text-align: center; font-family: 'JetBrains Mono', monospace; color: #0f172a; }

    /* Page Footer / Page Break */
    .sheet-bottom-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #64748b;
      margin-top: auto;
      padding-top: 3px;
      border-top: 1px dashed #cbd5e1;
    }

    /* Page 2 (Back) Specific Sections */
    .page-back-header {
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 4px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .back-header-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
    }
    .back-student-ref {
      font-size: 10px;
      color: #334155;
      font-weight: 600;
    }

    .learning-areas-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      border: 1px solid #94a3b8;
      margin-bottom: 6px;
      background: #ffffff;
    }
    .learning-areas-table th {
      border: 1px solid #94a3b8;
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      padding: 2.5px 4px;
      text-align: center;
    }
    .learning-areas-table td {
      border: 1px solid #cbd5e1;
      padding: 1.5px 4px;
      color: #0f172a;
    }
    .la-name { font-weight: 600; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }

    /* Evaluation Blocks */
    .evaluation-grid {
      display: grid;
      grid-template-columns: 1.1fr 1fr 1fr;
      gap: 6px;
      margin-bottom: 6px;
    }
    .eval-box {
      border: 1px solid #94a3b8;
      border-radius: 2px;
      padding: 4px 6px;
      background: #ffffff;
      font-size: 9px;
    }
    .eval-box-title {
      font-weight: 800;
      font-size: 9.5px;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
      margin-bottom: 3px;
    }
    .eval-item-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .eval-check {
      font-weight: 700;
      color: #166534;
    }

    /* Graduation Decision Card */
    .graduation-decision-card {
      border: 1.5px solid #1e3a8a;
      background: #eff6ff;
      border-radius: 2px;
      padding: 6px 10px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .grad-left {
      font-size: 10px;
      color: #1e3a8a;
    }
    .grad-main-status {
      font-size: 11px;
      font-weight: 800;
      color: #1e3a8a;
    }
    .grad-gpax-stat {
      text-align: right;
    }
    .grad-gpax-num {
      font-size: 20px;
      font-weight: 900;
      color: #1e3a8a;
      font-family: 'JetBrains Mono', monospace;
      line-height: 1;
    }

    /* Official Signatures and Seals */
    .official-signatures-section {
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
      margin-top: auto;
      display: grid;
      grid-template-columns: 1fr 1.2fr 1.2fr;
      gap: 10px;
      align-items: flex-end;
    }
    .qr-verification-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .qr-verification-img {
      width: 60px;
      height: 60px;
      border: 1px solid #94a3b8;
      padding: 2px;
      background: #ffffff;
    }
    .qr-label-sm {
      font-size: 7.5px;
      color: #475569;
      margin-top: 2px;
      font-family: 'JetBrains Mono', monospace;
    }

    .sig-col {
      text-align: center;
      position: relative;
    }
    .sig-cursive-name {
      font-style: italic;
      font-weight: 700;
      font-size: 12px;
      color: #1e293b;
      margin-bottom: 2px;
      font-family: 'Sarabun', serif;
    }
    .sig-dotted-line {
      border-top: 1px dotted #334155;
      padding-top: 2px;
      font-size: 9.5px;
    }
    .sig-person-name {
      font-weight: 700;
      color: #0f172a;
    }
    .sig-role-title {
      font-size: 8.5px;
      color: #64748b;
    }
    .sig-date-th {
      font-size: 8px;
      color: #64748b;
      margin-top: 1px;
    }

    .official-seal-wrapper {
      position: absolute;
      top: -24px;
      right: 0px;
      width: 76px;
      height: 76px;
      pointer-events: none;
      transform: rotate(-10deg);
      opacity: 0.88;
    }

    @media print {
      .screen-control-bar {
        display: none !important;
      }
      body {
        background: #ffffff !important;
      }
      .pages-wrapper {
        padding: 0 !important;
        gap: 0 !important;
      }
      .a4-sheet {
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100vh !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .a4-sheet:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <!-- Top Tool bar -->
  <div class="screen-control-bar">
    <div>
      <h2>
        <span>🏛️</span>
        <span>ระเบียนแสดงผลการเรียนหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน (แบบ ปพ.๑ : พ - ตัวจริง)</span>
      </h2>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
        เอกสารฉบับสมบูรณ์ ๒ หน้า (ด้านหน้า - ด้านหลัง) • สพฐ. กระทรวงศึกษาธิการ
      </div>
    </div>

    <div>
      <button class="btn-print-action" onclick="window.print()">
        <span>🖨️ บันทึกเป็นไฟล์ PDF / สั่งพิมพ์</span>
      </button>
      <button class="btn-secondary" onclick="window.close()">
        ปิดหน้าต่าง
      </button>
    </div>
  </div>

  <div class="pages-wrapper">

    <!-- ================= PAGE 1 (FRONT / ด้านหน้า) ================= -->
    <div class="a4-sheet">
      <div class="official-border-frame">
        <div class="official-border-inner">
          <div class="corner-decor corner-tl"></div>
          <div class="corner-decor corner-tr"></div>
          <div class="corner-decor corner-bl"></div>
          <div class="corner-decor corner-br"></div>

          <!-- Subtle Watermark -->
          <div class="watermark-layer">
            ${OFFICIAL_GARUDA_SVG}
          </div>

          <div class="content-layer">
            <!-- Top Metadata -->
            <div class="header-top-meta">
              <div class="header-top-left">
                เลขประจำตัวนักเรียน: <strong style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #0f172a;">${data.studentId}</strong> (${data.studentIdThai})
              </div>
              <div class="header-top-right">
                <div class="doc-code-badge">${data.documentCode}</div>
                <div class="doc-numbers">ชุดที่ ${data.documentBookNo} &nbsp; เลขที่ ${data.documentSheetNo}</div>
                <div>${renderNationalIdBoxes(data.nationalId)}</div>
              </div>
            </div>

            <!-- Garuda Crest and Official Title -->
            <div class="garuda-header-block">
              <div class="garuda-container">
                ${OFFICIAL_GARUDA_SVG}
              </div>
              <h1 class="main-doc-title">${data.documentType}</h1>
              <div class="sub-doc-title">ระดับมัธยมศึกษาตอนปลาย</div>
              <div class="transcript-en-label">(TRANSCRIPT)</div>
              <div class="school-location-text">
                <strong>${data.schoolNameTh}</strong> (${data.schoolNameEn})
              </div>
              <p class="ministry-text">
                ${data.schoolSubDistrict} ${data.schoolDistrict} ${data.schoolProvince} &nbsp;•&nbsp; ${data.educationArea} &nbsp;•&nbsp; ${data.ministryTh}
              </p>
            </div>

            <!-- Student Dossier Section -->
            <div class="student-dossier-box">
              <div class="student-dossier-left">
                <div class="dossier-row">
                  <div class="dossier-item" style="flex: 1.2;">
                    <span class="dossier-label">ชื่อ - ชื่อสกุล (ภาษาไทย):</span>
                    <span class="dossier-val dossier-dotted">${data.studentName}</span>
                  </div>
                  <div class="dossier-item" style="flex: 1;">
                    <span class="dossier-label">Name - Surname:</span>
                    <span class="dossier-val dossier-dotted">${data.studentEngName}</span>
                  </div>
                </div>

                <div class="dossier-row">
                  <div class="dossier-item">
                    <span class="dossier-label">เพศ:</span>
                    <span class="dossier-val">${data.gender}</span>
                  </div>
                  <div class="dossier-item">
                    <span class="dossier-label">วัน เดือน ปีเกิด:</span>
                    <span class="dossier-val dossier-dotted">${data.birthDateTh}</span>
                    <span style="font-size: 8.5px; color: #64748b; margin-left: 4px;">(${data.birthDateEn})</span>
                  </div>
                  <div class="dossier-item">
                    <span class="dossier-label">สัญชาติ:</span>
                    <span class="dossier-val">${data.nationality}</span>
                  </div>
                  <div class="dossier-item">
                    <span class="dossier-label">เชื้อชาติ:</span>
                    <span class="dossier-val">${data.ethnicity}</span>
                  </div>
                  <div class="dossier-item">
                    <span class="dossier-label">ศาสนา:</span>
                    <span class="dossier-val">${data.religion}</span>
                  </div>
                </div>

                <div class="dossier-row">
                  <div class="dossier-item" style="flex: 1;">
                    <span class="dossier-label">ชื่อบิดา:</span>
                    <span class="dossier-val dossier-dotted">${data.fatherName}</span>
                  </div>
                  <div class="dossier-item" style="flex: 1;">
                    <span class="dossier-label">ชื่อมารดา:</span>
                    <span class="dossier-val dossier-dotted">${data.motherName}</span>
                  </div>
                </div>

                <div class="dossier-row">
                  <div class="dossier-item">
                    <span class="dossier-label">วันเข้าเรียน:</span>
                    <span class="dossier-val">${data.admissionDate}</span>
                  </div>
                  <div class="dossier-item">
                    <span class="dossier-label">ชั้นที่เข้าเรียน:</span>
                    <span class="dossier-val">${data.admissionGrade}</span>
                  </div>
                  <div class="dossier-item">
                    <span class="dossier-label">แผนการเรียน:</span>
                    <span class="dossier-val">${data.curriculumTrack}</span>
                  </div>
                </div>

                <div class="dossier-row">
                  <div class="dossier-item" style="width: 100%;">
                    <span class="dossier-label">วันออกจากสถานศึกษา:</span>
                    <span class="dossier-val">${data.completionDate}</span>
                    <span class="dossier-label" style="margin-left: 8px;">เหตุผลที่ออก:</span>
                    <span class="dossier-val" style="font-size: 9.5px;">${data.completionReason}</span>
                  </div>
                </div>
              </div>

              <!-- Student Photo with Official Stamp -->
              <div class="student-photo-wrapper">
                <div class="student-photo-frame">
                  ${
                    data.avatarUrl
                      ? `<img src="${data.avatarUrl}" alt="Photo" crossorigin="anonymous" />`
                      : `<div style="font-size: 8px; color: #94a3b8; text-align: center;">รูปถ่ายนักเรียน<br>ขนาด ๑.๕ นิ้ว</div>`
                  }
                </div>
                <div class="photo-corner-stamp">
                  ${OFFICIAL_SEAL_STAMP_SVG}
                </div>
              </div>
            </div>

            <!-- Semesters 1 - 4 (Page 1 Table) -->
            <div class="semesters-duo-grid">
              ${frontSemesters.map(renderSemesterTable).join('')}
            </div>

            <!-- Page 1 Bottom Note -->
            <div class="sheet-bottom-status">
              <div>เอกสารแบบ ปพ.๑ : พ (ด้านหน้า) • เลขที่เอกสาร ${data.documentNo}</div>
              <div>(ดูผลการเรียนต่อในหน้าที่ ๒ ด้านหลัง) ➔ หน้า ๑ / ๒</div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- ================= PAGE 2 (BACK / ด้านหลัง) ================= -->
    <div class="a4-sheet">
      <div class="official-border-frame">
        <div class="official-border-inner">
          <div class="corner-decor corner-tl"></div>
          <div class="corner-decor corner-tr"></div>
          <div class="corner-decor corner-bl"></div>
          <div class="corner-decor corner-br"></div>

          <!-- Subtle Watermark -->
          <div class="watermark-layer">
            ${OFFICIAL_GARUDA_SVG}
          </div>

          <div class="content-layer">
            <!-- Page 2 Header -->
            <div class="page-back-header">
              <div>
                <div class="back-header-title">ระเบียนแสดงผลการเรียน แบบ ปพ.๑ : พ (ด้านหลัง)</div>
                <div style="font-size: 8.5px; color: #475569;">หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน ระดับมัธยมศึกษาตอนปลาย</div>
              </div>
              <div class="back-student-ref">
                เลขประจำตัวนักเรียน: <strong style="font-family: 'JetBrains Mono', monospace;">${data.studentId}</strong> &nbsp;|&nbsp; ${data.studentName}
              </div>
            </div>

            <!-- Semesters 5 - 6 (Senior Year Records) -->
            <div class="semesters-duo-grid" style="flex: 0 0 auto; margin-bottom: 6px;">
              ${backSemesters.map(renderSemesterTable).join('')}
            </div>

            <!-- Summary Table of 8 Learning Areas -->
            <div style="font-size: 10px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
              สรุปผลสัมฤทธิ์ทางการเรียนตามกลุ่มสาระการเรียนรู้ (๘ กลุ่มสาระ)
            </div>
            <table class="learning-areas-table">
              <thead>
                <tr>
                  <th style="width: 6%;">ที่</th>
                  <th style="width: 44%; text-align: left;">กลุ่มสาระการเรียนรู้</th>
                  <th style="width: 13%;">หน่วยกิตพื้นฐาน</th>
                  <th style="width: 13%;">หน่วยกิตเพิ่มเติม</th>
                  <th style="width: 12%;">รวมหน่วยกิต</th>
                  <th style="width: 12%;">ผลการเรียนเฉลี่ย</th>
                </tr>
              </thead>
              <tbody>
                ${learningAreasRows}
              </tbody>
              <tfoot>
                <tr style="background: #f8fafc; font-weight: 700;">
                  <td colspan="2" class="text-center font-bold">รวมตลอดหลักสูตร</td>
                  <td class="text-center">${data.totalBasicCredits.toFixed(1)}</td>
                  <td class="text-center">${data.totalAdditionalCredits.toFixed(1)}</td>
                  <td class="text-center font-bold" style="color: #1e3a8a;">${data.totalCredits.toFixed(1)}</td>
                  <td class="text-center font-bold" style="color: #1e3a8a; font-size: 10.5px;">${data.gpax}</td>
                </tr>
              </tfoot>
            </table>

            <!-- Evaluations Row (Activities, Desirable, Analytical) -->
            <div class="evaluation-grid">
              <!-- กิจกรรมพัฒนาผู้เรียน -->
              <div class="eval-box">
                <div class="eval-box-title">๑. กิจกรรมพัฒนาผู้เรียน</div>
                <div class="eval-item-row">
                  <span>- แนะแนว:</span>
                  <span class="eval-check">✓ ${data.activityGuidance}</span>
                </div>
                <div class="eval-item-row">
                  <span>- กิจกรรมนักเรียน (รด./ชุมนุม):</span>
                  <span class="eval-check">✓ ${data.activityStudent}</span>
                </div>
                <div class="eval-item-row">
                  <span>- เพื่อสังคมและสาธารณประโยชน์:</span>
                  <span class="eval-check">✓ ${data.activitySocial}</span>
                </div>
                <div style="font-size: 8px; color: #166534; font-weight: 700; border-top: 1px dashed #cbd5e1; padding-top: 1px; margin-top: 2px;">
                  สรุป: ผ่านเกณฑ์การตัดสิน
                </div>
              </div>

              <!-- คุณลักษณะอันพึงประสงค์ -->
              <div class="eval-box">
                <div class="eval-box-title">๒. คุณลักษณะอันพึงประสงค์</div>
                <div style="font-size: 8.5px; color: #475569; margin-bottom: 2px;">
                  ประเมินคุณลักษณะตามเกณฑ์ ๘ ประการ
                </div>
                <div style="font-size: 11.5px; font-weight: 800; color: #166534; margin: 4px 0;">
                  ✓ ผ่านระดับ ${data.moralityAssessment}
                </div>
                <div style="font-size: 7.5px; color: #64748b;">(๓: ดีเยี่ยม, ๒: ดี, ๑: ผ่าน, ๐: ไม่ผ่าน)</div>
              </div>

              <!-- การอ่าน คิดวิเคราะห์ และเขียน -->
              <div class="eval-box">
                <div class="eval-box-title">๓. การอ่าน คิดวิเคราะห์ และเขียน</div>
                <div style="font-size: 8.5px; color: #475569; margin-bottom: 2px;">
                  ประเมินทักษะการสื่อสารและการคิด
                </div>
                <div style="font-size: 11.5px; font-weight: 800; color: #166534; margin: 4px 0;">
                  ✓ ผ่านระดับ ${data.analyticalAssessment}
                </div>
                <div style="font-size: 7.5px; color: #64748b;">(๓: ดีเยี่ยม, ๒: ดี, ๑: ผ่าน, ๐: ไม่ผ่าน)</div>
              </div>
            </div>

            <!-- Graduation Decision Banner -->
            <div class="graduation-decision-card">
              <div class="grad-left">
                <div class="grad-main-status">
                  ✓ ได้รับการตัดสินให้สำเร็จการศึกษาชั้นมัธยมศึกษาปีที่ ๖
                </div>
                <div style="font-size: 9px; color: #3b82f6; margin-top: 1px;">
                  ตามเกณฑ์ของหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน กระทรวงศึกษาธิการ • ${data.honors}
                </div>
              </div>
              <div class="grad-gpax-stat">
                <div style="font-size: 9px; color: #1e3a8a; font-weight: 700;">เกรดเฉลี่ยสะสมตลอดหลักสูตร (GPAX)</div>
                <div class="grad-gpax-num">${data.gpax} <span style="font-size: 12px; font-weight: 700;">(${data.gpaxThai})</span></div>
              </div>
            </div>

            <!-- Certification, Signatures & Digital Seal Stamp -->
            <div class="official-signatures-section">
              <div class="qr-verification-cell">
                <img class="qr-verification-img" src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://school-nexus.internal/verify/transcript/${data.studentId}" alt="Verify QR Code" />
                <div class="qr-label-sm">สแกนตรวจสอบความถูกต้อง e-Transcript</div>
                <div class="qr-label-sm" style="font-size: 6.8px; color: #94a3b8;">SECURE DIGITAL HASH SHA-256</div>
              </div>

              <!-- Registrar Signature -->
              <div class="sig-col">
                <div class="sig-cursive-name">${data.registrarName}</div>
                <div class="sig-dotted-line">
                  <div class="sig-person-name">(${data.registrarName})</div>
                  <div class="sig-role-title">นายทะเบียน / ผู้ตรวจทาน</div>
                  <div class="sig-date-th">วันที่ ${data.issueDateThai}</div>
                </div>
              </div>

              <!-- Director Signature & Official Stamp -->
              <div class="sig-col">
                <div class="official-seal-wrapper">
                  ${OFFICIAL_SEAL_STAMP_SVG}
                </div>
                <div class="sig-cursive-name">${data.directorName}</div>
                <div class="sig-dotted-line">
                  <div class="sig-person-name">(${data.directorName})</div>
                  <div class="sig-role-title">ผู้อำนวยการสถานศึกษา</div>
                  <div class="sig-date-th">วันที่ ${data.issueDateThai}</div>
                </div>
              </div>
            </div>

            <!-- Page 2 Bottom Note -->
            <div class="sheet-bottom-status">
              <div>เอกสารแบบ ปพ.๑ : พ (ด้านหลัง) • ขอรับรองว่าระเบียนแสดงผลการเรียนนี้ถูกต้องตรงตามหลักฐานของสถานศึกษา</div>
              <div>หน้า ๒ / ๒</div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <script>
    // Prompt to print immediately after loading
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
