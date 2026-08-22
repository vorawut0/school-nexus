import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { LearningView } from './components/LearningView';
import { CampusView } from './components/CampusView';
import { AssignmentsView } from './components/AssignmentsView';
import { ProfileView } from './components/ProfileView';
import { AITutorSidebar } from './components/AITutorSidebar';

// Admin Specific Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminUsersView } from './components/admin/AdminUsersView';
import { AdminLogsView } from './components/admin/AdminLogsView';
import { AdminFacilitiesView } from './components/admin/AdminFacilitiesView';

// Teacher Specific Views
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { TeacherClassesView } from './components/teacher/TeacherClassesView';
import { TeacherAttendanceView } from './components/teacher/TeacherAttendanceView';
import { TeacherGradingView } from './components/teacher/TeacherGradingView';

// Parent Specific Views
import { ParentAttendanceView } from './components/parent/ParentAttendanceView';
import { ParentWalletView } from './components/parent/ParentWalletView';
import { ParentTasksView } from './components/parent/ParentTasksView';

// Modals
import { CourseModal } from './components/modals/CourseModal';
import { AssignmentModal } from './components/modals/AssignmentModal';
import { CreateTaskModal } from './components/modals/CreateTaskModal';
import { FacilityModal } from './components/modals/FacilityModal';
import { CampusMapModal } from './components/modals/CampusMapModal';
import { NodeModal } from './components/modals/NodeModal';
import { ScheduleModal } from './components/modals/ScheduleModal';
import { GpaModal } from './components/modals/GpaModal';
import { CalendarModal } from './components/modals/CalendarModal';
import { SearchModal } from './components/modals/SearchModal';
import { NotificationDrawer } from './components/modals/NotificationDrawer';
import { QRScannerModal } from './components/modals/QRScannerModal';
import { DigitalIdModal } from './components/modals/DigitalIdModal';
import { ShareIdQrModal } from './components/modals/ShareIdQrModal';
import { CampusPulseModal, CampusPulseTab } from './components/modals/CampusPulseModal';
import { ChangeIdPhotoModal } from './components/modals/ChangeIdPhotoModal';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { RealtimeNotificationBanner } from './components/RealtimeNotificationBanner';
import { checkLinkedGithubRepoCommits } from './utils/githubSync';
import { playNotificationChime } from './utils/sound';

// Mock Data
import { INITIAL_USER, MOCK_NOTIFICATIONS, DEMO_PRESET_USERS, MOCK_ASSIGNMENTS, INITIAL_ROOM_BOOKINGS } from './data/mockData';
import { UserProfile, UserRole, Course, Assignment, Facility, DigitalTwinNode, ScheduleItem, NotificationItem, AssignmentAttachment, RoomBooking } from './types';
import {
  subscribeToRoomBookings,
  subscribeToAssignments,
  subscribeToNotifications,
  subscribeToUserProfile,
  addRoomBookingToFirestore,
  updateRoomBookingInFirestore,
  deleteRoomBookingFromFirestore,
  addAssignmentToFirestore,
  updateAssignmentInFirestore,
  addNotificationToFirestore,
  markAllNotificationsReadInFirestore,
  markNotificationReadInFirestore,
  deleteNotificationFromFirestore,
  clearAllNotificationsInFirestore,
  simulateRoleRealtimeNotification,
  saveUserProfile,
  syncOfflineQueueToFirestore,
  getLocalCache,
  setLocalCache,
  getPersistedAvatar,
  getStoredCustomPresets,
  getStoredAccounts,
  purgeAccountImmediately,
  addSecurityAuditLog,
} from './services/firebaseService';

export default function App() {
  // Session persistence across page refreshes
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const isLocked = localStorage.getItem('sn_is_auto_locked') === 'true';
      if (isLocked) return null;

      const cached = getLocalCache<UserProfile | null>('sn_active_user', null);
      if (cached && cached.id) {
        const customAvatar = getPersistedAvatar(cached);
        return customAvatar ? { ...cached, avatar: customAvatar } : cached;
      }
      const rawUser = localStorage.getItem('sn_active_user') || localStorage.getItem('sn_user_profile');
      if (rawUser) {
        const parsed = JSON.parse(rawUser) as UserProfile;
        if (parsed && parsed.id) {
          const customAvatar = getPersistedAvatar(parsed);
          return customAvatar ? { ...parsed, avatar: customAvatar } : parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const savedTab = localStorage.getItem('sn_active_tab');
      if (savedTab) return savedTab;
    } catch {
      // ignore
    }
    return 'dashboard';
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    return getLocalCache<NotificationItem[]>('notifications', MOCK_NOTIFICATIONS);
  });
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    return getLocalCache<Assignment[]>('assignments', MOCK_ASSIGNMENTS);
  });
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>(() => {
    return getLocalCache<RoomBooking[]>('roomBookings', INITIAL_ROOM_BOOKINGS);
  });
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [offlineToast, setOfflineToast] = useState<string | null>(null);
  const [latestRealtimeNotif, setLatestRealtimeNotif] = useState<NotificationItem | null>(null);
  const prevNotifIdsRef = React.useRef<Set<string>>(new Set());
  const isInitialNotifLoadRef = React.useRef<boolean>(true);

  // Theme state (Light / Dark Mode) with localStorage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('sn_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  // Apply theme to DOM documentElement and body
  useEffect(() => {
    try {
      localStorage.setItem('sn_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  // Synchronize active tab to localStorage for page refresh persistence
  useEffect(() => {
    try {
      if (currentTab) {
        localStorage.setItem('sn_active_tab', currentTab);
      }
    } catch {
      // ignore
    }
  }, [currentTab]);

  // Synchronize active user to localStorage for page refresh persistence
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('sn_active_user', JSON.stringify(user));
        localStorage.setItem('sn_user_profile', JSON.stringify(user));
        setLocalCache('sn_active_user', user);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Auto-lock security state (15 minutes inactivity)
  const [isAutoLocked, setIsAutoLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sn_is_auto_locked') === 'true';
    } catch {
      return false;
    }
  });
  const [lockedUser, setLockedUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem('sn_locked_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const lastActivityRef = React.useRef<number>(Date.now());

  // Monitor network connection state
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      setOfflineToast('เชื่อมต่อเครือข่ายสำเร็จ กำลังซิงค์ข้อมูล...');
      const res = await syncOfflineQueueToFirestore();
      if (res.syncedCount > 0) {
        setOfflineToast(`ซิงค์ข้อมูลที่บันทึกไว้ขณะออฟไลน์ (${res.syncedCount} รายการ) สำเร็จแล้ว`);
      } else {
        setOfflineToast('กลับมาออนไลน์แล้ว ข้อมูลเป็นปัจจุบัน');
      }
      setTimeout(() => setOfflineToast(null), 4000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setOfflineToast('เข้าสู่โหมดออฟไลน์: ใช้งานข้อมูลที่แคชไว้ในเครื่องได้ตามปกติ');
      setTimeout(() => setOfflineToast(null), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleSystemResetEvent = () => {
      setAssignments(MOCK_ASSIGNMENTS);
      setRoomBookings(INITIAL_ROOM_BOOKINGS);
      setNotifications([
        {
          id: `notif-reset-${Date.now()}`,
          title: '✨ ระบบ School Nexus รีเซ็ตพร้อมใช้งาน 100%',
          message: 'ข้อมูลและค่าทุกระบบได้รับการเชื่อมโยงและปรับสถานะให้พร้อมเริ่มต้นการทำงานใหม่ทันที',
          type: 'system',
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          read: false,
          priority: 'high',
          icon: 'restart_alt',
          role: 'all',
        },
      ]);
    };
    window.addEventListener('sn_system_full_reset', handleSystemResetEvent);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sn_system_full_reset', handleSystemResetEvent);
    };
  }, []);

  // Subscribe to real-time Firestore database
  useEffect(() => {
    if (!user?.id) return;

    const unsubUserProfile = subscribeToUserProfile(user.id, (updatedProfile) => {
      if (updatedProfile) {
        setUser((prev) => {
          if (!prev) return updatedProfile;
          // Only update if avatar or crucial fields changed to avoid unnecessary re-renders
          if (
            prev.avatar !== updatedProfile.avatar ||
            prev.name !== updatedProfile.name ||
            prev.thaiName !== updatedProfile.thaiName ||
            prev.studentId !== updatedProfile.studentId ||
            prev.gpa !== updatedProfile.gpa ||
            prev.grade !== updatedProfile.grade ||
            prev.department !== updatedProfile.department ||
            prev.position !== updatedProfile.position
          ) {
            return {
              ...prev,
              ...updatedProfile,
            };
          }
          return prev;
        });
      }
    });

    const unsubBookings = subscribeToRoomBookings(user.id || 'sn-std-01', (bookings) => {
      setRoomBookings(bookings);
    });
    const unsubAssignments = subscribeToAssignments((items) => {
      setAssignments(items);
    });
    const unsubNotifs = subscribeToNotifications((notifs) => {
      setNotifications(notifs);

      // Check if there are newly arrived unread notifications in real-time
      if (isInitialNotifLoadRef.current) {
        prevNotifIdsRef.current = new Set(notifs.map((n) => n.id));
        isInitialNotifLoadRef.current = false;
      } else {
        const brandNewItems = notifs.filter((n) => !prevNotifIdsRef.current.has(n.id) && !n.read);
        if (brandNewItems.length > 0) {
          const newest = brandNewItems[0];
          setLatestRealtimeNotif(newest);
          playNotificationChime(newest.priority || 'normal');

          // Trigger native Web Push if permitted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(newest.title, {
                body: newest.message,
                icon: '/favicon.ico',
              });
            } catch (e) {
              console.debug('Browser notification trigger:', e);
            }
          }
        }
        prevNotifIdsRef.current = new Set(notifs.map((n) => n.id));
      }
    });

    return () => {
      unsubUserProfile();
      unsubBookings();
      unsubAssignments();
      unsubNotifs();
    };
  }, [user?.id]);

  // Modals state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedNode, setSelectedNode] = useState<DigitalTwinNode | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);

  const [showCreateTaskModal, setShowCreateTaskModal] = useState<boolean>(false);
  const [showCampusMapModal, setShowCampusMapModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showGpaModal, setShowGpaModal] = useState<boolean>(false);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState<boolean>(false);
  const [showQrScannerModal, setShowQrScannerModal] = useState<boolean>(false);
  const [showDigitalIdModal, setShowDigitalIdModal] = useState<boolean>(false);
  const [showShareIdModal, setShowShareIdModal] = useState<boolean>(false);
  const [showCampusPulseModal, setShowCampusPulseModal] = useState<boolean>(false);
  const [campusPulseInitialTab, setCampusPulseInitialTab] = useState<CampusPulseTab>('overview');
  const [showChangePhotoModal, setShowChangePhotoModal] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);

  // AI Tutor Sidebar state
  const [showAITutorSidebar, setShowAITutorSidebar] = useState<boolean>(false);
  const [aiTutorFocusCourse, setAiTutorFocusCourse] = useState<Course | null>(null);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const pendingTasksCount = assignments.filter(
    (a) => a.status === 'to_submit' || a.status === 'in_progress' || a.status === 'overdue'
  ).length;

  const handleOpenAITutor = (course?: Course | null) => {
    setAiTutorFocusCourse(course || null);
    setShowAITutorSidebar(true);
  };

  const handleOpenCampusPulse = (tab: CampusPulseTab = 'overview') => {
    setCampusPulseInitialTab(tab);
    setShowCampusPulseModal(true);
  };

  // 15-Minute Inactivity Auto-Lock Handler
  const handleAutoLock = React.useCallback(() => {
    if (!user) return;
    const active = user;
    setLockedUser(active);
    setIsAutoLocked(true);
    try {
      localStorage.setItem('sn_is_auto_locked', 'true');
      localStorage.setItem('sn_locked_user', JSON.stringify(active));
      localStorage.removeItem('sn_active_user');
    } catch {
      // ignore
    }
    setUser(null);
    playNotificationChime('normal');
  }, [user]);

  const handleManualLock = () => {
    handleAutoLock();
  };

  // Auto-Lock Activity Tracker (15 minutes of inactivity = 900,000 ms)
  useEffect(() => {
    if (!user) return;

    lastActivityRef.current = Date.now();

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'wheel',
    ];

    let lastThrottle = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottle > 2000) {
        lastThrottle = now;
        lastActivityRef.current = now;
      }
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Check idle status every 4 seconds
    const checkInterval = setInterval(() => {
      if (!user) return;
      const elapsed = Date.now() - lastActivityRef.current;
      // 15 minutes = 15 * 60 * 1000 = 900000ms
      if (elapsed >= 15 * 60 * 1000) {
        handleAutoLock();
      }
    }, 4000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(checkInterval);
    };
  }, [user, handleAutoLock]);

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    const customAvatar = getPersistedAvatar(loggedInUser);
    const finalUser = customAvatar ? { ...loggedInUser, avatar: customAvatar } : loggedInUser;
    setUser(finalUser);
    setIsAutoLocked(false);
    setLockedUser(null);
    lastActivityRef.current = Date.now();
    setCurrentTab('dashboard');
    try {
      localStorage.removeItem('sn_is_auto_locked');
      localStorage.removeItem('sn_locked_user');
      setLocalCache('sn_active_user', finalUser);
    } catch {
      // ignore
    }
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem('sn_active_user');
      localStorage.removeItem('sn_user_profile');
      localStorage.removeItem('sn_active_tab');
      localStorage.removeItem('sn_is_auto_locked');
      localStorage.removeItem('sn_locked_user');
    } catch {
      // ignore
    }
    setIsAutoLocked(false);
    setLockedUser(null);
    setUser(null);
    setCurrentTab('dashboard');
  };

  const handleSwitchRole = (role: UserRole) => {
    const previousRole = user?.role;
    const registered = getStoredAccounts();
    const foundForRole = registered.find((a) => a.role === role);
    if (foundForRole) {
      const customAvatar = getPersistedAvatar(foundForRole.user);
      const updatedUser = customAvatar ? { ...foundForRole.user, avatar: customAvatar } : foundForRole.user;
      setUser(updatedUser);
      setCurrentTab('dashboard');

      // Security Audit Log into Firebase 'audit_logs'
      if (user) {
        addSecurityAuditLog({
          actionType: 'role_switch',
          severity: role === 'admin' ? 'high' : 'medium',
          actorId: user.id,
          actorName: user.thaiName || user.name,
          actorRole: previousRole || user.role,
          targetId: updatedUser.id,
          targetName: updatedUser.thaiName || updatedUser.name,
          details: `ผู้ใช้ ${user.thaiName} สลับบทบาทจาก [${previousRole}] เป็น [${role}] (Account: ${updatedUser.id})`,
        });
      }
    } else {
      // If no account registered for this role yet, prompt user to login/register for that role
      try {
        localStorage.setItem('sn_last_role', role);
      } catch {
        // ignore
      }
      handleSignOut();
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsReadInFirestore();
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markNotificationReadInFirestore(id);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    deleteNotificationFromFirestore(id);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    clearAllNotificationsInFirestore();
  };

  const handleTriggerSimulatedNotification = async () => {
    if (!user) return;
    const newNotif = await simulateRoleRealtimeNotification(user.role);
    setLatestRealtimeNotif(newNotif);
    playNotificationChime(newNotif.priority || 'high');
  };

  const handleUpdateCourseProgress = (courseId: string, newProgress: number) => {
    // Progress updated in modal
  };

  const handleSubmitAssignmentWork = async (
    assignmentId: string,
    progress: number,
    notes: string,
    attachments?: AssignmentAttachment[],
    isLate?: boolean,
    lateReason?: string,
    githubRepoUrl?: string
  ) => {
    const targetAssignment = assignments.find((a) => a.id === assignmentId);
    const assignmentTitle = targetAssignment?.title || 'งาน';
    const fileCount = attachments ? attachments.length : targetAssignment?.attachmentsCount || 0;
    const wasLate = isLate ?? (targetAssignment?.status === 'overdue' || targetAssignment?.isLate);

    let lastCommitSha = targetAssignment?.lastCommitSha;
    let lastCommitMessage = targetAssignment?.lastCommitMessage;
    let lastSyncedAt = targetAssignment?.lastSyncedAt;

    // Check linked GitHub repository for latest commits if provided
    if (githubRepoUrl && githubRepoUrl.trim()) {
      try {
        const syncResult = await checkLinkedGithubRepoCommits(githubRepoUrl.trim(), {
          assignmentId,
          assignmentTitle,
          studentName: user?.thaiName || user?.name,
          lastKnownCommitSha: targetAssignment?.lastCommitSha,
          triggerNotification: true,
        });

        if (syncResult.success && syncResult.commit) {
          lastCommitSha = syncResult.commit.sha;
          lastCommitMessage = syncResult.commit.message;
          lastSyncedAt = new Date().toISOString();
        }
      } catch (ghErr) {
        console.warn('GitHub commit check during assignment submit:', ghErr);
      }
    }

    const submissionUpdate: Partial<Assignment> = {
      status: 'submitted',
      progress: 100,
      submittedAt: new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.',
      submissionNotes: notes,
      isLate: wasLate,
      lateReason: lateReason || targetAssignment?.lateReason,
      attachmentsCount: fileCount,
      attachments: attachments || targetAssignment?.attachments || [],
      currentScore: wasLate ? 'รอตรวจ (ส่งย้อนหลัง)' : 'รอตรวจ',
      githubRepoUrl: githubRepoUrl?.trim() || targetAssignment?.githubRepoUrl,
      lastCommitSha,
      lastCommitMessage,
      lastSyncedAt,
    };

    // Update local state and Firestore
    setAssignments((prev) =>
      prev.map((as) => (as.id === assignmentId ? { ...as, ...submissionUpdate } : as))
    );
    updateAssignmentInFirestore(assignmentId, submissionUpdate);

    // Give user XP bonus for submitting work
    if (user) {
      const updatedUser = {
        ...user,
        xp: user.xp + 50,
      };
      setUser(updatedUser);
      saveUserProfile(updatedUser);
    }

    // Add success notifications across roles
    const commitSnippet = lastCommitSha ? ` • ซิงค์ GitHub Commit: [${lastCommitSha.substring(0, 7)}]` : '';
    const studentThaiName = user?.thaiName || user?.name || 'นายวรวุฒิ เพ็ชรราย';

    // 1. Notification for STUDENT
    const studentNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: wasLate ? 'ส่งงานย้อนหลังสำเร็จ' : 'ส่งงานสำเร็จแล้ว',
      message: wasLate
        ? `คุณได้ยื่นส่งงานย้อนหลัง "${assignmentTitle}" พร้อมไฟล์แนบ ${fileCount} ไฟล์ (เหตุผล: ${lateReason || 'แจ้งขอส่งล่าช้า'})${commitSnippet}`
        : `คุณได้ส่งงาน "${assignmentTitle}" พร้อมไฟล์แนบ ${fileCount} ไฟล์เรียบร้อยแล้ว${commitSnippet}`,
      time: 'เมื่อสักครู่',
      type: 'assignment',
      role: 'student',
      priority: 'high',
      icon: 'task_alt',
      read: false,
    };
    setNotifications((prev) => [studentNotif, ...prev]);
    addNotificationToFirestore(studentNotif);

    // 2. Notification for TEACHER (Cross-Role)
    const teacherNotif: NotificationItem = {
      id: `notif-t-${Date.now()}`,
      title: '📝 มีนักเรียนส่งการบ้านใหม่',
      message: `${studentThaiName} (ม.6/1) ส่ง "${assignmentTitle}" พร้อมไฟล์แนบ ${fileCount} ไฟล์ (วิชา ${targetAssignment?.subject || 'AI & Robotics'})${commitSnippet}`,
      time: 'เมื่อสักครู่',
      type: 'assignment',
      role: 'teacher',
      priority: 'high',
      icon: 'rate_review',
      read: false,
    };
    addNotificationToFirestore(teacherNotif);

    // 3. Notification for PARENT (Cross-Role)
    const parentNotif: NotificationItem = {
      id: `notif-p-${Date.now()}`,
      title: '📚 แจ้งเตือนการส่งงานของบุตรหลาน',
      message: `บุตรหลาน (${studentThaiName}) ได้ส่งงาน "${assignmentTitle}" เรียบร้อยแล้ว (+50 XP)`,
      time: 'เมื่อสักครู่',
      type: 'assignment',
      role: 'parent',
      priority: 'normal',
      icon: 'school',
      read: false,
    };
    addNotificationToFirestore(parentNotif);
  };

  const handleCreateTask = (newTask: Assignment) => {
    setAssignments((prev) => [newTask, ...prev]);
    addAssignmentToFirestore(newTask);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'สร้างภาระงานใหม่',
      message: `เพิ่มงาน "${newTask.title}" ในระบบเรียบร้อยแล้ว`,
      time: 'เมื่อสักครู่',
      type: 'assignment',
      read: false,
    };
    setNotifications([newNotif, ...notifications]);
    addNotificationToFirestore(newNotif);
    setCurrentTab('assignments');
  };

  const handleCreateBooking = (bookingData: Omit<RoomBooking, 'id' | 'bookedAt' | 'status'>) => {
    const newBooking: RoomBooking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      status: 'confirmed',
      bookedAt: new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.',
      unlocked: false,
    };

    setRoomBookings((prev) => [newBooking, ...prev]);
    addRoomBookingToFirestore(newBooking);

    // Save to Firestore
    if (user) {
      saveUserProfile(user);
    }

    // Notification for user
    const userNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'จองห้องเรียนสำเร็จ',
      message: `คุณได้จอง "${newBooking.roomName}" (${newBooking.date} • ${newBooking.timeSlot}) รหัสเปิดประตู: ${newBooking.passCode}`,
      time: 'เมื่อสักครู่',
      type: 'class',
      role: user?.role || 'student',
      priority: 'normal',
      read: false,
    };
    setNotifications((prev) => [userNotif, ...prev]);
    addNotificationToFirestore(userNotif);

    // Notification for ADMIN (Cross-Role notification)
    const adminNotif: NotificationItem = {
      id: `notif-adm-${Date.now()}`,
      title: '🏢 มีการจองห้องเรียน/พื้นที่ใหม่',
      message: `${user?.thaiName || user?.name || 'ผู้ใช้'} ทำการจอง "${newBooking.roomName}" (${newBooking.date} • ${newBooking.timeSlot}) รหัสปลดล็อก: ${newBooking.passCode}`,
      time: 'เมื่อสักครู่',
      type: 'iot',
      role: 'admin',
      priority: 'normal',
      icon: 'meeting_room',
      read: false,
    };
    addNotificationToFirestore(adminNotif);

    // Record Critical Action to dedicated 'audit_logs' collection in Firebase
    if (user) {
      addSecurityAuditLog({
        actionType: 'facility_booking',
        severity: 'medium',
        actorId: user.id,
        actorName: user.thaiName || user.name,
        actorRole: user.role,
        targetId: newBooking.id,
        targetName: newBooking.roomName,
        details: `ผู้ใช้ ${user.thaiName} (${user.role}) ทำการจองห้อง "${newBooking.roomName}" สำหรับวันที่ ${newBooking.date} ช่วงเวลา ${newBooking.timeSlot} (PassCode: ${newBooking.passCode})`,
      });
    }
  };

  const handleUpdateAvatar = (newAvatarUrl: string) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      avatar: newAvatarUrl,
    };
    setUser(updatedUser);
    saveUserProfile(updatedUser);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'อัปเดตรูปบัตรประจำตัวสำเร็จ',
      message: 'ระบบได้ทำการเปลี่ยนรูปถ่ายบัตร Smart Digital ID เรียบร้อยแล้ว',
      time: 'เมื่อสักครู่',
      type: 'system',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    addNotificationToFirestore(newNotif);
  };

  const handleCancelBooking = (bookingId: string) => {
    const targetBooking = roomBookings.find((b) => b.id === bookingId);
    setRoomBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    );
    updateRoomBookingInFirestore(bookingId, { status: 'cancelled' });

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'ยกเลิกการจองห้อง',
      message: `ยกเลิกการจอง "${targetBooking?.roomName || 'ห้องเรียน'}" เรียบร้อยแล้ว`,
      time: 'เมื่อสักครู่',
      type: 'class',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    addNotificationToFirestore(newNotif);
  };

  const handleUnlockDoor = (bookingId: string) => {
    setRoomBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, unlocked: true } : b))
    );
    updateRoomBookingInFirestore(bookingId, { unlocked: true });

    const targetBooking = roomBookings.find((b) => b.id === bookingId);
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'ปลดล็อกประตูดิจิทัล (NFC)',
      message: `ส่งสัญญาณปลดล็อกประตู "${targetBooking?.roomName || 'ห้องเรียน'}" สำเร็จ`,
      time: 'เมื่อสักครู่',
      type: 'class',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    addNotificationToFirestore(newNotif);
  };

  // If user is not logged in, render the Login Screen directly
  if (!user) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        isAutoLocked={isAutoLocked}
        lockedUser={lockedUser}
        onClearAutoLock={() => {
          setIsAutoLocked(false);
          setLockedUser(null);
          try {
            localStorage.removeItem('sn_is_auto_locked');
            localStorage.removeItem('sn_locked_user');
          } catch {
            // ignore
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-screen max-w-full overflow-x-hidden bg-[#f9f9ff] text-[#121b2e] flex flex-col font-['Noto_Sans_Thai',sans-serif] selection:bg-[#1550d3] selection:text-white">
      {/* Fixed Top Header */}
      <Header
        currentTab={currentTab}
        user={user}
        unreadNotificationsCount={unreadNotificationsCount}
        isOffline={isOffline}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenNotifications={() => setShowNotificationDrawer(true)}
        onOpenProfile={() => setCurrentTab('profile')}
        onOpenAITutor={() => handleOpenAITutor(null)}
        onSyncComplete={(count) => {
          setOfflineToast(`ซิงค์ข้อมูล ${count} รายการไปยัง Firestore สำเร็จแล้ว`);
          setTimeout(() => setOfflineToast(null), 4000);
        }}
      />

      {/* Offline Status Warning Bar */}
      {isOffline && (
        <div className="bg-amber-500 text-slate-900 px-3 sm:px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-[56px] sm:top-[64px] z-30 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[18px] shrink-0">cloud_off</span>
            <span className="truncate">
              โหมดออฟไลน์ (Offline Mode) • ใช้งานข้อมูลที่แคชไว้ในเครื่องได้ตามปกติ ข้อมูลที่บันทึกจะซิงค์ใหม่อัตโนมัติเมื่อออนไลน์
            </span>
          </div>
          <button
            onClick={() => {
              if (navigator.onLine) {
                setIsOffline(false);
                syncOfflineQueueToFirestore();
              }
            }}
            className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            ตรวจสอบสัญญาณ
          </button>
        </div>
      )}

      {/* Offline Toast Notification */}
      {offlineToast && (
        <div className="fixed top-16 sm:top-20 right-3 sm:right-4 z-50 bg-[#121b2e] text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs font-semibold animate-slideDown max-w-[calc(100vw-24px)] sm:max-w-sm">
          <span className="material-symbols-outlined text-[#20C997] text-[20px] shrink-0">
            {isOffline ? 'cloud_off' : 'sync'}
          </span>
          <span className="flex-1 truncate">{offlineToast}</span>
          <button
            onClick={() => setOfflineToast(null)}
            className="text-slate-400 hover:text-white cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Real-time Live Push Notification Banner */}
      <RealtimeNotificationBanner
        notification={latestRealtimeNotif}
        currentUserRole={user.role}
        onClose={() => setLatestRealtimeNotif(null)}
        onOpenDrawer={() => setShowNotificationDrawer(true)}
        onMarkAsRead={handleMarkNotificationRead}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden flex flex-col px-0">
        {currentTab === 'dashboard' && (
          user.role === 'teacher' ? (
            <TeacherDashboard
              user={user}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenScheduleModal={(item) => {
                setSelectedSchedule(item || null);
                setShowScheduleModal(true);
              }}
              onOpenIdCardModal={() => setShowDigitalIdModal(true)}
              onOpenQrScanner={() => setShowQrScannerModal(true)}
              onOpenAITutor={() => handleOpenAITutor(null)}
              onOpenCalendarModal={() => setShowCalendarModal(true)}
              onOpenShareId={() => setShowShareIdModal(true)}
            />
          ) : user.role === 'admin' ? (
            <AdminDashboard
              user={user}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenDigitalIdModal={() => setShowDigitalIdModal(true)}
              onOpenQrScanner={() => setShowQrScannerModal(true)}
            />
          ) : user.role === 'parent' ? (
            <ParentAttendanceView user={user} />
          ) : (
            <DashboardView
              user={user}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenScheduleModal={(item) => {
                setSelectedSchedule(item || null);
                setShowScheduleModal(true);
              }}
              onOpenIdCardModal={() => setShowDigitalIdModal(true)}
              onOpenQrScanner={() => setShowQrScannerModal(true)}
              onOpenGpaModal={() => setShowGpaModal(true)}
              onOpenCalendarModal={() => setShowCalendarModal(true)}
              onOpenAITutor={() => handleOpenAITutor(null)}
              onOpenCampusPulse={(tab) => handleOpenCampusPulse(tab)}
              onOpenShareId={() => setShowShareIdModal(true)}
            />
          )
        )}

        {currentTab === 'campus' && (
          user.role === 'admin' ? (
            <AdminFacilitiesView
              user={user}
              roomBookings={roomBookings}
              onOpenFacilityModal={(fac) => setSelectedFacility(fac)}
              onOpenNodeModal={(node) => setSelectedNode(node)}
              onOpenCampusMap={() => setShowCampusMapModal(true)}
              onOpenCampusPulse={(tab) => handleOpenCampusPulse(tab)}
              onCancelBooking={handleCancelBooking}
              onUnlockDoor={handleUnlockDoor}
            />
          ) : (
            <CampusView
              roomBookings={roomBookings}
              onOpenFacilityModal={(fac) => setSelectedFacility(fac)}
              onOpenNodeModal={(node) => setSelectedNode(node)}
              onOpenCampusMap={() => setShowCampusMapModal(true)}
              onOpenCampusPulse={(tab) => handleOpenCampusPulse(tab)}
              onCancelBooking={handleCancelBooking}
              onUnlockDoor={handleUnlockDoor}
            />
          )
        )}

        {/* Student & Teacher Learning View */}
        {currentTab === 'learning' && (
          user.role === 'admin' ? (
            <AdminUsersView user={user} />
          ) : user.role === 'parent' ? (
            <ParentAttendanceView user={user} />
          ) : (
            <LearningView
              user={user}
              onOpenCourseModal={(course) => setSelectedCourse(course)}
              onOpenAITutor={(course) => handleOpenAITutor(course)}
            />
          )
        )}

        {/* Tasks & Assignments */}
        {currentTab === 'assignments' && (
          user.role === 'admin' ? (
            <AdminLogsView user={user} />
          ) : user.role === 'parent' ? (
            <ParentTasksView user={user} assignments={assignments} />
          ) : (
            <AssignmentsView
              assignments={assignments}
              onOpenAssignmentModal={(as) => setSelectedAssignment(as)}
              onOpenCreateTaskModal={() => setShowCreateTaskModal(true)}
            />
          )
        )}

        {/* Teacher Specific Tabs */}
        {currentTab === 'teacher-classes' && (
          <TeacherClassesView
            user={user}
          />
        )}

        {currentTab === 'teacher-attendance' && (
          <TeacherAttendanceView
            user={user}
            onOpenQrScanner={() => setShowQrScannerModal(true)}
          />
        )}

        {currentTab === 'teacher-grading' && (
          <TeacherGradingView
            user={user}
            assignments={assignments}
            onGradeAssignment={(asId, score, feedback) => {
              setAssignments((prev) =>
                prev.map((as) =>
                  as.id === asId
                    ? {
                        ...as,
                        currentScore: score,
                        submissionNotes: feedback || as.submissionNotes,
                      }
                    : as
                )
              );
            }}
          />
        )}

        {/* Admin Specific Tabs */}
        {currentTab === 'admin-users' && (
          <AdminUsersView user={user} />
        )}

        {currentTab === 'admin-logs' && (
          <AdminLogsView user={user} />
        )}

        {/* Parent Specific Tabs */}
        {currentTab === 'parent-attendance' && (
          <ParentAttendanceView user={user} />
        )}

        {currentTab === 'parent-wallet' && (
          <ParentWalletView user={user} />
        )}

        {currentTab === 'parent-tasks' && (
          <ParentTasksView user={user} assignments={assignments} />
        )}

        {/* Profile View */}
        {currentTab === 'profile' && (
          <ProfileView
            user={user}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            isOffline={isOffline}
            onUpdateUser={(updated) => setUser(updated)}
            onSwitchRole={handleSwitchRole}
            onSignOut={handleSignOut}
            onLockScreen={handleManualLock}
            onOpenQrScanner={() => setShowQrScannerModal(true)}
            onOpenGpaModal={() => setShowGpaModal(true)}
            onOpenShareId={() => setShowShareIdModal(true)}
            onOpenIdCardModal={() => setShowDigitalIdModal(true)}
            onOpenChangePhoto={() => setShowChangePhotoModal(true)}
            onOpenEditProfile={() => setShowEditProfileModal(true)}
          />
        )}
      </main>

      {/* Floating AI Assistant FAB Button (Bottom Right) */}
      <button
        onClick={() => handleOpenAITutor(null)}
        className={`fixed right-4 bottom-20 sm:bottom-22 z-40 px-4 py-3 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold text-[13px] border border-white/30 cursor-pointer group ${
          user.role === 'teacher'
            ? 'bg-gradient-to-r from-[#1550d3] to-[#2b7fff] shadow-blue-500/30'
            : user.role === 'admin'
            ? 'bg-gradient-to-r from-[#6e2acf] to-[#9b51e0] shadow-purple-500/30'
            : user.role === 'parent'
            ? 'bg-gradient-to-r from-[#d97706] to-[#f59e0b] shadow-amber-500/30'
            : 'bg-gradient-to-r from-[#1550d3] to-[#7857f8] shadow-[#1550d3]/30'
        }`}
        title={
          user.role === 'teacher'
            ? 'เปิด AI Teaching Assistant (ผู้ช่วยสอน & ออกแบบบทเรียน)'
            : user.role === 'admin'
            ? 'เปิด AI Ops Assistant (ผู้ช่วยระบบ & ตรวจสอบความปลอดภัย)'
            : user.role === 'parent'
            ? 'เปิด AI Family Guide (ที่ปรึกษาครอบครัว & พัฒนาการบุตรหลาน)'
            : 'เปิด AI Tutor (ผู้ช่วยติวเตอร์ & การเรียนรู้ส่วนบุคคล)'
        }
        aria-label="Open AI Assistant"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">
          {user.role === 'teacher'
            ? 'menu_book'
            : user.role === 'admin'
            ? 'security'
            : user.role === 'parent'
            ? 'family_restroom'
            : 'auto_awesome'}
        </span>
        <span className="hidden sm:inline">
          {user.role === 'teacher'
            ? 'AI Teaching'
            : user.role === 'admin'
            ? 'AI Ops'
            : user.role === 'parent'
            ? 'AI Family'
            : 'AI Tutor'}
        </span>
        <span className="w-2 h-2 rounded-full bg-[#20C997] animate-pulse" />
      </button>

      {/* Fixed Floating Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        pendingTasksCount={pendingTasksCount}
        userRole={user.role}
      />

      {/* AI Tutor Sidebar Panel */}
      <AITutorSidebar
        isOpen={showAITutorSidebar}
        onClose={() => setShowAITutorSidebar(false)}
        user={user}
        initialCourse={aiTutorFocusCourse}
      />

      {/* Interactive Modals */}
      <CourseModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
        onUpdateProgress={handleUpdateCourseProgress}
        onOpenAITutor={(course) => handleOpenAITutor(course)}
      />

      <AssignmentModal
        assignment={selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        onSubmitWork={handleSubmitAssignmentWork}
      />

      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onCreateTask={handleCreateTask}
      />

      <FacilityModal
        facility={selectedFacility}
        user={user}
        onClose={() => setSelectedFacility(null)}
        onConfirmBooking={handleCreateBooking}
        existingBookings={roomBookings}
        onOpenCampusMap={() => {
          setSelectedFacility(null);
          setShowCampusMapModal(true);
        }}
      />

      <CampusMapModal
        isOpen={showCampusMapModal}
        onClose={() => setShowCampusMapModal(false)}
        onSelectFacility={(fac) => setSelectedFacility(fac)}
      />

      <NodeModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />

      <ScheduleModal
        isOpen={showScheduleModal}
        selectedItem={selectedSchedule}
        user={user}
        onOpenCampusMap={() => setShowCampusMapModal(true)}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedSchedule(null);
        }}
      />

      <GpaModal
        user={user}
        isOpen={showGpaModal}
        onClose={() => setShowGpaModal(false)}
      />

      <CalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={(tab, item) => {
          setCurrentTab(tab);
          if (tab === 'learning' && item) setSelectedCourse(item);
          if (tab === 'assignments' && item) setSelectedAssignment(item);
          if (tab === 'campus' && item) setSelectedFacility(item);
        }}
      />

      <NotificationDrawer
        isOpen={showNotificationDrawer}
        onClose={() => setShowNotificationDrawer(false)}
        notifications={notifications}
        currentUserRole={user.role}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onMarkAsRead={handleMarkNotificationRead}
        onDeleteNotification={handleDeleteNotification}
        onClearNotifications={handleClearNotifications}
        onTriggerSimulatedNotification={handleTriggerSimulatedNotification}
      />

      <QRScannerModal
        isOpen={showQrScannerModal}
        onClose={() => setShowQrScannerModal(false)}
        onOpenShareId={() => setShowShareIdModal(true)}
      />

      <DigitalIdModal
        user={user}
        isOpen={showDigitalIdModal}
        onClose={() => setShowDigitalIdModal(false)}
        onOpenScanner={() => setShowQrScannerModal(true)}
        onOpenShareId={() => setShowShareIdModal(true)}
        onOpenChangePhoto={() => setShowChangePhotoModal(true)}
        onUpdateTheme={(newTheme) => {
          setUser((prev) => (prev ? { ...prev, cardTheme: newTheme } : prev));
        }}
      />

      <ShareIdQrModal
        user={user}
        isOpen={showShareIdModal}
        onClose={() => setShowShareIdModal(false)}
        onOpenScanner={() => setShowQrScannerModal(true)}
      />

      <ChangeIdPhotoModal
        isOpen={showChangePhotoModal}
        onClose={() => setShowChangePhotoModal(false)}
        user={user}
        onSaveAvatar={handleUpdateAvatar}
      />

      <CampusPulseModal
        isOpen={showCampusPulseModal}
        initialTab={campusPulseInitialTab}
        onClose={() => setShowCampusPulseModal(false)}
        totalStudents={1248}
      />

      {/* Edit Profile with Debounced Firestore Auto-save */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        user={user}
        onSaveProfile={(updatedProfile) => {
          setUser(updatedProfile);
          saveUserProfile(updatedProfile);
        }}
      />
    </div>
  );
}
