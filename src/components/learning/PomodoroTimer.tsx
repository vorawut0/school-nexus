import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Course } from '../../types';

interface PomodoroTimerProps {
  courses?: Course[];
  activeCourseId?: string;
  onSelectCourse?: (courseId: string) => void;
  onIdlePaused?: (message: string) => void;
  className?: string;
}

type TimerMode = 'focus' | 'short_break' | 'long_break';

interface FocusLog {
  id: string;
  mode: TimerMode;
  subjectTitle: string;
  durationMinutes: number;
  completedAt: string;
  notes?: string;
}

// Built-in Web Audio API Synthesizers for Offline Sound Effects & Ambient Audio
class AudioController {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play a soothing bell chime on timer completion
  playBellChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Frequencies for a pleasant meditative bell chord: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
      const freqs = [523.25, 659.25, 783.99, 1046.5];

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.25 / (i + 1), now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 2.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 2.3);
      });
    } catch {
      // Ignore audio errors
    }
  }

  // Play a gentle soothing reminder nudge (e.g. 5-minute paused idle alert)
  playGentleNudge() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Gentle mellow arpeggio: A4 (440Hz), C#5 (554.37Hz), E5 (659.25Hz)
      const notes = [440, 554.37, 659.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.12, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 1.3);
      });
    } catch {
      // Ignore
    }
  }

  // Play click feedback
  playClick() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  // Generate real-time ambient noise (rain/white noise/cafe flow)
  startAmbient(type: 'rain' | 'white_noise' | 'waves' | 'none') {
    this.stopAmbient();
    if (type === 'none') return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      if (type === 'rain') {
        // Pink / Brown filtered rain noise
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
          b6 = white * 0.115926;
        }
      } else if (type === 'waves') {
        // Gentle wave rhythm
        for (let i = 0; i < bufferSize; i++) {
          const t = i / ctx.sampleRate;
          const waveMod = Math.sin(t * Math.PI * 0.5) * 0.5 + 0.5;
          data[i] = (Math.random() * 2 - 1) * 0.03 * (waveMod * 0.8 + 0.2);
        }
      } else {
        // Pure soft white noise
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.02;
        }
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Filter for mellow focus tone
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'rain' ? 1200 : type === 'waves' ? 800 : 2500, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      this.ambientSource = noiseSource;
      this.ambientGain = gain;
    } catch {
      // Ignore
    }
  }

  stopAmbient() {
    try {
      if (this.ambientSource) {
        (this.ambientSource as AudioBufferSourceNode).stop();
        this.ambientSource.disconnect();
        this.ambientSource = null;
      }
    } catch {
      // Ignore
    }
  }
}

const audioCtrl = new AudioController();

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  courses = [],
  activeCourseId,
  onSelectCourse,
  onIdlePaused,
  className = '',
}) => {
  // Configurable Durations (in minutes)
  const [focusDuration, setFocusDuration] = useState<number>(25);
  const [shortBreakDuration, setShortBreakDuration] = useState<number>(5);
  const [longBreakDuration, setLongBreakDuration] = useState<number>(15);

  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(focusDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [targetSessionCount, setTargetSessionCount] = useState<number>(4);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [selectedCourse, setSelectedCourse] = useState<string>(activeCourseId || (courses[0]?.id || 'custom'));
  const [taskGoal, setTaskGoal] = useState<string>('ทบทวนบทเรียนและสรุปประเด็นสำคัญ');
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'waves' | 'white_noise'>('none');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isCompact, setIsCompact] = useState<boolean>(false);

  // 5-Minute Inactivity / Paused Idle Notification State
  const [showIdlePausedToast, setShowIdlePausedToast] = useState<boolean>(false);
  const [pausedIdleSeconds, setPausedIdleSeconds] = useState<number>(0);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const hasAlertedPauseRef = useRef<boolean>(false);
  const pauseStartTimestampRef = useRef<number | null>(null);

  // History & Statistics
  const [todayFocusedMinutes, setTodayFocusedMinutes] = useState<number>(50);
  const [sessionLogs, setSessionLogs] = useState<FocusLog[]>([
    {
      id: 'log-1',
      mode: 'focus',
      subjectTitle: 'CS30201 วิทยาการคำนวณ',
      durationMinutes: 25,
      completedAt: 'วันนี้ 09:15 น.',
      notes: 'เขียนฟังก์ชันและเชื่อมต่อ API สำเร็จ',
    },
    {
      id: 'log-2',
      mode: 'focus',
      subjectTitle: 'MA30101 คณิตศาสตร์ขั้นสูง',
      durationMinutes: 25,
      completedAt: 'วันนี้ 08:30 น.',
      notes: 'ฝึกทำโจทย์แคลคูลัส 5 ข้อ',
    },
  ]);

  // Sync when activeCourseId changes
  useEffect(() => {
    if (activeCourseId) {
      setSelectedCourse(activeCourseId);
    }
  }, [activeCourseId]);

  // Current total seconds for active mode
  const currentTotalSeconds = useMemo(() => {
    switch (mode) {
      case 'focus':
        return focusDuration * 60;
      case 'short_break':
        return shortBreakDuration * 60;
      case 'long_break':
        return longBreakDuration * 60;
    }
  }, [mode, focusDuration, shortBreakDuration, longBreakDuration]);

  // Handle Mode Change
  const handleModeChange = (newMode: TimerMode) => {
    audioCtrl.playClick();
    setMode(newMode);
    setIsRunning(false);
    switch (newMode) {
      case 'focus':
        setTimeLeft(focusDuration * 60);
        break;
      case 'short_break':
        setTimeLeft(shortBreakDuration * 60);
        break;
      case 'long_break':
        setTimeLeft(longBreakDuration * 60);
        break;
    }
  };

  // Timer Tick Interval
  useEffect(() => {
    let interval: any = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Completed current session
      setIsRunning(false);
      if (soundEnabled) {
        audioCtrl.playBellChime();
      }

      if (mode === 'focus') {
        const nextCount = completedSessions + 1;
        setCompletedSessions(nextCount);
        setTodayFocusedMinutes((prev) => prev + focusDuration);

        // Find subject name
        const matchedCourse = courses.find((c) => c.id === selectedCourse);
        const subjectName = matchedCourse ? `${matchedCourse.code} ${matchedCourse.thaiTitle}` : 'วิชาส่วนตัว / กิจกรรมเรียนรู้';

        // Add Log
        const newLog: FocusLog = {
          id: `log-${Date.now()}`,
          mode: 'focus',
          subjectTitle: subjectName,
          durationMinutes: focusDuration,
          completedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
          notes: taskGoal.trim() || undefined,
        };
        setSessionLogs((prev) => [newLog, ...prev]);

        // Auto switch to break
        if (nextCount % targetSessionCount === 0) {
          setMode('long_break');
          setTimeLeft(longBreakDuration * 60);
        } else {
          setMode('short_break');
          setTimeLeft(shortBreakDuration * 60);
        }
      } else {
        // Break finished, back to focus
        setMode('focus');
        setTimeLeft(focusDuration * 60);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning,
    timeLeft,
    mode,
    completedSessions,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    targetSessionCount,
    selectedCourse,
    taskGoal,
    courses,
    soundEnabled,
  ]);

  // Ambient sound handler
  useEffect(() => {
    if (isRunning && ambientSound !== 'none') {
      audioCtrl.startAmbient(ambientSound);
    } else {
      audioCtrl.stopAmbient();
    }
    return () => {
      audioCtrl.stopAmbient();
    };
  }, [isRunning, ambientSound]);

  // Track User Inactivity and 5-Minute Paused Timer State
  useEffect(() => {
    // Initialize pause start timestamp if paused
    if (!isRunning && !pauseStartTimestampRef.current) {
      pauseStartTimestampRef.current = Date.now();
    } else if (isRunning) {
      pauseStartTimestampRef.current = null;
      hasAlertedPauseRef.current = false;
      setShowIdlePausedToast(false);
      setPausedIdleSeconds(0);
    }

    // Activity listeners to monitor idle state on the Learning View
    const handleActivity = () => {
      lastActivityTimeRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    // Check pause and idle condition every 1 second
    const interval = setInterval(() => {
      if (!isRunning && pauseStartTimestampRef.current) {
        const now = Date.now();
        const pauseElapsedSec = Math.floor((now - pauseStartTimestampRef.current) / 1000);
        const idleElapsedSec = Math.floor((now - lastActivityTimeRef.current) / 1000);
        setPausedIdleSeconds(pauseElapsedSec);

        // 5 Minutes = 300 seconds of being paused AND user being idle on the Learning View
        // (or if paused for > 300 seconds without resuming)
        if (pauseElapsedSec >= 300 && idleElapsedSec >= 300 && !hasAlertedPauseRef.current) {
          hasAlertedPauseRef.current = true;
          setShowIdlePausedToast(true);
          if (onIdlePaused) {
            onIdlePaused('ตัวจับเวลาหยุดชั่วคราวเกิน 5 นาทีแล้ว — พร้อมกลับมาโฟกัสต่อหรือยัง?');
          }
          if (soundEnabled) {
            audioCtrl.playGentleNudge();
          }
        }
      }
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearInterval(interval);
    };
  }, [isRunning, soundEnabled]);

  const togglePlayPause = () => {
    audioCtrl.playClick();
    if (!isRunning) {
      // Resuming / Starting
      setIsRunning(true);
      setShowIdlePausedToast(false);
      hasAlertedPauseRef.current = false;
      pauseStartTimestampRef.current = null;
    } else {
      // Pausing
      setIsRunning(false);
      pauseStartTimestampRef.current = Date.now();
      lastActivityTimeRef.current = Date.now();
    }
  };

  const handleReset = () => {
    audioCtrl.playClick();
    setIsRunning(false);
    setTimeLeft(currentTotalSeconds);
    pauseStartTimestampRef.current = Date.now();
    setShowIdlePausedToast(false);
  };

  const handleSkip = () => {
    audioCtrl.playClick();
    setIsRunning(false);
    pauseStartTimestampRef.current = Date.now();
    setShowIdlePausedToast(false);
    if (mode === 'focus') {
      handleModeChange('short_break');
    } else {
      handleModeChange('focus');
    }
  };

  // Formatted display values
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.max(0, ((currentTotalSeconds - timeLeft) / currentTotalSeconds) * 100));

  // Mode Theme Configuration
  const modeConfig = {
    focus: {
      title: 'ช่วงเวลาโฟกัส (Focus Time)',
      badge: 'โหมดตั้งใจเรียน',
      accentColor: '#1550d3',
      bgGradient: 'from-blue-900 via-indigo-950 to-slate-900',
      progressColor: '#3b82f6',
      icon: 'psychology',
      tagColor: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    },
    short_break: {
      title: 'พักเบรกสั้น (Short Break)',
      badge: 'ผ่อนคลายสายตา',
      accentColor: '#008562',
      bgGradient: 'from-emerald-950 via-teal-950 to-slate-900',
      progressColor: '#10b981',
      icon: 'coffee',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    },
    long_break: {
      title: 'พักผ่อนยาว (Long Break)',
      badge: 'รีชาร์จพลังงาน',
      accentColor: '#7857f8',
      bgGradient: 'from-purple-950 via-indigo-950 to-slate-900',
      progressColor: '#8b5cf6',
      icon: 'self_improvement',
      tagColor: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    },
  }[mode];

  return (
    <div
      className={`rounded-3xl bg-gradient-to-br ${modeConfig.bgGradient} text-white shadow-xl border border-white/10 relative overflow-hidden transition-all duration-500 ${className}`}
    >
      {/* Background Decorative Rings */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 p-5 sm:p-7 flex flex-col gap-5">
        {/* Header Row: Title, Mode Badges, Sound & Tools */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 text-amber-300">
              <span className="material-symbols-outlined text-[24px]">timer</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[17px] sm:text-[19px] text-white tracking-tight">
                  Pomodoro Focus Timer
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${modeConfig.tagColor}`}>
                  {modeConfig.badge}
                </span>
              </div>
              <p className="text-xs text-white/60">
                จัดการสมาธิและแบ่งช่วงเวลาอ่านหนังสืออย่างมีประสิทธิภาพ
              </p>
            </div>
          </div>

          {/* Quick Action Controls: Sounds, Compact, Settings, History */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {/* Ambient Sound Switcher */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  const next: Record<string, 'none' | 'rain' | 'waves' | 'white_noise'> = {
                    none: 'rain',
                    rain: 'waves',
                    waves: 'white_noise',
                    white_noise: 'none',
                  };
                  setAmbientSound(next[ambientSound]);
                }}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  ambientSound !== 'none'
                    ? 'bg-blue-600/40 text-blue-200 border-blue-400/50 shadow-xs'
                    : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15'
                }`}
                title="เสียงสร้างสมาธิ (Ambient Focus Sound)"
              >
                <span className="material-symbols-outlined text-[17px]">
                  {ambientSound === 'rain'
                    ? 'rainy'
                    : ambientSound === 'waves'
                    ? 'waves'
                    : ambientSound === 'white_noise'
                    ? 'air'
                    : 'graphic_eq'}
                </span>
                <span className="hidden sm:inline">
                  {ambientSound === 'rain'
                    ? 'เสียงฝน'
                    : ambientSound === 'waves'
                    ? 'คลื่นทะเล'
                    : ambientSound === 'white_noise'
                    ? 'ไวท์นอยส์'
                    : 'เสียงสร้างสมาธิ'}
                </span>
              </button>
            </div>

            {/* Sound Chime Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-white/15 text-white border-white/20'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}
              title={soundEnabled ? 'เปิดเสียงแจ้งเตือนเมื่อหมดเวลา' : 'ปิดเสียงแจ้งเตือน'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
            </button>

            {/* History Toggle */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isHistoryOpen
                  ? 'bg-white/25 text-white border-white/40'
                  : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/15'
              }`}
              title="ประวัติการอ่านหนังสือวันนี้"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
            </button>

            {/* Settings Toggle */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isSettingsOpen
                  ? 'bg-white/25 text-white border-white/40'
                  : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/15'
              }`}
              title="ตั้งค่าระยะเวลา"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </button>

            {/* Minimize / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsCompact(!isCompact)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 border border-white/10 transition-all cursor-pointer"
              title={isCompact ? 'ขยายหน้าต่างจับเวลา' : 'ย่อหน้าต่าง'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isCompact ? 'expand_more' : 'expand_less'}
              </span>
            </button>
          </div>
        </div>

        {/* Gentle Toast Notification for 5+ Minutes Inactive Paused State */}
        {showIdlePausedToast && (
          <div className="p-4 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <span className="material-symbols-outlined text-[24px]">coffee</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-amber-200">
                    หยุดตัวจับเวลาชั่วคราวเกิน 5 นาทีแล้ว
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-100 font-bold">
                    เตือนสมาธิ
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
                  คุณไม่ได้ทำกิจกรรมและหยุดตัวจับเวลาไว้เกิน 5 นาที — พร้อมกลับมาโฟกัสต่อหรือต้องการเริ่มรอบใหม่ไหม?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsRunning(true);
                  setShowIdlePausedToast(false);
                  hasAlertedPauseRef.current = false;
                  pauseStartTimestampRef.current = null;
                  audioCtrl.playClick();
                }}
                className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                <span>โฟกัสต่อ (Resume)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleReset();
                  setShowIdlePausedToast(false);
                }}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>เริ่มรอบใหม่</span>
              </button>

              <button
                type="button"
                onClick={() => setShowIdlePausedToast(false)}
                className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="ปิดการแจ้งเตือน"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10">
          <button
            type="button"
            onClick={() => handleModeChange('focus')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'focus'
                ? 'bg-white text-[#121b2e] shadow-md scale-101'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">psychology</span>
            <span>ช่วงโฟกัส ({focusDuration} น.)</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('short_break')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'short_break'
                ? 'bg-white text-[#121b2e] shadow-md scale-101'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">coffee</span>
            <span>พักสั้น ({shortBreakDuration} น.)</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('long_break')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'long_break'
                ? 'bg-white text-[#121b2e] shadow-md scale-101'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">self_improvement</span>
            <span>พักยาว ({longBreakDuration} น.)</span>
          </button>
        </div>

        {/* Timer Display & Main Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-black/20 rounded-2xl p-4 sm:p-6 border border-white/5">
          {/* Circular Progress & Clock Face */}
          <div className="relative flex items-center justify-center">
            {/* SVG Circular Ring */}
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-white/10"
                  strokeWidth="7"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Active Animated Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="transition-all duration-1000 ease-linear"
                  strokeWidth="7"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 - (263.89 * progressPercent) / 100}
                  strokeLinecap="round"
                  stroke={modeConfig.progressColor}
                  fill="transparent"
                />
              </svg>

              {/* Center Digital Clock Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                <span className="font-mono text-[36px] sm:text-[42px] font-extrabold tracking-tight text-white drop-shadow-md">
                  {formattedTime}
                </span>
                <span className="text-[11px] font-semibold text-white/70 uppercase tracking-widest flex items-center gap-1.5 justify-center">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRunning
                        ? 'bg-emerald-400 animate-ping'
                        : pausedIdleSeconds >= 300
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-white/40'
                    }`}
                  />
                  <span>
                    {isRunning
                      ? 'กำลังจับเวลา'
                      : pausedIdleSeconds >= 300
                      ? 'หยุดชั่วคราว > 5 น.'
                      : 'หยุดชั่วคราว'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Controls & Session Info */}
          <div className="flex-1 flex flex-col gap-4 w-full">
            {/* Subject Link & Goal */}
            {!isCompact && (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="text-white/70 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-amber-400">school</span>
                    <span>รายวิชาที่กำลังอ่าน:</span>
                  </span>

                  {courses.length > 0 && (
                    <select
                      value={selectedCourse}
                      onChange={(e) => {
                        setSelectedCourse(e.target.value);
                        if (onSelectCourse) onSelectCourse(e.target.value);
                      }}
                      className="bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                    >
                      <option value="custom" className="bg-slate-900 text-white">
                        วิชาส่วนตัว / กิจกรรมทั่วไป
                      </option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                          {c.code} - {c.thaiTitle}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Task Objective Input */}
                <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
                  <span className="material-symbols-outlined text-white/60 text-[18px]">edit_note</span>
                  <input
                    type="text"
                    value={taskGoal}
                    onChange={(e) => setTaskGoal(e.target.value)}
                    placeholder="เป้าหมายในเซสชันนี้ เช่น ทบทวนสรุปบทที่ 2..."
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Session Progress Counter */}
            <div className="flex items-center justify-between bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="flex flex-col">
                <span className="text-[11px] text-white/60 font-semibold">รอบเซสชันโฟกัส</span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <span className="text-amber-400">🍅</span>
                  <span>{completedSessions} / {targetSessionCount} รอบ</span>
                </span>
              </div>

              {/* Visual Dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: targetSessionCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      idx < completedSessions
                        ? 'bg-amber-400 shadow-sm shadow-amber-400/50 scale-110'
                        : 'bg-white/20 border border-white/20'
                    }`}
                  />
                ))}
              </div>

              <div className="text-right">
                <span className="text-[11px] text-white/60 font-semibold">เวลารวมวันนี้</span>
                <span className="text-sm font-bold text-emerald-300 block font-mono">
                  {todayFocusedMinutes} นาที
                </span>
              </div>
            </div>

            {/* Main Interactive Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={togglePlayPause}
                className={`flex-1 py-3 px-5 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-white hover:bg-blue-50 text-[#121b2e] shadow-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {isRunning ? 'pause' : 'play_arrow'}
                </span>
                <span>{isRunning ? 'หยุดชั่วคราว (Pause)' : 'เริ่มจับเวลา (Start Focus)'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title="รีเซ็ตเวลารอบปัจจุบัน"
              >
                <span className="material-symbols-outlined text-[20px]">restart_alt</span>
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title="ข้ามไปยังช่วงถัดไป"
              >
                <span className="material-symbols-outlined text-[20px]">skip_next</span>
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel (Collapsible) */}
        {isSettingsOpen && (
          <div className="bg-black/40 rounded-2xl p-4 sm:p-5 border border-white/10 animate-fadeIn flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-blue-400">tune</span>
                <span>กำหนดระยะเวลา (นาที)</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-xs text-white/60 hover:text-white"
              >
                ปิด ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-white/70 font-semibold mb-1">ช่วงโฟกัส (นาที)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={focusDuration}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 25);
                    setFocusDuration(val);
                    if (mode === 'focus' && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-full bg-white/10 rounded-xl px-3 py-2 border border-white/20 text-white font-bold focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">พักสั้น (นาที)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={shortBreakDuration}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 5);
                    setShortBreakDuration(val);
                    if (mode === 'short_break' && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-full bg-white/10 rounded-xl px-3 py-2 border border-white/20 text-white font-bold focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">พักยาว (นาที)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={longBreakDuration}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 15);
                    setLongBreakDuration(val);
                    if (mode === 'long_break' && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-full bg-white/10 rounded-xl px-3 py-2 border border-white/20 text-white font-bold focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">จำนวนรอบก่อนพักยาว</label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={targetSessionCount}
                  onChange={(e) => setTargetSessionCount(Math.max(2, parseInt(e.target.value) || 4))}
                  className="w-full bg-white/10 rounded-xl px-3 py-2 border border-white/20 text-white font-bold focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Session History & Notes Panel (Collapsible) */}
        {isHistoryOpen && (
          <div className="bg-black/40 rounded-2xl p-4 sm:p-5 border border-white/10 animate-fadeIn flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-emerald-400">history_edu</span>
                <span>ประวัติและบันทึกการอ่านหนังสือวันนี้ ({sessionLogs.length} รายการ)</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="text-xs text-white/60 hover:text-white"
              >
                ปิด ✕
              </button>
            </div>

            {sessionLogs.length === 0 ? (
              <p className="text-xs text-white/50 text-center py-4">ยังไม่มีบันทึกรอบการโฟกัสในวันนี้</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {sessionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-white truncate">{log.subjectTitle}</div>
                        {log.notes && <div className="text-[11px] text-white/60 truncate">{log.notes}</div>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-emerald-300">{log.durationMinutes} นาที</span>
                      <span className="text-[10px] text-white/40 block">{log.completedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
