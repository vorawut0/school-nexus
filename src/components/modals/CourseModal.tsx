import React, { useState, useEffect } from 'react';
import { Course, Lesson } from '../../types';

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
  onUpdateProgress: (courseId: string, newProgress: number) => void;
  onOpenAITutor?: (course: Course) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  course,
  onClose,
  onUpdateProgress,
  onOpenAITutor,
}) => {
  const [lessons, setLessons] = useState<Lesson[]>(course?.lessons || []);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(course?.lessons?.[0] || null);
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'resources'>('content');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [downloadedRes, setDownloadedRes] = useState<string | null>(null);

  useEffect(() => {
    if (course) {
      setLessons(course.lessons);
      setActiveLesson(course.lessons[0] || null);
      setSelectedAnswer(null);
      setQuizSubmitted(false);
      setDownloadedRes(null);
    }
  }, [course]);

  if (!course || !activeLesson) return null;

  const toggleLessonComplete = (lessonId: string) => {
    const updated = lessons.map((l) =>
      l.id === lessonId ? { ...l, completed: !l.completed } : l
    );
    setLessons(updated);
    const completedCount = updated.filter((l) => l.completed).length;
    const progress = Math.round((completedCount / updated.length) * 100);
    onUpdateProgress(course.id, progress);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Modal Header */}
        <div
          className="p-5 sm:p-6 text-white relative flex justify-between items-start"
          style={{ backgroundColor: course.color }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <span className="material-symbols-outlined text-[28px]">{course.icon}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase opacity-80">
                {course.code} • {course.room}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold">{course.thaiTitle}</h2>
              <p className="text-xs text-white/80">{course.instructor}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAITutor && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAITutor(course);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
                title="เปิด AI Tutor สำหรับวิชานี้"
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span>ถาม AI Tutor</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/20 text-white hover:bg-black/30 flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-5 pt-3 gap-6 bg-[#f9f9ff]">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'content'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            บทเรียน ({lessons.filter((l) => l.completed).length}/{lessons.length})
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'quiz'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            แบบทดสอบเก็บคะแนน
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'resources'
                ? 'border-[#1550d3] text-[#1550d3]'
                : 'border-transparent text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            เอกสารประกอบการสอน
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {activeTab === 'content' && (
            <div className="flex flex-col gap-4">
              {/* Simulated Video Player */}
              <div className="w-full aspect-video bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col justify-between p-4 text-white shadow-inner">
                <div className="flex justify-between items-center z-10">
                  <span className="bg-black/60 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
                    {activeLesson.title}
                  </span>
                  <span className="text-xs bg-[#1550d3] px-2.5 py-0.5 rounded-full font-bold">
                    HD 1080p
                  </span>
                </div>

                <div className="flex items-center justify-center">
                  <button className="w-16 h-16 rounded-full bg-[#1550d3]/90 hover:bg-[#1550d3] flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer">
                    <span className="material-symbols-outlined text-4xl fill-1 ml-1">
                      play_arrow
                    </span>
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs text-white/80 z-10">
                  <span>ความยาว: {activeLesson.duration}</span>
                  <button
                    onClick={() => toggleLessonComplete(activeLesson.id)}
                    className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1 transition-all ${
                      activeLesson.completed
                        ? 'bg-[#20C997] text-white'
                        : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {activeLesson.completed ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>{activeLesson.completed ? 'เรียนเสร็จแล้ว' : 'ทำเครื่องหมายว่าเรียนแล้ว'}</span>
                  </button>
                </div>
              </div>

              {/* Lesson Checklist */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#121b2e]">สารบัญบทเรียนในวิชานี้</h4>
                  {onOpenAITutor && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAITutor(course);
                      }}
                      className="text-xs font-bold text-[#1550d3] hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">psychology</span>
                      ให้ AI ช่วยสรุปบทเรียน
                    </button>
                  )}
                </div>
                {lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      activeLesson.id === lesson.id
                        ? 'border-[#1550d3] bg-[#1550d3]/5'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLessonComplete(lesson.id);
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          lesson.completed
                            ? 'bg-[#20C997] text-white'
                            : 'border-2 border-slate-300 hover:border-[#1550d3]'
                        }`}
                      >
                        {lesson.completed && (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        )}
                      </button>
                      <span
                        className={`text-sm font-medium ${
                          lesson.completed ? 'text-[#737686] line-through' : 'text-[#121b2e]'
                        }`}
                      >
                        {idx + 1}. {lesson.title}
                      </span>
                    </div>
                    <span className="text-xs text-[#737686] shrink-0">{lesson.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#f1f3ff] p-4 rounded-2xl border border-blue-100">
                <span className="text-xs font-bold text-[#1550d3] uppercase tracking-wider">
                  คำถามที่ 1 จาก 5 • 10 คะแนน
                </span>
                <p className="font-bold text-base text-[#121b2e] mt-1">
                  ในหลักการออกแบบ UI/UX ทฤษฎีใดที่กล่าวถึงการจัดกลุ่มองค์ประกอบที่มีลักษณะใกล้เคียงกันให้อยู่ในกลุ่มเดียวกัน?
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  'Law of Proximity (กฎความใกล้ชิด)',
                  'Law of Similarity (กฎความคล้ายคลึง)',
                  'Fitts’s Law (กฎของฟิตส์)',
                  'Hick’s Law (กฎของฮิก)',
                ].map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => !quizSubmitted && setSelectedAnswer(idx)}
                      className={`p-4 rounded-xl text-left text-sm font-medium border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#1550d3] bg-[#1550d3]/10 text-[#1550d3] font-semibold'
                          : 'border-slate-200 hover:bg-slate-50 text-[#121b2e]'
                      }`}
                    >
                      <span>{option}</span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#1550d3] bg-[#1550d3]' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {quizSubmitted ? (
                <div className="p-4 rounded-2xl bg-[#20C997]/15 border border-[#20C997]/30 text-center">
                  <span className="text-[#00694d] font-bold text-base block">
                    🎉 ถูกต้อง! ตอบถูก 10 คะแนนเต็ม
                  </span>
                  <span className="text-xs text-[#00694d]">
                    Law of Similarity ระบุว่ามนุษย์จะรับรู้สิ่งที่มีรูปร่างหรือสีเหมือนกันเป็นกลุ่มเดียวกัน
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => selectedAnswer !== null && setQuizSubmitted(true)}
                  disabled={selectedAnswer === null}
                  className="w-full py-3 bg-[#1550d3] text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-[#1a53d6] transition-colors"
                >
                  ส่งคำตอบ
                </button>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="flex flex-col gap-3">
              {downloadedRes && (
                <div className="p-3 rounded-xl bg-[#20C997]/20 border border-[#20C997]/40 text-[#00694d] text-xs font-semibold flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{downloadedRes}</span>
                  </div>
                  <button onClick={() => setDownloadedRes(null)} className="font-bold text-xs">✕</button>
                </div>
              )}
              {[
                { title: 'Lecture Slide Presentation (.PDF)', size: '14.2 MB', icon: 'picture_as_pdf' },
                { title: 'Source Code Starter Kit (.ZIP)', size: '4.8 MB', icon: 'folder_zip' },
                { title: 'Reference Reading Guidelines (.DOCX)', size: '1.1 MB', icon: 'description' },
              ].map((res, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#1550d3] text-2xl">
                      {res.icon}
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-[#121b2e]">{res.title}</div>
                      <div className="text-xs text-[#737686]">{res.size}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDownloadedRes(`เริ่มดาวน์โหลด ${res.title} สำเร็จ`);
                      setTimeout(() => setDownloadedRes(null), 3500);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#f1f3ff] text-[#1550d3] hover:bg-[#1550d3] hover:text-white transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>ดาวน์โหลด</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
