import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import {
  ChatThread,
  ChatMessage,
  getChatThreads,
  getMessagesByThread,
  sendChatMessage,
  markThreadAsRead,
} from '../../services/messageService';

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialThreadId?: string;
}

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialThreadId,
}) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<'general' | 'academic' | 'attendance' | 'urgent'>('general');
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: 'file' | 'image' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTeacher = currentUser.role === 'teacher' || currentUser.role === 'admin' || currentUser.role === 'executive';
  const isParent = currentUser.role === 'parent';

  // Load threads
  const refreshThreads = () => {
    const allThreads = getChatThreads();
    setThreads(allThreads);

    if (!activeThreadId) {
      if (initialThreadId && allThreads.some((t) => t.id === initialThreadId)) {
        setActiveThreadId(initialThreadId);
      } else if (allThreads.length > 0) {
        // If parent, select vorawut thread by default
        const parentDefault = allThreads.find((t) => t.studentName.includes('วรวุฒิ')) || allThreads[0];
        setActiveThreadId(parentDefault.id);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshThreads();
    }
  }, [isOpen, initialThreadId]);

  // Load messages when activeThreadId changes
  useEffect(() => {
    if (activeThreadId) {
      const msgs = getMessagesByThread(activeThreadId);
      setMessages(msgs);
      markThreadAsRead(activeThreadId, isTeacher ? 'teacher' : 'parent');
    }
  }, [activeThreadId, isTeacher]);

  // Listen to real-time events
  useEffect(() => {
    const handleUpdate = () => {
      const allThreads = getChatThreads();
      setThreads(allThreads);
      if (activeThreadId) {
        setMessages(getMessagesByThread(activeThreadId));
      }
    };
    window.addEventListener('sn_messages_updated', handleUpdate);
    return () => window.removeEventListener('sn_messages_updated', handleUpdate);
  }, [activeThreadId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const currentThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    const senderRole = isTeacher ? 'teacher' : 'parent';
    const senderName =
      currentUser.thaiName ||
      currentUser.name ||
      (isTeacher ? 'อ.ดร.ชัญญา ธนะไพศาล' : 'นางกุลนันท์ เพ็ชรราย (คุณแม่)');

    await sendChatMessage(
      activeThreadId,
      currentUser.id || 'user-current',
      senderName,
      senderRole,
      inputText.trim(),
      {
        tag: selectedTag,
        attachment: attachedFile ? { name: attachedFile.name, type: attachedFile.type } : undefined,
        senderAvatar: currentUser.avatar,
      }
    );

    setInputText('');
    setAttachedFile(null);
    setSelectedTag('general');
  };

  const handleQuickChip = (text: string, tag?: 'general' | 'academic' | 'attendance' | 'urgent') => {
    setInputText(text);
    if (tag) setSelectedTag(tag);
  };

  const filteredThreads = threads.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.studentName.toLowerCase().includes(q) ||
      t.parentName.toLowerCase().includes(q) ||
      t.teacherName.toLowerCase().includes(q) ||
      t.className.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] max-h-[780px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleUp">
        {/* Top Header Bar */}
        <div className="bg-[#121b2e] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[22px]">forum</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  กล่องสนทนาและการติดต่อระหว่างครู-ผู้ปกครอง
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-400/30">
                  Direct Messaging
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ระบบสื่อสารส่วนบุคคลเพื่อติดตามการเรียน พฤติกรรม และความก้าวหน้าของนักเรียน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Main 2-Column Chat Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Thread List (For Teachers or Multi-thread view) */}
          <div
            className={`w-full sm:w-80 md:w-96 border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0 ${
              activeThreadId && isParent ? 'hidden sm:flex' : 'flex'
            }`}
          >
            {/* Thread Search Box */}
            <div className="p-3 border-b border-slate-200/80 bg-white">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อนักเรียน หรือผู้ปกครอง..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-xs rounded-xl border border-transparent focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Thread Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {filteredThreads.map((thr) => {
                const isSelected = thr.id === activeThreadId;
                const unread = isTeacher ? thr.unreadCountForTeacher : thr.unreadCountForParent;

                return (
                  <button
                    key={thr.id}
                    onClick={() => {
                      setActiveThreadId(thr.id);
                      markThreadAsRead(thr.id, isTeacher ? 'teacher' : 'parent');
                    }}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200/80 shadow-xs'
                        : 'hover:bg-white hover:shadow-xs border border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={isTeacher ? thr.parentAvatar || thr.teacherAvatar : thr.teacherAvatar}
                        alt={thr.studentName}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white shadow-2xs"
                      />
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                          {unread}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {isTeacher ? thr.parentName : thr.teacherName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {thr.lastMessageTime}
                        </span>
                      </div>

                      <p className="text-[11px] text-blue-700 font-semibold truncate mt-0.5">
                        {thr.studentName} • {thr.className}
                      </p>

                      <p className="text-xs text-slate-500 truncate mt-1 line-clamp-1">
                        {thr.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Chat Conversation Stream */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {currentThread ? (
              <>
                {/* Active Thread Header */}
                <div className="px-5 py-3.5 border-b border-slate-200 bg-white/95 backdrop-blur flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={isTeacher ? currentThread.parentAvatar : currentThread.teacherAvatar}
                      alt={currentThread.studentName}
                      className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {isTeacher ? currentThread.parentName : currentThread.teacherName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {isTeacher ? 'ผู้ปกครอง' : 'อาจารย์ที่ปรึกษา'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        นักเรียน: <strong>{currentThread.studentName}</strong> ({currentThread.className}) • เบอร์ติดต่อ:{' '}
                        <a href={`tel:${currentThread.parentPhone}`} className="text-blue-600 font-mono hover:underline">
                          {currentThread.parentPhone}
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${currentThread.parentPhone}`}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
                      title="โทรด่วน"
                    >
                      <span className="material-symbols-outlined text-[18px]">call</span>
                    </a>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
                  {/* Notice Banner */}
                  <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-center max-w-lg mx-auto">
                    <p className="text-xs text-blue-900 font-medium">
                      🔒 บทสนทนาการให้คำปรึกษาทางวิชาการและดูแลความประพฤติได้รับการคุ้มครองตามระเบียบสถานศึกษา
                    </p>
                  </div>

                  {messages.map((msg) => {
                    const isMe =
                      (isTeacher && msg.senderRole === 'teacher') ||
                      (!isTeacher && msg.senderRole === 'parent');

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
                          <span className="font-semibold text-slate-700">{msg.senderName}</span>
                          <span>•</span>
                          <span className="font-mono">{msg.timestamp}</span>
                          {msg.tag && msg.tag !== 'general' && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                msg.tag === 'urgent'
                                  ? 'bg-rose-100 text-rose-800'
                                  : msg.tag === 'attendance'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {msg.tag === 'urgent'
                                ? 'ด่วน'
                                : msg.tag === 'attendance'
                                ? 'การเข้าเรียน'
                                : 'วิชาการ'}
                            </span>
                          )}
                        </div>

                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-gradient-to-r from-blue-600 to-[#1550d3] text-white rounded-tr-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>

                          {/* Attachment preview if present */}
                          {msg.attachment && (
                            <div
                              className={`mt-2.5 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs border ${
                                isMe
                                  ? 'bg-white/15 border-white/20 text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="material-symbols-outlined text-[18px]">
                                  {msg.attachment.type === 'image' ? 'image' : 'description'}
                                </span>
                                <span className="font-semibold truncate">{msg.attachment.name}</span>
                              </div>
                              <span className="font-mono text-[10px] opacity-80 shrink-0">ดาวน์โหลด</span>
                            </div>
                          )}
                        </div>

                        {isMe && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5 pr-1">
                            <span className="material-symbols-outlined text-[13px] text-blue-500">done_all</span>
                            <span>{msg.read ? 'อ่านแล้ว' : 'ส่งแล้ว'}</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reply Chips */}
                <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-bold text-slate-400 shrink-0">ตอบด่วน:</span>
                  {(isTeacher
                    ? [
                        { label: 'รับทราบและบันทึกข้อมูลเรียบร้อยครับ', tag: 'general' as const },
                        { label: 'ผลการเรียนและความประพฤติดีเยี่ยมครับ', tag: 'academic' as const },
                        { label: 'ยินดีให้คำปรึกษาเพิ่มเติมหลังเลิกเรียนครับ', tag: 'general' as const },
                        { label: 'ขอส่งแบบฟอร์มยินยอมให้พิจารณาครับ', tag: 'urgent' as const },
                      ]
                    : [
                        { label: 'ขอบพระคุณอาจารย์มากค่ะสำหรับคำแนะนำ', tag: 'general' as const },
                        { label: 'ขอสอบถามเรื่องตารางสอบกลางภาคค่ะ', tag: 'academic' as const },
                        { label: 'น้องอาจจะถึงโรงเรียนช้ากว่าปกติเล็กน้อยค่ะ', tag: 'attendance' as const },
                        { label: 'ขอนัดหมายพบอาจารย์ช่วงเย็นค่ะ', tag: 'general' as const },
                      ]
                  ).map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickChip(chip.label, chip.tag)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Attachment info if selected */}
                {attachedFile && (
                  <div className="px-4 py-1.5 bg-blue-50 border-t border-blue-100 flex items-center justify-between text-xs text-blue-900">
                    <span className="flex items-center gap-1.5 font-medium truncate">
                      <span className="material-symbols-outlined text-[16px] text-blue-600">attach_file</span>
                      <span>แนบไฟล์: {attachedFile.name}</span>
                    </span>
                    <button
                      onClick={() => setAttachedFile(null)}
                      className="text-blue-600 hover:text-rose-600 font-bold ml-2 cursor-pointer"
                    >
                      ✕ ยกเลิก
                    </button>
                  </div>
                )}

                {/* Message Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-end gap-2 shrink-0"
                >
                  {/* File attach button */}
                  <button
                    type="button"
                    onClick={() => {
                      const fileName = window.prompt(
                        'ระบุชื่อเอกสารหรือหลักฐานที่ต้องการแนบ:',
                        'เอกสารรับรอง_ใบยินยอมผู้ปกครอง.pdf'
                      );
                      if (fileName) {
                        setAttachedFile({ name: fileName, type: 'file' });
                      }
                    }}
                    className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    title="แนบเอกสารหรือรูปภาพ"
                  >
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                  </button>

                  {/* Input area */}
                  <div className="flex-1 bg-slate-100 focus-within:bg-white rounded-2xl border border-transparent focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all p-1.5 flex items-center">
                    <input
                      type="text"
                      placeholder="พิมพ์ข้อความสื่อสารกับอาจารย์หรือผู้ปกครอง..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                  </div>

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() && !attachedFile}
                    className="p-2.5 sm:px-5 sm:py-2.5 rounded-2xl bg-[#1550d3] hover:bg-[#1a53d6] disabled:opacity-40 disabled:hover:bg-[#1550d3] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span className="hidden sm:inline">ส่ง</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-2 text-slate-300">chat</span>
                <p className="text-sm font-semibold">เลือกการสนทนาเพื่อเริ่มต้นพูดคุย</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
