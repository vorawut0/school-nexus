import React, { useState, useEffect, useRef } from 'react';
import { Assignment, AssignmentAttachment, GithubCommitInfo, GithubRepoSuggestion, UserProfile } from '../../types';
import {
  checkLinkedGithubRepoCommits,
  validateGithubRepoUrl,
  RepoValidationResult,
  parseGithubRepo,
  fetchUserRecentGithubRepos,
  getSavedRecentGithubRepos,
  saveRecentGithubRepo,
  getSavedLinkedGithubUsername,
  saveLinkedGithubUsername,
  detectCurrentProjectGithubRepo,
} from '../../utils/githubSync';
import { pushRealtimeNotification } from '../../services/firebaseService';
import { playNotificationChime } from '../../utils/sound';

interface AssignmentModalProps {
  assignment: Assignment | null;
  user?: UserProfile | null;
  onClose: () => void;
  onSubmitWork: (
    assignmentId: string,
    progress: number,
    notes: string,
    attachments?: AssignmentAttachment[],
    isLate?: boolean,
    lateReason?: string,
    githubRepoUrl?: string
  ) => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  assignment,
  user,
  onClose,
  onSubmitWork,
}) => {
  const [notes, setNotes] = useState('');
  const [progress, setProgress] = useState(assignment?.progress || 0);
  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([]);
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [repoValidation, setRepoValidation] = useState<RepoValidationResult>({
    status: 'idle',
    isValid: true,
  });
  const [latestCommit, setLatestCommit] = useState<GithubCommitInfo | null>(null);
  const [isCheckingGithub, setIsCheckingGithub] = useState(false);
  const [githubSyncMessage, setGithubSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [enableLateSubmission, setEnableLateSubmission] = useState(false);
  const [lateReason, setLateReason] = useState('');
  const [isReminderSet, setIsReminderSet] = useState(false);
  const [isCalendarAdded, setIsCalendarAdded] = useState(false);
  const [quickActionFeedback, setQuickActionFeedback] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-suggest state for GitHub repositories
  const [linkedUsername, setLinkedUsername] = useState<string>(() => getSavedLinkedGithubUsername(user));
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [suggestions, setSuggestions] = useState<GithubRepoSuggestion[]>([]);
  const [recentSavedRepos, setRecentSavedRepos] = useState<string[]>(() => getSavedRecentGithubRepos());
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isDetectingProjectRepo, setIsDetectingProjectRepo] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOverdue = assignment?.status === 'overdue';
  const isSubmitted = assignment?.status === 'submitted';

  // Keep linked username in sync if user changes
  useEffect(() => {
    const activeUsername = getSavedLinkedGithubUsername(user);
    setLinkedUsername(activeUsername);
  }, [user]);

  // Fetch GitHub repos for auto-suggest when linked username is present
  useEffect(() => {
    if (!linkedUsername) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    setIsLoadingSuggestions(true);

    fetchUserRecentGithubRepos(linkedUsername, controller.signal)
      .then((repos) => {
        if (!controller.signal.aborted) {
          setSuggestions(repos);
          setIsLoadingSuggestions(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setIsLoadingSuggestions(false);
        }
      });

    return () => controller.abort();
  }, [linkedUsername]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestionsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (assignment) {
      setProgress(assignment.progress);
      setNotes(assignment.submissionNotes || '');
      setAttachments(assignment.attachments || []);
      setLateReason(assignment.lateReason || '');
      setGithubRepoUrl(assignment.githubRepoUrl || '');
      if (assignment.lastCommitSha) {
        setLatestCommit({
          sha: assignment.lastCommitSha,
          shortSha: assignment.lastCommitSha.substring(0, 7),
          message: assignment.lastCommitMessage || 'Latest commit synced',
          authorName: 'GitHub Contributor',
          date: assignment.lastSyncedAt || new Date().toISOString(),
          url: assignment.githubRepoUrl ? `${assignment.githubRepoUrl}/commit/${assignment.lastCommitSha}` : '#',
          repoOwner: '',
          repoName: '',
        });
      } else {
        setLatestCommit(null);
      }
      // If already has attachments or was late, enable late submission mode
      setEnableLateSubmission(assignment.isLate || (assignment.attachments && assignment.attachments.length > 0) || false);
      setIsSubmitting(false);
      setIsSuccess(false);
      setGithubSyncMessage(null);
      setQuickActionFeedback(null);
      setShowCalendarMenu(false);

      // Check stored reminder & calendar states
      try {
        const reminderKey = `sn_reminder_${assignment.id}`;
        const calKey = `sn_calendar_${assignment.id}`;
        setIsReminderSet(localStorage.getItem(reminderKey) === 'true');
        setIsCalendarAdded(localStorage.getItem(calKey) === 'true');
      } catch {
        // ignore
      }
    }
  }, [assignment]);

  // Real-time validation for GitHub repository URL
  useEffect(() => {
    const trimmed = githubRepoUrl.trim();
    if (!trimmed) {
      setRepoValidation({ status: 'idle', isValid: true });
      return;
    }

    // Step 1: Quick format check
    const parsed = parseGithubRepo(trimmed);
    if (!parsed) {
      setRepoValidation({
        status: 'invalid_format',
        isValid: false,
        message: 'รูปแบบ URL ไม่ถูกต้อง (โปรดระบุ https://github.com/owner/repo หรือ owner/repo)',
      });
      return;
    }

    // Step 2: Show checking state immediately
    setRepoValidation({
      status: 'checking',
      isValid: false,
      owner: parsed.owner,
      repo: parsed.repo,
      message: `กำลังตรวจสอบการเข้าถึงคลัง "${parsed.owner}/${parsed.repo}"...`,
    });

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await validateGithubRepoUrl(trimmed, controller.signal);
        if (controller.signal.aborted) return;
        setRepoValidation(res);

        if (res.status === 'valid' && res.commit && !latestCommit) {
          setLatestCommit(res.commit);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setRepoValidation({
            status: 'error',
            isValid: false,
            message: 'ไม่สามารถตรวจสอบการเข้าถึงคลังได้ โปรดตรวจการเชื่อมต่ออินเทอร์เน็ต',
          });
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [githubRepoUrl]);

  // Helper to parse or derive ISO dates for calendar and reminders
  const getAssignmentDates = () => {
    let endDate = new Date(Date.now() + 24 * 3600 * 1000);
    if (assignment?.dueDate) {
      const parsed = new Date(assignment.dueDate);
      if (!isNaN(parsed.getTime())) {
        endDate = parsed;
      }
    }
    const startDate = new Date(endDate.getTime() - 3600 * 1000);
    return { startDate, endDate };
  };

  // Quick Action: Remind Me
  const handleRemindMe = async () => {
    if (!assignment) return;

    try {
      const newStatus = !isReminderSet;
      setIsReminderSet(newStatus);
      localStorage.setItem(`sn_reminder_${assignment.id}`, newStatus ? 'true' : 'false');

      if (newStatus) {
        // 1. Play chime sound
        playNotificationChime('high');

        // 2. Dispatch in-app and Firestore notification
        await pushRealtimeNotification({
          title: `⏰ ตั้งแจ้งเตือน: ${assignment.title}`,
          message: `กำหนดส่งวิชา ${assignment.subject} (${assignment.subjectCode}) ${assignment.dueRelative} • คะแนนเต็ม ${assignment.maxScore} คะแนน`,
          type: 'assignment',
          priority: 'high',
          icon: 'alarm',
          actionLabel: 'ดูงานที่ต้องส่ง',
        });

        // 3. Trigger browser Web Notification if supported and permitted
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(`🔔 แจ้งเตือนส่งงาน: ${assignment.title}`, {
              body: `วิชา ${assignment.subject} (${assignment.subjectCode}) • ${assignment.dueRelative}`,
              icon: '/favicon.ico',
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((perm) => {
              if (perm === 'granted') {
                new Notification(`🔔 แจ้งเตือนส่งงาน: ${assignment.title}`, {
                  body: `วิชา ${assignment.subject} (${assignment.subjectCode}) • ${assignment.dueRelative}`,
                  icon: '/favicon.ico',
                });
              }
            });
          }
        }

        setQuickActionFeedback({
          text: `ตั้งแจ้งเตือนสำหรับ "${assignment.title}" เรียบร้อยแล้ว!`,
          type: 'success',
        });
      } else {
        setQuickActionFeedback({
          text: `ยกเลิกการแจ้งเตือนสำหรับ "${assignment.title}" แล้ว`,
          type: 'info',
        });
      }

      setTimeout(() => setQuickActionFeedback(null), 4000);
    } catch (err) {
      console.warn('Reminder error:', err);
    }
  };

  // Quick Action: Add to Calendar via .ics file download
  const handleDownloadIcsCalendar = () => {
    if (!assignment) return;

    try {
      const { startDate, endDate } = getAssignmentDates();
      const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
      const formatIcs = (d: Date) =>
        `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

      const title = `[ส่งงาน] ${assignment.title} (${assignment.subjectCode})`;
      const cleanDesc = (assignment.description || '')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');
      const details = `วิชา: ${assignment.subject} (${assignment.subjectCode})\\nกำหนดส่ง: ${assignment.dueRelative}\\nคะแนน: ${assignment.maxScore} คะแนน\\n\\nรายละเอียด: ${cleanDesc}`;

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//School Nexus//Smart Assignment Calendar//TH',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:assignment-${assignment.id}-${Date.now()}@schoolnexus.edu`,
        `DTSTAMP:${formatIcs(new Date())}`,
        `DTSTART:${formatIcs(startDate)}`,
        `DTEND:${formatIcs(endDate)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${details}`,
        `LOCATION:School Nexus Smart Campus`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT3H',
        'ACTION:DISPLAY',
        'DESCRIPTION:แจ้งเตือนส่งการบ้านและโครงงาน School Nexus',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Assignment_${assignment.subjectCode || 'Task'}_${assignment.id}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsCalendarAdded(true);
      localStorage.setItem(`sn_calendar_${assignment.id}`, 'true');
      setShowCalendarMenu(false);
      setQuickActionFeedback({
        text: 'ดาวน์โหลดไฟล์ปฏิทิน (.ics) เรียบร้อย! สามารถเปิดใน Apple Calendar / Outlook / อุปกรณ์ได้ทันที',
        type: 'success',
      });
      setTimeout(() => setQuickActionFeedback(null), 4500);
    } catch (err) {
      console.warn('Calendar download error:', err);
    }
  };

  // Quick Action: Add directly to Google Calendar Web
  const handleOpenGoogleCalendar = () => {
    if (!assignment) return;

    try {
      const { startDate, endDate } = getAssignmentDates();
      const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
      const formatGCal = (d: Date) =>
        `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

      const titleParam = encodeURIComponent(`[ส่งงาน] ${assignment.title} (${assignment.subjectCode})`);
      const detailsParam = encodeURIComponent(
        `📚 วิชา: ${assignment.subject} (${assignment.subjectCode})\n⏰ กำหนดส่ง: ${assignment.dueRelative}\n🎯 คะแนนเต็ม: ${assignment.maxScore} คะแนน\n\n📌 รายละเอียด:\n${assignment.description}\n\n🏫 ระบบ School Nexus Smart Campus`
      );
      const locationParam = encodeURIComponent('School Nexus Smart Campus');
      const datesParam = `${formatGCal(startDate)}/${formatGCal(endDate)}`;

      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titleParam}&dates=${datesParam}&details=${detailsParam}&location=${locationParam}`;
      window.open(url, '_blank', 'noopener,noreferrer');

      setIsCalendarAdded(true);
      localStorage.setItem(`sn_calendar_${assignment.id}`, 'true');
      setShowCalendarMenu(false);
      setQuickActionFeedback({
        text: 'เปิด Google Calendar เพื่อบันทึกกำหนดส่งงานเรียบร้อยแล้ว!',
        type: 'success',
      });
      setTimeout(() => setQuickActionFeedback(null), 4000);
    } catch (err) {
      console.warn('Google calendar error:', err);
    }
  };

  const handleManualGithubCheck = async () => {
    if (!githubRepoUrl.trim()) {
      setGithubSyncMessage({ text: 'กรุณากรอกลิงก์ GitHub Repository ก่อนตรวจสอบ', type: 'error' });
      return;
    }

    setIsCheckingGithub(true);
    setGithubSyncMessage(null);

    const result = await checkLinkedGithubRepoCommits(githubRepoUrl.trim(), {
      assignmentId: assignment?.id,
      assignmentTitle: assignment?.title,
      lastKnownCommitSha: latestCommit?.sha,
      triggerNotification: true,
    });

    setIsCheckingGithub(false);

    if (result.success && result.commit) {
      setLatestCommit(result.commit);
      setGithubSyncMessage({
        text: `ซิงค์ GitHub สำเร็จ! พบคอมมิตล่าสุด [${result.commit.shortSha}] พร้อมส่งการแจ้งเตือนแล้ว`,
        type: 'success',
      });
    } else {
      setGithubSyncMessage({
        text: result.message || 'ไม่สามารถดึงข้อมูลจากคลัง GitHub ได้',
        type: 'error',
      });
    }
  };

  const handleDetectFromCurrentProject = async () => {
    setIsDetectingProjectRepo(true);
    setGithubSyncMessage(null);
    setShowSuggestionsDropdown(false);

    try {
      const detected = await detectCurrentProjectGithubRepo();
      if (detected.success && detected.repoUrl) {
        setGithubRepoUrl(detected.repoUrl);
        saveRecentGithubRepo(detected.repoUrl);
        setRecentSavedRepos(getSavedRecentGithubRepos());
        setGithubSyncMessage({
          text: `ตรวจพบคลังจากโปรเจกต์สำเร็จ (${detected.source || 'โครงสร้างโปรเจกต์'}): ${detected.repoUrl}`,
          type: 'success',
        });
      } else {
        setGithubSyncMessage({
          text: detected.message || 'ไม่พบการตั้งค่า GitHub Repository จากสภาพแวดล้อมโปรเจกต์นี้',
          type: 'error',
        });
      }
    } catch (err: any) {
      setGithubSyncMessage({
        text: err?.message || 'เกิดข้อผิดพลาดในการตรวจสอบโปรเจกต์',
        type: 'error',
      });
    } finally {
      setIsDetectingProjectRepo(false);
    }
  };

  if (!assignment) return null;

  // File upload is unlocked if not overdue, or if late submission is activated
  const isUploadUnlocked = !isOverdue || enableLateSubmission;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, mimeType?: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext) || mimeType?.startsWith('image/')) {
      return 'image';
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || mimeType?.startsWith('video/')) {
      return 'video_file';
    }
    if (['mp3', 'wav', 'aac', 'm4a', 'flac'].includes(ext) || mimeType?.startsWith('audio/')) {
      return 'audio_file';
    }
    if (['pdf'].includes(ext)) {
      return 'picture_as_pdf';
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return 'folder_zip';
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return 'description';
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return 'table_chart';
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return 'slideshow';
    }
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'json', 'cpp', 'java'].includes(ext)) {
      return 'code';
    }
    return 'attach_file';
  };

  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: AssignmentAttachment[] = Array.from(files).map((file, idx) => ({
      id: `upload-${Date.now()}-${idx}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'application/octet-stream',
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploadUnlocked) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploadUnlocked && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isOverdue && !enableLateSubmission) {
      setEnableLateSubmission(true);
      return;
    }

    if (
      githubRepoUrl.trim() &&
      !repoValidation.isValid &&
      repoValidation.status !== 'checking' &&
      repoValidation.status !== 'idle'
    ) {
      setGithubSyncMessage({
        text: repoValidation.message || 'ลิงก์ GitHub ไม่ถูกต้องหรือไม่สามารถเข้าถึงได้ โปรดแก้ไขหรือลบออกก่อนส่งงาน',
        type: 'error',
      });
      return;
    }

    if (githubRepoUrl.trim()) {
      saveRecentGithubRepo(githubRepoUrl.trim());
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSubmitWork(
          assignment.id,
          100,
          notes,
          attachments,
          isOverdue || assignment.isLate,
          lateReason,
          githubRepoUrl.trim() || undefined
        );
        onClose();
      }, 900);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-scaleIn">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#f9f9ff] border-b border-slate-200 flex justify-between items-start gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-md w-fit"
                style={{
                  backgroundColor: `${assignment.categoryColor}15`,
                  color: assignment.categoryColor,
                }}
              >
                {assignment.subject} ({assignment.subjectCode})
              </span>
              {isSubmitted ? (
                <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] fill-1">check_circle</span>
                  <span>{assignment.isLate ? 'ส่งงานย้อนหลังแล้ว' : 'ส่งงานแล้ว (Submitted)'}</span>
                </span>
              ) : isOverdue ? (
                <span className="text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] fill-1">error</span>
                  <span>เกินกำหนดส่ง (Overdue)</span>
                </span>
              ) : (
                <span className="text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">hourglass_top</span>
                  <span>ใกล้ถึงกำหนด (Due Soon)</span>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#121b2e] leading-snug">
              {assignment.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#737686] flex-wrap">
              <span className="material-symbols-outlined text-[15px]">
                {isOverdue ? 'event_busy' : 'event'}
              </span>
              <span className={`font-medium ${isOverdue ? 'text-[#ba1a1a] font-semibold' : 'text-slate-700'}`}>
                {assignment.dueRelative}
              </span>
              <span>•</span>
              <span className="font-semibold text-[#121b2e]">
                คะแนนเต็ม: {assignment.maxScore} คะแนน
              </span>
              {assignment.submittedAt && (
                <>
                  <span>•</span>
                  <span className="text-[#00694d]">ส่งเมื่อ: {assignment.submittedAt}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 text-[#434654] hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="ปิดหน้าต่าง"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Overdue Warning & Late Submission Activation Banner */}
          {isOverdue && !isSubmitted && (
            <div className={`p-4 rounded-2xl border transition-all ${
              enableLateSubmission 
                ? 'bg-amber-500/10 border-amber-300 text-amber-900' 
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  enableLateSubmission ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {enableLateSubmission ? 'history_edu' : 'warning'}
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h4 className="font-bold text-sm">
                      {enableLateSubmission ? 'เปิดใช้งานระบบส่งงานย้อนหลัง (Late Submission Active)' : 'งานนี้เลยกำหนดส่งแล้ว'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEnableLateSubmission(!enableLateSubmission)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs ${
                        enableLateSubmission
                          ? 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-100'
                          : 'bg-[#1550d3] text-white hover:bg-[#1a53d6] shadow-sm'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {enableLateSubmission ? 'check' : 'upload_file'}
                      </span>
                      <span>{enableLateSubmission ? 'ยื่นส่งย้อนหลังเปิดอยู่' : 'กดส่งงานย้อนหลังเพื่ออัปโหลดไฟล์'}</span>
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {enableLateSubmission
                      ? 'คุณสามารถอัปโหลดไฟล์งานจากคอมพิวเตอร์หรือมือถือ และระบุเหตุผลในการส่งล่าช้าเพื่อให้อาจารย์พิจารณาให้คะแนน'
                      : 'งานนี้ปิดรับส่งตามเวลาปกติแล้ว หากต้องการส่งงาน กรุณากด "กดส่งงานย้อนหลังเพื่ออัปโหลดไฟล์" เพื่อปลดล็อกการแนบไฟล์'}
                  </p>
                </div>
              </div>

              {/* Late Submission Reason Field */}
              {enableLateSubmission && (
                <div className="mt-3.5 pt-3 border-t border-amber-200/80 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">help_outline</span>
                    <span>ระบุเหตุผลในการส่งงานย้อนหลัง (ส่งให้อาจารย์พิจารณา)</span>
                  </label>
                  <input
                    type="text"
                    value={lateReason}
                    onChange={(e) => setLateReason(e.target.value)}
                    placeholder="เช่น ติดปัญหาด้านเทคนิค / ลาป่วย / ขอแก้ไขเพิ่มเติมผลงาน..."
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder:text-slate-400 text-slate-800"
                  />
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-[#737686] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>รายละเอียดและข้อกำหนดงาน</span>
            </h4>
            <div className="p-4 rounded-2xl bg-[#f1f3ff] text-sm text-[#121b2e] leading-relaxed border border-blue-100/70">
              {assignment.description}
            </div>
          </div>

          {/* Quick Actions Row: Remind Me & Add to Calendar */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#1550d3]">bolt</span>
                <span>การดำเนินการด่วน (Quick Actions)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {isReminderSet || isCalendarAdded ? 'บันทึกการแจ้งเตือนแล้ว' : 'ตั้งเตือน & บันทึกปฏิทิน'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative">
              {/* Button 1: Remind Me */}
              <button
                type="button"
                onClick={handleRemindMe}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98 border ${
                  isReminderSet
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/40'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
                title={isReminderSet ? 'คลิกเพื่อยกเลิกการแจ้งเตือน' : 'ตั้งการแจ้งเตือนส่งงานในระบบ'}
              >
                <span className={`material-symbols-outlined text-[18px] shrink-0 ${isReminderSet ? 'text-emerald-600' : 'text-[#1550d3]'}`}>
                  {isReminderSet ? 'alarm_on' : 'notifications_active'}
                </span>
                <span className="whitespace-nowrap shrink-0">
                  {isReminderSet ? 'ตั้งเตือนความจำแล้ว (Reminded)' : 'เตือนความจำ (Remind Me)'}
                </span>
              </button>

              {/* Button 2: Add to Calendar */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-98 border ${
                    isCalendarAdded
                      ? 'bg-blue-50 text-[#1550d3] border-blue-300 ring-1 ring-[#1550d3]/30'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300'
                  }`}
                  title="เพิ่มกำหนดส่งงานลงในปฏิทินของคุณ"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#1550d3] shrink-0">
                    {isCalendarAdded ? 'event_available' : 'calendar_month'}
                  </span>
                  <span className="whitespace-nowrap shrink-0">
                    {isCalendarAdded ? 'เพิ่มลงปฏิทินแล้ว (In Calendar)' : 'เพิ่มลงปฏิทิน (Add to Calendar)'}
                  </span>
                  <span className="material-symbols-outlined text-[15px] text-slate-400 ml-auto">
                    {showCalendarMenu ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Calendar Options Dropdown */}
                {showCalendarMenu && (
                  <div className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mt-1.5 mb-1.5 w-full sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 flex flex-col gap-1 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      เลือกรูปแบบปฏิทิน
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleOpenGoogleCalendar}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0">
                        open_in_new
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 truncate">เปิด Google Calendar (Web)</span>
                        <span className="text-[10px] text-slate-500">สร้างกำหนดการบนเบราว์เซอร์ทันที</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadIcsCalendar}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">
                        download
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 truncate">ดาวน์โหลดไฟล์ .ICS</span>
                        <span className="text-[10px] text-slate-500">สำหรับ Apple Calendar, Outlook, iOS/Android</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Feedback Toast/Banner */}
            {quickActionFeedback && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border transition-all ${
                  quickActionFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] shrink-0">
                    {quickActionFeedback.type === 'success' ? 'check_circle' : 'info'}
                  </span>
                  <span>{quickActionFeedback.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickActionFeedback(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Progress Slider */}
          <div className="flex flex-col gap-2 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-[#434654] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-[#1550d3]">trending_up</span>
                <span>ระดับความคืบหน้าของงาน</span>
              </span>
              <span className="text-[#1550d3] font-bold text-base">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1550d3]"
            />
            <div className="flex justify-between text-[11px] text-[#737686]">
              <span>ยังไม่เริ่ม (0%)</span>
              <span>กำลังทำ (50%)</span>
              <span>เสร็จสมบูรณ์ (100%)</span>
            </div>
          </div>

          {/* Real File Upload Section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-[#737686] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">attach_file</span>
                <span>ไฟล์แนบส่งงาน ({attachments.length} ไฟล์)</span>
              </h4>
              <span className="text-[11px] text-[#737686]">
                {isUploadUnlocked ? 'รองรับไฟล์จากคอมพิวเตอร์และมือถือ' : 'ต้องเปิดส่งงานย้อนหลังก่อนจึงจะอัปโหลดได้'}
              </span>
            </div>

            {/* Hidden File Input for Native File/Folder Selection */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFilesAdded(e.target.files)}
              className="hidden"
              id="assignment-file-upload"
            />

            {/* Drag and Drop Zone */}
            {isUploadUnlocked ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
                  isDragging
                    ? 'border-[#1550d3] bg-[#1550d3]/10 scale-[1.01]'
                    : isOverdue 
                    ? 'border-amber-300 hover:border-amber-500 hover:bg-amber-500/5 bg-amber-50/30'
                    : 'border-slate-300 hover:border-[#1550d3] hover:bg-[#1550d3]/5 bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isOverdue ? 'bg-amber-500/15 text-amber-700' : 'bg-[#1550d3]/10 text-[#1550d3]'
                }`}>
                  <span className="material-symbols-outlined text-[28px]">
                    {isDragging ? 'file_download' : 'cloud_upload'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-sm text-[#121b2e]">
                    {isDragging ? 'ปล่อยไฟล์เพื่ออัปโหลดทันที' : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่'}
                  </span>
                  <span className="text-xs text-[#737686]">
                    เลือกไฟล์จากโฟลเดอร์ในเครื่อง คอมพิวเตอร์ หรือคลังรูปภาพ/ไฟล์ในมือถือ
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-[#1550d3] bg-white px-3 py-1 rounded-lg border border-[#1550d3]/20 shadow-xs">
                  <span className="material-symbols-outlined text-[14px]">add_photo_alternate</span>
                  <span>รองรับ PDF, DOCX, ZIP, PNG, JPG, MP4, WAV, Code ฯลฯ</span>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setEnableLateSubmission(true)}
                className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-center cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">lock</span>
                </div>
                <span className="font-bold text-sm text-slate-700">
                  การอัปโหลดไฟล์ถูกล็อกเนื่องจากเกินกำหนดส่ง
                </span>
                <span className="text-xs text-[#1550d3] font-semibold flex items-center gap-1">
                  <span>กดปุ่ม "ส่งงานย้อนหลัง" เพื่อปลดล็อกและอัปโหลดไฟล์</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            )}

            {/* Attached Files List */}
            {attachments.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 bg-slate-50/90 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#1550d3] flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">
                          {getFileIcon(file.name, file.type)}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 truncate text-[13px]">
                          {file.name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{file.size}</span>
                          {file.uploadedAt && (
                            <>
                              <span>•</span>
                              <span>{file.uploadedAt}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {file.url && (
                        <a
                          href={file.url}
                          download={file.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-[#1550d3] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="ดู/ดาวน์โหลดไฟล์"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          <span className="hidden sm:inline">ดูไฟล์</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAttachment(file.id);
                        }}
                        className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="ลบไฟล์นี้"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#737686] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>บันทึกข้อความ / ลิงก์โครงงานถึงอาจารย์ผู้สอน</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุลิงก์ เช่น GitHub Repository, Figma Prototype, Google Drive หรือข้อความสรุปงานเพิ่มเติม..."
              className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:border-[#1550d3] focus:ring-2 focus:ring-[#1550d3]/20 focus:outline-none placeholder:text-slate-400 bg-white"
            />
          </div>

          {/* Success Notification Alert */}
          {isSuccess && (
            <div className="p-4 bg-[#20C997]/15 border border-[#20C997]/30 rounded-2xl text-[#00694d] text-sm font-bold text-center flex items-center justify-center gap-2 animate-bounce">
              <span className="material-symbols-outlined text-[22px] fill-1">check_circle</span>
              <span>
                {isOverdue || assignment.isLate
                  ? 'บันทึกและส่งงานย้อนหลังเรียบร้อยแล้ว! อาจารย์จะได้รับการแจ้งเตือนเพื่อตรวจพิจารณา'
                  : 'บันทึกและส่งงานเรียบร้อยแล้ว! อาจารย์จะได้รับการแจ้งเตือนทันที'}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3.5 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 ${
                isOverdue && enableLateSubmission
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#1550d3] hover:bg-[#1a53d6]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSubmitting ? 'sync' : isOverdue ? 'history_edu' : 'send'}
              </span>
              <span>
                {isSubmitting
                  ? 'กำลังอัปโหลดและส่งงาน...'
                  : isOverdue
                  ? enableLateSubmission
                    ? 'ยืนยันส่งงานย้อนหลัง (Submit Late)'
                    : 'กดส่งงานย้อนหลังเพื่ออัปไฟล์'
                  : isSubmitted
                  ? 'อัปเดต / ส่งงานใหม่อีกครั้ง'
                  : 'ยืนยันการส่งงาน (Submit)'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
