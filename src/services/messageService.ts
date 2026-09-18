import { pushRealtimeNotification } from './firebaseService';

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'parent' | 'student' | 'admin';
  senderAvatar?: string;
  text: string;
  timestamp: string;
  date: string;
  read: boolean;
  tag?: 'general' | 'leave' | 'attendance' | 'academic' | 'urgent';
  attachment?: {
    name: string;
    type: 'image' | 'file';
    url?: string;
  };
}

export interface ChatThread {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  parentAvatar?: string;
  teacherName: string;
  teacherSubject: string;
  teacherAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCountForTeacher: number;
  unreadCountForParent: number;
  updatedAt: number;
}

const STORAGE_THREADS_KEY = 'schoolnexus_chat_threads_v2';
const STORAGE_MESSAGES_KEY = 'schoolnexus_chat_messages_v2';

const DEFAULT_THREADS: ChatThread[] = [
  {
    id: 'thread-vorawut',
    studentId: 'STU-66040217',
    studentName: 'นายวรวุฒิ เพ็ชรราย',
    className: 'มัธยมศึกษาปีที่ 6/1',
    parentName: 'นางกุลนันท์ เพ็ชรราย',
    parentPhone: '081-987-6543',
    parentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    teacherName: 'อ.ดร.ชัญญา ธนะไพศาล',
    teacherSubject: 'อาจารย์ที่ปรึกษา / ปัญญาประดิษฐ์ AI',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    lastMessage: 'เอกสารทางโรงเรียนรับรองให้เรียบร้อยแล้วค่ะ คุณแม่เซ็นเอกสารอนุญาตเข้าร่วมกิจกรรมใบเดียวค่ะ',
    lastMessageTime: '08:45 น.',
    unreadCountForTeacher: 0,
    unreadCountForParent: 1,
    updatedAt: Date.now() - 1000 * 60 * 15,
  },
  {
    id: 'thread-panuwat',
    studentId: 'STU-66040218',
    studentName: 'นายภานุวัฒน์ มีสุข',
    className: 'มัธยมศึกษาปีที่ 6/1',
    parentName: 'นายเกรียงไกร มีสุข',
    parentPhone: '089-112-2334',
    parentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    teacherName: 'อ.ดร.สมชาย วิศวกรรม',
    teacherSubject: 'อาจารย์ผู้สอน หุ่นยนต์และระบบอัตโนมัติ',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    lastMessage: 'ขอบคุณครับคุณพ่อ รับทราบครับ เดี๋ยวทางโรงเรียนจะช่วยดูแลช่วงเช้าให้ครับ',
    lastMessageTime: 'เมื่อวาน',
    unreadCountForTeacher: 0,
    unreadCountForParent: 0,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'thread-nichanan',
    studentId: 'STU-66040219',
    studentName: 'น.ส.ณิชานันท์ รัตนกุล',
    className: 'มัธยมศึกษาปีที่ 6/1',
    parentName: 'นางสาวพรรณี รัตนกุล',
    parentPhone: '086-456-7890',
    parentAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
    teacherName: 'อ.ดร.ชัญญา ธนะไพศาล',
    teacherSubject: 'อาจารย์ที่ปรึกษา / ปัญญาประดิษฐ์ AI',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    lastMessage: 'ขอสอบถามเรื่องตารางสอบกลางภาคของนักเรียนค่ะ',
    lastMessageTime: '09:15 น.',
    unreadCountForTeacher: 1,
    unreadCountForParent: 0,
    updatedAt: Date.now() - 1000 * 60 * 45,
  },
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    threadId: 'thread-vorawut',
    senderId: 'teacher-1',
    senderName: 'อ.ดร.ชัญญา ธนะไพศาล',
    senderRole: 'teacher',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    text: 'สวัสดีค่ะคุณแม่ ขอแจ้งผลการทดสอบโครงงาน Computer Vision & AI ของน้องวรวุฒิ ได้คะแนนยอดเยี่ยม 98/100 เลยนะคะ มีศักยภาพสูงมากค่ะ',
    timestamp: '08:30 น.',
    date: '09 ก.ย. 2026',
    read: true,
    tag: 'academic',
  },
  {
    id: 'msg-2',
    threadId: 'thread-vorawut',
    senderId: 'parent-vorawut',
    senderName: 'นางกุลนันท์ เพ็ชรราย (คุณแม่)',
    senderRole: 'parent',
    senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    text: 'กราบขอบพระคุณอาจารย์มากค่ะ น้องตั้งใจฝึกฝนมากค่ะ สำหรับการแข่งขันโครงงานระดับภาคสัปดาห์หน้า คุณแม่ต้องเตรียมเอกสารอะไรเพิ่มเติมบ้างคะ?',
    timestamp: '08:38 น.',
    date: '09 ก.ย. 2026',
    read: true,
    tag: 'general',
  },
  {
    id: 'msg-3',
    threadId: 'thread-vorawut',
    senderId: 'teacher-1',
    senderName: 'อ.ดร.ชัญญา ธนะไพศาล',
    senderRole: 'teacher',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    text: 'เอกสารทางโรงเรียนรับรองให้เรียบร้อยแล้วค่ะ คุณแม่เซ็นเอกสารอนุญาตเข้าร่วมกิจกรรมใบเดียวค่ะ เดี๋ยวทางอาจารย์แนบไฟล์หนังสือยินยอมไว้ในระบบนี้ให้นะคะ',
    timestamp: '08:45 น.',
    date: '09 ก.ย. 2026',
    read: false,
    tag: 'urgent',
    attachment: {
      name: 'หนังสือยินยอมผู้ปกครอง_การแข่งขันAIระดับภาค.pdf',
      type: 'file',
    },
  },
  {
    id: 'msg-p1',
    threadId: 'thread-panuwat',
    senderId: 'teacher-2',
    senderName: 'อ.ดร.สมชาย วิศวกรรม',
    senderRole: 'teacher',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    text: 'สวัสดีครับคุณพ่อ ขอแจ้งเรื่องน้องภานุวัฒน์มาสายติดต่อกัน 2 วัน อยากสอบถามว่าการเดินทางช่วงเช้ามีติดขัดอะไรไหมครับ?',
    timestamp: '09:00 น.',
    date: '08 ก.ย. 2026',
    read: true,
    tag: 'attendance',
  },
  {
    id: 'msg-p2',
    threadId: 'thread-panuwat',
    senderId: 'parent-panuwat',
    senderName: 'นายเกรียงไกร มีสุข (คุณพ่อ)',
    senderRole: 'parent',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    text: 'สวัสดีครับอาจารย์ ช่วงนี้ถนนหน้าหมู่บ้านมีการปรับปรุงทางเลยรถติดมากครับ พรุ่งนี้จะพาน้องออกจากบ้านเช้าขึ้น 30 นาทีครับ ขออภัยด้วยครับอาจารย์',
    timestamp: '09:12 น.',
    date: '08 ก.ย. 2026',
    read: true,
    tag: 'attendance',
  },
  {
    id: 'msg-p3',
    threadId: 'thread-panuwat',
    senderId: 'teacher-2',
    senderName: 'อ.ดร.สมชาย วิศวกรรม',
    senderRole: 'teacher',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    text: 'ขอบคุณครับคุณพ่อ รับทราบครับ เดี๋ยวทางโรงเรียนจะช่วยดูแลช่วงเช้าให้ครับ',
    timestamp: '09:15 น.',
    date: '08 ก.ย. 2026',
    read: true,
    tag: 'attendance',
  },
  {
    id: 'msg-n1',
    threadId: 'thread-nichanan',
    senderId: 'parent-nichanan',
    senderName: 'นางสาวพรรณี รัตนกุล (คุณแม่)',
    senderRole: 'parent',
    senderAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
    text: 'เรียนอาจารย์ที่ปรึกษาค่ะ ขอสอบถามเรื่องตารางสอบกลางภาคของนักเรียน ม.6 มีกำหนดการและวิชาที่ต้องเตรียมตัวอย่างไรบ้างคะ?',
    timestamp: '09:15 น.',
    date: '09 ก.ย. 2026',
    read: false,
    tag: 'academic',
  },
];

export const getChatThreads = (): ChatThread[] => {
  try {
    const raw = localStorage.getItem(STORAGE_THREADS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(DEFAULT_THREADS));
      return DEFAULT_THREADS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to get chat threads:', err);
    return DEFAULT_THREADS;
  }
};

export const getMessagesByThread = (threadId: string): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
    let allMessages: ChatMessage[] = [];
    if (!raw) {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(DEFAULT_MESSAGES));
      allMessages = DEFAULT_MESSAGES;
    } else {
      allMessages = JSON.parse(raw);
    }
    return allMessages.filter((m) => m.threadId === threadId);
  } catch (err) {
    console.error('Failed to get messages:', err);
    return DEFAULT_MESSAGES.filter((m) => m.threadId === threadId);
  }
};

export const sendChatMessage = async (
  threadId: string,
  senderId: string,
  senderName: string,
  senderRole: 'teacher' | 'parent' | 'student' | 'admin',
  text: string,
  options?: {
    tag?: 'general' | 'leave' | 'attendance' | 'academic' | 'urgent';
    attachment?: { name: string; type: 'image' | 'file'; url?: string };
    senderAvatar?: string;
  }
): Promise<ChatMessage> => {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} น.`;
  const dateStr = now.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId,
    senderId,
    senderName,
    senderRole,
    senderAvatar: options?.senderAvatar,
    text,
    timestamp: timeStr,
    date: dateStr,
    read: false,
    tag: options?.tag || 'general',
    attachment: options?.attachment,
  };

  // Save Message
  const rawMsgs = localStorage.getItem(STORAGE_MESSAGES_KEY);
  const msgs: ChatMessage[] = rawMsgs ? JSON.parse(rawMsgs) : [...DEFAULT_MESSAGES];
  msgs.push(newMessage);
  localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(msgs));

  // Update Thread
  const threads = getChatThreads();
  const threadIndex = threads.findIndex((t) => t.id === threadId);
  if (threadIndex >= 0) {
    const thread = threads[threadIndex];
    thread.lastMessage = text;
    thread.lastMessageTime = timeStr;
    thread.updatedAt = Date.now();
    if (senderRole === 'parent') {
      thread.unreadCountForTeacher = (thread.unreadCountForTeacher || 0) + 1;
    } else if (senderRole === 'teacher') {
      thread.unreadCountForParent = (thread.unreadCountForParent || 0) + 1;
    }
    threads[threadIndex] = thread;
    localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(threads));
  }

  // Push Realtime Notification
  try {
    await pushRealtimeNotification({
      title: senderRole === 'parent' ? `ข้อความใหม่จากผู้ปกครอง: ${senderName}` : `ข้อความใหม่จากครู: ${senderName}`,
      message: text.slice(0, 100),
      type: 'announcement',
      role: senderRole === 'parent' ? 'teacher' : 'parent',
    });
  } catch (e) {
    console.error('Error sending push notification:', e);
  }

  window.dispatchEvent(
    new CustomEvent('sn_messages_updated', {
      detail: { threadId, message: newMessage },
    })
  );

  return newMessage;
};

export const markThreadAsRead = (threadId: string, userRole: 'teacher' | 'parent') => {
  const threads = getChatThreads();
  const threadIndex = threads.findIndex((t) => t.id === threadId);
  if (threadIndex >= 0) {
    if (userRole === 'teacher') {
      threads[threadIndex].unreadCountForTeacher = 0;
    } else {
      threads[threadIndex].unreadCountForParent = 0;
    }
    localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(threads));
  }

  // Also mark messages as read
  try {
    const rawMsgs = localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (rawMsgs) {
      const msgs: ChatMessage[] = JSON.parse(rawMsgs);
      const updated = msgs.map((m) => {
        if (m.threadId === threadId && m.senderRole !== userRole) {
          return { ...m, read: true };
        }
        return m;
      });
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }

  window.dispatchEvent(
    new CustomEvent('sn_messages_updated', {
      detail: { threadId },
    })
  );
};

export const getTotalUnreadMessages = (userRole: 'teacher' | 'parent'): number => {
  const threads = getChatThreads();
  return threads.reduce((acc, t) => {
    return acc + (userRole === 'teacher' ? t.unreadCountForTeacher || 0 : t.unreadCountForParent || 0);
  }, 0);
};
