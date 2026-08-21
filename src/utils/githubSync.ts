import { NotificationItem, GithubCommitInfo, GithubSyncResult } from '../types';
import { addNotificationToFirestore } from '../services/firebaseService';

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
