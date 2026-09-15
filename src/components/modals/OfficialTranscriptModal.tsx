import React, { useState, useRef } from 'react';
import { UserProfile } from '../../types';
import {
  exportTranscriptAsPdf,
  getDefaultTranscriptData,
  OFFICIAL_GARUDA_SVG,
  OFFICIAL_SEAL_STAMP_SVG,
  toThaiNumerals,
} from '../../utils/pdfGenerator';

interface OfficialTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const OfficialTranscriptModal: React.FC<OfficialTranscriptModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [activePage, setActivePage] = useState<'all' | 'front' | 'back'>('all');
  const [zoomScale, setZoomScale] = useState<number>(100);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const data = getDefaultTranscriptData(user);

  const handleExportPdf = () => {
    exportTranscriptAsPdf(data);
  };

  const handlePrint = () => {
    window.print();
  };

  // 13-digit National ID grouping
  const cleanId = data.nationalId.replace(/[^0-9]/g, '');
  const digits = cleanId.split('');
  const idGroups = [
    digits.slice(0, 1),
    digits.slice(1, 5),
    digits.slice(5, 10),
    digits.slice(10, 12),
    digits.slice(12, 13),
  ];

  const frontSemesters = data.semesters.slice(0, 4);
  const backSemesters = data.semesters.slice(4, 6);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-0 sm:p-3 overflow-hidden">
      {/* Outer Shell */}
      <div className="bg-[#0f172a] rounded-none sm:rounded-2xl max-w-5xl w-full h-full sm:h-[96vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-3 sm:px-5 bg-gradient-to-r from-slate-900 via-[#132338] to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  แบบ ปพ.๑ : พ (ระเบียนแสดงผลการเรียนตัวจริง)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  OFFICIAL TRANSCRIPT
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน • สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน กระทรวงศึกษาธิการ
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* View Selector Tabs */}
            <div className="hidden md:flex items-center bg-slate-800/90 rounded-xl p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActivePage('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activePage === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ครบ ๒ หน้า
              </button>
              <button
                type="button"
                onClick={() => setActivePage('front')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activePage === 'front'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ด้านหน้า (หน้า ๑)
              </button>
              <button
                type="button"
                onClick={() => setActivePage('back')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activePage === 'back'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ด้านหลัง (หน้า ๒)
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-800/70 rounded-xl px-2 py-1 border border-slate-700 text-xs text-slate-300">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(70, prev - 10))}
                className="hover:text-white px-1 font-bold"
                title="ย่อ"
              >
                -
              </button>
              <span className="font-mono text-[11px]">{zoomScale}%</span>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(130, prev + 10))}
                className="hover:text-white px-1 font-bold"
                title="ขยาย"
              >
                +
              </button>
            </div>

            {/* Primary Download PDF Button */}
            <button
              type="button"
              onClick={handleExportPdf}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer"
              title="ดาวน์โหลดและสั่งพิมพ์ใบ ปพ.1 ตัวจริงรูปแบบ A4 สองหน้าครบถ้วน"
            >
              <span className="material-symbols-outlined text-[17px]">download</span>
              <span>ดาวน์โหลด PDF แบบใบจริง</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
              title="พิมพ์เอกสารออกเครื่องพิมพ์"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span className="hidden sm:inline">พิมพ์</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
              title="ปิดหน้าต่าง"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sub Banner for Authenticity Notice */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-200/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-[16px]">info</span>
            <span>
              แบบฟอร์มเอกสารมาตรฐาน ปพ.๑ : พ กระทรวงศึกษาธิการ ประกอบด้วย ตราครุฑพ่าห์ราชการ, ลายน้ำความปลอดภัย, กล่องเลข ๑๓ หลัก, และตราประทับรับรอง
            </span>
          </div>
          <div className="hidden sm:block text-[11px] font-mono text-slate-400">
            ชุดที่ {data.documentBookNo} เลขที่ {data.documentSheetNo}
          </div>
        </div>

        {/* Scrollable Viewport */}
        <div
          ref={printRef}
          className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-900/60 flex flex-col items-center gap-6"
        >
          <div
            style={{
              transform: `scale(${zoomScale / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
            }}
            className="flex flex-col gap-6 w-full max-w-[820px]"
          >
            {/* ================= PAGE 1 (FRONT / ด้านหน้า) ================= */}
            {(activePage === 'all' || activePage === 'front') && (
              <div className="bg-white rounded-sm shadow-2xl border border-slate-300 p-5 sm:p-7 relative font-['Sarabun',sans-serif] text-slate-900 overflow-hidden">
                {/* Official Security Border Frame (เขียว/น้ำตาลทอง ลายไทย) */}
                <div className="border-[3.5px] border-[#14532d] p-1.5 sm:p-2 bg-[#fffdfa] relative">
                  <div className="border border-[#166534] p-3 sm:p-5 relative">
                    {/* Corner Rosettes / Borders */}
                    <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-[3px] border-l-[3px] border-[#14532d]" />
                    <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-[3px] border-r-[3px] border-[#14532d]" />
                    <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-[3px] border-l-[3px] border-[#14532d]" />
                    <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-[3px] border-r-[3px] border-[#14532d]" />

                    {/* Garuda Watermark Layer */}
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: OFFICIAL_GARUDA_SVG }}
                    />

                    {/* Top Row (Student ID left, Form code & 13-digit ID right) */}
                    <div className="flex justify-between items-start mb-2 relative z-10 text-[11px]">
                      <div className="text-slate-700">
                        เลขประจำตัวนักเรียน:{' '}
                        <span className="font-mono font-bold text-slate-950 text-[12px]">
                          {data.studentId}
                        </span>{' '}
                        ({data.studentIdThai})
                      </div>
                      <div className="text-right">
                        <div className="font-black text-slate-950 text-sm">{data.documentCode}</div>
                        <div className="text-[10px] text-slate-600">
                          ชุดที่ {data.documentBookNo} &nbsp; เลขที่ {data.documentSheetNo}
                        </div>

                        {/* 13-digit Box */}
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <span className="text-[9.5px] font-semibold text-slate-600">เลขประจำตัวประชาชน:</span>
                          <div className="inline-flex items-center gap-0.5">
                            {idGroups.map((grp, gIdx) => (
                              <React.Fragment key={gIdx}>
                                <div className="inline-flex border-l border-slate-900">
                                  {grp.map((d, dIdx) => (
                                    <span
                                      key={dIdx}
                                      className="w-3.5 h-4 border border-l-0 border-slate-900 bg-white flex items-center justify-center font-mono font-bold text-[10px]"
                                    >
                                      {d}
                                    </span>
                                  ))}
                                </div>
                                {gIdx < idGroups.length - 1 && (
                                  <span className="text-slate-700 font-bold text-xs">-</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Garuda Crest and Title */}
                    <div className="text-center my-1 relative z-10">
                      <div
                        className="w-12 h-12 mx-auto mb-1"
                        dangerouslySetInnerHTML={{ __html: OFFICIAL_GARUDA_SVG }}
                      />
                      <h1 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight leading-snug">
                        {data.documentType}
                      </h1>
                      <div className="text-xs sm:text-sm font-bold text-slate-800">
                        ระดับมัธยมศึกษาตอนปลาย
                      </div>
                      <div className="text-[10px] font-bold text-slate-600 tracking-wider">
                        (TRANSCRIPT)
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1">
                        {data.schoolNameTh} ({data.schoolNameEn})
                      </div>
                      <p className="text-[10px] text-slate-600">
                        {data.schoolSubDistrict} {data.schoolDistrict} {data.schoolProvince} • {data.educationArea} • {data.ministryTh}
                      </p>
                    </div>

                    {/* Student Dossier Table */}
                    <div className="border border-slate-400 p-2 sm:p-3 my-2.5 bg-white rounded-xs relative z-10 flex gap-3 text-[11px] leading-relaxed">
                      <div className="flex-1 space-y-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-600">ชื่อ - ชื่อสกุล (ภาษาไทย): </span>
                            <span className="font-bold border-b border-dotted border-slate-600 pb-0.5">
                              {data.studentName}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600">Name - Surname: </span>
                            <span className="font-semibold border-b border-dotted border-slate-600 pb-0.5">
                              {data.studentEngName}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <div>
                            <span className="text-slate-600">เพศ: </span>
                            <span className="font-semibold">{data.gender}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">วัน เดือน ปีเกิด: </span>
                            <span className="font-bold">{data.birthDateTh}</span>
                            <span className="text-slate-500 text-[9.5px] ml-1">({data.birthDateEn})</span>
                          </div>
                          <div>
                            <span className="text-slate-600">สัญชาติ: </span>
                            <span>{data.nationality}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">เชื้อชาติ: </span>
                            <span>{data.ethnicity}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">ศาสนา: </span>
                            <span>{data.religion}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-600">ชื่อบิดา: </span>
                            <span className="font-medium border-b border-dotted border-slate-600">
                              {data.fatherName}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600">ชื่อมารดา: </span>
                            <span className="font-medium border-b border-dotted border-slate-600">
                              {data.motherName}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <div>
                            <span className="text-slate-600">วันเข้าเรียน: </span>
                            <span>{data.admissionDate}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">ชั้นที่เข้าเรียน: </span>
                            <span>{data.admissionGrade}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">แผนการเรียน: </span>
                            <span className="font-bold text-slate-900">{data.curriculumTrack}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-600">วันออกจากสถานศึกษา: </span>
                          <span className="font-semibold">{data.completionDate}</span>
                          <span className="text-slate-600 ml-3">เหตุผลที่ออก: </span>
                          <span className="text-[10px] text-slate-800">{data.completionReason}</span>
                        </div>
                      </div>

                      {/* Photo with Official Red Stamp */}
                      <div className="w-20 h-26 shrink-0 relative flex flex-col items-center">
                        <div className="w-full h-full border border-slate-400 p-0.5 rounded-xs bg-slate-100 overflow-hidden shadow-2xs">
                          {data.avatarUrl ? (
                            <img
                              src={data.avatarUrl}
                              alt="Student"
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-center text-[9px] text-slate-400">
                              รูปถ่ายนักเรียน<br />ขนาด ๑.๕ นิ้ว
                            </div>
                          )}
                        </div>
                        {/* Red Seal Stamp over photo corner */}
                        <div
                          className="absolute -bottom-3 -right-3 w-14 h-14 pointer-events-none opacity-85"
                          dangerouslySetInnerHTML={{ __html: OFFICIAL_SEAL_STAMP_SVG }}
                        />
                      </div>
                    </div>

                    {/* Semesters 1 to 4 Tables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2 relative z-10 text-[10px]">
                      {frontSemesters.map((sem, sIdx) => (
                        <div
                          key={sIdx}
                          className="border border-slate-300 rounded-xs bg-white overflow-hidden flex flex-col"
                        >
                          <div className="bg-slate-100/90 border-b border-slate-300 px-2 py-1 flex justify-between items-center font-bold text-slate-900 text-[10.5px]">
                            <span>{sem.semester}</span>
                            <span className="text-[9px] text-slate-600">{sem.semesterThYear}</span>
                          </div>
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[9.5px]">
                                <th className="py-1 px-1.5 w-[20%]">รหัสวิชา</th>
                                <th className="py-1 px-1.5 w-[56%]">รายวิชา</th>
                                <th className="py-1 px-1 text-center w-[12%]">นก.</th>
                                <th className="py-1 px-1 text-center w-[12%]">เกรด</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sem.courses.map((c, cIdx) => (
                                <tr
                                  key={cIdx}
                                  className="border-b border-slate-100 last:border-none hover:bg-slate-50/50"
                                >
                                  <td className="py-0.5 px-1.5 font-mono text-[9px] text-slate-700">
                                    {c.code}
                                  </td>
                                  <td className="py-0.5 px-1.5 truncate max-w-[150px]">{c.name}</td>
                                  <td className="py-0.5 px-1 text-center font-mono">
                                    {c.credit.toFixed(1)}
                                  </td>
                                  <td className="py-0.5 px-1 text-center font-mono font-bold text-slate-950">
                                    {c.grade}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50 border-t border-slate-300 font-bold text-[9px]">
                                <td colSpan={2} className="py-1 px-1.5 text-right text-slate-600">
                                  รวมหน่วยกิต / ผลการเรียนเฉลี่ย:
                                </td>
                                <td className="py-1 px-1 text-center font-mono">
                                  {sem.courses.reduce((sum, item) => sum + item.credit, 0).toFixed(1)}
                                </td>
                                <td className="py-1 px-1 text-center font-mono text-emerald-800 font-bold">
                                  4.00
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ))}
                    </div>

                    {/* Page 1 Bottom Footer */}
                    <div className="border-t border-dashed border-slate-400 pt-1.5 mt-2 flex justify-between items-center text-[9px] text-slate-500 relative z-10">
                      <div>
                        แบบ ปพ.๑ : พ (ด้านหน้า) • เลขที่เอกสาร {data.documentNo}
                      </div>
                      <div className="font-semibold text-slate-700">
                        (ดูผลการเรียนต่อหน้าที่ ๒ ด้านหลัง) ➔ หน้า ๑ / ๒
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= PAGE 2 (BACK / ด้านหลัง) ================= */}
            {(activePage === 'all' || activePage === 'back') && (
              <div className="bg-white rounded-sm shadow-2xl border border-slate-300 p-5 sm:p-7 relative font-['Sarabun',sans-serif] text-slate-900 overflow-hidden">
                <div className="border-[3.5px] border-[#14532d] p-1.5 sm:p-2 bg-[#fffdfa] relative">
                  <div className="border border-[#166534] p-3 sm:p-5 relative">
                    <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-[3px] border-l-[3px] border-[#14532d]" />
                    <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-[3px] border-r-[3px] border-[#14532d]" />
                    <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-[3px] border-l-[3px] border-[#14532d]" />
                    <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-[3px] border-r-[3px] border-[#14532d]" />

                    {/* Subtle Watermark */}
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: OFFICIAL_GARUDA_SVG }}
                    />

                    {/* Header of Page 2 */}
                    <div className="flex justify-between items-center pb-2 border-b-2 border-slate-900 mb-3 relative z-10">
                      <div>
                        <div className="text-sm font-black text-slate-950">
                          ระเบียนแสดงผลการเรียน แบบ ปพ.๑ : พ (ด้านหลัง)
                        </div>
                        <div className="text-[10px] text-slate-600">
                          หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน ระดับมัธยมศึกษาตอนปลาย
                        </div>
                      </div>
                      <div className="text-right text-[11px]">
                        <div>
                          เลขประจำตัวนักเรียน:{' '}
                          <span className="font-mono font-bold text-slate-900">{data.studentId}</span>
                        </div>
                        <div className="font-bold text-slate-900">{data.studentName}</div>
                      </div>
                    </div>

                    {/* Senior Year Semesters (5 and 6) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 relative z-10 text-[10px]">
                      {backSemesters.map((sem, sIdx) => (
                        <div
                          key={sIdx}
                          className="border border-slate-300 rounded-xs bg-white overflow-hidden flex flex-col"
                        >
                          <div className="bg-slate-100/90 border-b border-slate-300 px-2 py-1 flex justify-between items-center font-bold text-slate-900 text-[10.5px]">
                            <span>{sem.semester}</span>
                            <span className="text-[9px] text-slate-600">{sem.semesterThYear}</span>
                          </div>
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[9.5px]">
                                <th className="py-1 px-1.5 w-[20%]">รหัสวิชา</th>
                                <th className="py-1 px-1.5 w-[56%]">รายวิชา</th>
                                <th className="py-1 px-1 text-center w-[12%]">นก.</th>
                                <th className="py-1 px-1 text-center w-[12%]">เกรด</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sem.courses.map((c, cIdx) => (
                                <tr
                                  key={cIdx}
                                  className="border-b border-slate-100 last:border-none hover:bg-slate-50/50"
                                >
                                  <td className="py-0.5 px-1.5 font-mono text-[9px] text-slate-700">
                                    {c.code}
                                  </td>
                                  <td className="py-0.5 px-1.5 truncate max-w-[150px]">{c.name}</td>
                                  <td className="py-0.5 px-1 text-center font-mono">
                                    {c.credit.toFixed(1)}
                                  </td>
                                  <td className="py-0.5 px-1 text-center font-mono font-bold text-slate-950">
                                    {c.grade}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50 border-t border-slate-300 font-bold text-[9px]">
                                <td colSpan={2} className="py-1 px-1.5 text-right text-slate-600">
                                  รวมหน่วยกิต / ผลการเรียนเฉลี่ย:
                                </td>
                                <td className="py-1 px-1 text-center font-mono">
                                  {sem.courses.reduce((sum, item) => sum + item.credit, 0).toFixed(1)}
                                </td>
                                <td className="py-1 px-1 text-center font-mono text-emerald-800 font-bold">
                                  4.00
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ))}
                    </div>

                    {/* Summary of 8 Learning Areas Table */}
                    <div className="mb-3 relative z-10">
                      <div className="text-xs font-bold text-slate-900 mb-1">
                        สรุปผลสัมฤทธิ์ทางการเรียนตามกลุ่มสาระการเรียนรู้ (๘ กลุ่มสาระ)
                      </div>
                      <table className="w-full text-left border-collapse border border-slate-300 text-[10px] bg-white">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-center font-bold">
                            <th className="py-1 px-2 border-r border-slate-300 w-[6%]">ที่</th>
                            <th className="py-1 px-2 border-r border-slate-300 w-[44%] text-left">
                              กลุ่มสาระการเรียนรู้
                            </th>
                            <th className="py-1 px-2 border-r border-slate-300 w-[14%]">หน่วยกิตพื้นฐาน</th>
                            <th className="py-1 px-2 border-r border-slate-300 w-[14%]">หน่วยกิตเพิ่มเติม</th>
                            <th className="py-1 px-2 border-r border-slate-300 w-[11%]">รวมหน่วยกิต</th>
                            <th className="py-1 px-2 w-[11%]">ผลการเรียนเฉลี่ย</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.learningAreas.map((la, idx) => (
                            <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                              <td className="py-0.5 px-2 text-center border-r border-slate-200">
                                {toThaiNumerals(la.no)}
                              </td>
                              <td className="py-0.5 px-2 font-medium border-r border-slate-200">
                                {la.name}
                              </td>
                              <td className="py-0.5 px-2 text-center font-mono border-r border-slate-200">
                                {la.basicCredit.toFixed(1)}
                              </td>
                              <td className="py-0.5 px-2 text-center font-mono border-r border-slate-200">
                                {la.additionalCredit.toFixed(1)}
                              </td>
                              <td className="py-0.5 px-2 text-center font-mono font-bold border-r border-slate-200">
                                {la.totalCredit.toFixed(1)}
                              </td>
                              <td className="py-0.5 px-2 text-center font-mono font-bold text-slate-950">
                                {la.gpa}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold text-[10px]">
                            <td colSpan={2} className="py-1 px-2 text-center text-slate-800">
                              รวมตลอดหลักสูตร
                            </td>
                            <td className="py-1 px-2 text-center font-mono border-r border-slate-300">
                              {data.totalBasicCredits.toFixed(1)}
                            </td>
                            <td className="py-1 px-2 text-center font-mono border-r border-slate-300">
                              {data.totalAdditionalCredits.toFixed(1)}
                            </td>
                            <td className="py-1 px-2 text-center font-mono font-black text-blue-900 border-r border-slate-300 text-xs">
                              {data.totalCredits.toFixed(1)}
                            </td>
                            <td className="py-1 px-2 text-center font-mono font-black text-blue-950 text-xs">
                              {data.gpax}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Evaluations (3 blocks: Activities, Character, Analytical) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3 relative z-10 text-[9.5px]">
                      <div className="border border-slate-300 rounded p-2 bg-white">
                        <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1">
                          ๑. กิจกรรมพัฒนาผู้เรียน
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between">
                            <span>- แนะแนว:</span>
                            <span className="font-bold text-emerald-700">✓ {data.activityGuidance}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>- กิจกรรมนักเรียน (รด./ชุมนุม):</span>
                            <span className="font-bold text-emerald-700">✓ {data.activityStudent}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>- เพื่อสังคมและสาธารณประโยชน์:</span>
                            <span className="font-bold text-emerald-700">✓ {data.activitySocial}</span>
                          </div>
                        </div>
                        <div className="mt-1 pt-1 border-t border-dashed border-slate-200 text-[8.5px] font-bold text-emerald-800">
                          สรุป: ผ่านเกณฑ์การตัดสิน
                        </div>
                      </div>

                      <div className="border border-slate-300 rounded p-2 bg-white">
                        <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1">
                          ๒. คุณลักษณะอันพึงประสงค์
                        </div>
                        <div className="text-[8.5px] text-slate-500">ประเมินตามเกณฑ์ ๘ ประการ</div>
                        <div className="text-xs font-bold text-emerald-800 my-1.5">
                          ✓ ผ่านระดับ {data.moralityAssessment}
                        </div>
                        <div className="text-[7.5px] text-slate-400">(๓: ดีเยี่ยม, ๒: ดี, ๑: ผ่าน, ๐: ไม่ผ่าน)</div>
                      </div>

                      <div className="border border-slate-300 rounded p-2 bg-white">
                        <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1">
                          ๓. การอ่าน คิดวิเคราะห์ และเขียน
                        </div>
                        <div className="text-[8.5px] text-slate-500">ประเมินทักษะการสื่อสารและความคิด</div>
                        <div className="text-xs font-bold text-emerald-800 my-1.5">
                          ✓ ผ่านระดับ {data.analyticalAssessment}
                        </div>
                        <div className="text-[7.5px] text-slate-400">(๓: ดีเยี่ยม, ๒: ดี, ๑: ผ่าน, ๐: ไม่ผ่าน)</div>
                      </div>
                    </div>

                    {/* Graduation Decision Banner */}
                    <div className="border-2 border-blue-900 bg-blue-50/80 rounded p-2.5 mb-3 flex items-center justify-between relative z-10">
                      <div>
                        <div className="text-xs font-black text-blue-950">
                          ✓ ได้รับการตัดสินให้สำเร็จการศึกษาชั้นมัธยมศึกษาปีที่ ๖
                        </div>
                        <div className="text-[10px] text-blue-800 mt-0.5">
                          ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช ๒๕๕๑ (ฉบับปรับปรุง ๒๕๖๐) • {data.honors}
                        </div>
                      </div>
                      <div className="text-right pl-3 border-l border-blue-200">
                        <div className="text-[9px] font-bold text-blue-900">เกรดเฉลี่ยสะสม (GPAX)</div>
                        <div className="text-xl font-black font-mono text-blue-950 leading-tight">
                          {data.gpax}{' '}
                          <span className="text-xs font-serif font-bold text-blue-800">
                            ({data.gpaxThai})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Official Signatures & Official Stamp */}
                    <div className="border-t border-slate-300 pt-3 mt-3 grid grid-cols-3 gap-3 items-end text-center relative z-10 text-[10px]">
                      {/* QR Verification */}
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border border-slate-300 p-0.5 rounded bg-white shadow-2xs">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://school-nexus.internal/verify/transcript/${data.studentId}`}
                            alt="Verify QR"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-[8.5px] text-slate-500 mt-1 font-mono">
                          สแกนตรวจสอบ e-Transcript
                        </span>
                        <span className="text-[7.5px] text-slate-400 font-mono">
                          HASH: 8F2A-91C4-SN26
                        </span>
                      </div>

                      {/* Registrar */}
                      <div className="space-y-1">
                        <div className="font-serif italic text-sm font-bold text-slate-800 h-7 flex items-end justify-center">
                          {data.registrarName}
                        </div>
                        <div className="border-t border-dotted border-slate-500 pt-1">
                          <p className="font-bold text-slate-950">({data.registrarName})</p>
                          <p className="text-[9px] text-slate-500">นายทะเบียน / ผู้ตรวจทาน</p>
                          <p className="text-[8px] text-slate-400">วันที่ {data.issueDateThai}</p>
                        </div>
                      </div>

                      {/* Director & Official Seal Stamp */}
                      <div className="space-y-1 relative">
                        {/* Red Seal Stamp */}
                        <div
                          className="absolute -top-10 right-2 w-20 h-20 pointer-events-none opacity-90 rotate-[-10deg]"
                          dangerouslySetInnerHTML={{ __html: OFFICIAL_SEAL_STAMP_SVG }}
                        />

                        <div className="font-serif italic text-sm font-bold text-slate-800 h-7 flex items-end justify-center">
                          {data.directorName}
                        </div>
                        <div className="border-t border-dotted border-slate-500 pt-1">
                          <p className="font-bold text-slate-950">({data.directorName})</p>
                          <p className="text-[9px] text-slate-500">ผู้อำนวยการสถานศึกษา</p>
                          <p className="text-[8px] text-slate-400">วันที่ {data.issueDateThai}</p>
                        </div>
                      </div>
                    </div>

                    {/* Page 2 Bottom Note */}
                    <div className="border-t border-dashed border-slate-400 pt-1.5 mt-3 flex justify-between items-center text-[9px] text-slate-500 relative z-10">
                      <div>
                        แบบ ปพ.๑ : พ (ด้านหลัง) • ขอรับรองว่าระเบียนแสดงผลการเรียนนี้ถูกต้องตรงตามหลักฐานของสถานศึกษา
                      </div>
                      <div className="font-semibold text-slate-700">หน้า ๒ / ๒</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
