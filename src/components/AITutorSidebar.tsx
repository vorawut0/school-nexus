import React, { useState, useEffect, useRef } from 'react';
import { Course, UserProfile, UserRole } from '../types';
import { MOCK_COURSES } from '../data/mockData';

interface AITutorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  initialCourse?: Course | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode?: string;
  courseCode?: string;
  targetRole?: UserRole;
}

interface ModeConfig {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

export const AITutorSidebar: React.FC<AITutorSidebarProps> = ({
  isOpen,
  onClose,
  user,
  initialCourse,
}) => {
  const userRole: UserRole = user.role || 'student';

  // Role Configuration Setup
  const roleConfig = getRoleAIConfig(userRole, user);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourse?.id || 'all'
  );
  const [activeMode, setActiveMode] = useState<string>(roleConfig.defaultMode);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);

  // Update initial message when user or role changes
  useEffect(() => {
    const config = getRoleAIConfig(user.role || 'student', user);
    setActiveMode(config.defaultMode);
    setMessages([
      {
        id: `msg-welcome-${user.role}`,
        role: 'assistant',
        content: config.welcomeMessage,
        timestamp: 'เมื่อสักครู่',
        mode: config.defaultMode,
        targetRole: user.role,
      },
    ]);
  }, [user.role, user.thaiName, user.name]);

  // Sync initialCourse prop when changed
  useEffect(() => {
    if (initialCourse) {
      setSelectedCourseId(initialCourse.id);
    }
  }, [initialCourse]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle ESC key to close & stop speech on close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(null);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, onClose]);

  const currentCourse =
    selectedCourseId === 'all'
      ? null
      : MOCK_COURSES.find((c) => c.id === selectedCourseId) || null;

  const quickPrompts = roleConfig.promptsByMode[activeMode] || [];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: 'เมื่อสักครู่',
      mode: activeMode,
      courseCode: currentCourse?.code,
      targetRole: user.role,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      // First attempt to call the backend API if available
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: query,
          mode: activeMode,
          userRole: user.role,
          userName: user.thaiName || user.name,
          courseContext: currentCourse
            ? {
                id: currentCourse.id,
                title: currentCourse.title,
                thaiTitle: currentCourse.thaiTitle,
                code: currentCourse.code,
                progress: currentCourse.progress,
                assignmentsDue: currentCourse.assignmentsDue,
                description: currentCourse.description,
              }
            : {
                title: 'All Contexts',
                totalCourses: MOCK_COURSES.length,
              },
          messages: messages.slice(-6),
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const botMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.text || 'ไม่สามารถรับข้อมูลได้ โปรดลองอีกครั้ง',
        timestamp: 'เมื่อสักครู่',
        mode: activeMode,
        courseCode: currentCourse?.code,
        targetRole: user.role,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      // Role-specific intelligent local fallback engine
      const generatedResponse = generateRoleSpecificFallback(
        user.role || 'student',
        activeMode,
        query,
        currentCourse,
        user
      );

      setTimeout(() => {
        const fallbackMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: generatedResponse,
          timestamp: 'เมื่อสักครู่',
          mode: activeMode,
          courseCode: currentCourse?.code,
          targetRole: user.role,
        };
        setMessages((prev) => [...prev, fallbackMessage]);
      }, 400);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    const config = getRoleAIConfig(user.role || 'student', user);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `ล้างประวัติการสนทนาเรียบร้อยแล้วครับ! ท่านสามารถพิมพ์คำถามหรือเลือกหัวข้อเพื่อเริ่มสนทนาใหม่ได้เลย`,
        timestamp: 'เมื่อสักครู่',
        mode: activeMode,
        targetRole: user.role,
      },
    ]);
  };

  const handleCopyText = (content: string, msgId?: string) => {
    navigator.clipboard?.writeText(content);
    if (msgId) {
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2500);
    }
  };

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/###|\*\*|__|```|`|\*|\$/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'th-TH';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    setIsSpeaking(msgId);
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Panel Container */}
      <div className="relative w-full max-w-[560px] bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200/80 animate-slideInRight duration-300">
        
        {/* Top Header Bar */}
        <div className={`p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-3 ${roleConfig.headerBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl ${roleConfig.iconGradient} text-white flex items-center justify-center shadow-md relative`}>
                <span className="material-symbols-outlined text-[24px] fill-1">
                  {roleConfig.mainIcon}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#20C997] rounded-full border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-[17px] text-[#121b2e]">{roleConfig.title}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleConfig.badgeStyle}`}>
                    {roleConfig.badgeLabel}
                  </span>
                </div>
                <p className="text-[12px] text-[#737686]">
                  {roleConfig.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="w-8 h-8 rounded-lg text-[#737686] hover:text-[#ba1a1a] hover:bg-red-50 flex items-center justify-center transition-colors text-[16px] cursor-pointer"
                title="ล้างการสนทนา (Clear Chat)"
                aria-label="Clear chat"
              >
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 text-[#434654] hover:bg-slate-200 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                title="ปิดหน้าต่าง (Close)"
                aria-label="Close sidebar"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Context Filter Selector depending on role */}
          {user.role === 'student' && (
            <div className="flex items-center gap-2">
              <label htmlFor="course-select" className="text-[12px] font-bold text-[#434654] shrink-0 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#1550d3]">
                  school
                </span>
                วิชาที่โฟกัส:
              </label>
              <select
                id="course-select"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="flex-1 text-[12px] font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[#121b2e] focus:outline-none focus:ring-2 focus:ring-[#1550d3]/20 focus:border-[#1550d3] cursor-pointer truncate shadow-xs"
              >
                <option value="all">🌐 ทุกรายวิชาที่ลงทะเบียน (4 Active Courses)</option>
                {MOCK_COURSES.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code}: {course.thaiTitle} ({course.progress}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          {user.role === 'teacher' && (
            <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-blue-100 text-xs text-slate-700">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">co_present</span>
              <span>กลุ่มสาระ: <strong>{user.department || 'วิทยาศาสตร์และเทคโนโลยี'}</strong> • ห้องเรียน ม.6/1, ม.6/2</span>
            </div>
          )}

          {user.role === 'admin' && (
            <div className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-purple-100 text-xs text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Scope: <strong>Smart Campus Infrastructure & Security</strong></span>
              </span>
              <span className="font-mono text-purple-700 font-bold text-[11px]">12 Nodes Active</span>
            </div>
          )}

          {user.role === 'parent' && (
            <div className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-amber-100 text-xs text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-600 text-[16px]">child_care</span>
                <span>นักเรียนในความดูแล: <strong>วรวุฒิ เพ็ชรราย (ม.6/1)</strong></span>
              </span>
              <span className="font-mono text-emerald-700 font-bold text-[11px]">มาเรียน 98.2%</span>
            </div>
          )}

          {/* Active Course Mini Banner (for Students) */}
          {user.role === 'student' && currentCourse && (
            <div
              className="px-3 py-2 rounded-xl text-white text-[12px] flex items-center justify-between shadow-xs transition-all"
              style={{ backgroundColor: currentCourse.color }}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-[18px]">
                  {currentCourse.icon}
                </span>
                <span className="font-bold truncate">
                  {currentCourse.code} • {currentCourse.thaiTitle}
                </span>
              </div>
              <span className="bg-white/20 px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0">
                {currentCourse.progress}% Completed
              </span>
            </div>
          )}

          {/* 3 Main Mode Switcher Tabs for This Role */}
          <div className="grid grid-cols-3 gap-1 bg-[#eef2ff] p-1 rounded-xl">
            {roleConfig.modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`py-1.5 px-2 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeMode === mode.id
                    ? 'bg-white text-[#1550d3] shadow-xs'
                    : 'text-[#434654] hover:text-[#121b2e]'
                }`}
                title={mode.desc}
              >
                <span className="material-symbols-outlined text-[15px]">{mode.icon}</span>
                <span className="truncate">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 bg-[#fbfbfe]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[92%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {!isUser ? (
                  <div className={`w-8 h-8 rounded-xl ${roleConfig.iconGradient} text-white flex items-center justify-center shrink-0 shadow-xs mt-1`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {roleConfig.mainIcon}
                    </span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-[#1550d3] text-white flex items-center justify-center shrink-0 shadow-xs mt-1 text-[12px] font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-[14px] leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-[#1550d3] text-white rounded-tr-xs'
                        : 'bg-white text-[#121b2e] rounded-tl-xs border border-slate-200/70'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans break-words space-y-2">
                      {renderFormattedContent(msg.content, isUser)}
                    </div>
                  </div>

                  {/* Actions under AI messages */}
                  {!isUser && (
                    <div className="flex items-center gap-2 pl-1 text-[11px] text-[#737686]">
                      <span>{msg.timestamp}</span>
                      <span>•</span>
                      <button
                        onClick={() => handleCopyText(msg.content, msg.id)}
                        className="hover:text-[#1550d3] flex items-center gap-0.5 cursor-pointer"
                        title="คัดลอกคำตอบ"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {copiedMsgId === msg.id ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedMsgId === msg.id ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}</span>
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => handleToggleSpeak(msg.id, msg.content)}
                        className={`hover:text-[#1550d3] flex items-center gap-0.5 cursor-pointer ${
                          isSpeaking === msg.id ? 'text-[#1550d3] font-bold' : ''
                        }`}
                        title="อ่านออกเสียง"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {isSpeaking === msg.id ? 'stop_circle' : 'volume_up'}
                        </span>
                        {isSpeaking === msg.id ? 'หยุดพูด' : 'อ่านออกเสียง'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 mr-auto max-w-[85%]">
              <div className={`w-8 h-8 rounded-xl ${roleConfig.iconGradient} text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse`}>
                <span className="material-symbols-outlined text-[18px]">{roleConfig.mainIcon}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-[13px] text-[#1550d3] font-medium flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#1550d3] animate-ping" />
                {roleConfig.title} กำลังประมวลผลข้อมูล...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips for the Active Mode */}
        <div className="px-4 py-2.5 bg-[#f4f6fc] border-t border-slate-200/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#1550d3]">
                magic_button
              </span>
              คำสั่ง & หัวข้อแนะนำสำหรับบทบาทนี้:
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {quickPrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(item.prompt)}
                disabled={loading}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-[#eef2ff] hover:text-[#1550d3] hover:border-[#1550d3]/30 border border-slate-200/80 text-[12px] font-medium text-[#434654] transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Input Field */}
        <div className="p-4 border-t border-slate-200/80 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={roleConfig.inputPlaceholders[activeMode] || 'พิมพ์ข้อความหรือคำถามที่ต้องการ...'}
                disabled={loading}
                className="w-full h-12 pl-4 pr-10 rounded-xl bg-[#f8f9fe] border border-slate-200 text-[14px] text-[#121b2e] placeholder:text-[#737686] focus:outline-none focus:border-[#1550d3] focus:ring-2 focus:ring-[#1550d3]/20 transition-all disabled:opacity-60"
              />
              {inputQuery && (
                <button
                  type="button"
                  onClick={() => setInputQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="w-12 h-12 rounded-xl bg-[#1550d3] hover:bg-[#1a53d6] disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
              title="ส่งข้อความ"
            >
              <span className="material-symbols-outlined text-[20px] fill-1">send</span>
            </button>
          </form>
          <p className="text-[10px] text-center text-[#737686] mt-2">
            ขับเคลื่อนด้วย Google Gemini • ระบบแยกฟังก์ชันและสิทธิ์การทำงานตามบทบาทอย่างสมบูรณ์
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ROLE SPECIFIC AI CONFIGURATION HELPER
// ==========================================

function getRoleAIConfig(role: UserRole, user: UserProfile) {
  const firstName = (user.thaiName || user.name).split(' ')[0];

  switch (role) {
    case 'teacher':
      return {
        title: 'Nexus AI Teaching Assistant',
        subtitle: 'ผู้ช่วยออกแบบแผนการสอน & วิเคราะห์ผู้เรียน',
        badgeLabel: '👨‍🏫 อาจารย์ • Lesson & Pedagogy',
        badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
        mainIcon: 'menu_book',
        iconGradient: 'bg-gradient-to-tr from-[#1550d3] to-[#2b7fff]',
        headerBg: 'bg-[#f4f7ff]',
        defaultMode: 'lesson_plan',
        welcomeMessage: `### 👨‍🏫 สวัสดีครับอาจารย์ ${firstName}!
ผมคือ **Nexus AI Teaching Assistant** ผู้ช่วยจัดการเรียนการสอนอัจฉริยะของคุณ

ผมพร้อมสนับสนุนงานด้านวิชาการและการสอน:
1. 📋 **ออกแบบแผนการสอน & กิจกรรม Active Learning** (5E, PBL, Flipped Classroom)
2. 📊 **สร้างรูบริกเกณฑ์ประเมิน (Rubrics) & ออกแบบชุดข้อสอบวัดผล**
3. 🔍 **วิเคราะห์การส่งงาน & ติดตามช่วยเหลือนักเรียนที่ต้องการการดูแลพิเศษ**

เลือกโหมดหรือหัวข้อตัวอย่างด้านล่างเพื่อเริ่มสร้างสื่อการสอนได้ทันทีครับ!`,
        modes: [
          { id: 'lesson_plan', label: 'แผนการสอน', icon: 'menu_book', desc: 'ออกแบบแผนการสอน & กิจกรรม' },
          { id: 'rubric_quiz', label: 'เกณฑ์ & ข้อสอบ', icon: 'grading', desc: 'สร้างเกณฑ์ Rubrics และข้อสอบ' },
          { id: 'student_insight', label: 'วิเคราะห์ผู้เรียน', icon: 'insights', desc: 'ติดตามผลการเรียนและการส่งงาน' },
        ],
        inputPlaceholders: {
          lesson_plan: 'เช่น ร่างแผนการสอน 50 นาที เรื่อง Data Structures แบบ Active Learning...',
          rubric_quiz: 'เช่น สร้างเกณฑ์ Rubrics ตรวจรายงานวิชาการ 4 ระดับคะแนน...',
          student_insight: 'เช่น ขอแนวทางช่วยเหลือนักเรียนที่มีปัญหาค้างส่งงาน 2 สัปดาห์...',
        } as Record<string, string>,
        promptsByMode: {
          lesson_plan: [
            {
              label: '📋 ร่างแผนการสอน 50 นาที (Active Learning)',
              prompt: 'ช่วยร่างแผนการสอน 50 นาที เรื่อง Graph Data Structures โดยใช้รูปแบบ Active Learning พร้อมช่วงเวลาและกิจกรรมกลุ่ม',
            },
            {
              label: '💡 ไอเดียกิจกรรม Ice-breaking ในคาบ Lab',
              prompt: 'ขอไอเดียกิจกรรม Ice-breaking 5 นาที สำหรับนักเรียน ม.ปลาย ก่อนเริ่มเรียนเขียนโค้ด ให้ตื่นตัวและร่วมมือกัน',
            },
            {
              label: '🎯 โครงงานบูรณาการ STEM สัปดาห์นี้',
              prompt: 'ช่วยเสนอหัวข้อโครงงาน STEM สั้นๆ 2 สัปดาห์ ที่เชื่อมโยงวิชา Computer Science กับการแก้ปัญหาในโรงเรียน',
            },
            {
              label: '⏱️ เทคนิคจัดสรรเวลาคาบปฏิบัติการ',
              prompt: 'แนะนำเทคนิคการจัดสรรเวลาในคาบปฏิบัติการคอมพิวเตอร์ 100 นาที ให้นักเรียนลงมือปฏิบัติได้ครบทุกคนและสรุปทันเวลา',
            },
          ],
          rubric_quiz: [
            {
              label: '📊 รูบริกตรวจ Coding Project (4 ระดับ)',
              prompt: 'สร้างตารางเกณฑ์ Rubrics ตรวจโปรเจกต์เขียนโปรแกรม (Full-stack Web) แบ่ง 4 ระดับ (ดีเยี่ยม, ดี, พอใช้, ปรับปรุง) ครอบคลุม Clean Code, UI/UX, Functionality',
            },
            {
              label: '✍️ ข้อสอบปรนัยคิดวิเคราะห์ 5 ข้อ',
              prompt: 'ออกแบบข้อสอบปรนัย 5 ข้อ เรื่อง Object-Oriented Programming (OOP) ที่เน้นวัดการคิดวิเคราะห์ (Higher Order Thinking) พร้อมเฉลยและคำอธิบาย',
            },
            {
              label: '📑 โจทย์แล็ปค้นหาบัก (Debugging Task)',
              prompt: 'สร้างโจทย์แบบฝึกหัดแล็ปที่มีโค้ดบั๊กซ่อนอยู่ 3 จุด ให้นักเรียนฝึกทักษะ Debugging พร้อมไกด์ไลน์คำแนะนำสำหรับครู',
            },
            {
              label: '🏷️ เกณฑ์ประเมินทักษะการทำงานเป็นทีม',
              prompt: 'ร่างแบบประเมินทักษะการทำงานร่วมกันเป็นทีม (Peer Evaluation Form) สำหรับโครงงานนักเรียน ม.ปลาย',
            },
          ],
          student_insight: [
            {
              label: '🔍 แนวทางช่วยเหลือนักเรียนส่งงานช้า',
              prompt: 'แนะนำแนวทางและกลยุทธ์เชิงบวกในการติดตามช่วยเหลือนักเรียนที่ติดค้างการบ้านโดยไม่ทำให้เด็กรู้สึกกดดัน',
            },
            {
              label: '📈 ข้อความแจ้งเตือนผู้ปกครองเชิงบวก',
              prompt: 'ร่างข้อความแจ้งเตือนผู้ปกครองผ่านระบบ School Nexus เพื่อชื่นชมนักเรียนและแจ้งเตือนการบ้านที่ต้องส่งอย่างสุภาพ',
            },
            {
              label: '✨ แบบฝึกหัดเสริมสำหรับเด็กหัวไว',
              prompt: 'ขอไอเดีย Challenge โจทย์เพิ่มเติมสำหรับนักเรียนที่มีความสามารถพิเศษ (Fast Learner) ที่ทำงานเสร็จก่อนเพื่อนในห้อง',
            },
            {
              label: '🤝 รูปแบบการสอนซ่อมเสริมแบบกลุ่มย่อย',
              prompt: 'แนะนำวิธีการจัดกลุ่มติวซ่อมเสริมแบบ Peer Tutoring (เพื่อนช่วยเพื่อน) สำหรับวิชาคำนวณที่มีประสิทธิภาพ',
            },
          ],
        },
      };

    case 'admin':
      return {
        title: 'Nexus AI Ops Assistant',
        subtitle: 'ผู้ช่วยตรวจสอบระบบเครือข่าย & ความปลอดภัย',
        badgeLabel: '🛡️ ผู้ดูแลระบบ • Network & Security',
        badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
        mainIcon: 'security',
        iconGradient: 'bg-gradient-to-tr from-[#6e2acf] to-[#9b51e0]',
        headerBg: 'bg-[#faf5ff]',
        defaultMode: 'sys_health',
        welcomeMessage: `### 🛡️ สวัสดีครับคุณ ${firstName} (ผู้ดูแลระบบ)!
ผมคือ **Nexus AI Ops Assistant** ผู้ช่วยบริหารจัดการระบบไอทีและโครงสร้างพื้นฐาน Smart Campus

ผมเชื่อมต่อกับข้อมูลสถานะฮาร์ดแวร์และเครือข่าย:
1. 🖥️ **วินิจฉัยสุขภาพระบบ & สถานะคลาวด์เซิร์ฟเวอร์ (Uptime 99.8%)**
2. 📡 **วิเคราะห์โหนด IoT 12 จุด และทราฟฟิก Wi-Fi 34 Access Points**
3. 🔒 **ตรวจสอบความปลอดภัย, สิทธิ์ผู้ใช้งาน และบันทึก Audit Logs**

พิมพ์คำสั่งหรือเลือกหัวข้อด้านล่างเพื่อเริ่มการวิเคราะห์ได้ทันทีครับ!`,
        modes: [
          { id: 'sys_health', label: 'สุขภาพระบบ', icon: 'health_and_safety', desc: 'ตรวจสอบสถานะ Server & Database' },
          { id: 'iot_network', label: 'IoT & เครือข่าย', icon: 'router', desc: 'วิเคราะห์โหนดเซนเซอร์และแบนด์วิดท์' },
          { id: 'security_audit', label: 'ความปลอดภัย & Audit', icon: 'lock', desc: 'บันทึกการเข้าใช้และสิทธิ์ RFID' },
        ],
        inputPlaceholders: {
          sys_health: 'เช่น รายงานการทำงานของ Cloud Server และ Database วันนี้...',
          iot_network: 'เช่น วิเคราะห์สาเหตุที่ Node 07 สัญญาณ RSSI ดรอป...',
          security_audit: 'เช่น ตรวจสอบบันทึกการ Login ที่ล้มเหลว หรือร่างนโยบาย RFID...',
        } as Record<string, string>,
        promptsByMode: {
          sys_health: [
            {
              label: '🖥️ สรุปสถานะระบบภาพรวม (System Health)',
              prompt: 'ขอรายงานสรุปสถานะการทำงานของ Cloud Servers, Database และ API Gateway ประจำวันนี้ มีคอขวดจุดใดหรือไม่',
            },
            {
              label: '💾 แผนสำรองฐานข้อมูลฉุกเฉิน (Disaster Recovery)',
              prompt: 'ช่วยร่างขั้นตอนการรับมือเหตุฉุกเฉินและการกู้คืนฐานข้อมูล (Disaster Recovery Plan) สำหรับระบบ School Nexus',
            },
            {
              label: '⚡ วิเคราะห์ Peak Load ช่วง 12:00 น.',
              prompt: 'วิเคราะห์ภาระโหลดของเซิร์ฟเวอร์ช่วงพักเที่ยง (ระบบ Smart Canteen) และแนวทางเพิ่มประสิทธิภาพ Caching',
            },
            {
              label: '🔄 นโยบายปรับปรุงความปลอดภัย Security Patch',
              prompt: 'แนะนำ Checklists ในการอัปเดตระบบปฏิบัติการและ Security Patch ประจำเดือนโดยไม่กระทบชั่วโมงการเรียน',
            },
          ],
          iot_network: [
            {
              label: '📡 วินิจฉัย IoT Node 07 (สัญญาณต่ำ)',
              prompt: 'วิเคราะห์สาเหตุและวิธีแก้ไขปัญหา IoT Node 07 (อาคาร 4 ชั้น 2) ที่มีค่า RSSI -84 dBm และอัตราส่งข้อมูลช้า',
            },
            {
              label: '📶 สถิติทราฟฟิก Wi-Fi หอประชุมและห้องสมุด',
              prompt: 'วิเคราะห์การกระจายโหลดของ Wi-Fi Access Points ในจุดที่มีผู้ใช้งานหนาแน่น เช่น โรงอาหารและห้องสมุด',
            },
            {
              label: '🌡️ ค่ามลพิษ PM2.5 และคุณภาพอากาศแคมปัส',
              prompt: 'สรุปข้อมูลคุณภาพอากาศ (PM2.5 / Temperature / Humidity) จากเซนเซอร์ทั้ง 12 โหนดในโรงเรียน',
            },
            {
              label: '🔋 แผนซ่อมบำรุงเซนเซอร์และแบตเตอรี่สำรอง',
              prompt: 'สร้างตารางการบำรุงรักษาเชิงป้องกัน (Preventive Maintenance) สำหรับอุปกรณ์ IoT และแบตเตอรี่สำรองในแคมปัส',
            },
          ],
          security_audit: [
            {
              label: '🔒 ตรวจสอบบันทึกเข้าใช้งานผิดปกติ (Audit Log)',
              prompt: 'ตรวจสอบ Log การพยายามเข้าสู่ระบบที่ไม่สำเร็จ (Failed Logins) และการเข้าถึงระบบจาก IP ภายนอกที่น่าสงสัย',
            },
            {
              label: '💳 ระเบียบปฏิบัติเมื่อบัตร RFID สูญหาย',
              prompt: 'ร่างคู่มือขั้นตอนการระงับบัตร RFID นักเรียนที่แจ้งสูญหาย และการออกบัตรสำรองพร้อมย้ายยอดเงินในกระเป๋า',
            },
            {
              label: '🛡️ ตรวจสอบการปฏิบัติตามมาตรฐาน PDPA',
              prompt: 'แนะนำข้อกำหนดในการปกป้องข้อมูลส่วนบุคคล (PDPA) ของนักเรียนและรูปภาพใบหน้าในระบบ School Nexus',
            },
            {
              label: '🔑 ตรวจสอบสิทธิ์ Role-based Access Control (RBAC)',
              prompt: 'ทบทวนสิทธิ์การเข้าถึงของผู้ดูแลระบบ (Admin) และกำหนดนโยบายการบังคับใช้ Two-Factor Authentication (2FA)',
            },
          ],
        },
      };

    case 'parent':
      return {
        title: 'Nexus AI Family Guide',
        subtitle: 'ผู้ช่วยที่ปรึกษาครอบครัว & พัฒนาการบุตรหลาน',
        badgeLabel: '👨‍👩‍👦 ผู้ปกครอง • Family & Student Care',
        badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
        mainIcon: 'family_restroom',
        iconGradient: 'bg-gradient-to-tr from-[#d97706] to-[#f59e0b]',
        headerBg: 'bg-[#fffbeb]',
        defaultMode: 'student_progress',
        welcomeMessage: `### 👨‍👩‍👦 สวัสดีครับคุณ ${firstName}!
ผมคือ **Nexus AI Family Guide** ผู้ช่วยดูแลและติดตามพัฒนาการของบุตรหลาน

ผมเชื่อมต่อกับข้อมูลของ **วรวุฒิ เพ็ชรราย (ม.6/1)**:
1. 📊 **สรุปพัฒนาการการเรียน, การเข้าเรียน (98.2%) และการบ้านที่ค้างส่ง**
2. 💬 **ให้คำแนะนำเชิงบวกในการส่งเสริมการเรียนรู้และการพูดคุยที่บ้าน**
3. 🥗 **สรุปการใช้จ่ายบัตร Smart Canteen และคำแนะนำด้านโภชนาการ**

กดเลือกคำถามด้านล่างเพื่อเริ่มดูข้อมูลและขอคำแนะนำได้เลยครับ!`,
        modes: [
          { id: 'student_progress', label: 'ผลการเรียน & เข้าเรียน', icon: 'trending_up', desc: 'ติดตามความก้าวหน้าและการเข้าเรียน' },
          { id: 'home_support', label: 'การพูดคุย & ส่งเสริม', icon: 'psychology_alt', desc: 'คำแนะนำการดูแลลูกที่บ้าน' },
          { id: 'canteen_nutrition', label: 'โภชนาการ & บัตรอาหาร', icon: 'restaurant_menu', desc: 'สรุปการซื้ออาหารและการใช้จ่าย' },
        ],
        inputPlaceholders: {
          student_progress: 'เช่น สรุปการเข้าเรียนและการบ้านที่ต้องส่งของลูกสัปดาห์นี้...',
          home_support: 'เช่น ขอวิธีพูดคุยให้กำลังใจลูกเรื่องเตรียมสอบเข้ามหาวิทยาลัย...',
          canteen_nutrition: 'เช่น สรุปรายการอาหารที่ลูกซื้อและโภชนาการในโรงเรียน...',
        } as Record<string, string>,
        promptsByMode: {
          student_progress: [
            {
              label: '📊 สรุปภาพรวมการเรียนและการเข้าเรียนสัปดาห์นี้',
              prompt: 'ช่วยสรุปรายงานการเข้าเรียน ผลการส่งงาน และภาพรวมวิชาการของ วรวุฒิ เพ็ชรราย ในสัปดาห์นี้',
            },
            {
              label: '⏰ ประวัติการสแกนเข้าโรงเรียนย้อนหลัง 5 วัน',
              prompt: 'แสดงเวลาสแกนบัตรเข้า-ออกโรงเรียนของบุตรหลานในช่วง 5 วันทำการที่ผ่านมา พร้อมสถานะความตรงต่อเวลา',
            },
            {
              label: '📝 รายการการบ้านที่ต้องติดตามด่วน',
              prompt: 'ตรวจสอบว่ามีการบ้านหรือโปรเจกต์ใดที่ใกล้ถึงกำหนดส่งบ้าง เพื่อให้ผู้ปกครองช่วยเตือนความจำ',
            },
            {
              label: '🏆 จุดเด่นและทักษะที่ทำผลงานได้ดีเยี่ยม',
              prompt: 'วิเคราะห์รายวิชาและทักษะที่บุตรหลานมีความโดดเด่นเป็นพิเศษ (เช่น ด้านวิทยาการคอมพิวเตอร์และนวัตกรรม)',
            },
          ],
          home_support: [
            {
              label: '💬 วิธีพูดคุยให้กำลังใจเรื่องเตรียมสอบ TCAS/เข้ามหาวิทยาลัย',
              prompt: 'ขอคำแนะนำและตัวอย่างประโยคพูดคุยเชิงบวกกับลูก ม.6 เรื่องการเตรียมตัวสอบเข้ามหาวิทยาลัยโดยไม่สร้างความกดดัน',
            },
            {
              label: '🧘 วิธีช่วยลูกผ่อนคลายเมื่ออ่านหนังสือดึก',
              prompt: 'แนะนำกิจกรรมในครอบครัวและวิธีช่วยลูกผ่อนคลายสายตาและลดความเครียดจากการอ่านหนังสือสอบ',
            },
            {
              label: '⏰ แนะนำการจัดระเบียบเวลาเล่นเกมกับการเรียน',
              prompt: 'ขอเทคนิคการตั้งข้อตกลงร่วมกันในบ้านเรื่องเวลาเล่นเกมกับเวลาทำการบ้านให้มีความสุขทั้งสองฝ่าย',
            },
            {
              label: '🤝 ตัวอย่างข้อความปรึกษาอาจารย์ที่ปรึกษา',
              prompt: 'ช่วยร่างข้อความสุภาพสำหรับส่งถึงอาจารย์ที่ปรึกษาเพื่อสอบถามเกี่ยวกับกิจกรรมแนะแนวการศึกษาต่อ',
            },
          ],
          canteen_nutrition: [
            {
              label: '🥗 วิเคราะห์รายการอาหารและโภชนาการที่ซื้อ',
              prompt: 'วิเคราะห์พฤติกรรมการซื้ออาหารและเครื่องดื่มในโรงอาหารของบุตรหลาน สารอาหารครบถ้วนหรือไม่',
            },
            {
              label: '💳 คำนวณงบประมาณเติมเงินบัตรรายสัปดาห์',
              prompt: 'ช่วยคำนวณงบค่าอาหารที่เหมาะสมต่อสัปดาห์โดยเฉลี่ยสำหรับการเรียน ม.ปลาย ในโรงเรียน',
            },
            {
              label: '🍎 เมนูอาหารสุขภาพแนะนำในโรงอาหาร',
              prompt: 'แนะนำเมนูอาหารที่มีประโยชน์ในโรงเรียน เช่น ผลไม้สด ข้าวกล้อง และโปรตีนเสริมสร้างสมาธิ',
            },
            {
              label: '🛡️ วิธีตั้งวงเงินจำกัดการใช้จ่ายต่อวัน',
              prompt: 'ขอคำแนะนำเรื่องการตั้งลิมิตการใช้จ่ายต่อวัน (Daily Limit) ในบัตร Smart Pass ให้เหมาะสม',
            },
          ],
        },
      };

    case 'student':
    default:
      return {
        title: 'Nexus AI Tutor',
        subtitle: 'ผู้ช่วยติวเตอร์ส่วนตัว & วางแผนการเรียน',
        badgeLabel: '🎓 นักเรียน • Personalized Study',
        badgeStyle: 'bg-emerald-50 text-[#00694d] border-emerald-200',
        mainIcon: 'auto_awesome',
        iconGradient: 'bg-gradient-to-tr from-[#1550d3] to-[#7857f8]',
        headerBg: 'bg-[#f9faff]',
        defaultMode: 'study_tips',
        welcomeMessage: `### 👋 สวัสดีครับคุณ ${firstName}!
ผมคือ **Nexus AI Tutor** ผู้ช่วยด้านการเรียนส่วนตัวของคุณ

ผมเชื่อมต่อกับข้อมูล 4 รายวิชาที่คุณกำลังศึกษาอยู่ พร้อมช่วยคุณ:
1. 💡 **วางแผนและแนะนำเทคนิคการเรียนเฉพาะบุคคล** (Study Tips)
2. 🧠 **ย่อยเนื้อหายากๆ ให้เข้าใจง่ายด้วยอุปมาอุปไมย** (Simplify Topics)
3. 💬 **ตอบคำถาม ไขข้อสงสัยการบ้าน และสร้างแบบทดสอบจำลอง** (Q&A & Quizzes)

เลือกวิชาที่ต้องการโฟกัส หรือกดหัวข้อตัวอย่างด้านล่างเพื่อเริ่มต้นได้ทันทีครับ!`,
        modes: [
          { id: 'study_tips', label: 'Study Tips', icon: 'tips_and_updates', desc: 'เทคนิคการเรียนและการจัดการเวลา' },
          { id: 'simplify', label: 'ย่อยเนื้อหา', icon: 'psychology', desc: 'อธิบายเรื่องยากให้เข้าใจง่าย' },
          { id: 'qa', label: 'ถาม-ตอบ Q&A', icon: 'chat', desc: 'ไขข้อสงสัยและสร้างแบบทดสอบ' },
        ],
        inputPlaceholders: {
          study_tips: 'ขอเคล็ดลับการอ่านหนังสือ, วางแผนเวลา, เทคนิค Pomodoro...',
          simplify: 'พิมพ์เรื่องยากๆ ที่อยากให้สรุปเข้าใจง่ายด้วยภาพ...',
          qa: 'ถามคำถาม, ให้ช่วยตรวจการบ้าน หรือขอแบบทดสอบ 3 ข้อ...',
        } as Record<string, string>,
        promptsByMode: {
          study_tips: [
            {
              label: '⚡ แผนส่ง Coding Project พรุ่งนี้',
              prompt: 'ขอแผนจัดการเวลาเร่งด่วนสำหรับส่ง Coding Project (CS30201) ในวันพรุ่งนี้ พร้อมเทคนิคแบ่งเวลาที่ได้ผลจริง',
            },
            {
              label: '📚 เทคนิคเก็บเนื้อหาคณิตศาสตร์ใน 3 วัน',
              prompt: 'แนะนำวิธีการเริ่มต้นเรียน Advanced Mathematics (MA30101) ที่ progress ยัง 0% ให้เข้าใจพื้นฐานได้เร็วที่สุดใน 3 วัน',
            },
            {
              label: '🍅 จัดตาราง Pomodoro 4 วิชา',
              prompt: 'ช่วยวางแผนตารางอ่านหนังสือแบบ Pomodoro 50/10 สำหรับ 4 วิชาที่ลงทะเบียนในสัปดาห์นี้ให้หน่อยครับ',
            },
            {
              label: '🎯 เทคนิค Active Recall ก่อนสอบ',
              prompt: 'สอนวิธีฝึก Active Recall และ Spaced Repetition สำหรับวิชา Computer Science และ UI Design',
            },
          ],
          simplify: [
            {
              label: '🌳 Tree vs Graph Data Structure',
              prompt: 'ช่วยอธิบายความแตกต่างระหว่าง Tree และ Graph Data Structures ในวิชา CS30201 แบบเห็นภาพ เข้าใจง่าย มีตัวอย่างในชีวิตประจำวัน',
            },
            {
              label: '🎨 Gestalt Principles ใน UI/UX',
              prompt: 'อธิบายกฎของเกสตัลท์ (Gestalt Principles) ในการออกแบบ UI ให้เข้าใจง่ายๆ ว่าทำไมคนถึงมองเห็นภาพรวมก่อนรายละเอียด',
            },
            {
              label: '📐 Calculus: ลิมิตและอนุพันธ์',
              prompt: 'อธิบายแนวคิดเรื่อง Limit และ Derivative ในคณิตศาสตร์ให้เด็ก ม.ปลาย ฟังแบบเห็นภาพ ไม่เน้นท่องจำสูตร',
            },
            {
              label: '🎧 Spatial Audio & Foley Sound',
              prompt: 'Foley Sound และ Spatial Audio ในวิชา Multimedia ทำงานอย่างไร ทำไมถึงสร้างมิติเสียงในภาพยนตร์ได้',
            },
          ],
          qa: [
            {
              label: '❓ REST API Authentication คืออะไร',
              prompt: 'ช่วยอธิบายหลักการทำงานของ REST API Authentication และ JWT Token ในโปรเจกต์เว็บแบบทีละขั้นตอน',
            },
            {
              label: '📝 สุ่มแบบทดสอบ Quiz 3 ข้อ',
              prompt: 'สร้าง Quiz สั้นๆ 3 ข้อสำหรับวิชาที่เลือกพร้อมช้อยส์ เพื่อทดสอบความเข้าใจของฉัน',
            },
            {
              label: '🧩 วิเคราะห์ Error โค้ดที่พบบ่อย',
              prompt: 'มี Error อะไรบ้างที่เด็กเขียนโปรแกรมมักตกม้าตายใน Full-stack Web Development พร้อมวิธีแก้ไข',
            },
            {
              label: '✨ เคล็ดลับทำ Portfolio สาย AI/CS',
              prompt: 'แนะนำการเตรียม Portfolio ด้าน Computer Science & AI สำหรับนักเรียน ม.6 เพื่อยื่นรอบโควตา/พอร์ตฟอลิโอ',
            },
          ],
        },
      };
  }
}

// ==========================================
// ROLE-SPECIFIC INTELLIGENT FALLBACK ENGINE
// ==========================================

function generateRoleSpecificFallback(
  role: UserRole,
  mode: string,
  query: string,
  course: Course | null,
  user: UserProfile
): string {
  const q = query.toLowerCase();

  // 1. TEACHER RESPONSES (AI Teaching Assistant)
  if (role === 'teacher') {
    if (q.includes('เตือนผู้ปกครอง') || q.includes('แจ้งเตือน') || q.includes('ข้อความ')) {
      return `### ✉️ ร่างข้อความแจ้งเตือนผู้ปกครองเชิงบวก
**หัวข้อ:** การติดตามการเรียนและการบ้านประจำสัปดาห์
**ข้อความแนะนำ:**
> *"เรียนท่านผู้ปกครองของนักเรียนชั้น ${user.department ? 'ม.6/1' : 'ม.ปลาย'}\nทางโรงเรียนขอชื่นชมนักเรียนที่มีความตั้งใจในการร่วมกิจกรรมโครงงานในสัปดาห์นี้ ทั้งนี้มีงานชิ้นสำคัญวิชาคอมพิวเตอร์ที่ใกล้ถึงกำหนดส่ง จึงใคร่ขอความร่วมมือท่านผู้ปกครองช่วยให้กำลังใจและดูแลการจัดสรรเวลาทำการบ้านของบุตรหลานที่บ้านครับ หากมีข้อสงสัยสามารถติดต่อครูผู้สอนได้ตลอดเวลาครับ"*`;
    }

    if (q.includes('โจทย์') || q.includes('challenge') || q.includes('fast learner') || q.includes('เด็กหัวไว')) {
      return `### ✨ โจทย์ Challenge เสริมทักษะสำหรับ Fast Learner
**วิชา:** ${course ? course.thaiTitle : 'วิทยาการคำนวณ & การพัฒนาโปรแกรม'}
1. **Extra Milestone 1:** พัฒนาระบบ Caching แบบ LRU (Least Recently Used) บนหน่วยความจำ เพื่อลดเวลาค้นหาข้อมูล
2. **Extra Milestone 2:** เขียน Unit Test ครอบคลุม Edge Cases อย่างน้อย 5 กรณี (เช่น Empty Input, Overflow, Null Pointer)
3. **Extra Milestone 3:** ออกแบบ UI ให้รองรับ Responsive Design และ Dark Theme อัตโนมัติ`;
    }

    if (mode === 'lesson_plan' || q.includes('แผนการสอน') || q.includes('สอน')) {
      return `### 📋 โครงร่างแผนการสอน 50 นาที (Active Learning Framework)
**กลุ่มสาระการเรียนรู้:** ${user.department || 'วิทยาศาสตร์และเทคโนโลยี'}
**หัวข้อ:** ${course ? course.thaiTitle : 'การคิดเชิงคำนวณและโครงสร้างข้อมูล'}
**เป้าหมายการเรียนรู้ (LO):** นักเรียนสามารถออกแบบขั้นตอนวิธีและเลือกใช้ Data Structure ได้ถูกต้อง

1. **ขั้นกระตุ้นความสนใจ (Engage - 10 นาที):**
   - ตั้งคำถามชวนคิด: *"ถ้าต้องการจัดเส้นทางส่งของในแผนที่กรุงเทพฯ ระบบคำนวณเส้นทางสั้นที่สุดอย่างไร?"*
   - ฉาย Animation สั้น 2 นาทีเปรียบเทียบการค้นหาแบบ Sequential vs Graph Traversal

2. **ขั้นสำรวจและลงมือปฏิบัติ (Explore - 25 นาที):**
   - ให้นักเรียนจับคู่ (Pair Programming) ทำใบกิจกรรม Interactive Lab บน School Nexus
   - ครูเดินสำรวจ ให้คำแนะนำรายกลุ่ม พร้อมบันทึกคะแนน Formative Assessment แบบเรียลไทม์

3. **ขั้นสรุปและประเมินผล (Evaluate - 15 นาที):**
   - ตัวแทนนักเรียน 2 คู่ร่วมแชร์แนวทางการแก้ปัญหาหน้าชั้นเรียน
   - ทำ Exit Ticket สั้นๆ 1 ข้อผ่าน School Nexus Digital Quiz เพื่อประเมินความเข้าใจร้อยละ 80 ของห้อง`;
    }

    if (mode === 'rubric_quiz' || q.includes('เกณฑ์') || q.includes('rubric') || q.includes('ข้อสอบ')) {
      return `### 📊 เกณฑ์การประเมินชิ้นงาน (Scoring Rubrics - 4 ระดับ)
**ชิ้นงานที่ประเมิน:** โครงงาน / ชิ้นงานภาคปฏิบัติ (${course ? course.code : 'โครงงานภาคเรียน'})

| เกณฑ์การประเมิน | ดีเยี่ยม (4) | ดี (3) | พอใช้ (2) | ปรับปรุง (1) |
|---|---|---|---|---|
| **1. ฟังก์ชันการทำงาน** | ทำงานถูกต้อง 100% ไม่มี Error | ทำงานได้ 80%+ มีบั๊กเล็กน้อย | ทำงานได้บางส่วน | ไม่สามารถทำงานได้ |
| **2. ความคิดสร้างสรรค์** | มีลูกเล่นใหม่ออกแบบน่าประทับใจ | มีองค์ประกอบแปลกใหม่ | รูปแบบมาตรฐานตามโจทย์ | ลอกเลียนแบบโดยไม่ดัดแปลง |
| **3. ความสะอาดของโค้ด** | มี Comment ครบ โครงสร้าง Clean | จัดระเบียบดี มีชื่อตัวแปรชัด | พออ่านเข้าใจ ขาด Comment | โค้ดรก ไม่เป็นระเบียบ |
| **4. การส่งงานตรงเวลา** | ส่งภายในกำหนดเวลา | ส่งช้าไม่เกิน 1 วัน | ส่งช้า 2-3 วัน | ส่งช้าเกิน 3 วัน |

💡 *อาจารย์สามารถปรับค่าน้ำหนักคะแนนในระบบได้ตามดุลยพินิจครับ*`;
    }

    return `### 🔍 ข้อมูลวิเคราะห์ผู้เรียน & แนวทางช่วยเหลือ (Classroom Analytics)
- **ภาพรวมในชั้นเรียน:** นักเรียน 94% เข้าใจมโนทัศน์หลักได้ดี มีนักเรียนประมาณ 3 คนที่ยังส่งงานล่าช้าในวิชาปฏิบัติการ
- **ข้อเสนอแนะเชิงรุกสำหรับอาจารย์:** 
  1. ส่ง Notification เตือนแบบส่วนตัวผ่านแอป School Nexus
  2. จัดช่วงเวลา Office Hours พิเศษ 15 นาทีก่อนเริ่มคาบหน้าเพื่อตอบข้อสงสัย
  3. มอบหมาย Buddy คู่หูคอยช่วยทบทวนโค้ดเบื้องต้น`;
  }

  // 2. ADMIN RESPONSES (AI Ops & Infrastructure Assistant)
  if (role === 'admin') {
    if (q.includes('rfid') || q.includes('บัตร') || q.includes('สูญหาย')) {
      return `### 💳 ระเบียบปฏิบัติ & แผนผังการจัดการบัตร RFID / Smart Pass
1. **ขั้นตอนการระงับบัตรสูญหาย:**
   - เข้าแท็บ **จัดการผู้ใช้** ➔ ค้นหาชื่อนักเรียน ➔ กดปุ่ม *"ระงับบัตร RFID ทันที"*
   - ระบบจะยกเลิกสิทธิ์เปิดประตูและระงับการตัดเงินในกระเป๋า Smart Canteen อัตโนมัติใน 1 วินาที
2. **การออกบัตรสำรอง:**
   - แตะบัตร RFID ใบใหม่กับหัวอ่านเครื่องแอดมิน
   - ผูกรหัสบัตรใหม่เข้ากับ UID นักเรียน ยอดเงินคงเหลือจะถูกโอนย้ายอัตโนมัติ 100%`;
    }

    if (q.includes('pdpa') || q.includes('ความปลอดภัย') || q.includes('audit') || q.includes('log')) {
      return `### 🛡️ รายงานความปลอดภัย & การปฏิบัติตามมาตรฐาน PDPA
- **สถานะระบบความปลอดภัย:** 🛡️ ปลอดภัย ไม่พบภัยคุกคามหรือการ Brute Force ผิดปกติ
- **บันทึก Audit Logs 24 ชม. ที่ผ่านมา:**
  - มีการพยายาม Login รหัสผ่านผิด 4 ครั้งจาก IP ภายใน (ระบบล็อกชั่วคราวตามนโยบาย)
  - มีการผูกบัตร RFID นักเรียนใหม่ 8 ใบสำเร็จ
- **การปฏิบัติตาม PDPA:** ข้อมูลส่วนบุคคลและภาพถ่ายนักเรียนถูกเข้ารหัสแบบ AES-256 และเข้าถึงได้เฉพาะผู้มีสิทธิ์ Role-based เท่านั้น
- **คำแนะนำ:** แนะนำบังคับเปิด Two-Factor Authentication (2FA) สำหรับทุกบัญชีที่มีสิทธิ์ Super Admin ครับ`;
    }

    if (mode === 'iot_network' || q.includes('iot') || q.includes('node') || q.includes('wi-fi') || q.includes('wifi')) {
      return `### 📡 รายงานเครือข่าย & สถานะโหนด IoT แคมปัส
- **จำนวนโหนดที่ออนไลน์:** 12 / 12 Nodes (🟢 Normal 10 จุด / 🟡 Signal Low 2 จุด)
- **จุดที่ตรวจพบสัญญาณอ่อน:**
  - **Node 07 (อาคาร 4 ชั้น 2):** RSSI -84 dBm แนะนำปรับทิศทางเสาอากาศหรือย้ายใกล้ Repeater
  - **Node 11 (โรงยิมเนเซียม):** แบตเตอรี่สำรอง 78% (ปกติ)
- **Wi-Fi Campus Access Points:** 34 จุดทำงานปกติ รองรับอุปกรณ์พร้อมกัน 1,240 Devices แบนด์วิดท์เหลือใช้ 65%
- **ค่าเฉลี่ยสิ่งแวดล้อม:** PM2.5 เฉลี่ย 14 µg/m³ (อากาศดีมาก) • อุณหภูมิเฉลี่ย 24.2°C`;
    }

    return `### 🖥️ รายงานสุขภาพระบบ School Nexus Core & Infrastructure
- **Cloud Infrastructure Status:** 🟢 **Healthy (99.8% Uptime)**
- **Database Connection Pool:** 28 / 100 Active Connections (Peak: 64 ช่วง 12:15 น.)
- **Response Time (API Latency):** เฉลี่ย **42 ms** (อยู่ในเกณฑ์ยอดเยี่ยม < 100ms)
- **Automatic Backup:** สำรองข้อมูลล่าสุดเมื่อ 04:00 น. (Snapshots ขนาด 1.84 GB ถูกเก็บใน Multi-Region Storage ปลอดภัย 100%)
- **IoT Door Controllers:** เชื่อมต่อครบทุกอาคาร สั่งการ Master Unlock/Lock ได้ทันที`;
  }

  // 3. PARENT RESPONSES (AI Family Guide & Student Care)
  if (role === 'parent') {
    if (q.includes('คุย') || q.includes('กำลังใจ') || q.includes('เครียด') || q.includes('เกม') || mode === 'home_support') {
      return `### 💬 คำแนะนำเชิงบวกในการดูแลและพูดคุยกับลูกที่บ้าน
1. **ถามด้วยความเข้าใจ:** ลองถามว่า *"วันนี้ที่โรงเรียนโปรเจกต์ที่ทำอยู่สนุกไหมลูก มีอะไรอยากให้พ่อ/แม่ช่วยซัพพอร์ตไหม?"* แทนการถามกดดันเรื่องคะแนน
2. **ดูแลสภาพแวดล้อม:** ช่วยจัดโต๊ะอ่านหนังสือให้มีแสงสว่างเพียงพอ และเตรียมผลไม้สดหรือน้ำดื่มไว้ใกล้ๆ
3. **ส่งเสริมการพักผ่อน:** ชวนลูกยืดเส้นยืดสายหรือพักเบรก 10 นาทีหลังจากอ่านหนังสือต่อเนื่อง 50 นาที
4. **ข้อตกลงเรื่องเล่นเกม:** กำหนดเวลาเล่นเกมเป็นรางวัลหลังจากส่งการบ้านวิชาสำคัญเสร็จเรียบร้อยครับ`;
    }

    if (q.includes('อาหาร') || q.includes('เงิน') || q.includes('บัตร') || mode === 'canteen_nutrition') {
      return `### 🥗 รายงานการใช้จ่าย & โภชนาการ (Smart Canteen)
- **ยอดเงินคงเหลือในบัตร:** **฿420.00** (สถานะ: เพียงพอสำหรับ 3-4 วัน)
- **รายการที่ซื้อวันนี้ (17 ส.ค.):**
  - 🍱 ข้าวราดแกงไก่ผัดพริกไทยดำ + ผัดผัก (฿45.00)
  - 🥛 นมจืดไขมันต่ำ (฿15.00)
  - 🍉 แตงโมสดตัดแต่ง (฿15.00)
- **การประเมินโภชนาการ:** สารอาหารครบ 5 หมู่ ได้รับโปรตีน ผัก และผลไม้สดอย่างเหมาะสม แนะนำเติมเงินเพิ่มสัปดาห์ละ 500 บาทครับ`;
    }

    return `### 📊 รายงานพัฒนาการ: วรวุฒิ เพ็ชรราย (ม.6/1)
- **การเข้าเรียน:** อัตราการมาเรียน **98.2%** (ตรงเวลาสม่ำเสมอ เข้าเรียนเฉลี่ย 07:42 น.)
- **ผลการเรียนปัจจุบัน:** GPA สะสม **3.92** (อยู่ในกลุ่มหัวแถวของสายวิทย์-คอมพ์)
- **ภาระงานและการบ้าน:**
  - ✅ ส่งงานแล้ว: 12 ชิ้นงาน
  - ⏳ งานที่ต้องส่งเร็วๆ นี้: **Coding Project (วิชา ว30101)** กำหนดส่งพรุ่งนี้ (ทำไปแล้ว 45%)
- **ความเห็นครูที่ปรึกษา:** *"น้องวรวุฒิตั้งใจเรียน มีทักษะความเป็นผู้นำในกิจกรรมกลุ่มยอดเยี่ยมมากครับ"*`;
  }

  // 4. STUDENT RESPONSES (Nexus AI Tutor)
  if (q.includes('pomodoro') || q.includes('วางแผน') || q.includes('เวลา') || mode === 'study_tips') {
    return `### 💡 เคล็ดลับการเรียน & วางแผนเวลา (${course ? course.thaiTitle : 'ภาพรวม 4 รายวิชา'})
1. **เทคนิค Pomodoro 50/10:** ตั้งเวลาอ่านหนังสือ 50 นาที พัก 10 นาที (ห้ามจับโทรศัพท์ช่วง 50 นาทีแรก)
2. **Active Recall:** หลังจากอ่านจบหนึ่งหัวข้อ ให้ปิดหนังสือแล้วเขียน Concept Map สรุปสิ่งที่จำได้ลงกระดาษเปล่า
3. **ลำดับความสำคัญ:** ให้โฟกัสงาน **Coding Project (CS30201)** ก่อนเป็นอันดับแรกเนื่องจากมีกำหนดส่งพรุ่งนี้ครับ!`;
  }

  if (q.includes('อธิบาย') || q.includes('คืออะไร') || q.includes('ย่อย') || mode === 'simplify') {
    return `### 🧠 ย่อยเนื้อหาให้เข้าใจง่าย: Concept Overview (${course ? course.thaiTitle : 'Computer Science'})
ลองเปรียบเทียบเรื่องนี้กับ **"ระบบจัดส่งพัสดุในชีวิตจริง"**:
- **ข้อมูล (Data):** เหมือนพัสดุที่ถูกส่งไปตามจุดต่างๆ
- **เส้นทาง (Algorithm):** เหมือนการเลือกทางด่วนที่ไม่มีรถติดที่สุด
- **ผลลัพธ์:** ทำให้ส่งพัสดุได้เร็วและแม่นยำโดยใช้พลังงานน้อยที่สุด

จำง่ายๆ: *"เข้าใจแก่น Concept ให้เห็นภาพก่อน แล้วสูตรหรือโค้ดจะตามมาเองครับ!"*`;
  }

  return `### 📝 สรุปคำตอบ & แบบทดสอบจำลอง (Q&A)
- **ข้อแนะนำสำหรับการบ้าน (${course ? course.code : 'ทั่วไป'}):** แนะนำให้เช็กเงื่อนไข Edge Cases ของฟังก์ชัน เช่น เมื่อ Input เป็นค่าว่างหรือเลข 0
- **คำถามชวนคิด 1 ข้อ:** *"หากต้องเก็บข้อมูลที่มีความสัมพันธ์แบบลำดับชั้น (Hierarchy) โครงสร้างข้อมูลใดเหมาะสมที่สุดระหว่าง Array, Stack หรือ Tree?"*
*(ลองพิมพ์คำตอบส่งมาให้ผมตรวจได้เลยครับ!)*`;
}

// Helper function to format basic markdown-like structures cleanly
function renderFormattedContent(text: string, isUser: boolean) {
  if (isUser) return <span>{text}</span>;

  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div
            key={`code-${lineIdx}`}
            className="my-2 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[12px] overflow-x-auto shadow-inner border border-slate-700"
          >
            <pre>{codeBuffer.join('\n')}</pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={lineIdx} className="font-bold text-[15px] text-[#1550d3] mt-2 mb-1">
          {line.replace('### ', '')}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={lineIdx} className="font-bold text-[16px] text-[#121b2e] mt-2 mb-1">
          {line.replace('## ', '')}
        </h3>
      );
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const cleanLine = line.trim().replace(/^[-*]\s+/, '');
      elements.push(
        <div key={lineIdx} className="flex items-start gap-2 ml-1 text-[13.5px]">
          <span className="text-[#1550d3] font-bold mt-0.5">•</span>
          <span>{parseBold(cleanLine)}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line.trim())) {
      const match = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (match) {
        elements.push(
          <div key={lineIdx} className="flex items-start gap-2 ml-1 text-[13.5px]">
            <span className="font-bold text-[#1550d3] shrink-0">{match[1]}.</span>
            <span>{parseBold(match[2])}</span>
          </div>
        );
      }
    } else if (line.trim() === '') {
      elements.push(<div key={lineIdx} className="h-1" />);
    } else {
      elements.push(
        <p key={lineIdx} className="text-[13.5px] text-[#2c3345]">
          {parseBold(line)}
        </p>
      );
    }
  });

  return elements;
}

function parseBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-[#121b2e]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
