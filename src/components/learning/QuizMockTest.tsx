import React, { useState, useEffect, useMemo } from 'react';
import { QuizMockSet, QuizQuestion, Course, UserProfile, QuizUserAttempt } from '../../types';
import { MOCK_QUIZ_SETS, MOCK_QUIZ_QUESTIONS } from '../../data/mockQuizData';
import { playNotificationChime } from '../../utils/sound';

interface QuizMockTestProps {
  user: UserProfile;
  courses: Course[];
  onOpenAITutor?: (course?: Course) => void;
  onToast: (message: string) => void;
}

export const QuizMockTest: React.FC<QuizMockTestProps> = ({
  user,
  courses,
  onOpenAITutor,
  onToast,
}) => {
  // Navigation & Mode State
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [activeQuizSet, setActiveQuizSet] = useState<QuizMockSet | null>(null);
  const [isExamRunning, setIsExamRunning] = useState<boolean>(false);
  const [isExamCompleted, setIsExamCompleted] = useState<boolean>(false);
  const [isTimedMode, setIsTimedMode] = useState<boolean>(true);

  // Active Exam Progress
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);

  // History & Attempts Cache in LocalStorage
  const [attemptsHistory, setAttemptsHistory] = useState<QuizUserAttempt[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_quiz_attempts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [lastAttemptResult, setLastAttemptResult] = useState<QuizUserAttempt | null>(null);

  // Filtered Quiz Sets
  const filteredQuizSets = useMemo(() => {
    return MOCK_QUIZ_SETS.filter((set) => {
      const matchesCourse =
        selectedCourseFilter === 'all' || set.courseId === selectedCourseFilter || (selectedCourseFilter === 'cs-1' && set.courseId === 'cs-1');
      const matchesCategory =
        selectedCategoryFilter === 'all' || set.category === selectedCategoryFilter;
      return matchesCourse && matchesCategory;
    });
  }, [selectedCourseFilter, selectedCategoryFilter]);

  // Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isExamRunning && !isExamCompleted) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        if (isTimedMode) {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              // Auto submit when time expires
              handleFinishExam(true);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isExamRunning, isExamCompleted, isTimedMode]);

  const handleStartExam = (quizSet: QuizMockSet, timed: boolean = true) => {
    setActiveQuizSet(quizSet);
    setIsTimedMode(timed);
    setRemainingSeconds(quizSet.timeLimitMinutes * 60);
    setElapsedSeconds(0);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setIsExamCompleted(false);
    setIsExamRunning(true);
    setLastAttemptResult(null);
    onToast(`🚀 เริ่มทำข้อสอบ: ${quizSet.title}`);
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const next = !prev[questionId];
      onToast(next ? '🚩 ติดธงข้อนี้ไว้เพื่อกลับมาทบทวน' : 'ปลดธงข้อนี้เรียบร้อย');
      return { ...prev, [questionId]: next };
    });
  };

  const handleFinishExam = (isTimeout: boolean = false) => {
    if (!activeQuizSet) return;

    // Calculate Scores
    let earnedPoints = 0;
    let totalPoints = 0;

    activeQuizSet.questions.forEach((q) => {
      totalPoints += q.points;
      if (userAnswers[q.id] === q.correctOptionId) {
        earnedPoints += q.points;
      }
    });

    const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = scorePercentage >= activeQuizSet.passingScorePercent;
    const xpEarned = passed ? 50 + earnedPoints * 2 : 20;

    const newAttempt: QuizUserAttempt = {
      id: `attempt-${Date.now()}`,
      quizSetId: activeQuizSet.id,
      quizTitle: activeQuizSet.title,
      courseCode: activeQuizSet.courseCode,
      userId: user.id || 'student-current',
      startedAt: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      answers: userAnswers,
      flags: flaggedQuestions,
      score: earnedPoints,
      totalPoints,
      scorePercentage,
      passed,
      timeSpentSeconds: elapsedSeconds,
      xpEarned,
    };

    const updatedHistory = [newAttempt, ...attemptsHistory];
    setAttemptsHistory(updatedHistory);
    try {
      localStorage.setItem('nexus_quiz_attempts', JSON.stringify(updatedHistory.slice(0, 30)));
    } catch {
      // Storage safe
    }

    setLastAttemptResult(newAttempt);
    setIsExamRunning(false);
    setIsExamCompleted(true);
    setShowSubmitConfirmModal(false);

    playNotificationChime(passed ? 'high' : 'normal');
    if (isTimeout) {
      onToast('⏰ หมดเวลาทำข้อสอบ! ระบบได้ตรวจคำตอบและสรุปคะแนนเรียบร้อยแล้ว');
    } else {
      onToast(passed ? `🎉 ยอดเยี่ยม! คุณสอบผ่านได้ ${scorePercentage}% (+${xpEarned} XP)` : `สรุปผลการทดสอบ: ได้คะแนน ${scorePercentage}%`);
    }
  };

  const currentQuestion: QuizQuestion | undefined =
    activeQuizSet?.questions[currentQuestionIndex];

  const totalAnsweredCount = Object.keys(userAnswers).length;
  const totalQuestionsCount = activeQuizSet?.questions.length || 0;
  const unansweredCount = totalQuestionsCount - totalAnsweredCount;

  // Format Time Helper
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // VIEW 1: RESULTS & REVIEW SCREEN
  // -------------------------------------------------------------
  if (isExamCompleted && lastAttemptResult && activeQuizSet) {
    return (
      <div className="flex flex-col gap-6 animate-fadeIn w-full max-w-5xl mx-auto">
        {/* Result Header Hero Card */}
        <div className="bg-gradient-to-br from-[#121b2e] via-[#1a263d] to-[#1550d3] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col gap-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <span className="text-xs font-bold px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-blue-200">
                  {activeQuizSet.courseCode} • {activeQuizSet.courseTitle}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    lastAttemptResult.passed
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                      : 'bg-rose-500/30 text-rose-300 border border-rose-400/40'
                  }`}
                >
                  {lastAttemptResult.passed ? '✓ ผ่านเกณฑ์มาตรฐาน' : '✕ ยังไม่ผ่านเกณฑ์ (ต้องทบทวน)'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1 leading-tight">
                {activeQuizSet.title}
              </h2>
              <p className="text-white/80 text-sm max-w-xl">
                {lastAttemptResult.passed
                  ? 'คุณมีความเข้าใจในบทเรียนนี้เป็นอย่างดี สามารถนำองค์ความรู้ไปต่อยอดในคาบเรียนและงานชิ้นถัดไปได้ทันที'
                  : 'แนะนำให้ทบทวนหัวข้อที่ตอบผิดด้านล่าง หรือใช้ฟังก์ชันผู้ช่วย AI Tutor เพื่อขอคำอธิบายเพิ่มเติม'}
              </p>
            </div>

            {/* Score Ring / Metric */}
            <div className="flex items-center gap-4 sm:gap-6 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">
                  {lastAttemptResult.score} / {lastAttemptResult.totalPoints}
                </span>
                <span className="text-xs font-bold text-blue-200">
                  คะแนนที่ได้ ({lastAttemptResult.scorePercentage}%)
                </span>
              </div>
              <div className="h-10 w-px bg-white/20"></div>
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-bold text-amber-400 flex items-center gap-1">
                  +{lastAttemptResult.xpEarned} <span className="text-xs font-normal text-white">XP</span>
                </span>
                <span className="text-xs text-white/70">
                  ใช้เวลา {formatTimer(lastAttemptResult.timeSpentSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-white/15 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setIsExamCompleted(false);
                setIsExamRunning(false);
                setActiveQuizSet(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>กลับสู่หน้ารวมข้อสอบ</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartExam(activeQuizSet, isTimedMode)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                <span>ทำข้อสอบชุดนี้ใหม่อีกครั้ง</span>
              </button>

              {onOpenAITutor && (
                <button
                  type="button"
                  onClick={() => {
                    const relatedCourse = courses.find((c) => c.id === activeQuizSet.courseId);
                    onOpenAITutor(relatedCourse);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  <span>ปรึกษา AI Tutor ข้อที่สงสัย</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1550d3]">fact_check</span>
              <span>เฉลยคำตอบพร้อมคำอธิบายละเอียด (Question Review)</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              ข้อที่ตอบถูก {activeQuizSet.questions.filter((q) => lastAttemptResult.answers[q.id] === q.correctOptionId).length} จาก {activeQuizSet.questions.length} ข้อ
            </span>
          </div>

          <div className="space-y-4">
            {activeQuizSet.questions.map((q, idx) => {
              const userAnswerId = lastAttemptResult.answers[q.id];
              const isCorrect = userAnswerId === q.correctOptionId;

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl p-5 sm:p-6 border transition-all ${
                    isCorrect
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-rose-50/70 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                          isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {q.topic}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {q.points} คะแนน
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isCorrect ? 'check_circle' : 'cancel'}
                      </span>
                      <span>{isCorrect ? 'ตอบถูกต้อง' : 'ตอบผิด'}</span>
                    </span>
                  </div>

                  <p className="text-slate-900 font-bold text-sm sm:text-base mb-3 leading-relaxed">
                    {q.question}
                  </p>

                  {q.codeSnippet && (
                    <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs overflow-x-auto mb-4 border border-slate-800">
                      <code>{q.codeSnippet}</code>
                    </pre>
                  )}

                  {/* Options Review Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                    {q.options.map((opt) => {
                      const isUserChoice = opt.id === userAnswerId;
                      const isCorrectChoice = opt.id === q.correctOptionId;

                      let optBg = 'bg-white border-slate-200 text-slate-700';
                      if (isCorrectChoice) {
                        optBg = 'bg-emerald-100/80 border-emerald-400 text-emerald-950 font-bold';
                      } else if (isUserChoice && !isCorrect) {
                        optBg = 'bg-rose-100/80 border-rose-400 text-rose-950 font-medium line-through';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${optBg}`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5 ${
                              isCorrectChoice
                                ? 'bg-emerald-600 text-white'
                                : isUserChoice
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {opt.id.replace('opt-', '').toUpperCase()}
                          </span>
                          <span className="flex-1 leading-normal">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  <div className="bg-white/90 rounded-xl p-3.5 border border-slate-200/80 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1550d3]">
                      <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                      <span>คำอธิบายเฉลยและหลักการ:</span>
                    </div>
                    <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                      {q.explanation}
                    </p>
                    {q.relatedFormulaOrTip && (
                      <div className="mt-1 pt-1.5 border-t border-slate-100 text-[11px] font-mono text-purple-700 font-semibold">
                        💡 {q.relatedFormulaOrTip}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ACTIVE EXAM RUNNER (ข้อสอบที่กำลังทำอยู่)
  // -------------------------------------------------------------
  if (isExamRunning && activeQuizSet && currentQuestion) {
    const isLastQuestion = currentQuestionIndex === activeQuizSet.questions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;
    const isCurrentFlagged = !!flaggedQuestions[currentQuestion.id];
    const selectedOption = userAnswers[currentQuestion.id];

    return (
      <div className="flex flex-col gap-6 animate-fadeIn w-full max-w-4xl mx-auto">
        {/* Top Control Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1550d3] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[24px]">quiz</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {activeQuizSet.courseCode} • {activeQuizSet.courseTitle}
              </span>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
                {activeQuizSet.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Timer Badge */}
            {isTimedMode ? (
              <div
                className={`px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold flex items-center gap-1.5 border ${
                  remainingSeconds < 120
                    ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                    : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span>{formatTimer(remainingSeconds)}</span>
              </div>
            ) : (
              <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">all_inclusive</span>
                <span>โหมดฝึกฝน (ไม่จำกัดเวลา)</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSubmitConfirmModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              ส่งข้อสอบ ({totalAnsweredCount}/{totalQuestionsCount})
            </button>
          </div>
        </div>

        {/* Progress Bar & Quick Question Jump Pallet */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>
              ข้อที่ {currentQuestionIndex + 1} จากทั้งหมด {totalQuestionsCount} ข้อ
            </span>
            <span className="text-[#1550d3]">
              ตอบแล้ว {totalAnsweredCount} ข้อ ({Math.round((totalAnsweredCount / totalQuestionsCount) * 100)}%)
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#1550d3] h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestionsCount) * 100}%` }}
            ></div>
          </div>

          {/* Quick Navigator Pallet */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {activeQuizSet.questions.map((q, idx) => {
              const isAnswered = !!userAnswers[q.id];
              const isCurrent = idx === currentQuestionIndex;
              const isFlagged = !!flaggedQuestions[q.id];

              let btnClass = 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
              if (isCurrent) {
                btnClass = 'bg-[#1550d3] text-white border-[#1550d3] shadow-xs scale-105';
              } else if (isFlagged) {
                btnClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
              } else if (isAnswered) {
                btnClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold border flex items-center justify-center transition-all cursor-pointer relative ${btnClass}`}
                  title={`ไปยังข้อ ${idx + 1}`}
                >
                  <span>{idx + 1}</span>
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Question Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col gap-6">
          {/* Question Header & Meta */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1550d3] border border-blue-100">
                ข้อ {currentQuestionIndex + 1}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                หัวข้อ: {currentQuestion.topic}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  currentQuestion.difficulty === 'easy'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                ระดับ: {currentQuestion.difficulty.toUpperCase()}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleToggleFlag(currentQuestion.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isCurrentFlagged
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isCurrentFlagged ? 'flag' : 'outlined_flag'}
              </span>
              <span>{isCurrentFlagged ? 'ติดธงไว้แล้ว' : 'ติดธงทบทวน'}</span>
            </button>
          </div>

          {/* Question Text */}
          <div className="flex flex-col gap-3">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {currentQuestion.question}
            </h4>

            {currentQuestion.codeSnippet && (
              <div className="relative group">
                <pre className="bg-[#0f172a] text-slate-100 p-4 rounded-2xl font-mono text-xs sm:text-sm overflow-x-auto border border-slate-800 shadow-inner">
                  <code>{currentQuestion.codeSnippet}</code>
                </pre>
                <span className="absolute top-2 right-3 text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                  TypeScript / Logic
                </span>
              </div>
            )}
          </div>

          {/* 4 Multiple Choice Options */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                  className={`w-full p-4 rounded-2xl text-left border text-sm sm:text-base flex items-start gap-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-[#1550d3] text-slate-950 font-bold shadow-xs ring-2 ring-[#1550d3]/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-800'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 border ${
                      isSelected
                        ? 'bg-[#1550d3] text-white border-[#1550d3]'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {option.id.replace('opt-', '').toUpperCase()}
                  </div>
                  <span className="flex-1 leading-relaxed">{option.text}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Action Controls */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 flex-wrap">
            <button
              type="button"
              disabled={isFirstQuestion}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
                isFirstQuestion
                  ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>ข้อก่อนหน้า</span>
            </button>

            <div className="flex items-center gap-2">
              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirmModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>ตรวจคำตอบ & ส่งข้อสอบ</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestionsCount - 1, prev + 1))}
                  className="px-6 py-2.5 rounded-xl bg-[#1550d3] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>ข้อถัดไป</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitConfirmModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col gap-4 animate-scaleUp">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto font-bold">
                <span className="material-symbols-outlined text-[28px]">verified</span>
              </div>

              <div className="text-center flex flex-col gap-1">
                <h3 className="text-lg font-bold text-slate-900">
                  ยืนยันการส่งข้อสอบและตรวจผลคะแนน?
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm">
                  {unansweredCount > 0
                    ? `⚠️ คุณยังไม่ได้ตอบข้อสอบอีก ${unansweredCount} ข้อ ต้องการส่งตรวจทันทีหรือไม่?`
                    : 'คุณตอบข้อสอบครบทุกข้อแล้ว ระบบจะทำการประมวลผลคะแนนและแสดงเฉลยละเอียดทันที'}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span>ข้อสอบทั้งหมด:</span>
                  <span className="font-bold text-slate-900">{totalQuestionsCount} ข้อ</span>
                </div>
                <div className="flex justify-between">
                  <span>ตอบแล้ว:</span>
                  <span className="font-bold text-emerald-600">{totalAnsweredCount} ข้อ</span>
                </div>
                {unansweredCount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>ยังไม่ตอบ:</span>
                    <span>{unansweredCount} ข้อ</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirmModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  กลับไปทำต่อ
                </button>
                <button
                  type="button"
                  onClick={() => handleFinishExam(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  ยืนยันส่งข้อสอบ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: QUIZ CATALOG & SET SELECTOR (หน้ารายการชุดข้อสอบ)
  // -------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-fadeIn w-full">
      {/* Hero Banner with Stats */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 relative z-10 max-w-xl">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 border border-white/10 w-fit text-slate-200 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-blue-400">school</span>
            <span>คลังข้อสอบวัดผลสัมฤทธิ์ Smart Quiz System</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-white">
            ทำข้อสอบจำลองรายบทเรียน (Quiz Mock Test)
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            เลือกรายวิชาและชุดข้อสอบมาตรฐานเพื่อทดสอบความรู้ล่วงหน้า พร้อมระบบจับเวลา วิเคราะห์ข้อผิดพลาด และเฉลยละเอียดทุกข้อ
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-3 relative z-10 shrink-0 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
          <div className="flex flex-col items-center px-2">
            <span className="text-2xl font-extrabold text-white">
              {MOCK_QUIZ_SETS.length}
            </span>
            <span className="text-[11px] text-slate-400">ชุดข้อสอบพร้อมสอบ</span>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="flex flex-col items-center px-2">
            <span className="text-2xl font-extrabold text-amber-400">
              {MOCK_QUIZ_QUESTIONS.length}
            </span>
            <span className="text-[11px] text-slate-400">ข้อสอบในคลัง</span>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="flex flex-col items-center px-2">
            <span className="text-2xl font-extrabold text-emerald-400">
              {attemptsHistory.length}
            </span>
            <span className="text-[11px] text-slate-400">ครั้งที่ทดสอบแล้ว</span>
          </div>
        </div>
      </div>

      {/* Filter & Subject Selection Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Subject Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCourseFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCourseFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ทุกรายวิชา (All)
          </button>
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCourseFilter(c.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCourseFilter === c.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{c.icon}</span>
              <span>{c.code} {c.thaiTitle}</span>
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">ประเภท:</span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            aria-label="เลือกประเภทชุดข้อสอบ"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกประเภทข้อสอบ</option>
            <option value="unit_test">แบบทดสอบประจำบท (Unit Test)</option>
            <option value="midterm_prep">เตรียมสอบกลางภาค (Midterm)</option>
            <option value="final_exam">เตรียมสอบปลายภาค (Final Exam)</option>
          </select>
        </div>
      </div>

      {/* Quiz Sets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredQuizSets.map((quizSet) => {
          const pastAttempt = attemptsHistory.find((a) => a.quizSetId === quizSet.id);

          return (
            <div
              key={quizSet.id}
              className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border border-slate-200 flex flex-col justify-between gap-5 group"
            >
              <div className="flex flex-col gap-3">
                {/* Meta Badges */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1550d3] font-mono text-xs font-bold">
                      {quizSet.courseCode}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        quizSet.difficulty === 'standard'
                          ? 'bg-emerald-50 text-emerald-700'
                          : quizSet.difficulty === 'advanced'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {quizSet.difficulty === 'standard'
                        ? 'ระดับมาตรฐาน'
                        : quizSet.difficulty === 'advanced'
                        ? 'ระดับเข้มข้น'
                        : 'ระดับท้าทาย'}
                    </span>
                  </div>

                  {pastAttempt && (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        pastAttempt.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {pastAttempt.passed ? 'check_circle' : 'cancel'}
                      </span>
                      <span>คะแนนล่าสุด: {pastAttempt.scorePercentage}%</span>
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-[#1550d3] transition-colors leading-snug">
                  {quizSet.title}
                </h3>

                <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                  {quizSet.description}
                </p>

                {/* Specs info */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-blue-600">help</span>
                    <span>{quizSet.totalQuestions} ข้อ</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">timer</span>
                    <span>{quizSet.timeLimitMinutes} นาที</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">award_star</span>
                    <span>เกณฑ์ผ่าน {quizSet.passingScorePercent}%</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleStartExam(quizSet, true)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                >
                  <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  <span>เริ่มสอบแบบจับเวลา ({quizSet.timeLimitMinutes} น.)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartExam(quizSet, false)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all cursor-pointer"
                  title="ฝึกทำข้อสอบแบบไม่จำกัดเวลา"
                >
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  <span>ฝึกทำ</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Past Attempts History Section */}
      {attemptsHistory.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1550d3]">history</span>
              <span>ประวัติการทำข้อสอบจำลองย้อนหลัง</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              บันทึก {attemptsHistory.length} ครั้งล่าสุด
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ชุดข้อสอบ</th>
                  <th className="py-2.5 px-3">รายวิชา</th>
                  <th className="py-2.5 px-3">คะแนน</th>
                  <th className="py-2.5 px-3">สถานะ</th>
                  <th className="py-2.5 px-3">เวลาที่ใช้</th>
                  <th className="py-2.5 px-3">XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attemptsHistory.slice(0, 5).map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 line-clamp-1 max-w-xs">
                      {att.quizTitle}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#1550d3]">
                      {att.courseCode}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {att.score} / {att.totalPoints} ({att.scorePercentage}%)
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          att.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {att.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {formatTimer(att.timeSpentSeconds)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-amber-600">
                      +{att.xpEarned} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
