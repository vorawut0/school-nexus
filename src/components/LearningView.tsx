import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MOCK_COURSES, MOCK_LEARNING_MEDIA } from '../data/mockData';
import { Course, UserProfile, LearningMedia } from '../types';
import { PomodoroTimer } from './learning/PomodoroTimer';
import { LearningAnalytics } from './analytics/LearningAnalytics';
import { QuizMockTest } from './learning/QuizMockTest';

interface MediaRealtimeStat {
  views: number;
  likes: number;
  activeViewers: number;
  isLiked: boolean;
  lastViewedAt?: number;
}

const STORAGE_KEY = 'school_nexus_realtime_media_stats_v2';

const getInitialMediaStats = (): Record<string, MediaRealtimeStat> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const initial: Record<string, MediaRealtimeStat> = {};
      MOCK_LEARNING_MEDIA.forEach((m) => {
        initial[m.id] = {
          views: typeof parsed[m.id]?.views === 'number' ? parsed[m.id].views : m.viewsCount,
          likes: typeof parsed[m.id]?.likes === 'number' ? parsed[m.id].likes : m.likesCount,
          activeViewers: typeof parsed[m.id]?.activeViewers === 'number' ? parsed[m.id].activeViewers : Math.floor(Math.random() * 16) + 12,
          isLiked: Boolean(parsed[m.id]?.isLiked),
          lastViewedAt: parsed[m.id]?.lastViewedAt,
        };
      });
      return initial;
    }
  } catch (e) {
    console.warn('Error reading media stats:', e);
  }
  const initial: Record<string, MediaRealtimeStat> = {};
  MOCK_LEARNING_MEDIA.forEach((m) => {
    initial[m.id] = {
      views: m.viewsCount,
      likes: m.likesCount,
      activeViewers: Math.floor(Math.random() * 16) + 12,
      isLiked: false,
    };
  });
  return initial;
};

interface LearningViewProps {
  user: UserProfile;
  onOpenCourseModal: (course: Course) => void;
  onOpenAITutor?: (course?: Course) => void;
  onOpenGpaModal?: () => void;
}

export const LearningView: React.FC<LearningViewProps> = ({
  user,
  onOpenCourseModal,
  onOpenAITutor,
  onOpenGpaModal,
}) => {
  const [courses] = useState<Course[]>(MOCK_COURSES);
  const [learningMainTab, setLearningMainTab] = useState<'all' | 'media_hub' | 'quiz_mock' | 'analytics'>('all');
  const [activeFocusCourseId, setActiveFocusCourseId] = useState<string>(MOCK_COURSES[0]?.id || '');
  const [showPomodoroSection, setShowPomodoroSection] = useState<boolean>(true);

  // Real-time Media Stats (Real-time Viewers, Live Views Count, Real-time Heart Likes)
  const [mediaStats, setMediaStats] = useState<Record<string, MediaRealtimeStat>>(getInitialMediaStats);
  const [recentlyIncrementedId, setRecentlyIncrementedId] = useState<string | null>(null);
  const statsRef = useRef(mediaStats);
  statsRef.current = mediaStats;

  // Sync to localStorage whenever mediaStats change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mediaStats));
    } catch (e) {
      console.warn('Error saving media stats to storage:', e);
    }
  }, [mediaStats]);

  // Real-time cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const remoteStats = JSON.parse(e.newValue);
          setMediaStats(remoteStats);
        } catch (err) {
          console.warn('Sync error from storage event:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Real-time background ticker (Active online viewers and subtle real-time campus activity)
  useEffect(() => {
    const interval = setInterval(() => {
      setMediaStats((prev) => {
        const next = { ...prev };
        // Randomly choose 1-2 media to fluctuate live viewers & occasional view increments
        const mediaList = MOCK_LEARNING_MEDIA;
        if (mediaList.length === 0) return prev;
        
        const randomIdx = Math.floor(Math.random() * mediaList.length);
        const item = mediaList[randomIdx];
        if (item && next[item.id]) {
          const current = next[item.id];
          const deltaViewers = Math.floor(Math.random() * 5) - 2; // -2 to +2
          const newViewers = Math.max(4, Math.min(65, current.activeViewers + deltaViewers));
          
          // Occasional live campus view tick (+1)
          const shouldIncrementView = Math.random() > 0.45;
          next[item.id] = {
            ...current,
            activeViewers: newViewers,
            views: shouldIncrementView ? current.views + 1 : current.views,
          };
        }
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Media Library state
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<LearningMedia | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [activeTabInModal, setActiveTabInModal] = useState<'content' | 'notes' | 'summary'>('content');
  const [userNotes, setUserNotes] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<Record<string, string[]>>({
    'media-cs-01': [
      '• หัวใจของ React + TypeScript คือการกำหนด Type Props ให้ชัดเจน',
      '• onSnapshot ของ Firestore คืนฟังก์ชัน unsubscribe ต้อง return ใน useEffect cleanup',
    ],
    'media-ma-01': [
      '• อนุพันธ์คือความชันของเส้นสัมผัสกราฟ ณ จุดใดๆ',
      '• ใน Gradient Descent ความชันจะบอกทิศทางที่ค่า Loss ลดลงเร็วที่สุด',
    ],
  });
  const [completedMediaIds, setCompletedMediaIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter Media logic
  const filteredMedia = MOCK_LEARNING_MEDIA.filter((item) => {
    const matchesSubject =
      selectedSubjectFilter === 'all' || item.courseId === selectedSubjectFilter;
    const matchesType =
      selectedTypeFilter === 'all' ||
      (selectedTypeFilter === 'video' && item.type === 'video') ||
      (selectedTypeFilter === 'document' && (item.type === 'pdf' || item.type === 'slide')) ||
      (selectedTypeFilter === 'interactive' && (item.type === 'interactive' || item.type === 'source_code'));
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSubject && matchesType && matchesSearch;
  });

  // Real-time View Increment when opening a media item
  const handleOpenMedia = (media: LearningMedia) => {
    // Increment view count in real-time immediately
    setMediaStats((prev) => {
      const current = prev[media.id] || {
        views: media.viewsCount,
        likes: media.likesCount,
        activeViewers: 15,
        isLiked: false,
      };
      return {
        ...prev,
        [media.id]: {
          ...current,
          views: current.views + 1,
          activeViewers: current.activeViewers + 1,
          lastViewedAt: Date.now(),
        },
      };
    });

    setRecentlyIncrementedId(media.id);
    setTimeout(() => setRecentlyIncrementedId(null), 2000);

    setSelectedMedia(media);
    setCurrentChapterIndex(0);
    setActiveTabInModal('content');
  };

  // Real-time Heart / Like toggle
  const handleToggleLike = (mediaId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMediaStats((prev) => {
      const current = prev[mediaId] || {
        views: MOCK_LEARNING_MEDIA.find((m) => m.id === mediaId)?.viewsCount || 1000,
        likes: MOCK_LEARNING_MEDIA.find((m) => m.id === mediaId)?.likesCount || 100,
        activeViewers: 12,
        isLiked: false,
      };
      const newLikedState = !current.isLiked;
      const newLikesCount = newLikedState ? current.likes + 1 : Math.max(0, current.likes - 1);
      
      showToast(newLikedState ? '❤️ บันทึกเข้าสู่รายการที่ถูกใจ (Real-time Updated)' : '🤍 ยกเลิกการถูกใจ');

      return {
        ...prev,
        [mediaId]: {
          ...current,
          isLiked: newLikedState,
          likes: newLikesCount,
        },
      };
    });
  };

  const handleCompleteMedia = (media: LearningMedia) => {
    if (completedMediaIds[media.id]) {
      showToast('คุณได้เรียนรู้สื่อนี้เรียบร้อยแล้ว');
      return;
    }
    setCompletedMediaIds((prev) => ({ ...prev, [media.id]: true }));
    showToast(`✓ บันทึกสำเร็จการเรียนรู้: ${media.title}`);
  };

  const handleSaveNote = () => {
    if (!userNotes.trim() || !selectedMedia) return;
    setSavedNotes((prev) => ({
      ...prev,
      [selectedMedia.id]: [...(prev[selectedMedia.id] || []), `• ${userNotes.trim()}`],
    }));
    setUserNotes('');
    showToast('บันทึกโน้ตช่วยจำบทเรียนสำเร็จ');
  };

  const handleDownloadMaterial = (media: LearningMedia) => {
    showToast(`กำลังดาวน์โหลด: ${media.title} (${media.fileSize || 'เอกสาร'})`);
  };

  return (
    <div className="flex flex-col w-full relative pb-20 sm:pb-24 pt-5 sm:pt-6 px-4 sm:px-6 max-w-[1280px] mx-auto min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-3 sm:right-6 z-[90] bg-[#121b2e] text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-emerald-500/40 animate-slideInRightToast max-w-[calc(100vw-24px)] sm:max-w-md pointer-events-auto">
          <span className="material-symbols-outlined text-[#20C997] text-[20px] shrink-0">verified</span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-6 sm:gap-8">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#121b2e] leading-tight">
              ศูนย์การเรียนรู้ & วิเคราะห์ผลการศึกษา (Learning Analytics Hub)
            </h1>
            <p className="text-[#434654] text-sm sm:text-base">
              แดชบอร์ดติดตามคะแนนเฉลี่ยรายวิชา สถิติเวลาเข้าเรียนย้อนหลัง 30 วัน และคลังสื่อการสอนจริง
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setShowPomodoroSection(!showPomodoroSection)}
              className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shrink-0 ${
                showPomodoroSection
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
              title="สลับการแสดงผลตัวจับเวลา Pomodoro"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">timer</span>
              <span>{showPomodoroSection ? 'ซ่อนตัวจับเวลา' : 'เปิดตัวจับเวลา Pomodoro'}</span>
            </button>

            {onOpenAITutor && (
              <button
                type="button"
                onClick={() => onOpenAITutor()}
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-amber-400">auto_awesome</span>
                <span>ผู้ช่วย AI Tutor</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary View Switcher Tabs: Responsive Grid Layout (Never overlaps) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => setLearningMainTab('all')}
            className={`w-full py-2.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              learningMainTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">dashboard_customize</span>
            <span className="truncate">แสดงทั้งหมด</span>
          </button>

          <button
            type="button"
            onClick={() => setLearningMainTab('media_hub')}
            className={`w-full py-2.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              learningMainTab === 'media_hub'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">video_library</span>
            <span className="truncate">สื่อการสอน</span>
          </button>

          <button
            type="button"
            onClick={() => setLearningMainTab('quiz_mock')}
            className={`w-full py-2.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              learningMainTab === 'quiz_mock'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">quiz</span>
            <span className="truncate">ข้อสอบจำลอง</span>
          </button>

          <button
            type="button"
            onClick={() => setLearningMainTab('analytics')}
            className={`w-full py-2.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              learningMainTab === 'analytics'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">insights</span>
            <span className="truncate">วิเคราะห์ผล</span>
          </button>
        </div>

        {/* =================================================== */}
        {/* VIEW: QUIZ MOCK TEST MODE                           */}
        {/* =================================================== */}
        {(learningMainTab === 'all' || learningMainTab === 'quiz_mock') && (
          <section className="flex flex-col gap-6 animate-fadeIn">
            <QuizMockTest
              user={user}
              courses={courses}
              onOpenAITutor={onOpenAITutor}
              onToast={showToast}
            />
          </section>
        )}

        {/* =================================================== */}
        {/* VIEW: LEARNING ANALYTICS (Charts & 30-day Trends)   */}
        {/* =================================================== */}
        {(learningMainTab === 'all' || learningMainTab === 'analytics') && (
          <section className="flex flex-col gap-6 animate-fadeIn">
            <LearningAnalytics
              user={user}
              courses={courses}
              onOpenCourse={onOpenCourseModal}
              onOpenAITutor={onOpenAITutor}
            />
          </section>
        )}

        {/* =================================================== */}
        {/* VIEW: COURSES & MEDIA HUB (Videos & Labs)           */}
        {/* =================================================== */}
        {(learningMainTab === 'all' || learningMainTab === 'media_hub') && (
          <div className="flex flex-col gap-6 sm:gap-8 animate-fadeIn">
            {/* Section: Pomodoro Focus Timer Integration */}
            {showPomodoroSection && (
              <section id="pomodoro-focus-section">
                <PomodoroTimer
                  courses={courses}
                  activeCourseId={activeFocusCourseId}
                  onSelectCourse={(cId) => setActiveFocusCourseId(cId)}
                  onIdlePaused={(msg) => showToast(msg)}
                />
              </section>
            )}

            {/* Section 1: My Registered Courses */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] sm:text-[22px] font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-700">menu_book</span>
                  <span>รายวิชาที่ลงทะเบียนเรียน</span>
                </h2>
                <span className="text-[13px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                  4 รายวิชาในเทอมนี้
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => {
                  const isStarted = course.progress > 0;
                  const hasDue = course.assignmentsDue > 0;

                  return (
                    <div
                      key={course.id}
                      className={`bg-white hover:bg-slate-50/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300 border border-slate-200/80 ${
                        course.progress === 0 ? 'opacity-90' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                            style={{ backgroundColor: course.color }}
                          >
                            <span className="material-symbols-outlined text-[26px]">
                              {course.icon}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                {course.code}
                              </span>
                              <span className="text-[12px] text-slate-500">{course.instructor}</span>
                            </div>
                            <h3 className="font-bold text-[16px] sm:text-[17px] text-slate-900 group-hover:text-blue-700 transition-colors mt-0.5">
                              {course.thaiTitle}
                            </h3>
                            <span
                              className={`text-[12px] font-semibold ${
                                hasDue
                                  ? 'text-rose-600'
                                  : isStarted
                                  ? 'text-emerald-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {course.statusText}
                            </span>
                          </div>
                        </div>
                        <span
                          className="font-bold text-[16px]"
                          style={{ color: course.color }}
                        >
                          {course.progress}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative z-10 border border-slate-200">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${course.progress}%`,
                            backgroundColor: course.color,
                          }}
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-3 gap-2 relative z-10">
                        <button
                          onClick={() => onOpenCourseModal(course)}
                          className={`py-2.5 rounded-xl font-bold text-[12px] sm:text-[13px] transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-98 cursor-pointer ${
                            course.progress > 0
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span>{course.progress > 0 ? 'เข้าเรียนต่อ' : 'เริ่มเรียน'}</span>
                          <span className="material-symbols-outlined text-[15px]">
                            {course.progress > 0 ? 'play_arrow' : 'arrow_forward'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveFocusCourseId(course.id);
                            setShowPomodoroSection(true);
                            const el = document.getElementById('pomodoro-focus-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                            showToast(`ตั้งค่าช่วงเวลาโฟกัสสำหรับวิชา: ${course.thaiTitle}`);
                          }}
                          className="py-2.5 rounded-xl font-bold text-[12px] sm:text-[13px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-98 cursor-pointer"
                          title="เริ่มจับเวลาโฟกัสวิชานี้ด้วย Pomodoro"
                        >
                          <span>🍅</span>
                          <span>โฟกัสวิชานี้</span>
                        </button>

                        {onOpenAITutor && (
                          <button
                            onClick={() => onOpenAITutor(course)}
                            className="py-2.5 rounded-xl font-bold text-[12px] sm:text-[13px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-98 cursor-pointer"
                            title="ถาม AI Tutor สำหรับวิชานี้"
                          >
                            <span className="material-symbols-outlined text-[15px] text-amber-500">auto_awesome</span>
                            <span>AI Tutor</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

        {/* Section 2: Real Digital Learning Media Gallery */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="material-symbols-outlined text-[22px] block">smart_display</span>
                </span>
                <h2 className="text-[20px] sm:text-[22px] font-bold text-slate-900">
                  คลังสื่อการเรียนรู้วิชาการจริง (Verified Learning Media)
                </h2>
              </div>
              <p className="text-[13px] text-slate-500 mt-0.5">
                วิดีโอบรรยายเต็ม, เอกสารสรุปสูตร PDF, สไลด์บทเรียน และตัวอย่างจริงจากสถาบันการศึกษาชั้นนำ
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาสื่อ, วิดีโอ, รหัสวิชา..."
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-[13px] rounded-xl py-2 pl-9 pr-3 shadow-2xs border border-slate-200 focus:border-blue-600 focus:outline-none"
              />
              <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-2.5 top-2.5 pointer-events-none">
                search
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Bars */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            {/* Subject Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase px-1 shrink-0">
                วิชา:
              </span>
              <button
                onClick={() => setSelectedSubjectFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedSubjectFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({MOCK_LEARNING_MEDIA.length})
              </button>
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedSubjectFilter(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedSubjectFilter === c.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>{c.thaiTitle}</span>
                </button>
              ))}
            </div>

            {/* Media Type Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase px-1 shrink-0">
                ประเภท:
              </span>
              <button
                onClick={() => setSelectedTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedTypeFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทุกประเภท
              </button>
              <button
                onClick={() => setSelectedTypeFilter('video')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  selectedTypeFilter === 'video'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">videocam</span>
                <span>วิดีโอบรรยาย</span>
              </button>
              <button
                onClick={() => setSelectedTypeFilter('document')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  selectedTypeFilter === 'document'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">description</span>
                <span>PDF & สไลด์</span>
              </button>
              <button
                onClick={() => setSelectedTypeFilter('interactive')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  selectedTypeFilter === 'interactive'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">folder_zip</span>
                <span>คลัง Assets & Labs</span>
              </button>
            </div>
          </div>

          {/* Media Cards Grid */}
          {filteredMedia.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
                search_off
              </span>
              <p className="font-bold text-[#121b2e]">ไม่พบสื่อการเรียนรู้ที่ค้นหา</p>
              <p className="text-xs text-[#737686] mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองหมวดหมู่</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMedia.map((media) => {
                const stat = mediaStats[media.id] || {
                  views: media.viewsCount,
                  likes: media.likesCount,
                  activeViewers: 14,
                  isLiked: false,
                };
                const isLiked = stat.isLiked;
                const isCompleted = completedMediaIds[media.id];
                const isJustViewed = recentlyIncrementedId === media.id;

                return (
                  <div
                    key={media.id}
                    onClick={() => handleOpenMedia(media)}
                    className="bg-white hover:bg-slate-50/80 rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer relative"
                  >
                    {/* Media Thumbnail & Badges */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                      <img
                        src={media.thumbnail}
                        alt={media.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                      {/* Top Left Badges: Type & Course */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">
                            {media.type === 'video'
                              ? 'play_circle'
                              : media.type === 'pdf'
                              ? 'picture_as_pdf'
                              : media.type === 'slide'
                              ? 'slideshow'
                              : 'folder_zip'}
                          </span>
                          <span>{media.type}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#1550d3] text-white text-[10px] font-bold shadow-xs">
                          {media.courseCode}
                        </span>
                      </div>

                      {/* Top Right: Live Active Viewers Badge */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-md text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        <span>{stat.activeViewers} กำลังดูสด</span>
                      </div>

                      {/* Duration / Pages Badge */}
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[11px] font-mono font-medium">
                        {media.durationOrPages}
                      </div>

                      {/* Play Hover Icon */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-[#1550d3] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-[28px] pl-0.5">
                            {media.type === 'video' ? 'play_arrow' : 'visibility'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 flex flex-col flex-grow justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-[#737686] mb-1">
                          <span className="font-semibold text-[#1550d3]">{media.courseTitle}</span>
                          <span>{media.publishedDate}</span>
                        </div>
                        <h3 className="font-bold text-[14px] text-[#121b2e] leading-snug group-hover:text-[#1550d3] transition-colors line-clamp-2">
                          {media.title}
                        </h3>
                        <p className="text-[12px] text-[#434654] mt-1 line-clamp-2 leading-relaxed">
                          {media.description}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {media.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-[#434654] text-[10px] font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Footer & Real-Time Stats (Views & Likes) */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#737686]">
                        <div className="flex items-center gap-3">
                          {/* Real-time View Count */}
                          <span
                            title="ยอดเข้าชมแบบเรียลไทม์ (Real-time Views)"
                            className={`flex items-center gap-1 font-medium transition-colors ${
                              isJustViewed ? 'text-emerald-600 font-bold' : 'text-slate-600'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px] text-slate-500">
                              visibility
                            </span>
                            <span className="font-mono tracking-tight font-semibold">
                              {stat.views.toLocaleString()}
                            </span>
                          </span>

                          {/* Real-time Heart / Like Button */}
                          <button
                            type="button"
                            title={isLiked ? 'ยกเลิกการถูกใจ' : 'กดถูกใจ (Real-time)'}
                            onClick={(e) => handleToggleLike(media.id, e)}
                            className={`flex items-center gap-1 transition-all px-1.5 py-0.5 rounded-md cursor-pointer ${
                              isLiked
                                ? 'text-rose-600 font-bold bg-rose-50'
                                : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/60'
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[14px] transition-transform active:scale-125 ${
                                isLiked ? 'fill-1 text-rose-500' : ''
                              }`}
                            >
                              favorite
                            </span>
                            <span className="font-mono tracking-tight font-semibold">
                              {stat.likes.toLocaleString()}
                            </span>
                          </button>
                        </div>

                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#00694d] text-[10px] font-bold flex items-center gap-0.5 border border-emerald-200">
                            <span className="material-symbols-outlined text-[12px]">check</span>
                            <span>เรียนจบแล้ว</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1550d3] text-[10px] font-bold flex items-center gap-0.5">
                            <span>สื่อพร้อมเรียน</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 3: Academic Overview & Semester Progress */}
        <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-[19px] sm:text-[21px] font-bold text-[#121b2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1550d3]">school</span>
                <span>สรุปข้อมูลการศึกษา & สถิติวิชาการประจำภาคเรียน</span>
              </h2>
              <p className="text-xs text-[#737686] mt-0.5">
                ภาคเรียนที่ 1/2569 • แผนการเรียนวิทยาศาสตร์-คอมพิวเตอร์และปัญญาประดิษฐ์
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-[#00694d] text-xs font-bold border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#20C997] animate-pulse"></span>
                <span>สถานะ: กำลังศึกษาปกติ</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#f8faff] border border-blue-100/60 flex flex-col justify-between">
              <div className="text-[12px] font-semibold text-[#737686] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#1550d3]">menu_book</span>
                <span>รายวิชาที่ลงทะเบียน</span>
              </div>
              <div className="text-[22px] font-bold text-[#121b2e] mt-2 font-mono">4 รายวิชา</div>
              <div className="text-[11px] text-[#1550d3] font-medium mt-1">12 หน่วยกิตสะสม</div>
            </div>

            <div
              onClick={() => onOpenGpaModal && onOpenGpaModal()}
              className={`p-4 rounded-2xl bg-[#f8faff] border border-blue-100/60 flex flex-col justify-between transition-all ${
                onOpenGpaModal ? 'cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-200 hover:shadow-xs group' : ''
              }`}
            >
              <div className="text-[12px] font-semibold text-[#737686] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                  <span>เกรดเฉลี่ยสะสม (GPAX)</span>
                </span>
                {onOpenGpaModal && (
                  <span className="text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 font-bold transition-opacity">
                    ดูกราฟ ➔
                  </span>
                )}
              </div>
              <div className="text-[22px] font-bold text-emerald-600 mt-2 font-mono">
                {user.gpa ? user.gpa.toFixed(2) : '3.92'}
              </div>
              <div className="text-[11px] text-[#00694d] font-medium mt-1">ผลการเรียนยอดเยี่ยม (เกียรตินิยม)</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8faff] border border-blue-100/60 flex flex-col justify-between">
              <div className="text-[12px] font-semibold text-[#737686] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-purple-600">assignment_turned_in</span>
                <span>อัตราส่งงานตรงเวลา</span>
              </div>
              <div className="text-[22px] font-bold text-[#121b2e] mt-2 font-mono">96.5%</div>
              <div className="text-[11px] text-purple-600 font-medium mt-1">ส่งครบ 22/23 งาน</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8faff] border border-blue-100/60 flex flex-col justify-between">
              <div className="text-[12px] font-semibold text-[#737686] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-amber-600">how_to_reg</span>
                <span>เวลาเรียนสะสม</span>
              </div>
              <div className="text-[22px] font-bold text-[#121b2e] mt-2 font-mono">98.2%</div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">ผ่านเกณฑ์ขั้นต่ำ 80%</div>
            </div>
          </div>
        </section>
      </div>
      )}
    </div>

      {/* ------------------------------------------------------------- */}
      {/* REAL DIGITAL LEARNING MEDIA MODAL (Live YouTube / PDF / Labs) */}
      {/* ------------------------------------------------------------- */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[94vh] animate-scaleIn">
            {/* Modal Header Bar with Real-time Stats */}
            <div className="px-5 py-3.5 bg-[#121b2e] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#1550d3] text-white text-[11px] font-bold shrink-0">
                  {selectedMedia.courseCode}
                </span>
                <h3 className="font-bold text-[14px] sm:text-[16px] truncate">
                  {selectedMedia.title}
                </h3>
              </div>

              {/* Real-time stats ticker in Modal Header */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Active Viewers */}
                <span className="px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{mediaStats[selectedMedia.id]?.activeViewers || 16} คนกำลังดูสด</span>
                </span>

                {/* Real-time Views */}
                <span
                  title="ยอดเข้าชมแบบเรียลไทม์"
                  className="flex items-center gap-1 text-xs text-slate-300 font-mono bg-white/10 px-2.5 py-1 rounded-lg"
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-400">visibility</span>
                  <span>{(mediaStats[selectedMedia.id]?.views || selectedMedia.viewsCount).toLocaleString()}</span>
                </span>

                {/* Real-time Heart Like Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleLike(selectedMedia.id)}
                  className={`flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    mediaStats[selectedMedia.id]?.isLiked
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-white/10 text-slate-300 hover:bg-rose-500/30 hover:text-rose-300'
                  }`}
                  title={mediaStats[selectedMedia.id]?.isLiked ? 'ยกเลิกการถูกใจ' : 'กดถูกใจ (Real-time)'}
                >
                  <span className={`material-symbols-outlined text-[16px] ${mediaStats[selectedMedia.id]?.isLiked ? 'fill-1' : ''}`}>
                    favorite
                  </span>
                  <span>{(mediaStats[selectedMedia.id]?.likes || selectedMedia.likesCount).toLocaleString()}</span>
                </button>

                <button
                  onClick={() => setSelectedMedia(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 ml-1 cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 gap-2 sm:gap-4 text-xs font-bold">
              <button
                onClick={() => setActiveTabInModal('content')}
                className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTabInModal === 'content'
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {selectedMedia.type === 'video' ? 'play_circle' : 'visibility'}
                </span>
                <span>{selectedMedia.type === 'video' ? 'วิดีโอบรรยายสด' : 'เนื้อหา & สื่อการเรียน'}</span>
              </button>

              <button
                onClick={() => setActiveTabInModal('summary')}
                className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTabInModal === 'summary'
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                <span>สรุปบทเรียน & สูตรคำนวณ</span>
              </button>

              <button
                onClick={() => setActiveTabInModal('notes')}
                className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTabInModal === 'notes'
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>สมุดจดบันทึก ({savedNotes[selectedMedia.id]?.length || 0})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
              {activeTabInModal === 'content' && (
                <>
                  {/* Real Video Player via YouTube Embed */}
                  {selectedMedia.type === 'video' && selectedMedia.youtubeId ? (
                    <div className="flex flex-col gap-3">
                      <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden shadow-lg border border-slate-800">
                        <iframe
                          src={`https://www.youtube.com/embed/${selectedMedia.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                          title={selectedMedia.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      </div>

                      {/* Video Stream Actions & External Link */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-red-600">timer</span>
                            {selectedMedia.durationOrPages}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            HD 1080p Stream
                          </span>
                        </div>

                        <a
                          href={`https://www.youtube.com/watch?v=${selectedMedia.youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          title="เปิดชมวิดีโอแบบเต็มจอบน YouTube"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          <span>เปิดดูบน YouTube โดยตรง</span>
                        </a>
                      </div>

                      {/* Chapters / Timestamps if available */}
                      {selectedMedia.chapters && (
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                          <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-blue-700">
                              format_list_bulleted
                            </span>
                            <span>สารบัญบทเรียนย่อย (Chapters Timeline)</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                            {selectedMedia.chapters.map((ch, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setCurrentChapterIndex(idx);
                                  showToast(`กำลังข้ามไปยัง: ${ch.title} (${ch.time})`);
                                }}
                                className={`p-2 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                                  currentChapterIndex === idx
                                    ? 'bg-slate-900 text-white font-bold'
                                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                                }`}
                              >
                                <span className="truncate pr-2">{ch.title}</span>
                                <span className="font-mono text-[11px] opacity-80 shrink-0">
                                  {ch.time}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : selectedMedia.type === 'pdf' || selectedMedia.type === 'slide' ? (
                    /* PDF Document Preview & Highlights */
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-blue-700 text-[24px]">
                            description
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{selectedMedia.title}</h4>
                            <p className="text-xs text-slate-500">เอกสารการสอนฉบับสมบูรณ์ • {selectedMedia.durationOrPages}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadMaterial(selectedMedia)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          <span>ดาวน์โหลด PDF</span>
                        </button>
                      </div>

                      {selectedMedia.pdfContent && (
                        <div className="flex flex-col gap-3">
                          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
                            <span className="font-bold block mb-1">📌 สรุปใจความสำคัญ (Summary):</span>
                            {selectedMedia.pdfContent.summary}
                          </div>

                          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-2">
                            <span className="font-bold text-xs text-slate-800">หัวข้อหลักในเอกสาร:</span>
                            <ul className="space-y-1.5 text-xs text-slate-600">
                              {selectedMedia.pdfContent.keyPoints.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-700 font-bold">✓</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Audio / Asset Package Viewer */
                    <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col gap-4 shadow-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[28px]">graphic_eq</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-base">{selectedMedia.title}</h4>
                            <p className="text-xs text-slate-400">{selectedMedia.durationOrPages} • {selectedMedia.fileSize}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadMaterial(selectedMedia)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">cloud_download</span>
                          <span>ดาวน์โหลดไฟล์ (.ZIP)</span>
                        </button>
                      </div>

                      <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 leading-relaxed">
                        <p>{selectedMedia.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="px-2 py-1 rounded bg-slate-700 text-xs">WAV 48kHz 24-bit</span>
                          <span className="px-2 py-1 rounded bg-slate-700 text-xs">MP3 320kbps</span>
                          <span className="px-2 py-1 rounded bg-slate-700 text-xs">Royalty Free</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTabInModal === 'summary' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-blue-700">auto_awesome</span>
                      <span>สาระสำคัญและสูตรที่ต้องรู้</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {selectedMedia.description}
                    </p>

                    {selectedMedia.pdfContent?.formulas && (
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2">
                        <span className="font-bold text-xs text-slate-800">สูตรสำคัญประจำบทเรียน:</span>
                        <div className="space-y-1 font-mono text-xs text-blue-800 bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                          {selectedMedia.pdfContent.formulas.map((f, idx) => (
                            <div key={idx}>• {f}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTabInModal === 'notes' && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                      placeholder="พิมพ์โน้ตสรุปช่วยจำของคุณสำหรับบทเรียนนี้..."
                      className="flex-1 bg-slate-50 text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      onClick={handleSaveNote}
                      className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer shadow-xs"
                    >
                      บันทึกโน้ต
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {(savedNotes[selectedMedia.id] || []).length > 0 ? (
                      savedNotes[selectedMedia.id].map((n, i) => (
                        <div
                          key={i}
                          className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-800 flex items-center justify-between"
                        >
                          <span>{n}</span>
                          <span className="text-[10px] text-slate-400">จดแล้ว</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        ยังไม่มีบันทึกช่วยจำ พิมพ์และกดบันทึกได้เลย
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Author & Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">school</span>
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      {selectedMedia.author}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {selectedMedia.courseTitle} • เผยแพร่ {selectedMedia.publishedDate}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Ask AI Tutor */}
                  {onOpenAITutor && (
                    <button
                      onClick={() => {
                        const course = courses.find((c) => c.id === selectedMedia.courseId);
                        onOpenAITutor(course || null);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-300 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-amber-500">auto_awesome</span>
                      <span>ถาม AI Tutor</span>
                    </button>
                  )}

                  {/* Complete & Earn XP Button */}
                  <button
                    onClick={() => handleCompleteMedia(selectedMedia)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                      completedMediaIds[selectedMedia.id]
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {completedMediaIds[selectedMedia.id] ? 'check_circle' : 'verified'}
                    </span>
                    <span>
                      {completedMediaIds[selectedMedia.id]
                        ? 'เรียนจบเนื้อหานี้แล้ว'
                        : 'ทำเครื่องหมายว่าเรียนจบ'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>ขนาดไฟล์ / ความละเอียด: {selectedMedia.fileSize || 'Online Resource'}</span>
              <button
                onClick={() => setSelectedMedia(null)}
                className="px-4 py-1.5 rounded-lg bg-white text-slate-700 font-bold border border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
