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
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'resources' | 'notes'>('content');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [downloadedRes, setDownloadedRes] = useState<string | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [userNote, setUserNote] = useState<string>('');
  const [lessonNotes, setLessonNotes] = useState<Record<string, string[]>>({});
  const [activeViewers, setActiveViewers] = useState<number>(() => Math.floor(Math.random() * 18) + 14);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);
  const [customStreamId, setCustomStreamId] = useState<string | null>(null);

  useEffect(() => {
    if (course) {
      setLessons(course.lessons);
      setActiveLesson(course.lessons[0] || null);
      setSelectedAnswer(null);
      setQuizSubmitted(false);
      setDownloadedRes(null);
      setActiveChapterIndex(0);
      setSelectedSlideIndex(0);
      setViewingDocumentId(null);
      setCustomStreamId(null);
      setActiveViewers(Math.floor(Math.random() * 18) + 14);
    }
  }, [course]);

  // Live viewers fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveViewers((prev) => Math.max(8, Math.min(55, prev + (Math.floor(Math.random() * 5) - 2))));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  if (!course || !activeLesson) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const toggleLessonComplete = (lessonId: string) => {
    const updated = lessons.map((l) =>
      l.id === lessonId ? { ...l, completed: !l.completed } : l
    );
    setLessons(updated);
    if (activeLesson.id === lessonId) {
      setActiveLesson({ ...activeLesson, completed: !activeLesson.completed });
    }
    const completedCount = updated.filter((l) => l.completed).length;
    const progress = Math.round((completedCount / updated.length) * 100);
    onUpdateProgress(course.id, progress);
    showToast(
      updated.find((l) => l.id === lessonId)?.completed
        ? '✓ บันทึกว่าเรียนบทเรียนนี้สำเร็จแล้ว'
        : 'ยกเลิกสถานะเรียนเสร็จแล้ว'
    );
  };

  const handleAddNote = () => {
    if (!userNote.trim()) return;
    setLessonNotes((prev) => ({
      ...prev,
      [activeLesson.id]: [...(prev[activeLesson.id] || []), userNote.trim()],
    }));
    setUserNote('');
    showToast('📝 บันทึกโน้ตสรุปช่วยจำสำเร็จ');
  };

  const BACKUP_STREAMS: Record<string, { id: string; label: string }[]> = {
    'cs-1': [
      { id: 'rfscVS0vtbw', label: 'สตรีม 1: Python & OOP (freeCodeCamp)' },
      { id: 'bMknfKXIFA8', label: 'สตรีม 2: React & Web Architecture' },
      { id: '8hly31xKli0', label: 'สตรีม 3: Data Structures & Algorithms' },
      { id: 'aircAruvnKk', label: 'สตรีม 4: Neural Networks & AI (3Blue1Brown)' },
    ],
    'ds-1': [
      { id: 'c9Wg6Cb_YlU', label: 'สตรีม 1: Figma UI/UX Complete Course' },
      { id: 'FTFaQWZBqQ8', label: 'สตรีม 2: Interactive Prototyping & Motion' },
      { id: '68w2V_8bI60', label: 'สตรีม 3: Color Theory & Semantic Tokens' },
    ],
    'mm-1': [
      { id: 'd1japIhCE9Y', label: 'สตรีม 1: Shot Types & Angles (StudioBinder)' },
      { id: 'Hls3TBKh3CE', label: 'สตรีม 2: Filmmaking & Production (CrashCourse)' },
      { id: '7y9s9F_ZcTg', label: 'สตรีม 3: Camera Movement (Film Riot)' },
    ],
    'ma-1': [
      { id: 'WUvTyaaNkzM', label: 'สตรีม 1: The Essence of Calculus (3Blue1Brown)' },
      { id: 'fNk_zzaMoSs', label: 'สตรีม 2: Essence of Linear Algebra (3Blue1Brown)' },
      { id: 'aircAruvnKk', label: 'สตรีม 3: Math for Deep Learning (3Blue1Brown)' },
    ],
  };

  const currentStreams = BACKUP_STREAMS[course.id] || BACKUP_STREAMS['cs-1'];

  const youtubeId = customStreamId || activeLesson.youtubeId || (
    course.id === 'cs-1' ? 'rfscVS0vtbw' :
    course.id === 'ds-1' ? 'c9Wg6Cb_YlU' :
    course.id === 'mm-1' ? 'd1japIhCE9Y' : 'WUvTyaaNkzM'
  );

  const youtubeWatchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;

  // Curated course documents, slides & external references
  const courseResources = {
    'cs-1': {
      slides: [
        {
          slideNum: 1,
          title: 'แนะนำ Object-Oriented Programming (OOP) & Clean Architecture',
          content: 'การเขียนโปรแกรมเชิงวัตถุ (OOP) เน้นการรวมข้อมูล (State) และพฤติกรรม (Methods) เข้าด้วยกันเป็น Class เพื่อให้โค้ดสามารถ Reuse และบำรุงรักษาได้ง่ายในระบบขนาดใหญ่',
          code: `class SmartStudent:\n    def __init__(self, name: str, student_id: str):\n        self.name = name\n        self.__student_id = student_id  # Encapsulated\n        self.gpa = 4.00\n\n    def calculate_honors(self) -> str:\n        return "First Class Honors" if self.gpa >= 3.60 else "Standard"`,
          takeaway: '4 เสาหลักของ OOP: Encapsulation, Abstraction, Inheritance, Polymorphism'
        },
        {
          slideNum: 2,
          title: 'โครงสร้างข้อมูล Data Structures & Big-O Time Complexity',
          content: 'การเลือก Data Structure ที่ถูกต้องช่วยลดเวลาประมวลผลจาก O(n^2) ให้เหลือ O(n log n) หรือ O(1)',
          code: `// Hash Map Lookup vs Array Search in TypeScript\nconst studentScores = new Map<string, number>();\nstudentScores.set("ST69001", 98); // O(1) Insertion\nconst score = studentScores.get("ST69001"); // O(1) Lookup`,
          takeaway: 'Array: Fast index access O(1) | LinkedList: Fast insertion O(1) | Hash Map: Constant lookup O(1)'
        },
        {
          slideNum: 3,
          title: 'สถาปัตยกรรม RESTful API & Client-Server Integration',
          content: 'มาตรฐานการสื่อสารระหว่าง Frontend และ Backend ด้วย HTTP Methods, JSON และ Stateless Token-based Authentication',
          code: `GET /api/v1/courses/cs-1 -> 200 OK\nPOST /api/v1/submissions -> 201 Created\nAuthorization: Bearer <JWT_SECRET_TOKEN>`,
          takeaway: 'Always use semantic HTTP Status Codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized)'
        }
      ],
      officialDocs: [
        { name: 'Python 3.12 Official Documentation', url: 'https://docs.python.org/3/', icon: 'code', type: 'Official Docs' },
        { name: 'MDN Web Docs: JavaScript & Web APIs', url: 'https://developer.mozilla.org/en-US/', icon: 'language', type: 'Reference' },
        { name: 'Google Colab: Interactive Python Notebook', url: 'https://colab.research.google.com/', icon: 'terminal', type: 'Interactive Lab' },
        { name: 'W3Schools Data Structures Guide', url: 'https://www.w3schools.com/dsa/', icon: 'school', type: 'Tutorial' }
      ]
    },
    'ds-1': {
      slides: [
        {
          slideNum: 1,
          title: 'หลักการ Visual Hierarchy & Gestalt Psychology',
          content: 'Gestalt Principles อธิบายว่าสมองมนุษย์จัดกลุ่มสิ่งที่มองเห็นอย่างไร: กฎความใกล้ชิด (Proximity), ความคล้ายคลึง (Similarity), ความต่อเนื่อง (Continuity), และพื้นที่ปิดล้อม (Closure)',
          code: `/* CSS Visual Weight Hierarchy */\n.hero-title { font-size: 2.25rem; font-weight: 800; color: #0f172a; }\n.sub-label   { font-size: 0.875rem; font-weight: 500; color: #64748b; }\n.cta-button { padding: 12px 24px; border-radius: 9999px; background: #1550d3; }`,
          takeaway: 'ผู้ใช้งานควรรู้ได้ใน 3 วินาทีว่าจุดที่สำคัญที่สุดบนหน้าจอคือจุดใด'
        },
        {
          slideNum: 2,
          title: 'Design Tokens & ระบบคู่สี Dark/Light Mode',
          content: 'การกำหนด Semantic Color Tokens ช่วยให้เปลี่ยนธีมได้ทันทีและผ่านมาตรฐานการเข้าถึง WCAG AA (Contrast Ratio >= 4.5:1 สำหรับ Body Text)',
          code: `:root {\n  --color-surface-bg: #f8fafc;\n  --color-text-main: #0f172a;\n  --color-primary: #1550d3;\n}\n[data-theme="dark"] {\n  --color-surface-bg: #0f172a;\n  --color-text-main: #f8fafc;\n}`,
          takeaway: 'ห้ามใช้สีดำสนิท #000000 เป็นพื้นหลัง Dark Mode เพื่อลด Eyestrain'
        },
        {
          slideNum: 3,
          title: 'Figma Auto Layout & Component Variant Architecture',
          content: 'การสร้าง UI Library ใน Figma โดยใช้ Auto Layout, Hug/Fill constraints และ Component Properties',
          code: `Button Component Variants:\n- Size: Small (32px), Medium (40px), Large (48px)\n- State: Default, Hover, Active, Disabled, Loading\n- Icon: LeadingIcon, TrailingIcon, None`,
          takeaway: 'Auto Layout เลียนแบบ Flexbox ใน CSS ช่วยลดช่องว่างระหว่างดีไซเนอร์และโปรแกรมเมอร์'
        }
      ],
      officialDocs: [
        { name: 'Figma Learn & Design Systems Guide', url: 'https://help.figma.com/hc/en-us/categories/360002051613', icon: 'palette', type: 'Official Guide' },
        { name: 'Material Design 3 Token Guidelines', url: 'https://m3.material.io/', icon: 'brush', type: 'Design System' },
        { name: 'WebAIM WCAG Contrast Checker', url: 'https://webaim.org/resources/contrastchecker/', icon: 'visibility', type: 'Accessibility Tool' },
        { name: 'Nielsen Norman Group (NN/g) UX Articles', url: 'https://www.nngroup.com/articles/', icon: 'menu_book', type: 'Research' }
      ]
    },
    'mm-1': {
      slides: [
        {
          slideNum: 1,
          title: 'หลักการจัดองค์ประกอบภาพยนตร์ & กฎ 180 องศา',
          content: 'การตั้งแกนการกระทำ (Axis of Action) เพื่อไม่ให้ตำแหน่งและทิศทางการมองของตัวละครสลับข้างกันเมื่อเปลี่ยนมุมกล้อง',
          code: `Shot Sizes Progression:\n1. Extreme Wide Shot (EWS) -> กำหนดสถานที่และบรรยากาศ\n2. Medium Shot (MS) -> บทสนทนาระหว่างตัวละคร\n3. Close-Up (CU) -> ถ่ายทอดอารมณ์ความรู้สึกทางสีหน้า`,
          takeaway: 'การรักษาสายตาแกนหลักทำให้ผู้ชมไม่สับสนมิติพื้นที่'
        },
        {
          slideNum: 2,
          title: 'Color Grading & Color Correction ด้วย LUTs & Curves',
          content: 'ความแตกต่างระหว่าง Color Correction (ปรับแสง-สมดุลขาวให้ตรงจริง) กับ Color Grading (สร้างโทนอารมณ์ Mood & Tone)',
          code: `Workflow:\nRaw Log Footage -> Rec.709 Transform -> Exposure & Balance -> Creative LUT -> Film Grain`,
          takeaway: 'ดู Waveform และ Vectorscope ควบคู่กับจอ Calibrated เสมอ'
        }
      ],
      officialDocs: [
        { name: 'Blackmagic DaVinci Resolve Training Guide', url: 'https://www.blackmagicdesign.com/products/davinciresolve/training', icon: 'movie_filter', type: 'Official Training' },
        { name: 'Adobe Premiere Pro User Guide', url: 'https://helpx.adobe.com/premiere-pro/user-guide.html', icon: 'video_settings', type: 'Manual' },
        { name: 'Freesound: Creative Commons Audio Library', url: 'https://freesound.org/', icon: 'volume_up', type: 'Audio Assets' }
      ]
    },
    'ma-1': {
      slides: [
        {
          slideNum: 1,
          title: 'แก่นแท้ของแคลคูลัส: ลิมิตและอัตราการเปลี่ยนแปลงชั่วขณะ',
          content: 'อนุพันธ์ f\'(x) คือความชันของเส้นสัมผัสกราฟ ณ จุดใดๆ อธิบายการเปลี่ยนแปลงในระดับเสี้ยววินาที (Instantaneous Rate of Change)',
          code: `f'(x) = lim (h -> 0) [ f(x + h) - f(x) ] / h\n\nสูตรพื้นฐาน:\nd/dx [x^n] = n * x^(n-1)\nd/dx [e^x] = e^x\nd/dx [ln x] = 1/x`,
          takeaway: 'อนุพันธ์คือรากฐานของ Gradient Descent ในการเทรน AI Neural Networks'
        },
        {
          slideNum: 2,
          title: 'พีชคณิตเชิงเส้น (Linear Algebra) สำหรับวิทยาการข้อมูล',
          content: 'เวกเตอร์และการคูณเมทริกซ์ในฐานะการแปลงเชิงเส้น (Linear Transformation) ในปริภูมิ 2 มิติและ 3 มิติ',
          code: `Matrix Multiplication Transformation:\n[x'] = [a  b] [x]\n[y']   [c  d] [y]\n\nDeterminant det(A) = ad - bc (อัตราส่วนการขยายหรือหดพื้นที่)`,
          takeaway: 'เมทริกซ์คือฟังก์ชันที่แปลงพิกัดของเวกเตอร์ใน Space'
        }
      ],
      officialDocs: [
        { name: '3Blue1Brown: Essence of Linear Algebra', url: 'https://www.3blue1brown.com/topics/linear-algebra', icon: 'calculate', type: 'Interactive Math' },
        { name: 'Khan Academy: Calculus 1 & 2 Course', url: 'https://www.khanacademy.org/math/calculus-1', icon: 'school', type: 'Open Course' },
        { name: 'GeoGebra 3D Math Graphing Calculator', url: 'https://www.geogebra.org/3d', icon: 'hub', type: 'Visual Tool' }
      ]
    }
  };

  const currentCourseResources = courseResources[course.id as keyof typeof courseResources] || courseResources['cs-1'];
  const activeSlide = currentCourseResources.slides[selectedSlideIndex] || currentCourseResources.slides[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-scaleIn">
        {/* Modal Header */}
        <div
          className="p-4 sm:p-5 text-white relative flex justify-between items-center shadow-sm"
          style={{ backgroundColor: course.color }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shrink-0">
              <span className="material-symbols-outlined text-[24px]">{course.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase opacity-90 bg-black/20 px-2 py-0.5 rounded-md">
                  {course.code} • {course.room}
                </span>
                <span className="hidden sm:inline-flex text-[11px] bg-white/20 px-2 py-0.5 rounded-md font-medium">
                  {course.instructor}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold truncate mt-0.5">{course.thaiTitle}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
                <span className="hidden sm:inline">ถาม AI Tutor</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 text-white hover:bg-black/30 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 gap-3 sm:gap-6 bg-[#f9f9ff] text-xs sm:text-sm font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'content'
                ? 'border-[#1550d3] text-[#1550d3] font-bold'
                : 'border-transparent text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            <span>วิดีโอบรรยาย YouTube HD ({lessons.filter((l) => l.completed).length}/{lessons.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'resources'
                ? 'border-[#1550d3] text-[#1550d3] font-bold'
                : 'border-transparent text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            <span>เอกสาร สไลด์ & แหล่งอ้างอิงจริง</span>
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'quiz'
                ? 'border-[#1550d3] text-[#1550d3] font-bold'
                : 'border-transparent text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">quiz</span>
            <span>แบบทดสอบเก็บคะแนน</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'notes'
                ? 'border-[#1550d3] text-[#1550d3] font-bold'
                : 'border-transparent text-[#434654] hover:text-[#121b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            <span>สมุดจดบันทึก ({lessonNotes[activeLesson.id]?.length || 0})</span>
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">info</span>
              {toastMsg}
            </span>
            <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {activeTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Main Video & Active Lesson Section (7 cols on desktop) */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                {/* Real YouTube Video Player Embed */}
                <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden shadow-lg border border-slate-800">
                  <iframe
                    key={`${activeLesson.id}-${youtubeId}`}
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                    title={activeLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />

                  {/* Top Overlays */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                    <span className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] font-bold truncate max-w-[65%] border border-white/10 shadow-sm">
                      {activeLesson.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950/85 backdrop-blur-md text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        <span>{activeViewers} กำลังเรียนสด</span>
                      </span>
                      <span className="text-[10px] bg-[#1550d3] text-white px-2 py-0.5 rounded-md font-bold shadow-sm">
                        HD 1080p
                      </span>
                    </div>
                  </div>
                </div>

                {/* Video Stream & Troubleshooting Toolbar */}
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl p-3 border border-blue-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                      <span className="material-symbols-outlined text-[16px] text-[#1550d3]">live_tv</span>
                      <span>เลือกช่องสัญญาณสตรีม (Stream Channels):</span>
                    </div>
                    <span className="text-[11px] text-blue-700 font-medium">
                      *หากพบว่าคลิปใดติดการจำกัดของ YouTube ให้กดสลับช่องสัญญาณได้ทันที
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentStreams.map((stream, idx) => (
                      <button
                        key={stream.id}
                        onClick={() => {
                          setCustomStreamId(stream.id);
                          showToast(`สลับไปยัง ${stream.label} สำเร็จ`);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          youtubeId === stream.id
                            ? 'bg-[#1550d3] text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-blue-100 border border-slate-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {youtubeId === stream.id ? 'check_circle' : 'play_arrow'}
                        </span>
                        <span>{stream.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lesson Video Action Bar */}
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <span className="material-symbols-outlined text-[#1550d3] text-[18px]">
                        schedule
                      </span>
                      <span>ความยาว: {activeLesson.duration}</span>
                    </div>
                    <a
                      href={youtubeWatchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                      title="เปิดดูแบบเต็มจอบน YouTube"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      <span>เปิดดูบน YouTube โดยตรง</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleLessonComplete(activeLesson.id)}
                      className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        activeLesson.completed
                          ? 'bg-[#20C997] text-white hover:bg-[#1bb386]'
                          : 'bg-[#1550d3] text-white hover:bg-[#1a53d6]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {activeLesson.completed ? 'check_circle' : 'task_alt'}
                      </span>
                      <span>{activeLesson.completed ? 'เรียนเสร็จแล้ว (Completed)' : 'ทำเครื่องหมายว่าเรียนจบแล้ว'}</span>
                    </button>
                  </div>
                </div>

                {/* Chapters / Timeline Breakdown if available */}
                {activeLesson.chapters && activeLesson.chapters.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-2.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#1550d3] text-[18px]">
                        format_list_bulleted
                      </span>
                      <span>สารบัญช่วงเวลา (Video Chapters & Timestamps)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeLesson.chapters.map((ch, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveChapterIndex(idx);
                            showToast(`ข้ามไปยังหัวข้อย่อย: ${ch.title} (${ch.time})`);
                          }}
                          className={`p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer border ${
                            activeChapterIndex === idx
                              ? 'bg-blue-50 border-[#1550d3] text-[#1550d3] font-bold shadow-xs'
                              : 'bg-slate-50/70 text-slate-700 hover:bg-slate-100 border-slate-200/80'
                          }`}
                        >
                          <span className="truncate pr-2">{ch.title}</span>
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white border border-slate-200 shrink-0">
                            {ch.time}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary & Key Takeaways Card */}
                {activeLesson.summary && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs flex flex-col gap-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#1550d3] text-[18px]">
                        lightbulb
                      </span>
                      <span>สรุปสาระสำคัญประจำบทเรียน (Key Takeaways)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {activeLesson.summary}
                    </p>
                    {activeLesson.keyPoints && (
                      <ul className="mt-1 space-y-1.5 text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                        {activeLesson.keyPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[#1550d3] font-bold">✓</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar: All Lessons Checklist for this Course (5 cols on desktop) */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#121b2e] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#1550d3] text-[20px]">
                      video_library
                    </span>
                    <span>บทเรียนทั้งหมดในวิชานี้</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {lessons.filter((l) => l.completed).length}/{lessons.length} บท
                  </span>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto max-h-[520px] pr-1">
                  {lessons.map((lesson, idx) => {
                    const isCurrent = activeLesson.id === lesson.id;
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          setActiveLesson(lesson);
                          setActiveChapterIndex(0);
                        }}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isCurrent
                            ? 'border-[#1550d3] bg-blue-50/80 shadow-xs ring-1 ring-[#1550d3]/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLessonComplete(lesson.id);
                            }}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                              lesson.completed
                                ? 'bg-[#20C997] text-white shadow-xs'
                                : 'border-2 border-slate-300 hover:border-[#1550d3] text-slate-300'
                            }`}
                            title={lesson.completed ? 'เรียนจบแล้ว' : 'กดเพื่อทำเครื่องหมายว่าเรียนแล้ว'}
                          >
                            {lesson.completed ? (
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400">{idx + 1}</span>
                            )}
                          </button>
                          <div className="min-w-0">
                            <h5
                              className={`text-xs font-bold truncate ${
                                isCurrent
                                  ? 'text-[#1550d3]'
                                  : lesson.completed
                                  ? 'text-slate-400 line-through'
                                  : 'text-[#121b2e]'
                              }`}
                            >
                              {lesson.title}
                            </h5>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                {lesson.duration}
                              </span>
                              <span>•</span>
                              <span className="capitalize font-medium text-[#1550d3]">
                                {lesson.type === 'video' ? 'วิดีโอ HD' : lesson.type === 'quiz' ? 'แบบทดสอบ' : 'ปฏิบัติการ'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2">
                          <span className={`material-symbols-outlined text-[20px] ${
                            isCurrent ? 'text-[#1550d3]' : 'text-slate-300'
                          }`}>
                            {isCurrent ? 'play_arrow' : 'chevron_right'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick AI Summary Help */}
                {onOpenAITutor && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAITutor(course);
                    }}
                    className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 hover:border-[#1550d3] text-[#1550d3] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">psychology</span>
                    <span>ให้ AI Tutor สรุปย่อเนื้อหาวิชานี้</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RESOURCES & INTERACTIVE SLIDE DECK */}
          {activeTab === 'resources' && (
            <div className="flex flex-col gap-5 max-w-3xl mx-auto w-full">
              {downloadedRes && (
                <div className="p-3 rounded-xl bg-[#20C997]/20 border border-[#20C997]/40 text-[#00694d] text-xs font-semibold flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{downloadedRes}</span>
                  </div>
                  <button onClick={() => setDownloadedRes(null)} className="font-bold text-xs">✕</button>
                </div>
              )}

              {/* 1. Interactive Slide Presentation Deck */}
              <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#1550d3] text-white text-[11px] font-bold">
                      สไลด์การสอนดิจิทัล
                    </span>
                    <span className="text-xs text-slate-400">
                      หน้า {selectedSlideIndex + 1} จาก {currentCourseResources.slides.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedSlideIndex((prev) => Math.max(0, prev - 1))}
                      disabled={selectedSlideIndex === 0}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors"
                      title="สไลด์ก่อนหน้า"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <button
                      onClick={() => setSelectedSlideIndex((prev) => Math.min(currentCourseResources.slides.length - 1, prev + 1))}
                      disabled={selectedSlideIndex === currentCourseResources.slides.length - 1}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors"
                      title="สไลด์ถัดไป"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-[#1550d3] font-mono">#{activeSlide.slideNum}</span>
                    <span>{activeSlide.title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeSlide.content}
                  </p>

                  {/* Code snippet / formula box */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                    <pre>{activeSlide.code}</pre>
                  </div>

                  <div className="p-3 bg-blue-950/60 rounded-xl border border-blue-800/40 text-xs text-blue-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-blue-400 shrink-0">tips_and_updates</span>
                    <span>{activeSlide.takeaway}</span>
                  </div>
                </div>

                {/* Slide Thumbnail Tabs */}
                <div className="flex gap-2 pt-2 overflow-x-auto border-t border-slate-800">
                  {currentCourseResources.slides.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSlideIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                        selectedSlideIndex === idx
                          ? 'bg-[#1550d3] text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      สไลด์ {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Official Documentation & Interactive External Links */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#1550d3] text-[20px]">
                      open_in_new
                    </span>
                    <span>เอกสารอ้างอิงและคู่มือทางการ (Official Docs & Web Resources)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">เข้าถึงได้ตลอด 24 ชม.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentCourseResources.officialDocs.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#1550d3] hover:shadow-xs transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1550d3] flex items-center justify-center shrink-0 group-hover:bg-[#1550d3] group-hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-[18px]">{doc.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 group-hover:text-[#1550d3] transition-colors truncate">
                            {doc.name}
                          </h5>
                          <span className="text-[10px] text-slate-400">{doc.type}</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-[#1550d3] transition-colors shrink-0">
                        north_east
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* 3. Downloadable Course Handouts & Code Starter Kits */}
              <div className="flex flex-col gap-2.5">
                <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#1550d3]">download_for_offline</span>
                  <span>ไฟล์ดาวน์โหลดสำหรับฝึกปฏิบัติ (Downloadable Materials)</span>
                </h4>
                {[
                  { title: `สไลด์บรรยายฉบับเต็ม: ${course.thaiTitle} (.PDF)`, size: '14.2 MB', icon: 'picture_as_pdf' },
                  { title: `Source Code & Starter Kit สำหรับการทดลองในแล็บ (.ZIP)`, size: '4.8 MB', icon: 'folder_zip' },
                  { title: `สรุปสูตร คีย์เวิร์ด และแนวข้อสอบปลายภาค (.PDF)`, size: '6.5 MB', icon: 'description' },
                ].map((res, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#1550d3] text-2xl">
                        {res.icon}
                      </span>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[#121b2e]">{res.title}</div>
                        <div className="text-[11px] text-slate-400">{res.size} • ตรวจสอบความถูกต้องแล้ว</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDownloadedRes(`เริ่มดาวน์โหลด ${res.title} สำเร็จ`);
                        setTimeout(() => setDownloadedRes(null), 3500);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#f1f3ff] text-[#1550d3] hover:bg-[#1550d3] hover:text-white transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      <span>ดาวน์โหลด</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: QUIZ */}
          {activeTab === 'quiz' && (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
              <div className="bg-[#f1f3ff] p-4 rounded-2xl border border-blue-100">
                <span className="text-xs font-bold text-[#1550d3] uppercase tracking-wider">
                  คำถามที่ 1 จาก 5 • 10 คะแนน ({course.thaiTitle})
                </span>
                <p className="font-bold text-base text-[#121b2e] mt-1">
                  {course.id === 'cs-1'
                    ? 'ในหลักการ OOP คุณสมบัติข้อใดหมายถึงความสามารถที่คลาสลูกจะสามารถแก้ไขพฤติกรรมของ Method จากคลาสแม่ได้?'
                    : course.id === 'ds-1'
                    ? 'ในหลักการออกแบบ UI/UX ทฤษฎีใดที่กล่าวถึงการจัดกลุ่มองค์ประกอบที่มีลักษณะใกล้เคียงกันให้อยู่ในกลุ่มเดียวกัน?'
                    : course.id === 'mm-1'
                    ? 'กฎ 180 องศา (180-Degree Rule) ในการถ่ายทำภาพยนตร์มีวัตถุประสงค์เพื่ออะไร?'
                    : 'ในวิชาแคลคูลัส อนุพันธ์ของฟังก์ชัน f(x) ณ จุด x ใดๆ มีความหมายทางเรขาคณิตตรงกับข้อใด?'}
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {(course.id === 'cs-1'
                  ? ['Encapsulation', 'Polymorphism (Method Overriding)', 'Abstraction', 'Inheritance']
                  : course.id === 'ds-1'
                  ? ['Law of Proximity (กฎความใกล้ชิด)', 'Law of Similarity (กฎความคล้ายคลึง)', 'Fitts’s Law (กฎของฟิตส์)', 'Hick’s Law (กฎของฮิก)']
                  : course.id === 'mm-1'
                  ? ['รักษาสายตาแกนหลักเพื่อไม่ให้ผู้ชมสับสนทิศทาง', 'เพิ่มความสว่างของเฟรมภาพ 180%', 'ทำให้การตัดต่อเสียงสมดุลทั้ง 2 ข้าง', 'กำหนดมุมกล้องแบบ Dutch Angle']
                  : ['ความชันของเส้นสัมผัสเส้นโค้ง ณ จุดนั้น', 'พื้นที่ใต้กราฟทั้งหมด', 'จุดตัดแกน Y ของกราฟ', 'ระยะห่างระหว่างจุด 2 จุด']
                ).map((option, idx) => {
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
                    🎉 ถูกต้อง! ตอบถูก 10 คะแนนเต็ม (คำตอบได้รับการบันทึกลงระบบแล้ว)
                  </span>
                  <span className="text-xs text-[#00694d] mt-1 block">
                    ยอดเยี่ยมมาก! คุณทำความเข้าใจบทเรียนในรายวิชานี้ได้อย่างแม่นยำ
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => selectedAnswer !== null && setQuizSubmitted(true)}
                  disabled={selectedAnswer === null}
                  className="w-full py-3 bg-[#1550d3] text-white font-bold rounded-xl disabled:opacity-50 hover:bg-[#1a53d6] transition-colors cursor-pointer shadow-md"
                >
                  ส่งคำตอบเก็บคะแนน
                </button>
              )}
            </div>
          )}

          {/* TAB 4: NOTES */}
          {activeTab === 'notes' && (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-2.5">
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#1550d3]">edit_note</span>
                  <span>บันทึกช่วยจำสำหรับ: {activeLesson.title}</span>
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="พิมพ์โน้ตช่วยจำของคุณที่นี่ (กด Enter เพื่อบันทึก)..."
                    className="flex-1 bg-white text-slate-800 text-xs rounded-xl p-3 border border-slate-200 focus:border-[#1550d3] focus:outline-none"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-[#1550d3] text-white text-xs font-bold rounded-xl hover:bg-[#1a53d6] cursor-pointer"
                  >
                    บันทึก
                  </button>
                </div>
              </div>

              {/* Saved Notes list */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-700">โน้ตที่บันทึกไว้:</span>
                {(lessonNotes[activeLesson.id] && lessonNotes[activeLesson.id].length > 0) ? (
                  lessonNotes[activeLesson.id].map((n, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{n}</span>
                      </div>
                      <span className="text-[10px] text-amber-600/80 shrink-0">เมื่อสักครู่</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                    ยังไม่มีโน้ตสำหรับบทเรียนนี้ พิมพ์ข้อความด้านบนเพื่อจดบันทึกได้เลย
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

