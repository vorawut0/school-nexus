import React, { useState, useEffect } from 'react';
import { UserProfile, Assignment } from '../../types';
import { pushRealtimeNotification, updateAssignmentInFirestore } from '../../services/firebaseService';

interface StudentSubmission {
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
  status: 'pending' | 'graded';
  feedback?: string;
}

interface TeacherGradingViewProps {
  user: UserProfile;
  assignments?: Assignment[];
  onGradeAssignment?: (assignmentId: string, score: number, feedback: string) => void;
}

export const TeacherGradingView: React.FC<TeacherGradingViewProps> = ({
  user,
  assignments = [],
  onGradeAssignment,
}) => {
  const [selectedTab, setSelectedTab] = useState<'pending' | 'graded'>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [inputScore, setInputScore] = useState<string>('');
  const [inputFeedback, setInputFeedback] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<StudentSubmission[]>([
    {
      id: 'sub-1',
      assignmentId: 'asg-1',
      studentName: 'Vorawut Phetrai',
      thaiName: 'วรวุฒิ เพ็ชรระยา',
      studentId: '66041001',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
      assignmentTitle: 'โครงงานโมเดล Deep Learning จำแนกภาพ CNN',
      subject: 'ว33281 AI & Robotics (ม.6/1)',
      submittedDate: 'วันนี้ 09:12 น.',
      fileAttachment: 'cnn_image_classification_model.zip',
      maxScore: 20,
      status: 'pending',
    },
    {
      id: 'sub-2',
      assignmentId: 'asg-2',
      studentName: 'Natthaphon Siriphan',
      thaiName: 'ณัฐพล ศิริพันธ์ (กันต์)',
      studentId: '66040188',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      assignmentTitle: 'โครงงานโมเดล Deep Learning จำแนกภาพ CNN',
      subject: 'ว33281 AI & Robotics (ม.6/1)',
      submittedDate: 'วันนี้ 07:15 น.',
      fileAttachment: 'natthaphon_cnn_model.zip',
      maxScore: 20,
      status: 'pending',
    },
    {
      id: 'sub-3',
      assignmentId: 'asg-3',
      studentName: 'Chatchai Phromsiri',
      thaiName: 'ฉัตรชัย พรหมศิริ',
      studentId: '66040233',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      assignmentTitle: 'แล็บการเขียนโปรแกรม REST API ด้วย Python FastAPI',
      subject: 'ว33282 Web Development (ม.6/2)',
      submittedDate: '17 ส.ค. 18:20 น.',
      fileAttachment: 'fastapi_school_service.py',
      maxScore: 15,
      currentScore: 14,
      status: 'graded',
      feedback: 'โค้ดมีโครงสร้างสะอาด มีเอกสาร OpenAPI สวยงามและจัดการ Exception ได้ดีมาก',
    },
  ]);

  // Merge real student assignments into teacher submissions queue
  useEffect(() => {
    if (assignments && assignments.length > 0) {
      const studentSubmitted = assignments.filter((a) => a.status === 'submitted');
      if (studentSubmitted.length > 0) {
        setSubmissions((prev) => {
          const updated = [...prev];
          studentSubmitted.forEach((as) => {
            const existingIdx = updated.findIndex((s) => s.assignmentId === as.id || s.id === as.id);
            const isAlreadyGraded = typeof as.currentScore === 'number';
            const item: StudentSubmission = {
              id: as.id,
              assignmentId: as.id,
              studentName: 'Vorawut Phetrai',
              thaiName: 'วรวุฒิ เพ็ชรระยา',
              studentId: '66041001',
              avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
              assignmentTitle: as.title,
              subject: as.subject,
              submittedDate: as.submittedAt || 'เมื่อสักครู่',
              fileAttachment: as.attachments && as.attachments.length > 0 ? as.attachments[0].name : 'assignment_submission.pdf',
              maxScore: as.maxScore || 20,
              currentScore: typeof as.currentScore === 'number' ? as.currentScore : undefined,
              status: isAlreadyGraded ? 'graded' : 'pending',
              feedback: as.submissionNotes,
            };

            if (existingIdx >= 0) {
              updated[existingIdx] = { ...updated[existingIdx], ...item };
            } else {
              updated.unshift(item);
            }
          });
          return updated;
        });
      }
    }
  }, [assignments]);

  const handleOpenGradeModal = (sub: StudentSubmission) => {
    setSelectedSubmission(sub);
    setInputScore(sub.currentScore !== undefined ? String(sub.currentScore) : '');
    setInputFeedback(sub.feedback || '');
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;
    const scoreNum = parseFloat(inputScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > selectedSubmission.maxScore) {
      alert(`กรุณากรอกคะแนนระหว่าง 0 ถึง ${selectedSubmission.maxScore}`);
      return;
    }

    // 1. Update local submissions list
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === selectedSubmission.id
          ? {
              ...s,
              currentScore: scoreNum,
              feedback: inputFeedback,
              status: 'graded',
            }
          : s
      )
    );

    // 2. Update Firestore assignment if mapped
    if (selectedSubmission.assignmentId) {
      updateAssignmentInFirestore(selectedSubmission.assignmentId, {
        currentScore: scoreNum,
        status: 'submitted',
      });
    }

    if (onGradeAssignment && selectedSubmission.assignmentId) {
      onGradeAssignment(selectedSubmission.assignmentId, scoreNum, inputFeedback);
    }

    // 3. Push Real-time Cross-Role Notifications
    // Notification for STUDENT:
    await pushRealtimeNotification({
      title: '🎉 อาจารย์ตรวจผลงานและให้คะแนนแล้ว!',
      message: `วิชา ${selectedSubmission.subject}: ได้รับคะแนน ${scoreNum}/${selectedSubmission.maxScore} ในงาน "${selectedSubmission.assignmentTitle}"${inputFeedback ? ` (ข้อคิดเห็น: "${inputFeedback}")` : ''}`,
      type: 'grade',
      priority: 'high',
      role: 'student',
      icon: 'military_tech',
    });

    // Notification for PARENT:
    await pushRealtimeNotification({
      title: '📊 แจ้งเตือนผลการเรียนบุตรหลาน',
      message: `บุตรหลาน (${selectedSubmission.thaiName}) ได้รับการประเมินคะแนน ${scoreNum}/${selectedSubmission.maxScore} ในวิชา ${selectedSubmission.subject}`,
      type: 'grade',
      priority: 'normal',
      role: 'parent',
      icon: 'school',
    });

    setToastMessage(`บันทึกคะแนน ${selectedSubmission.thaiName} (${scoreNum}/${selectedSubmission.maxScore}) และส่งการแจ้งเตือนสดสำเร็จ!`);
    setTimeout(() => setToastMessage(null), 3000);
    setSelectedSubmission(null);
  };

  const pendingList = submissions.filter((s) => s.status === 'pending');
  const gradedList = submissions.filter((s) => s.status === 'graded');

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 pb-28 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#121b2e] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-emerald-400/40 animate-slideDown">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121b2e] via-[#1a2b50] to-[#1550d3] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700/50 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-400/30 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">rate_review</span>
              <span>ระบบตรวจการบ้าน & ซิงค์คะแนนเรียลไทม์ (Live Connected Grading)</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ตรวจงานนักเรียน & มอบหมายงาน
          </h1>
          <p className="text-sm text-slate-300">
            เมื่อตรวจและบันทึกคะแนน ระบบจะส่งแจ้งเตือนเรียลไทม์ถึงนักเรียนและผู้ปกครองทันที
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
          <div className="text-center px-3">
            <div className="text-2xl font-black font-mono text-amber-300">{pendingList.length}</div>
            <div className="text-[11px] text-blue-200">รอตรวจ</div>
          </div>
          <div className="text-center px-3 border-l border-white/10">
            <div className="text-2xl font-black font-mono text-[#67fcc6]">{gradedList.length}</div>
            <div className="text-[11px] text-blue-200">ตรวจแล้ว</div>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setSelectedTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            selectedTab === 'pending'
              ? 'bg-[#1550d3] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>งานรอตรวจ</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono text-[10px] font-extrabold">
            {pendingList.length}
          </span>
        </button>
        <button
          onClick={() => setSelectedTab('graded')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            selectedTab === 'graded'
              ? 'bg-[#1550d3] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>ตรวจแล้ว</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px]">
            {gradedList.length}
          </span>
        </button>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {(selectedTab === 'pending' ? pendingList : gradedList).map((sub) => (
          <div
            key={sub.id}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
          >
            <div className="flex items-start gap-4">
              <img
                src={sub.avatar}
                alt={sub.studentName}
                className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#1550d3] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {sub.subject}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{sub.submittedDate}</span>
                </div>
                <h3 className="font-bold text-base text-[#121b2e] leading-snug">
                  {sub.assignmentTitle}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <span>ผู้ส่ง: <b className="text-slate-900">{sub.thaiName}</b> ({sub.studentId})</span>
                  <span>•</span>
                  <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">attach_file</span>
                    {sub.fileAttachment}
                  </span>
                </div>

                {sub.feedback && (
                  <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 mt-2">
                    <b className="text-blue-700">ข้อเสนอแนะอาจารย์:</b> {sub.feedback}
                  </div>
                )}
              </div>
            </div>

            {/* Score & Action Button */}
            <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold">คะแนน</div>
                <div className="text-xl font-black font-mono text-slate-900">
                  {sub.currentScore !== undefined ? (
                    <span className="text-emerald-600">
                      {sub.currentScore} <span className="text-xs text-slate-400">/ {sub.maxScore}</span>
                    </span>
                  ) : (
                    <span className="text-amber-500">
                      รอตรวจ <span className="text-xs text-slate-400">/ {sub.maxScore}</span>
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleOpenGradeModal(sub)}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98 ${
                  sub.status === 'pending'
                    ? 'bg-[#1550d3] hover:bg-[#1a53d6] text-white shadow-blue-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                <span>{sub.status === 'pending' ? 'ตรวจและให้คะแนน' : 'แก้ไขคะแนน'}</span>
              </button>
            </div>
          </div>
        ))}

        {(selectedTab === 'pending' ? pendingList : gradedList).length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">task_alt</span>
            <h4 className="font-bold text-slate-700">ไม่มีรายการในหมวดหมู่นี้</h4>
            <p className="text-xs text-slate-400 mt-1">ทุกผลงานได้รับการตรวจสอบเรียบร้อยแล้ว</p>
          </div>
        )}
      </div>

      {/* Grading Modal */}
      {selectedSubmission && (
        <div
          onClick={() => setSelectedSubmission(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 animate-scaleIn border border-slate-100"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1550d3]">grading</span>
                <h3 className="font-bold text-base text-slate-900">ตรวจให้คะแนนผลงานนักเรียน</h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedSubmission.assignmentTitle}</div>
              <div className="text-slate-600">
                นักเรียน: <b>{selectedSubmission.thaiName}</b> ({selectedSubmission.studentId})
              </div>
              <div className="font-mono text-blue-600">ไฟล์แนบ: {selectedSubmission.fileAttachment}</div>
            </div>

            {/* Score Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                คะแนนที่ได้ (เต็ม {selectedSubmission.maxScore} คะแนน)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={selectedSubmission.maxScore}
                  step="0.5"
                  value={inputScore}
                  onChange={(e) => setInputScore(e.target.value)}
                  placeholder={`0 - ${selectedSubmission.maxScore}`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-base font-bold text-slate-900 focus:outline-none focus:border-[#1550d3]"
                />
                <button
                  type="button"
                  onClick={() => setInputScore(String(selectedSubmission.maxScore))}
                  className="px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 cursor-pointer"
                >
                  เต็ม ({selectedSubmission.maxScore})
                </button>
              </div>
            </div>

            {/* Feedback Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ความคิดเห็นและข้อเสนอแนะสำหรับนักเรียน (Feedback)
              </label>
              <textarea
                rows={3}
                value={inputFeedback}
                onChange={(e) => setInputFeedback(e.target.value)}
                placeholder="เขียนคำชม ข้อปรับปรุง หรือสิ่งที่ควรศึกษาเพิ่มเติม..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1550d3]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveGrade}
                className="px-6 py-2.5 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] text-white font-bold text-xs shadow-md active:scale-98 transition-all cursor-pointer"
              >
                บันทึกคะแนน & ซิงค์แจ้งเตือน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
