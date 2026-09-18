import React, { useState } from 'react';
import { AssignmentAttachment } from '../../types';

export interface StudentWorkViewerData {
  id: string;
  assignmentId?: string;
  studentName: string;
  thaiName: string;
  studentId: string;
  avatar: string;
  assignmentTitle: string;
  subject: string;
  submittedDate: string;
  fileAttachment: string;
  maxScore: number;
  currentScore?: number;
  feedback?: string;
  githubRepoUrl?: string;
  attachments?: AssignmentAttachment[];
  lateReason?: string;
  isLate?: boolean;
  status?: 'pending' | 'graded';
}

interface StudentWorkViewerModalProps {
  data: StudentWorkViewerData | null;
  onClose: () => void;
  onGradeSubmit?: (id: string, score: number, feedback: string) => void;
}

interface DocumentPage {
  pageNumber: number;
  title: string;
  content: {
    sectionHeading?: string;
    paragraphs?: string[];
    bulletPoints?: string[];
    table?: { headers: string[]; rows: string[][] };
    image?: { url: string; caption: string };
    codeSnippet?: { language: string; code: string };
    highlightBox?: { title: string; text: string; type?: 'info' | 'success' | 'warning' };
  }[];
}

// Generate realistic multi-page document structure for any submission
const generateDocumentPages = (data: StudentWorkViewerData): DocumentPage[] => {
  const fileName = data.fileAttachment || 'assignment_submission.pdf';
  const fileExt = fileName.split('.').pop()?.toLowerCase() || 'pdf';

  if (fileExt === 'png' || fileExt === 'jpg' || fileExt === 'jpeg') {
    return [
      {
        pageNumber: 1,
        title: `เอกสารส่งงานภาพ: ${data.assignmentTitle}`,
        content: [
          {
            sectionHeading: '1. ผลงานออกแบบ / แผนภาพประกอบ (Submitted Graphic/Image)',
            paragraphs: [
              `ไฟล์แนบ: ${fileName} • ขนาดความละเอียดสูง (High Resolution Render)`,
              `จัดทำโดย: ${data.thaiName} (รหัสนักเรียน ${data.studentId}) รายวิชา ${data.subject}`,
            ],
            image: {
              url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
              caption: `ภาพผลงานที่ส่ง: ${fileName} (ซิงค์จากระบบ School Nexus Storage)`,
            },
          },
          {
            sectionHeading: '2. คำอธิบายผลงาน (Student Description)',
            paragraphs: [
              'ผลงานนี้เป็นการออกแบบชิ้นงานและแผนภาพสรุปกระบวนการทำงานตามโจทย์ที่ได้รับมอบหมาย โดยเน้นความถูกต้องของข้อมูล การจัดองค์ประกอบภาพ และการสื่อความหมายที่ชัดเจน',
            ],
            highlightBox: {
              title: 'บันทึกการส่งงาน',
              text: `ส่งเมื่อ: ${data.submittedDate} • สถานะ: ${data.isLate ? 'ส่งช้ากว่ากำหนด' : 'ส่งตรงตามเวลาปกติ'}`,
              type: 'info',
            },
          },
        ],
      },
    ];
  }

  // Multi-page standard PDF / Report for all general and project submissions
  return [
    {
      pageNumber: 1,
      title: data.assignmentTitle,
      content: [
        {
          highlightBox: {
            title: 'รายงานการส่งงานวิชาการ (Academic Assignment Submission)',
            text: `วิชา: ${data.subject} | ผู้จัดทำ: ${data.thaiName} (รหัสประจำตัว ${data.studentId}) | ส่งเมื่อ: ${data.submittedDate}`,
            type: 'info',
          },
        },
        {
          sectionHeading: '1. บทคัดย่อและวัตถุประสงค์ (Abstract & Objectives)',
          paragraphs: [
            `รายงานฉบับนี้จัดทำขึ้นเพื่อนำเสนอผลการศึกษา ค้นคว้า และปฏิบัติการตามโจทย์ของ "${data.assignmentTitle}" โดยมุ่งเน้นการประยุกต์ใช้องค์ความรู้ตามหลักสูตรและการแก้ปัญหาอย่างเป็นระบบ`,
            'นักเรียนได้ศึกษาหลักการ ออกแบบขั้นตอนการทำงาน และดำเนินการทดสอบผลลัพธ์เพื่อตรวจสอบความถูกต้องตามเกณฑ์มาตรฐานที่อาจารย์ผู้สอนกำหนด',
          ],
          bulletPoints: [
            'ศึกษาทฤษฎีและแนวคิดพื้นฐานที่เกี่ยวข้องกับการดำเนินงาน',
            'ออกแบบสถาปัตยกรรม ขั้นตอนการทำงาน และผังลำดับกระบวนการ (Workflows)',
            'ลงมือปฏิบัติตามข้อกำหนด พร้อมบันทึกผลการทดลองและประเมินประสิทธิภาพ',
          ],
        },
        {
          sectionHeading: '2. เครื่องมือและเทคโนโลยีที่ใช้ (Tools & Methodology)',
          table: {
            headers: ['รายการ / องค์ประกอบ', 'รายละเอียดการใช้งาน', 'ผลการทดสอบ'],
            rows: [
              ['สถาปัตยกรรมหลัก', 'Modular Architecture & Clean Code Structure', 'ผ่านเกณฑ์มาตรฐาน'],
              ['ชุดข้อมูล / Data Input', 'Curated Academic Dataset & Edge Cases', 'ความแม่นยำ 94.8%'],
              ['การตรวจสอบความถูกต้อง', 'Unit Testing & Verification Suite', '100% Passed'],
            ],
          },
        },
      ],
    },
    {
      pageNumber: 2,
      title: `${data.assignmentTitle} - ผลการดำเนินงาน`,
      content: [
        {
          sectionHeading: '3. ผลการทดสอบและการวิเคราะห์ข้อมูล (Results & Analysis)',
          paragraphs: [
            'จากการทดสอบชิ้นงานและการประเมินผลการทำงานจริง พบว่าระบบและชิ้นงานที่พัฒนาขึ้นสามารถทำงานได้ตามวัตถุประสงค์ มีความเสถียร และรองรับกรณีทดสอบต่าง ๆ ได้อย่างถูกต้อง',
          ],
          image: {
            url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000',
            caption: 'รูปที่ 1: กราฟแสดงประสิทธิภาพและความแม่นยำของการประมวลผลตามรอบการทดสอบ',
          },
          highlightBox: {
            title: 'สรุปผลการวัดค่าประสิทธิภาพ (Key Metrics)',
            text: 'ความถูกต้องแม่นยำเฉลี่ย: 94.8% | เวลาตอบสนองเฉลี่ย: 0.12 วินาที | ไม่พบข้อผิดพลาดรุนแรงในการประมวลผล',
            type: 'success',
          },
        },
        {
          sectionHeading: '4. ตัวอย่างโครงสร้างการทำงาน (Sample Implementation)',
          paragraphs: [
            'โค้ดและส่วนประกอบหลักได้รับการจัดหมวดหมู่อย่างเป็นระเบียบ พร้อมแนบไฟล์ต้นฉบับในชุดส่งงาน:',
          ],
          codeSnippet: {
            language: 'Python / Architecture Spec',
            code: `# โครงสร้างการทำงานหลักที่นักเรียนส่งมอบ (${fileName})\nclass AssignmentSubmission:\n    def __init__(self, student_id="${data.studentId}"):\n        self.student = "${data.thaiName}"\n        self.status = "VERIFIED_COMPLETED"\n        self.accuracy = 0.948\n\n    def evaluate(self):\n        return {"passed": True, "score_ready": True}`,
          },
        },
      ],
    },
    {
      pageNumber: 3,
      title: `${data.assignmentTitle} - สรุปผลและเอกสารอ้างอิง`,
      content: [
        {
          sectionHeading: '5. สรุปผลการเรียนรู้และข้อเสนอแนะ (Conclusion & Discussion)',
          paragraphs: [
            'จากการจัดทำผลงานชิ้นนี้ นักเรียนได้รับประสบการณ์ตรงในการวิเคราะห์ ออกแบบ และแก้ปัญหาเชิงลึก โดยชิ้นงานสำเร็จลุล่วงและพร้อมสำหรับการนำไปต่อยอดในระดับโครงงานขั้นสูง',
            'ข้อจำกัดและสิ่งที่สามารถพัฒนาต่อ: สามารถขยายขอบเขตการทำงานเพื่อรองรับข้อมูลขนาดใหญ่ขึ้น และปรับปรุงส่วนติดต่อผู้ใช้งานให้สะดวกรวดเร็วยิ่งขึ้น',
          ],
          bulletPoints: [
            'ผลงานเสร็จสมบูรณ์ตรงตามเงื่อนไขทุกข้อ',
            'ส่งมอบไฟล์เอกสารและไฟล์ชิ้นงานครบถ้วนในระบบ',
            'ผ่านการตรวจสอบความถูกต้องเรียบร้อย',
          ],
        },
        {
          sectionHeading: '6. รายการไฟล์แนบในระบบ (Attached Submission Files)',
          table: {
            headers: ['ชื่อไฟล์', 'ประเภท', 'ขนาดไฟล์', 'สถานะการตรวจ'],
            rows: [
              [fileName, fileExt.toUpperCase(), '4.8 MB', 'พร้อมให้คะแนน'],
              ['project_summary_report.pdf', 'PDF Document', '1.2 MB', 'ตรวจสอบแล้ว'],
            ],
          },
          highlightBox: {
            title: 'การรับรองความถูกต้องของผลงาน',
            text: `ข้าพเจ้า ${data.thaiName} ขอรับรองว่าผลงานชิ้นนี้เป็นผลงานที่จัดทำขึ้นด้วยตนเองตามหลักจริยธรรมทางวิชาการ`,
            type: 'info',
          },
        },
      ],
    },
  ];
};

export const StudentWorkViewerModal: React.FC<StudentWorkViewerModalProps> = ({
  data,
  onClose,
  onGradeSubmit,
}) => {
  if (!data) return null;

  const fileName = data.fileAttachment || 'assignment_submission.pdf';
  const fileExt = fileName.split('.').pop()?.toLowerCase() || 'pdf';
  const pages = generateDocumentPages(data);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentScore, setCurrentScore] = useState<string>(
    data.currentScore !== undefined ? String(data.currentScore) : ''
  );
  const [feedback, setFeedback] = useState<string>(data.feedback || '');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const totalPages = pages.length;
  const activePageData = pages.find((p) => p.pageNumber === currentPage) || pages[0];

  // Handle direct file download
  const handleDownload = () => {
    try {
      const contentStr = `School Nexus Academic Submission\n===============================\nAssignment: ${data.assignmentTitle}\nSubject: ${data.subject}\nStudent: ${data.thaiName} (${data.studentId})\nSubmitted Date: ${data.submittedDate}\nFile: ${fileName}\n\n[Document Content Verified & Archival Copy Ready]`;
      const blob = new Blob([contentStr], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccessToast(`ดาวน์โหลดไฟล์ "${fileName}" เรียบร้อยแล้ว`);
      setTimeout(() => setDownloadSuccessToast(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle grade submission
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreNum = parseFloat(currentScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > data.maxScore) {
      alert(`กรุณาระบุคะแนนระหว่าง 0 ถึง ${data.maxScore}`);
      return;
    }
    if (onGradeSubmit) {
      onGradeSubmit(data.id, scoreNum, feedback);
    }
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 border border-slate-200 animate-scaleIn"
      >
        {/* Top Header Bar - Clean & Friendly */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">
                {fileExt === 'pdf' ? 'picture_as_pdf' : fileExt === 'png' || fileExt === 'jpg' ? 'image' : 'description'}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate max-w-md">
                  {fileName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 shrink-0">
                  {data.subject}
                </span>
                {data.status === 'graded' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold shrink-0">
                    ตรวจแล้ว ({data.currentScore}/{data.maxScore})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold shrink-0">
                    รอตรวจ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                นักเรียน: <b className="text-slate-800">{data.thaiName}</b> (รหัส {data.studentId}) • ส่งเมื่อ {data.submittedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download File */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="ดาวน์โหลดไฟล์งาน"
            >
              <span className="material-symbols-outlined text-[16px] text-blue-600">download</span>
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </button>

            {/* Print Document */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="พิมพ์เอกสาร"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer font-bold"
              title="ปิด"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Download Success Banner */}
        {downloadSuccessToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              {downloadSuccessToast}
            </span>
            <button onClick={() => setDownloadSuccessToast(null)} className="text-white cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Main Content Area: PDF Viewer on Left (70%) and Simple Grading on Right (30%) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* PDF & Document Viewer (Col 8) */}
          <div className="lg:col-span-8 flex flex-col bg-slate-100/80 border-r border-slate-200 overflow-hidden">
            {/* Document Navigation & Zoom Toolbar */}
            <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0 shadow-xs">
              {/* Pagination Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer flex items-center"
                  title="หน้าก่อนหน้า"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>

                <span className="font-bold text-slate-800 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  หน้า {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer flex items-center"
                  title="หน้าถัดไป"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>

              {/* Document Title Header in Toolbar */}
              <div className="hidden sm:block font-bold text-slate-700 truncate max-w-xs text-xs">
                {data.assignmentTitle}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                  className="p-1 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                  title="ซูมออก"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-700 w-12 text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
                  className="p-1 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                  title="ซูมเข้า"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="px-1.5 py-0.5 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                  title="ขนาดพอดีหน้า"
                >
                  100%
                </button>
              </div>
            </div>

            {/* Document Paper Page Container (Clean White Document Layout) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  width: '100%',
                  maxWidth: '720px',
                }}
                className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-10 space-y-6 transition-transform my-2"
              >
                {/* Academic Header */}
                <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black text-blue-700 tracking-wider uppercase">
                      โรงเรียนอัจฉริยะ Smart School Nexus • เอกสารรายงานผลงานนักเรียน
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                      {activePageData.title}
                    </h2>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                      หน้า {activePageData.pageNumber} จาก {totalPages}
                    </span>
                  </div>
                </div>

                {/* Page Content Sections */}
                <div className="space-y-5">
                  {activePageData.content.map((sec, idx) => (
                    <div key={idx} className="space-y-2.5">
                      {/* Section Heading */}
                      {sec.sectionHeading && (
                        <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-3.5 bg-blue-600 rounded-full" />
                          <span>{sec.sectionHeading}</span>
                        </h4>
                      )}

                      {/* Highlight Box */}
                      {sec.highlightBox && (
                        <div
                          className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                            sec.highlightBox.type === 'success'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                              : 'bg-blue-50 border-blue-200 text-blue-950'
                          }`}
                        >
                          <div className="font-bold mb-1 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-blue-600">
                              {sec.highlightBox.type === 'success' ? 'check_circle' : 'info'}
                            </span>
                            <span>{sec.highlightBox.title}</span>
                          </div>
                          <div>{sec.highlightBox.text}</div>
                        </div>
                      )}

                      {/* Paragraphs */}
                      {sec.paragraphs &&
                        sec.paragraphs.map((p, pIdx) => (
                          <p key={pIdx} className="text-xs text-slate-700 leading-relaxed indent-4">
                            {p}
                          </p>
                        ))}

                      {/* Bullet points */}
                      {sec.bulletPoints && (
                        <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside pl-2">
                          {sec.bulletPoints.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      )}

                      {/* Table */}
                      {sec.table && (
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                                {sec.table.headers.map((h, hIdx) => (
                                  <th key={hIdx} className="p-2.5">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sec.table.rows.map((row, rIdx) => (
                                <tr
                                  key={rIdx}
                                  className={`border-b border-slate-100 ${
                                    rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                  }`}
                                >
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2.5 text-slate-700">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Image Attachment */}
                      {sec.image && (
                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 space-y-1.5">
                          <img
                            src={sec.image.url}
                            alt={sec.image.caption}
                            className="w-full max-h-72 object-contain rounded-lg mx-auto"
                          />
                          <p className="text-[11px] text-center text-slate-500 italic">
                            {sec.image.caption}
                          </p>
                        </div>
                      )}

                      {/* Code Snippet */}
                      {sec.codeSnippet && (
                        <div className="rounded-xl bg-slate-900 text-slate-100 p-3.5 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-700">
                          <div className="text-[10px] text-slate-400 pb-1 mb-2 border-b border-slate-800">
                            {sec.codeSnippet.language}
                          </div>
                          <pre>
                            <code>{sec.codeSnippet.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Page Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>ผู้ส่ง: {data.thaiName} ({data.studentId})</span>
                  <span>หน้า {activePageData.pageNumber} / {totalPages}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grading & Feedback Panel on Right (Col 4) - Simple & Clean */}
          <div className="lg:col-span-4 bg-white p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div className="pb-2.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-xl">fact_check</span>
                  <h4 className="font-bold text-sm text-slate-900">ตรวจให้คะแนน</h4>
                </div>
                <span className="text-xs font-bold text-slate-500">เต็ม {data.maxScore} คะแนน</span>
              </div>

              {/* Student Summary Card */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={data.avatar}
                  alt={data.thaiName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-900 truncate">{data.thaiName}</div>
                  <div className="text-[11px] text-slate-500">เลขประจำตัว: {data.studentId}</div>
                  <div className="text-[10px] font-bold text-blue-600 truncate">{data.assignmentTitle}</div>
                </div>
              </div>

              {/* Score Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ระบุคะแนนที่ได้ (0 - {data.maxScore})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={data.maxScore}
                    step="0.5"
                    value={currentScore}
                    onChange={(e) => setCurrentScore(e.target.value)}
                    placeholder={`0 - ${data.maxScore}`}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-base font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentScore(String(data.maxScore))}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 cursor-pointer transition-colors"
                  >
                    เต็ม ({data.maxScore})
                  </button>
                </div>
              </div>

              {/* Quick Feedback Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ข้อเสนอแนะด่วน
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'ส่งงานตรงเวลาดีมาก',
                    'เนื้อหาถูกต้องครบถ้วน',
                    'จัดรูปแบบเอกสารสวยงาม',
                    'ควรเพิ่มรายละเอียดส่วนวิเคราะห์',
                    'ยอดเยี่ยมมาก',
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setFeedback((prev) => (prev ? `${prev} • ${preset}` : preset))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200 cursor-pointer transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="เขียนข้อเสนอแนะ หรือคำชมเชยแก่นักเรียน..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>บันทึกคะแนน</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </form>

            <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-2">
              School Nexus • ตรวจผลงานวิชาการ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
