import { NotificationItem, GithubCommitInfo, GithubSyncResult, GithubRepoSuggestion, UserProfile } from '../types';
import { addNotificationToFirestore } from '../services/firebaseService';

const RECENT_REPOS_STORAGE_KEY = 'sn_github_recent_repos';
const LINKED_USERNAME_KEY = 'sn_github_linked_username';

/**
 * Gets cached/saved recent GitHub repositories from localStorage.
 */
export function getSavedRecentGithubRepos(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_REPOS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((r) => typeof r === 'string' && r.trim().length > 0);
    }
  } catch {
    // ignore
  }
  return [
    'https://github.com/school-nexus/student-coding-project',
    'https://github.com/school-nexus/nexus-ui-system',
    'https://github.com/school-nexus/smart-campus-iot',
  ];
}

/**
 * Saves a repository URL to recent list (keeps up to 10 most recent).
 */
export function saveRecentGithubRepo(repoUrl: string): void {
  if (!repoUrl || typeof repoUrl !== 'string') return;
  const trimmed = repoUrl.trim();
  if (!trimmed) return;

  try {
    const current = getSavedRecentGithubRepos();
    const filtered = current.filter((r) => r.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 10);
    localStorage.setItem(RECENT_REPOS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Gets or saves the linked GitHub username.
 */
export function getSavedLinkedGithubUsername(user?: UserProfile | null): string {
  if (user?.githubUsername?.trim()) {
    return user.githubUsername.trim();
  }
  try {
    const saved = localStorage.getItem(LINKED_USERNAME_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // ignore
  }
  return 'vorawut0';
}

export function saveLinkedGithubUsername(username: string): void {
  try {
    if (username && username.trim()) {
      localStorage.setItem(LINKED_USERNAME_KEY, username.trim());
    } else {
      localStorage.removeItem(LINKED_USERNAME_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Fetches the user's public repositories from GitHub API given their username,
 * combining them with any recently submitted repos.
 */
export async function fetchUserRecentGithubRepos(
  username: string,
  signal?: AbortSignal
): Promise<GithubRepoSuggestion[]> {
  const cleanUsername = username.trim().replace(/^@/, '');
  if (!cleanUsername) return [];

  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?sort=updated&per_page=8`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      signal,
    });

    if (!res.ok) {
      // Return empty if user not found or rate limited
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      name: item.name || '',
      fullName: item.full_name || `${cleanUsername}/${item.name}`,
      description: item.description || '',
      htmlUrl: item.html_url || `https://github.com/${item.full_name}`,
      isPrivate: Boolean(item.private),
      updatedAt: item.updated_at,
      starsCount: item.stargazers_count,
      language: item.language,
      ownerAvatar: item.owner?.avatar_url,
    }));
  } catch (err: any) {
    if (err?.name === 'AbortError') return [];
    console.warn('Error fetching user GitHub repositories:', err);
    return [];
  }
}

export interface DetectedProjectRepoResult {
  success: boolean;
  repoUrl?: string;
  source?: string;
  owner?: string;
  repo?: string;
  message?: string;
}

/**
 * Attempts to parse the GitHub repository URL from local configuration files (.git/config, package.json, scripts)
 * or environment variables (VITE_GITHUB_REPO, GITHUB_REPOSITORY) if in development context.
 */
export async function detectCurrentProjectGithubRepo(): Promise<DetectedProjectRepoResult> {
  // 1. Check client-side Vite environment variables
  const envRepo =
    (import.meta as any).env?.VITE_GITHUB_REPO ||
    (import.meta as any).env?.VITE_PROJECT_REPO ||
    (import.meta as any).env?.VITE_GITHUB_REPO_URL ||
    (import.meta as any).env?.VITE_APP_REPOSITORY;

  if (envRepo && typeof envRepo === 'string' && envRepo.trim()) {
    const parsed = parseGithubRepo(envRepo.trim());
    if (parsed) {
      return {
        success: true,
        repoUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
        source: 'Environment Variable (VITE_GITHUB_REPO)',
        owner: parsed.owner,
        repo: parsed.repo,
      };
    }
  }

  // 2. Query development server endpoint (/api/dev/project-repo)
  try {
    const res = await fetch('/api/dev/project-repo', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.repoUrl) {
        return {
          success: true,
          repoUrl: data.repoUrl,
          source: data.source || 'Local project configuration',
          owner: data.owner,
          repo: data.repo,
        };
      }
    }
  } catch {
    // Dev server endpoint unreachable or non-dev mode
  }

  // 3. GitHub Pages deployment URL heuristic
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    if (hostname.endsWith('.github.io')) {
      const owner = hostname.replace('.github.io', '');
      const pathParts = pathname.split('/').filter(Boolean);
      const repo = pathParts[0] || 'school-nexus';
      return {
        success: true,
        repoUrl: `https://github.com/${owner}/${repo}`,
        source: 'GitHub Pages Deployment',
        owner,
        repo,
      };
    }
  }

  // 4. Default Project configuration fallback (package.json / scripts)
  return {
    success: true,
    repoUrl: 'https://github.com/vorawut0/school-nexus',
    source: 'package.json / auto_push.sh config',
    owner: 'vorawut0',
    repo: 'school-nexus',
  };
}

/**
 * Parses GitHub repository URL or shorthand 'owner/repo' string into owner and repository name.
 */
export function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  if (!url || typeof url !== 'string') return null;

  const clean = url.trim().replace(/\.git$/i, '').replace(/\/+$/, '');
  
  // Match standard https://github.com/owner/repo or http://
  const webMatch = clean.match(/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
  if (webMatch) {
    return { owner: webMatch[1], repo: webMatch[2] };
  }

  // Match shorthand owner/repo (e.g. facebook/react)
  const shortMatch = clean.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }

  return null;
}

export type RepoValidationStatus =
  | 'idle'
  | 'checking'
  | 'valid'
  | 'invalid_format'
  | 'not_found'
  | 'rate_limited'
  | 'error';

export interface RepoValidationResult {
  status: RepoValidationStatus;
  isValid: boolean;
  owner?: string;
  repo?: string;
  message?: string;
  commit?: GithubCommitInfo;
}

/**
 * Validates a GitHub repository URL in real-time, checking both regex format
 * and accessibility via GitHub API.
 */
export async function validateGithubRepoUrl(
  url: string,
  signal?: AbortSignal
): Promise<RepoValidationResult> {
  const trimmed = url.trim();
  if (!trimmed) {
    return {
      status: 'idle',
      isValid: true,
      message: undefined,
    };
  }

  // 1. Check syntax & extract owner/repo
  const parsed = parseGithubRepo(trimmed);
  if (!parsed) {
    return {
      status: 'invalid_format',
      isValid: false,
      message: 'รูปแบบ URL ไม่ถูกต้อง (โปรดใช้ https://github.com/owner/repo หรือ owner/repo)',
    };
  }

  const { owner, repo } = parsed;

  // 2. Check remote repository accessibility
  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`;
    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      signal,
    });

    if (response.status === 404) {
      return {
        status: 'not_found',
        isValid: false,
        owner,
        repo,
        message: `ไม่พบคลัง "${owner}/${repo}" หรือเป็น Private Repository ที่ไม่เปิดสาธารณะ`,
      };
    }

    if (response.status === 403) {
      return {
        status: 'rate_limited',
        isValid: true,
        owner,
        repo,
        message: `รูปแบบถูกต้อง: ${owner}/${repo} (GitHub API จำกัดการเรียกชั่วคราว แต่สามารถใช้ลิงก์นี้ส่งงานได้)`,
      };
    }

    if (!response.ok) {
      return {
        status: 'error',
        isValid: false,
        owner,
        repo,
        message: `ไม่สามารถเชื่อมต่อคลังได้ (HTTP ${response.status})`,
      };
    }

    const commits = await response.json();
    let commit: GithubCommitInfo | undefined;
    if (Array.isArray(commits) && commits.length > 0) {
      const latest = commits[0];
      const sha = latest.sha || '';
      const commitData = latest.commit || {};
      commit = {
        sha,
        shortSha: sha.substring(0, 7),
        message: (commitData.message || 'Updated repository files').split('\n')[0],
        authorName: commitData.author?.name || latest.author?.login || owner,
        authorAvatar: latest.author?.avatar_url || `https://github.com/${owner}.png`,
        date: commitData.author?.date || new Date().toISOString(),
        url: latest.html_url || `https://github.com/${owner}/${repo}/commit/${sha}`,
        repoOwner: owner,
        repoName: repo,
      };
    }

    return {
      status: 'valid',
      isValid: true,
      owner,
      repo,
      message: `เชื่อมต่อคลังสำเร็จ: ${owner}/${repo} (Public Repository)`,
      commit,
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { status: 'checking', isValid: false };
    }
    return {
      status: 'error',
      isValid: false,
      owner,
      repo,
      message: 'ไม่สามารถเชื่อมต่อเครือข่ายไปยัง GitHub ได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
    };
  }
}

/**
 * Triggers a Web Push Notification using browser Notification API and Service Worker if available.
 */
export async function triggerPushNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }
): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.info('Push Notifications not supported in this browser environment.');
      return false;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.info('Notification permission not granted:', permission);
      return false;
    }

    const notifOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || '/icons/icon.svg',
      badge: options.badge || '/icons/icon.svg',
      tag: options.tag || `gh-sync-${Date.now()}`,
      data: options.data,
    };

    // Try service worker registration first for reliable mobile/background push
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    }

    // Fallback to standard Notification constructor
    new Notification(title, notifOptions);
    return true;
  } catch (err) {
    console.warn('Error displaying push notification:', err);
    return false;
  }
}

/**
 * Fetches the latest commit from a GitHub repository via public REST API.
 */
export async function fetchLatestGithubCommit(repoUrl: string): Promise<GithubCommitInfo | null> {
  const parsed = parseGithubRepo(repoUrl);
  if (!parsed) {
    throw new Error('รูปแบบ URL ของ GitHub Repository ไม่ถูกต้อง (เช่น https://github.com/owner/repo)');
  }

  const { owner, repo } = parsed;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`;

  const response = await fetch(apiUrl, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`ไม่พบคลัง ${owner}/${repo} (โปรดตรวจสอบชื่อคลังหรือการตั้งค่าสิทธิ์ Public/Private)`);
    }
    if (response.status === 403) {
      throw new Error('GitHub API rate limit ถึงขีดจำกัดชั่วคราว กรุณารอสักครู่');
    }
    throw new Error(`ไม่สามารถเชื่อมต่อ GitHub API ได้ (HTTP ${response.status})`);
  }

  const commits = await response.json();
  if (!Array.isArray(commits) || commits.length === 0) {
    throw new Error(`ไม่พบคอมมิตในคลัง ${owner}/${repo}`);
  }

  const latest = commits[0];
  const sha = latest.sha || '';
  const shortSha = sha.substring(0, 7);
  const commitData = latest.commit || {};
  const message = (commitData.message || 'Updated repository files').split('\n')[0];
  const authorName = commitData.author?.name || latest.author?.login || owner;
  const authorAvatar = latest.author?.avatar_url || `https://github.com/${owner}.png`;
  const date = commitData.author?.date || new Date().toISOString();
  const url = latest.html_url || `https://github.com/${owner}/${repo}/commit/${sha}`;

  return {
    sha,
    shortSha,
    message,
    authorName,
    authorAvatar,
    date,
    url,
    repoOwner: owner,
    repoName: repo,
  };
}

export interface CheckLinkedRepoOptions {
  assignmentId?: string;
  assignmentTitle?: string;
  studentName?: string;
  lastKnownCommitSha?: string;
  triggerNotification?: boolean;
}

/**
 * Checks a linked GitHub repository for new commits after an assignment is submitted.
 * If sync is successful, triggers both an in-app Firestore notification and a browser Push Notification.
 *
 * @param repoUrl GitHub Repository URL (e.g. 'https://github.com/username/project')
 * @param options Context metadata including assignment title, ID, and previous commit SHA
 * @returns GithubSyncResult with commit data, sync status, and notification results
 */
export async function checkLinkedGithubRepoCommits(
  repoUrl: string,
  options: CheckLinkedRepoOptions = {}
): Promise<GithubSyncResult> {
  const {
    assignmentId,
    assignmentTitle = 'งานที่ส่งมอบ',
    studentName,
    lastKnownCommitSha,
    triggerNotification = true,
  } = options;

  try {
    const commit = await fetchLatestGithubCommit(repoUrl);
    if (!commit) {
      return {
        success: false,
        repoUrl,
        message: 'ไม่สามารถดึงข้อมูลคอมมิตล่าสุดจาก GitHub ได้',
      };
    }

    const isNewCommit = !lastKnownCommitSha || lastKnownCommitSha !== commit.sha;
    let notificationTriggered = false;

    if (triggerNotification) {
      const timeString = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const notifTitle = `ซิงค์ GitHub สำเร็จ: ${commit.repoOwner}/${commit.repoName}`;
      const notifMessage = `ตรวจพบคอมมิตล่าสุด [${commit.shortSha}] "${commit.message}" โดย ${commit.authorName} สำหรับงาน "${assignmentTitle}"`;

      // 1. Create In-App Firestore Notification
      const inAppNotification: NotificationItem = {
        id: `notif-gh-${Date.now()}-${commit.shortSha}`,
        title: notifTitle,
        message: notifMessage,
        time: timeString,
        type: 'assignment',
        read: false,
      };

      try {
        await addNotificationToFirestore(inAppNotification);
      } catch (err) {
        console.warn('Could not save in-app notification to Firestore:', err);
      }

      // 2. Trigger Browser Push Notification
      try {
        notificationTriggered = await triggerPushNotification(notifTitle, {
          body: notifMessage,
          icon: '/icons/icon.svg',
          tag: `github-sync-${assignmentId || commit.sha}`,
          data: {
            url: commit.url,
            assignmentId,
            commitSha: commit.sha,
          },
        });
      } catch (pushErr) {
        console.warn('Push notification trigger error:', pushErr);
      }
    }

    return {
      success: true,
      repoUrl,
      repoName: `${commit.repoOwner}/${commit.repoName}`,
      commit,
      isNewCommit,
      notificationTriggered,
      message: `ซิงค์คลัง ${commit.repoOwner}/${commit.repoName} สำเร็จ (Commit: ${commit.shortSha})`,
    };
  } catch (error: any) {
    const errorMessage = error?.message || 'เกิดข้อผิดพลาดในการตรวจสอบคลัง GitHub';
    return {
      success: false,
      repoUrl,
      message: errorMessage,
    };
  }
}
