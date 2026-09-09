import React, { useRef } from 'react';
import { UserProfile } from '../../types';

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
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentName = user.thaiName || 'นายวรวุฒิ เพ็ชรราย';
  const studentEngName = user.name || 'Mr. Vorawut Phetrai';
  const studentId = user.studentId || '66041001';
  const nationalId = '1-1004-99881-22-3';
  const birthDate = '17 มีนาคม 2551';
  const admissionDate = '16 พฤษภาคม 2564';
  const completionDate = '31 มีนาคม 2567';
  const gpa = (user.gpa || 3.92).toFixed(2);

  const academicRecords = [
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Container */}
      <div className="bg-white rounded-[24px] max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-300 flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none my-auto">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-4 bg-[#121b2e] text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-400 text-[26px]">
              school
            </span>
            <div>
              <h2 className="text-base font-bold">
                แบบระเบียนแสดงผลการเรียนทางการ (ปพ.1 / Official Academic Transcript)
              </h2>
              <p className="text-xs text-slate-300">
                เอกสารรับรองคุณวุฒิทางการศึกษา • โรงเรียนสาธิตนวัตกรรมดิจิทัล School Nexus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>พิมพ์ / บันทึก PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="ปิด"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-slate-50 print:bg-white print:p-4 print:overflow-visible" ref={printRef}>
          <div className="bg-white p-8 sm:p-12 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 max-w-[800px] mx-auto text-slate-900 font-serif">
            {/* Ministry / School Header */}
            <div className="text-center relative pb-6 border-b-2 border-slate-900">
              {/* Garuda / School Emblem */}
              <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center rounded-full bg-slate-100 border border-slate-400">
                <span className="material-symbols-outlined text-slate-800 text-[36px]">
                  account_balance
                </span>
              </div>
              <div className="absolute right-0 top-0 text-right text-[11px] font-sans font-semibold">
                <div>แบบ ปพ.1 : พ</div>
                <div className="text-slate-500 text-[10px]">เลขที่เอกสาร SN-66/041001-A</div>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 font-sans">
                ระเบียนแสดงผลการเรียนหลักสูตรการศึกษาขั้นพื้นฐาน (ปพ.1)
              </h1>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 mt-1 font-sans">
                โรงเรียนสาธิตนวัตกรรมดิจิทัล School Nexus (Smart Campus Academy)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 font-sans">
                สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน กระทรวงศึกษาธิการ
              </p>
            </div>

            {/* Student Info Card */}
            <div className="grid grid-cols-4 gap-4 py-5 border-b border-slate-300 text-xs sm:text-sm font-sans">
              <div className="col-span-3 space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">ชื่อ - นามสกุล: </span>
                    <span className="font-bold">{studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Name: </span>
                    <span className="font-semibold">{studentEngName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">เลขประจำตัวนักเรียน: </span>
                    <span className="font-mono font-bold">{studentId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">เลขประจำตัวประชาชน: </span>
                    <span className="font-mono font-semibold">{nationalId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">วัน/เดือน/ปีเกิด: </span>
                    <span>{birthDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">แผนการเรียน: </span>
                    <span className="font-semibold">วิทยาศาสตร์ - ปัญญาประดิษฐ์และเทคโนโลยี</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 text-xs">
                  <div>
                    <span>เข้าเรียนเมื่อ: {admissionDate}</span>
                  </div>
                  <div>
                    <span>คาดว่าจะสำเร็จการศึกษา: {completionDate}</span>
                  </div>
                </div>
              </div>

              {/* Student Photo */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="w-24 h-28 border-2 border-slate-400 p-0.5 rounded shadow-2xs overflow-hidden bg-slate-100 flex items-center justify-center">
                  <img
                    src={user.avatar}
                    alt="Student Photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">ตราประทับดิจิทัล</span>
              </div>
            </div>

            {/* Academic Grade Breakdown */}
            <div className="py-4 space-y-4">
              <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <span>ผลสัมฤทธิ์ทางการเรียนตลอดหลักสูตร (Academic Records)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                {academicRecords.map((sem, sIdx) => (
                  <div key={sIdx} className="border border-slate-300 rounded p-2.5 bg-slate-50/50">
                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5 flex justify-between items-center text-[11px]">
                      <span>{sem.semester}</span>
                      <span className="text-[10px] text-slate-500 font-mono">ภาคปกติ</span>
                    </div>

                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] text-slate-500 border-b border-slate-200">
                          <th className="py-0.5 font-semibold">รหัสวิชา</th>
                          <th className="py-0.5 font-semibold">ชื่อรายวิชา</th>
                          <th className="py-0.5 text-center font-semibold">นก.</th>
                          <th className="py-0.5 text-center font-semibold">เกรด</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.courses.map((c, cIdx) => (
                          <tr key={cIdx} className="border-b border-slate-100/60 last:border-none">
                            <td className="py-0.5 font-mono text-[10.5px]">{c.code}</td>
                            <td className="py-0.5 truncate max-w-[180px]">{c.name}</td>
                            <td className="py-0.5 text-center font-mono">{c.credit.toFixed(1)}</td>
                            <td className="py-0.5 text-center font-mono font-bold text-slate-950">
                              {c.grade}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Evaluation & Characteristics */}
            <div className="border border-slate-900 rounded p-3 my-4 grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans text-xs bg-slate-50/70">
              <div className="border-r border-slate-300 pr-3">
                <span className="text-slate-500 block text-[11px]">หน่วยกิตสะสมรวม (Credits):</span>
                <span className="font-mono font-black text-lg text-slate-900">84.5 หน่วยกิต</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">ครบตามโครงสร้างหลักสูตร</span>
              </div>

              <div className="border-r border-slate-300 pr-3">
                <span className="text-slate-500 block text-[11px]">ผลการประเมินคุณลักษณะ:</span>
                <span className="font-bold text-sm text-emerald-800 flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                  ผ่านระดับดีเยี่ยม (Excellent)
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">กิจกรรมพัฒนาผู้เรียน: ผ่านครบ</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">เกรดเฉลี่ยสะสมตลอดหลักสูตร (GPAX):</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-black text-2xl text-blue-900">{gpa}</span>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                    เกียรตินิยมอันดับ 1
                  </span>
                </div>
              </div>
            </div>

            {/* Official Signatures & Verification QR */}
            <div className="pt-6 mt-4 border-t border-slate-300 grid grid-cols-3 gap-4 font-sans text-xs text-center items-end">
              {/* QR Verification Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-slate-100 border border-slate-400 p-1 rounded flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://school-nexus.internal/verify/transcript/${studentId}`}
                    alt="Official Verification QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[9px] text-slate-500 mt-1 font-mono">
                  สแกนตรวจสอบเอกสารจริง
                </span>
                <span className="text-[8px] text-slate-400 font-mono">
                  HASH: 8F2A-91C4-SN26
                </span>
              </div>

              {/* Registrar Signature */}
              <div className="space-y-1">
                <div className="font-serif italic text-sm text-slate-700 h-8 flex items-end justify-center font-bold">
                  กนกวรรณ จันทร์ประเสริฐ
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-slate-900">(นางกนกวรรณ จันทร์ประเสริฐ)</p>
                  <p className="text-[11px] text-slate-500">นายทะเบียนโรงเรียน</p>
                </div>
              </div>

              {/* Director Signature with Official Stamp */}
              <div className="space-y-1 relative">
                {/* Simulated Red Official Stamp */}
                <div className="absolute right-4 -top-8 w-20 h-20 rounded-full border-2 border-rose-600/40 text-rose-600/50 flex items-center justify-center text-[9px] font-bold rotate-[-15deg] pointer-events-none uppercase">
                  School Nexus
                  <br />
                  Official Seal
                </div>

                <div className="font-serif italic text-sm text-slate-700 h-8 flex items-end justify-center font-bold">
                  สมเกียรติ สว่างอารมณ์
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-slate-900">(ดร.สมเกียรติ สว่างอารมณ์)</p>
                  <p className="text-[11px] text-slate-500">ผู้อำนวยการโรงเรียนสาธิตนวัตกรรมดิจิทัล</p>
                  <p className="text-[10px] text-slate-400">วันที่ออกเอกสาร: {new Date().toLocaleDateString('th-TH')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
