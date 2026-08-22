export type UserRole = 'student' | 'teacher' | 'admin' | 'parent';

export interface UserProfile {
  id: string;
  name: string;
  thaiName: string;
  studentId: string;
  email: string;
  role: UserRole;
  avatar: string;
  streakDays?: number;
  grade?: string;
  room?: string;
  major?: string;
  studyTrack?: string;
  gpa?: number;
  advisor?: string;
  position?: string;
  department?: string;
  dutyStatus?: string;
  officeRoom?: string;
  childName?: string;
  rfidCard: string;
  cardTheme?: 'obsidian-gold' | 'cyber-blue' | 'emerald-tech' | 'aurora-violet' | 'titanium-carbon';
  updatedAt?: string;
}

export interface Course {
  id: string;
  title: string;
  thaiTitle: string;
  code: string;
  icon: string;
  color: string;
  progress: number;
  assignmentsDue: number;
  statusText: string;
  instructor: string;
  room: string;
  description: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  type: 'video' | 'reading' | 'quiz' | 'lab';
}

export interface LearningMedia {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'slide' | 'interactive' | 'source_code';
  durationOrPages: string;
  author: string;
  thumbnail: string;
  viewsCount: number;
  likesCount: number;
  downloadUrl?: string;
  videoUrl?: string;
  youtubeId?: string;
  publishedDate: string;
  tags: string[];
  fileSize?: string;
  isFeatured?: boolean;
  chapters?: { time: string; title: string }[];
  pdfContent?: {
    summary: string;
    keyPoints: string[];
    formulas?: string[];
  };
}

export interface ScheduleItem {
  id: string;
  time: string;
  startTime: string;
  endTime: string;
  title: string;
  subjectCode: string;
  room: string;
  building: string;
  status: 'active' | 'upcoming' | 'completed';
  instructor: string;
  periodNumber?: number;
  credits?: number;
  category?: 'core' | 'elective' | 'lab' | 'activity' | 'break' | 'duty' | 'meeting';
  color?: string;
  targetClass?: string;
  attendanceCount?: string;
  note?: string;
  materialsCount?: number;
}

export type DayOfWeekId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export interface WeeklyScheduleMap {
  [dayId: string]: ScheduleItem[];
}

export interface FacilityRoom {
  id: string;
  name: string;
  code: string;
  type: string;
  capacity: number;
  floor: string;
  status: 'available' | 'busy' | 'reserved' | 'maintenance';
  statusLabel: string;
  equipment: string[];
  specs?: {
    screen?: string;
    whiteboard?: boolean;
    acTemp?: string;
    computersCount?: number;
    wifiSpeed?: string;
  };
}

export interface Facility {
  id: string;
  name: string;
  category: string;
  icon: string;
  status: 'open' | 'available' | 'busy' | 'closed';
  statusLabel: string;
  activeRooms?: number;
  occupancy?: number;
  capacity?: number;
  temperature?: string;
  airQuality?: string;
  wifiLoad?: string;
  description?: string;
  rooms?: FacilityRoom[];
}

export interface RoomBooking {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityIcon: string;
  roomId: string;
  roomName: string;
  roomCode: string;
  date: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendeesCount: number;
  equipment: string[];
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  passCode: string;
  qrValue: string;
  bookedAt: string;
  bookedBy: string;
  unlocked?: boolean;
}

export interface DigitalTwinNode {
  id: string;
  code: string;
  type: string;
  icon: string;
  status: 'optimal' | 'warning' | 'alert';
  statusText: string;
  power: string;
  temp: string;
  devices: number;
  lastPing: string;
}

export interface AssignmentAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
  uploadedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  categoryColor: string;
  dueDate: string;
  dueRelative: string;
  status: 'in_progress' | 'submitted' | 'overdue' | 'to_submit';
  progress: number;
  maxScore: number;
  currentScore?: number | string;
  description: string;
  submittedAt?: string;
  submissionNotes?: string;
  isLate?: boolean;
  lateReason?: string;
  attachmentsCount?: number;
  attachments?: AssignmentAttachment[];
  githubRepoUrl?: string;
  lastCommitSha?: string;
  lastCommitMessage?: string;
  lastSyncedAt?: string;
  rubricSpreadsheetId?: string;
  rubricSpreadsheetUrl?: string;
}

export interface RubricLevel {
  label: string;
  score: number;
  description: string;
}

export interface AssignmentRubricCriteria {
  id: string;
  name: string;
  description: string;
  weightPercent?: number;
  maxScore: number;
  levels?: RubricLevel[];
}

export interface AssignmentRubric {
  id: string;
  title: string;
  subjectCode?: string;
  subjectTitle?: string;
  spreadsheetId?: string;
  sheetName?: string;
  spreadsheetUrl?: string;
  totalMaxScore: number;
  criteria: AssignmentRubricCriteria[];
  generalInstructions?: string;
  authorId?: string;
  authorName?: string;
  authorRole?: UserRole;
  createdAt?: string;
  updatedAt?: string;
  lastSyncedAt?: string;
  syncedWithFirestore?: boolean;
  syncedWithSheets?: boolean;
}

export interface GoogleSheetConnection {
  id: string;
  title: string;
  type: 'rubric' | 'schedule' | 'grades' | 'attendance' | 'custom';
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetName?: string;
  lastSyncedAt: string;
  syncDirection: 'import' | 'export' | 'two-way';
  autoSyncEnabled?: boolean;
  authorId?: string;
  authorName?: string;
  recordCount?: number;
  status: 'synced' | 'pending' | 'error';
  errorMessage?: string;
}

export interface SyncedScheduleDay {
  id: string;
  dayName: string;
  dayId?: string;
  items: ScheduleItem[];
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  sheetName?: string;
  lastSyncedAt: string;
  authorId?: string;
}

export interface GithubCommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorAvatar?: string;
  date: string;
  url: string;
  repoOwner: string;
  repoName: string;
}

export interface GithubSyncResult {
  success: boolean;
  repoUrl: string;
  repoName?: string;
  commit?: GithubCommitInfo;
  isNewCommit?: boolean;
  notificationTriggered?: boolean;
  message: string;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  subject: string;
  score?: number;
  avatar?: string;
  avatarLetter?: string;
  color?: string;
  isCurrentUser?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
  progressText?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'assignment' | 'class' | 'grade' | 'system' | 'security' | 'attendance' | 'iot' | 'payment' | 'announcement';
  read: boolean;
  role?: UserRole | 'all';
  priority?: 'high' | 'normal' | 'urgent';
  timestamp?: number;
  icon?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface SecurityAuditLog {
  id: string;
  actionType: 'role_switch' | 'facility_booking' | 'user_created' | 'user_updated' | 'user_deleted' | 'lockdown_toggle' | 'broadcast_sent' | 'security_override' | 'permission_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetId?: string;
  targetName?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
  timeIso: string;
}

