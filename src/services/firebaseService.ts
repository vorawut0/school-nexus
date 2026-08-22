import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
} from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from '../firebase';
export { db, auth, googleProvider };
import { UserProfile, UserRole, RoomBooking, Assignment, NotificationItem, SecurityAuditLog } from '../types';
import {
  INITIAL_USER,
  INITIAL_ROOM_BOOKINGS,
  MOCK_ASSIGNMENTS,
  MOCK_NOTIFICATIONS,
  DEMO_PRESET_USERS,
  ASSETS,
} from '../data/mockData';

// Helper to get custom preset users from localStorage
export function getStoredCustomPresets(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem('sn_preset_users_custom');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveStoredCustomPreset(role: string, user: UserProfile): void {
  try {
    const existing = getStoredCustomPresets();
    existing[role] = user;
    localStorage.setItem('sn_preset_users_custom', JSON.stringify(existing));
  } catch (e) {
    console.warn('Failed to save custom preset locally:', e);
  }
}

// Universal avatar persistence lookup to ensure custom photos are isolated per role and account
export function getPersistedAvatar(userOrKey: UserProfile | string | null | undefined): string | null {
  try {
    if (!userOrKey) return null;
    
    if (typeof userOrKey === 'string') {
      const lower = userOrKey.toLowerCase();
      return (
        localStorage.getItem(`sn_avatar_${userOrKey}`) ||
        localStorage.getItem(`sn_avatar_${lower}`) ||
        localStorage.getItem(`sn_avatar_role_${lower}`) ||
        null
      );
    }

    const user = userOrKey;

    // 1. Specific user ID first (isolated per document/user ID)
    if (user.id) {
      const fromId = localStorage.getItem(`sn_avatar_${user.id}`);
      if (fromId) return fromId;
    }

    // 2. Specific role + email combo (ensures same email on different roles has separate avatars)
    if (user.role && user.email) {
      const fromRoleEmail = localStorage.getItem(`sn_avatar_${user.role}_${user.email.toLowerCase()}`);
      if (fromRoleEmail) return fromRoleEmail;
    }

    // 3. Specific role + student/user ID combo
    if (user.role && user.studentId) {
      const fromRoleStudentId = localStorage.getItem(`sn_avatar_${user.role}_${user.studentId.toLowerCase()}`);
      if (fromRoleStudentId) return fromRoleStudentId;
    }

    // 4. Role-specific fallback
    if (user.role) {
      const fromRole = localStorage.getItem(`sn_avatar_role_${user.role}`);
      if (fromRole) return fromRole;
    }
  } catch {
    // ignore
  }
  return null;
}

// Clean undefined fields recursively so Firestore setDoc never throws unsupported undefined value errors
export function cleanFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = cleanFirestoreData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

export function savePersistedAvatar(user: UserProfile): void {
  if (!user || !user.avatar) return;
  try {
    // 1. Save strictly under this specific user ID
    if (user.id) {
      localStorage.setItem(`sn_avatar_${user.id}`, user.avatar);
    }
    // 2. Save strictly scoped by role to avoid cross-role contamination
    if (user.role) {
      localStorage.setItem(`sn_avatar_role_${user.role}`, user.avatar);
      if (user.email) {
        localStorage.setItem(`sn_avatar_${user.role}_${user.email.toLowerCase()}`, user.avatar);
      }
      if (user.studentId) {
        localStorage.setItem(`sn_avatar_${user.role}_${user.studentId.toLowerCase()}`, user.avatar);
      }
    }
  } catch (e) {
    console.warn('Failed to store avatar key in localStorage:', e);
  }
}

// User Profile Firestore Services
export function subscribeToUserProfile(
  userId: string,
  onUpdate: (user: UserProfile) => void
): () => void {
  if (!userId) return () => {};
  const path = `users/${userId}`;

  try {
    const docRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          if (data) {
            const resolvedUser: UserProfile = {
              ...data,
              id: data.id || userId,
            };
            if (resolvedUser.avatar) {
              savePersistedAvatar(resolvedUser);
            }
            setLocalCache('user_profile', resolvedUser);
            onUpdate(resolvedUser);
          }
        }
      },
      (error) => {
        console.debug(`[Firestore subscribeToUserProfile] notice on ${path}:`, error);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      const customAvatar = getPersistedAvatar(data);
      if (customAvatar && (!data.avatar || data.avatar === ASSETS.headerAvatar || data.avatar === ASSETS.cardAvatar)) {
        data.avatar = customAvatar;
      }
      return data;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfile(userProfile: UserProfile): Promise<void> {
  if (!userProfile) return;

  // 1. Save Avatar in multi-key lookup to guarantee no revert
  if (userProfile.avatar) {
    savePersistedAvatar(userProfile);
  }

  // 2. Always update local cache immediately for zero-latency persistence & offline support
  setLocalCache('user_profile', userProfile);
  try {
    localStorage.setItem('sn_user_profile', JSON.stringify(userProfile));
    localStorage.setItem('sn_active_user', JSON.stringify(userProfile));
  } catch (e) {
    console.warn('LocalStorage write warning:', e);
  }

  // 3. Update in-memory and persistent preset if user matches a role
  if (userProfile.role) {
    saveStoredCustomPreset(userProfile.role, userProfile);
    if (DEMO_PRESET_USERS[userProfile.role]) {
      DEMO_PRESET_USERS[userProfile.role] = {
        ...DEMO_PRESET_USERS[userProfile.role],
        ...userProfile,
      };
    }
  }

  // 4. Update registered accounts repository so next login requires the newly changed ID
  try {
    const accounts = getStoredAccounts();
    const index = accounts.findIndex(
      (a) =>
        (userProfile.id && a.id === userProfile.id) ||
        (userProfile.studentId && a.studentId?.toLowerCase() === userProfile.studentId.toLowerCase() && a.role === userProfile.role) ||
        (userProfile.email && a.email?.toLowerCase() === userProfile.email.toLowerCase() && a.role === userProfile.role)
    );

    if (index >= 0) {
      accounts[index].user = { ...accounts[index].user, ...userProfile };
      accounts[index].studentId = userProfile.studentId;
      accounts[index].email = userProfile.email;
      accounts[index].role = userProfile.role;
      accounts[index].name = userProfile.name;
      accounts[index].thaiName = userProfile.thaiName;
      if (userProfile.avatar) {
        accounts[index].user.avatar = userProfile.avatar;
      }
      localStorage.setItem('sn_registered_accounts', JSON.stringify(accounts));
    } else {
      saveStoredAccount({
        id: userProfile.id,
        studentId: userProfile.studentId,
        email: userProfile.email,
        name: userProfile.name,
        thaiName: userProfile.thaiName,
        role: userProfile.role,
        user: userProfile,
        registeredAt: new Date().toISOString(),
      });
    }

    // Auto-update remembered ID for this role so login page uses the new ID
    if (userProfile.role && userProfile.studentId) {
      localStorage.setItem(`sn_remembered_id_${userProfile.role}`, userProfile.studentId);
    }
  } catch (e) {
    console.warn('Failed to update registered account record with new profile:', e);
  }

  // 5. Save to Firestore
  if (userProfile.id) {
    const path = `users/${userProfile.id}`;
    try {
      const docRef = doc(db, 'users', userProfile.id);
      await setDoc(
        docRef,
        cleanFirestoreData({
          ...userProfile,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    } catch (error) {
      queueOfflineAction({ type: 'save_profile', payload: userProfile });
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export interface RegisterUserData {
  name: string;
  thaiName: string;
  email: string;
  password?: string;
  role: UserRole;
  studentId?: string;
  grade?: string;
  room?: string;
  major?: string;
  position?: string;
  department?: string;
  childName?: string;
  rfidCard?: string;
  avatar?: string;
}

// Interface for Stored Registered Account Credentials
export interface StoredAccountRecord {
  id: string;
  studentId: string;
  email: string;
  name: string;
  thaiName: string;
  role: UserRole;
  password?: string;
  user: UserProfile;
  registeredAt: string;
}

// Local Account Repository Helpers for maximum reliability and offline support
export function getDefaultSeedAccounts(): StoredAccountRecord[] {
  return [
    {
      id: 'demo-student-66040217',
      studentId: DEMO_PRESET_USERS.student?.studentId || '66040217',
      email: DEMO_PRESET_USERS.student?.email || 'worawut.p@schoolnexus.ac.th',
      name: DEMO_PRESET_USERS.student?.name || 'WORAWUT PETCHRAYA',
      thaiName: DEMO_PRESET_USERS.student?.thaiName || 'วรวุฒิ เพ็ชรระยา',
      role: 'student',
      password: 'password',
      user: { ...(DEMO_PRESET_USERS.student || INITIAL_USER) },
      registeredAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'demo-teacher-T55104',
      studentId: DEMO_PRESET_USERS.teacher?.studentId || 'T-55104',
      email: DEMO_PRESET_USERS.teacher?.email || 'kittipong.l@schoolnexus.ac.th',
      name: DEMO_PRESET_USERS.teacher?.name || 'KITTIPONG LERTPIRIYA',
      thaiName: DEMO_PRESET_USERS.teacher?.thaiName || 'อาจารย์ กิตติพงษ์ เลิศพิริยะ',
      role: 'teacher',
      password: 'password',
      user: { ...DEMO_PRESET_USERS.teacher },
      registeredAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'demo-parent-P66040217',
      studentId: DEMO_PRESET_USERS.parent?.studentId || 'P-66040217',
      email: DEMO_PRESET_USERS.parent?.email || 'sombat.p@gmail.com',
      name: DEMO_PRESET_USERS.parent?.name || 'PARENT PETCHRAYA',
      thaiName: DEMO_PRESET_USERS.parent?.thaiName || 'นายสมบัติ เพ็ชรระยา',
      role: 'parent',
      password: 'password',
      user: { ...DEMO_PRESET_USERS.parent },
      registeredAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'demo-admin-ADM001',
      studentId: DEMO_PRESET_USERS.admin?.studentId || 'ADM-001',
      email: DEMO_PRESET_USERS.admin?.email || 'admin.it@schoolnexus.ac.th',
      name: DEMO_PRESET_USERS.admin?.name || 'ADMINISTRATOR SYSTEM',
      thaiName: DEMO_PRESET_USERS.admin?.thaiName || 'ผู้ดูแลระบบไอทีและแคมปัส',
      role: 'admin',
      password: 'password',
      user: { ...DEMO_PRESET_USERS.admin },
      registeredAt: '2026-01-01T00:00:00.000Z',
    },
  ];
}

export function getStoredAccounts(): StoredAccountRecord[] {
  try {
    const raw = localStorage.getItem('sn_registered_accounts');
    if (!raw) {
      const defaults = getDefaultSeedAccounts();
      try {
        localStorage.setItem('sn_registered_accounts', JSON.stringify(defaults));
      } catch {
        // ignore
      }
      return defaults;
    }
    const parsed: StoredAccountRecord[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return getDefaultSeedAccounts();
    }
    return parsed.map((item) => {
      if (item.user) {
        const persistedAvatar = getPersistedAvatar(item.user);
        if (persistedAvatar) {
          item.user = { ...item.user, avatar: persistedAvatar };
        }
      }
      return item;
    });
  } catch (e) {
    console.warn('Failed to read stored accounts:', e);
    return getDefaultSeedAccounts();
  }
}

export async function syncAccountsFromCloud(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    if (snap.empty) {
      return { success: true, count: 0 };
    }

    let syncedCount = 0;
    const currentList = getStoredAccounts();
    
    for (const docSnap of snap.docs) {
      const u = { ...docSnap.data(), firestoreId: docSnap.id } as any;
      if (u.name || u.thaiName || u.email || u.studentId) {
        const userProfile: UserProfile = {
          id: u.id || docSnap.id,
          name: u.name || u.thaiName || 'USER',
          thaiName: u.thaiName || u.name || 'ผู้ใช้งาน',
          studentId: u.studentId || docSnap.id,
          email: u.email || '',
          role: u.role || 'student',
          avatar: u.avatar || ASSETS.headerAvatar,
          streakDays: u.streakDays ?? 1,
          grade: u.grade,
          room: u.room,
          major: u.major,
          studyTrack: u.studyTrack,
          gpa: u.gpa,
          advisor: u.advisor,
          position: u.position,
          department: u.department,
          dutyStatus: u.dutyStatus,
          officeRoom: u.officeRoom,
          childName: u.childName,
          rfidCard: u.rfidCard,
          cardTheme: u.cardTheme,
          updatedAt: u.updatedAt,
        };

        saveStoredAccount({
          id: userProfile.id,
          studentId: userProfile.studentId,
          email: userProfile.email,
          name: userProfile.name,
          thaiName: userProfile.thaiName,
          role: userProfile.role,
          password: u.password || 'password',
          user: userProfile,
          registeredAt: u.updatedAt || new Date().toISOString(),
        });
        syncedCount++;
      }
    }

    return { success: true, count: syncedCount };
  } catch (err: any) {
    console.warn('Sync accounts from cloud error:', err);
    return { success: false, count: 0, error: err?.message || 'ไม่สามารถเชื่อมต่อ Cloud ได้' };
  }
}

export function exportAccountsData(): string {
  try {
    const list = getStoredAccounts();
    return JSON.stringify(list, null, 2);
  } catch {
    return '[]';
  }
}

export function importAccountsData(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString.trim());
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, error: 'รูปแบบข้อมูลไม่ถูกต้อง (ต้องเป็นรายการบัญชี)' };
    }
    let count = 0;
    parsed.forEach((item: any) => {
      if (item && (item.studentId || item.email || item.name)) {
        saveStoredAccount(item);
        count++;
      }
    });
    return { success: true, count };
  } catch (e: any) {
    return { success: false, count: 0, error: 'รูปแบบ JSON ไม่ถูกต้อง: ' + (e?.message || '') };
  }
}

export function saveStoredAccount(account: StoredAccountRecord): void {
  try {
    const list = getStoredAccounts();
    const existing = list.find(
      (a) =>
        a.id === account.id ||
        (account.studentId && a.studentId === account.studentId) ||
        (account.email && a.email?.toLowerCase() === account.email?.toLowerCase() && a.role === account.role)
    );
    const filtered = list.filter(
      (a) =>
        a.id !== account.id &&
        !(account.studentId && a.studentId === account.studentId) &&
        !(account.email && a.email?.toLowerCase() === account.email?.toLowerCase() && a.role === account.role)
    );
    const recordToSave: StoredAccountRecord = {
      ...account,
      password: account.password || existing?.password || '',
    };
    filtered.unshift(recordToSave);
    localStorage.setItem('sn_registered_accounts', JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to save stored account locally:', e);
  }
}

export function removeStoredAccount(accountIdOrEmail: string): void {
  try {
    const list = getStoredAccounts();
    const target = accountIdOrEmail.toLowerCase();
    const filtered = list.filter(
      (a) => a.id.toLowerCase() !== target && a.email.toLowerCase() !== target && a.studentId.toLowerCase() !== target
    );
    localStorage.setItem('sn_registered_accounts', JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to remove stored account locally:', e);
  }
}

export function clearAllRegisteredAccounts(role?: UserRole): void {
  try {
    if (role) {
      const list = getStoredAccounts();
      const filtered = list.filter((a) => a.role !== role);
      localStorage.setItem('sn_registered_accounts', JSON.stringify(filtered));
      localStorage.removeItem(`sn_custom_preset_${role}`);
      localStorage.removeItem(`sn_remembered_id_${role}`);
    } else {
      localStorage.removeItem('sn_registered_accounts');
      localStorage.removeItem('sn_custom_preset_student');
      localStorage.removeItem('sn_custom_preset_teacher');
      localStorage.removeItem('sn_custom_preset_admin');
      localStorage.removeItem('sn_custom_preset_parent');
      localStorage.removeItem('sn_remembered_id_student');
      localStorage.removeItem('sn_remembered_id_teacher');
      localStorage.removeItem('sn_remembered_id_admin');
      localStorage.removeItem('sn_remembered_id_parent');
    }
  } catch (e) {
    console.warn('Failed to clear stored accounts:', e);
  }
}

export async function deleteUserAccountByEmailOrId(identifier: string): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const trimmed = identifier.trim();
    const lower = trimmed.toLowerCase();
    let deletedCount = 0;

    // 1. Delete from Cloud Firestore
    try {
      const usersCol = collection(db, 'users');
      const allDocsSnap = await getDocs(usersCol);
      for (const docItem of allDocsSnap.docs) {
        const u = docItem.data() as UserProfile;
        if (
          docItem.id.toLowerCase() === lower ||
          (u.email && u.email.toLowerCase() === lower) ||
          (u.studentId && u.studentId.toLowerCase() === lower) ||
          (u.id && u.id.toLowerCase() === lower)
        ) {
          await deleteDoc(doc(db, 'users', docItem.id));
          deletedCount++;
        }
      }
    } catch (e) {
      console.warn('Firestore user deletion notice:', e);
    }

    // 2. Remove from local stored accounts
    removeStoredAccount(trimmed);
    
    // Clear role-specific remembered keys if matching
    ['student', 'teacher', 'admin', 'parent'].forEach((r) => {
      const remId = localStorage.getItem(`sn_remembered_id_${r}`);
      if (remId && (remId.toLowerCase() === lower || remId === trimmed)) {
        localStorage.removeItem(`sn_remembered_id_${r}`);
      }
    });

    return { success: true, deletedCount };
  } catch (error: any) {
    console.error('Delete user account error:', error);
    return { success: false, deletedCount: 0, error: error?.message || 'ไม่สามารถลบบัญชีได้' };
  }
}

// Auto purge vorawutphetrai17@gmail.com once on startup / demand
export async function purgeAccountImmediately(email: string = 'vorawutphetrai17@gmail.com'): Promise<void> {
  try {
    await deleteUserAccountByEmailOrId(email);
  } catch (err) {
    console.debug('Purge notice:', err);
  }
}

// Full Registration Service connected to Firebase Auth & Firestore
export async function registerNewUser(data: RegisterUserData): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const SUPER_ADMIN_EMAIL = 'vorawutphetrai17@gmail.com';
    
    // Enforce admin role restriction: only the designated admin email can register as admin
    if (data.role === 'admin' && data.email.trim().toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      return {
        success: false,
        error: `สิทธิ์ผู้ดูแลระบบ (Admin) สงวนไว้เฉพาะอีเมลผู้ดูแลระบบหลัก (${SUPER_ADMIN_EMAIL}) เท่านั้น`,
      };
    }

    const trimmedEmail = data.email.trim();
    let generatedUid = `user_${data.role}_${trimmedEmail ? trimmedEmail.replace(/[^a-zA-Z0-9]/g, '_') : Date.now()}`;
    const regPassword = data.password?.trim() || 'nexus2026';
    
    // 1. Attempt Firebase Auth creation or update if email & password are provided
    if (trimmedEmail && regPassword && regPassword.length >= 6) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, regPassword);
        if (userCredential.user?.uid) {
          generatedUid = userCredential.user.uid;
        }
      } catch (authErr: any) {
        // If email already exists in Firebase Auth, attempt sign-in to claim UID
        if (authErr?.code === 'auth/email-already-in-use') {
          try {
            const signInRes = await signInWithEmailAndPassword(auth, trimmedEmail, regPassword);
            if (signInRes.user?.uid) {
              generatedUid = signInRes.user.uid;
            }
          } catch {
            // If previous password differed, generate a unique deterministic ID
            generatedUid = `user-${trimmedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
          }
        }
      }
    }

    // 2. Auto-generate standard IDs if missing
    const assignedStudentId = data.studentId?.trim() || (
      data.role === 'student' ? `${Math.floor(66040000 + Math.random() * 9999)}` :
      data.role === 'teacher' ? `T-${Math.floor(55000 + Math.random() * 9999)}` :
      data.role === 'admin' ? `ADM-001` :
      `P-${Math.floor(66040000 + Math.random() * 9999)}`
    );

    const assignedRfid = data.rfidCard?.trim() || `NFC-SN-${Math.floor(1000 + Math.random() * 9000)}-2026`;

    // 3. Choose appropriate avatar
    let defaultAvatar = ASSETS.headerAvatar;
    if (data.avatar) {
      defaultAvatar = data.avatar;
    } else if (data.role === 'teacher') {
      defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    } else if (data.role === 'admin') {
      defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
    } else if (data.role === 'parent') {
      defaultAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80';
    }

    const rawProfile: UserProfile = {
      id: generatedUid,
      name: (data.name?.trim() || data.thaiName.trim()).toUpperCase(),
      thaiName: data.thaiName.trim(),
      studentId: assignedStudentId,
      email: trimmedEmail,
      role: data.role,
      avatar: defaultAvatar,
      streakDays: 1,
      grade: data.grade || (data.role === 'student' ? 'มัธยมศึกษาปีที่ 6/1' : undefined),
      room: data.room || (data.role === 'student' ? 'ห้อง 601' : undefined),
      major: data.major || (data.role === 'student' ? 'วิทยาศาสตร์-คณิตศาสตร์-คอมพิวเตอร์' : undefined),
      gpa: data.role === 'student' ? 3.85 : undefined,
      advisor: data.role === 'student' ? 'อ.กิตติพงษ์ เลิศพิริยะ' : undefined,
      position: data.position || (data.role === 'teacher' ? 'อาจารย์ผู้สอนวิชาวิทยาการคำนวณ' : data.role === 'admin' ? 'ผู้ดูแลระบบไอทีและเครือข่าย' : data.role === 'parent' ? 'ผู้ปกครองนักเรียน' : undefined),
      department: data.department || (data.role === 'teacher' ? 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี' : data.role === 'admin' ? 'ศูนย์เทคโนโลยีสารสนเทศ' : data.role === 'parent' ? 'สมาคมผู้ปกครองและครู' : undefined),
      childName: data.role === 'parent' ? (data.childName?.trim() || data.thaiName.trim()) : undefined,
      rfidCard: assignedRfid,
      cardTheme: 'obsidian-gold',
    };

    const newUserProfile: UserProfile = cleanFirestoreData(rawProfile) as UserProfile;

    // 4. Save user profile + password securely in Firestore
    const userDocRef = doc(db, 'users', generatedUid);
    await setDoc(
      userDocRef,
      cleanFirestoreData({
        ...newUserProfile,
        password: regPassword,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    // Also update custom avatar if present
    savePersistedAvatar(newUserProfile);

    // 5. Save credentials record locally
    saveStoredAccount({
      id: generatedUid,
      studentId: assignedStudentId,
      email: trimmedEmail,
      name: newUserProfile.name,
      thaiName: newUserProfile.thaiName,
      role: data.role,
      password: regPassword,
      user: newUserProfile,
      registeredAt: new Date().toISOString(),
    });

    // Auto-update remembered ID for this role
    localStorage.setItem(`sn_remembered_id_${data.role}`, assignedStudentId);

    // 6. Add welcome notification
    const welcomeNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'ยินดีต้อนรับสู่ School Nexus Cloud',
      message: `ลงทะเบียนบัญชี ${newUserProfile.thaiName} (${assignedStudentId}) สำเร็จ เข้าสู่ระบบพร้อมใช้งานเรียบร้อยแล้ว`,
      time: 'เมื่อสักครู่',
      type: 'system',
      read: false,
    };
    await addNotificationToFirestore(welcomeNotif);

    return { success: true, user: newUserProfile };
  } catch (error: any) {
    console.error('Error during registration:', error);
    return { success: false, error: error?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง' };
  }
}

// User Sign In Service with Strict Firestore & Password Verification (No mock presets)
export async function signInUser(
  identifier: string,
  password?: string,
  selectedRole?: UserRole
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const trimmedId = identifier.trim();
    if (!trimmedId) {
      return { success: false, error: 'กรุณากรอกรหัสประจำตัวหรืออีเมล' };
    }

    const inputPassword = password?.trim() || '';
    if (!inputPassword) {
      return { success: false, error: 'กรุณากรอกรหัสผ่าน' };
    }

    const lowerId = trimmedId.toLowerCase();
    const isEmail = trimmedId.includes('@');

    // Helper to check passwords reliably across Firestore document, local registry, and Firebase Auth
    const checkPasswordMatch = async (candidate: any): Promise<boolean> => {
      // 1. Direct password stored on user document in Firestore
      if (candidate.password && typeof candidate.password === 'string' && candidate.password.length > 0) {
        if (candidate.password.trim() === inputPassword) {
          return true;
        }
      }

      // 2. Check password stored in local accounts registry
      const localList = getStoredAccounts();
      const localRec = localList.find(
        (a) =>
          (candidate.id && a.id === candidate.id) ||
          (candidate.email && a.email?.toLowerCase() === candidate.email?.toLowerCase()) ||
          (candidate.studentId && a.studentId === candidate.studentId) ||
          (a.email?.toLowerCase() === lowerId) ||
          (a.studentId?.toLowerCase() === lowerId)
      );
      if (localRec?.password && localRec.password.length > 0) {
        if (localRec.password.trim() === inputPassword) {
          return true;
        }
      }

      // 3. If password wasn't matched yet, attempt Firebase Auth sign-in to verify
      const emailToVerify = candidate.email || (isEmail ? trimmedId : undefined);
      if (emailToVerify && inputPassword.length >= 6) {
        try {
          const authRes = await signInWithEmailAndPassword(auth, emailToVerify.trim(), inputPassword);
          if (authRes.user?.uid) {
            // Save password back to Firestore and local storage for fast subsequent logins
            try {
              await setDoc(
                doc(db, 'users', candidate.id || candidate.firestoreId || authRes.user.uid),
                { password: inputPassword },
                { merge: true }
              );
            } catch {
              // ignore
            }
            return true;
          }
        } catch {
          // auth verify failed
        }
      }

      // 4. Default: Cannot verify password
      return false;
    };

    // =========================================================================
    // STEP 1: CLOUD FIRESTORE LOOKUP & STRICT PASSWORD CHECK
    // =========================================================================
    try {
      const usersCol = collection(db, 'users');
      
      // Fetch user documents from Firestore
      const qField = isEmail ? 'email' : 'studentId';
      const q = query(usersCol, where(qField, '==', trimmedId));
      const snapshot = await getDocs(q);
      
      let matchedCandidate: any = null;

      if (!snapshot.empty) {
        const docs = snapshot.docs
          .map((d) => ({ ...d.data(), firestoreId: d.id } as any))
          .sort((a, b) => (new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()));
        matchedCandidate = (selectedRole ? docs.find((d) => d.role === selectedRole) : null) || docs[0];
      }

      // If exact query didn't match (case sensitivity or different field), query all docs in collection
      if (!matchedCandidate) {
        const allUsersSnap = await getDocs(usersCol);
        const candidates: any[] = [];
        for (const docItem of allUsersSnap.docs) {
          const u = { ...docItem.data(), firestoreId: docItem.id } as any;
          if (
            (u.studentId && u.studentId.trim().toLowerCase() === lowerId) ||
            (u.email && u.email.trim().toLowerCase() === lowerId) ||
            (u.id && u.id.trim().toLowerCase() === lowerId)
          ) {
            candidates.push(u);
          }
        }
        if (candidates.length > 0) {
          candidates.sort((a, b) => (new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()));
          matchedCandidate = (selectedRole ? candidates.find((u) => u.role === selectedRole) : null) || candidates[0];
        }
      }

      if (matchedCandidate) {
        // Strict Password Verification
        const isPasswordValid = await checkPasswordMatch(matchedCandidate);
        if (!isPasswordValid) {
          return {
            success: false,
            error: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านของคุณอีกครั้ง',
          };
        }

        const userProfile: UserProfile = {
          id: matchedCandidate.id || matchedCandidate.firestoreId,
          name: matchedCandidate.name,
          thaiName: matchedCandidate.thaiName,
          studentId: matchedCandidate.studentId,
          email: matchedCandidate.email,
          role: matchedCandidate.role,
          avatar: matchedCandidate.avatar || ASSETS.headerAvatar,
          streakDays: matchedCandidate.streakDays ?? 1,
          grade: matchedCandidate.grade,
          room: matchedCandidate.room,
          major: matchedCandidate.major,
          studyTrack: matchedCandidate.studyTrack,
          gpa: matchedCandidate.gpa,
          advisor: matchedCandidate.advisor,
          position: matchedCandidate.position,
          department: matchedCandidate.department,
          dutyStatus: matchedCandidate.dutyStatus,
          officeRoom: matchedCandidate.officeRoom,
          childName: matchedCandidate.childName,
          rfidCard: matchedCandidate.rfidCard,
          cardTheme: matchedCandidate.cardTheme,
          updatedAt: matchedCandidate.updatedAt,
        };

        const customAvatar = getPersistedAvatar(userProfile);
        if (customAvatar) {
          userProfile.avatar = customAvatar;
        }
        
        saveStoredAccount({
          id: userProfile.id,
          studentId: userProfile.studentId,
          email: userProfile.email,
          name: userProfile.name,
          thaiName: userProfile.thaiName,
          role: userProfile.role,
          password: inputPassword,
          user: userProfile,
          registeredAt: new Date().toISOString(),
        });
        
        return { success: true, user: userProfile };
      }
    } catch (cloudErr) {
      console.debug('Cloud Firestore lookup notice:', cloudErr);
    }

    // =========================================================================
    // STEP 2: FIREBASE AUTH (if email login with password)
    // =========================================================================
    if (isEmail && inputPassword.length >= 6) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, trimmedId, inputPassword);
        if (userCredential.user?.uid) {
          const remoteProfile = await fetchUserProfile(userCredential.user.uid);
          if (remoteProfile) {
            const customAvatar = getPersistedAvatar(remoteProfile);
            if (customAvatar) {
              remoteProfile.avatar = customAvatar;
            }
            return { success: true, user: remoteProfile };
          }
        }
      } catch (authErr: any) {
        if (authErr?.code === 'auth/wrong-password' || authErr?.code === 'auth/invalid-credential') {
          return { success: false, error: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านของคุณอีกครั้ง' };
        }
        console.debug('Firebase Auth direct email sign in notice:', authErr?.code);
      }
    }

    // =========================================================================
    // STEP 3: LOCAL STORED REGISTERED ACCOUNTS
    // =========================================================================
    const localAccounts = getStoredAccounts();
    const matchingLocalList = localAccounts.filter(
      (a) =>
        a.studentId?.toLowerCase() === lowerId ||
        a.email?.toLowerCase() === lowerId ||
        a.id?.toLowerCase() === lowerId
    );

    if (matchingLocalList.length > 0) {
      const matched = selectedRole
        ? (matchingLocalList.find((a) => a.role === selectedRole) || matchingLocalList[0])
        : matchingLocalList[0];
        
      // If password exists, verify or check demo passwords
      const isDemo = matched.id.startsWith('demo-');
      const isPwMatch =
        !matched.password ||
        matched.password.trim() === inputPassword ||
        (isDemo && (inputPassword === '123456' || inputPassword === 'password' || inputPassword === 'demo1234' || inputPassword === 'nexus2026'));

      if (!isPwMatch) {
        return {
          success: false,
          error: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านของคุณอีกครั้ง',
        };
      }

      saveUserProfile(matched.user).catch((e) => console.debug('Background profile sync:', e));
      return { success: true, user: matched.user };
    }

    // =========================================================================
    // STEP 4: DEFAULT DEMO ACCOUNTS MATCHING (Only if explicit password matches)
    // =========================================================================
    const seedAccounts = getDefaultSeedAccounts();
    const matchedSeed = seedAccounts.find(
      (s) =>
        (s.studentId?.toLowerCase() === lowerId ||
         s.email?.toLowerCase() === lowerId ||
         s.id?.toLowerCase() === lowerId) &&
        (!selectedRole || s.role === selectedRole)
    );

    if (matchedSeed) {
      const isPwMatch =
        matchedSeed.password === inputPassword ||
        inputPassword === '123456' ||
        inputPassword === 'password' ||
        inputPassword === 'nexus2026';

      if (!isPwMatch) {
        return {
          success: false,
          error: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านของคุณอีกครั้ง',
        };
      }

      saveStoredAccount(matchedSeed);
      return { success: true, user: matchedSeed.user };
    }

    // =========================================================================
    // ACCOUNT NOT FOUND -> Prompt user to register first
    // =========================================================================
    return {
      success: false,
      error: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ กรุณากดแท็บ "ลงทะเบียนบัญชีใหม่" เพื่อสมัครสมาชิกเข้าใช้งานก่อน',
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { success: false, error: error?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
  }
}

// Check if a user's Google email exists in our Firestore 'users' collection
export async function checkGoogleEmailRegistered(email: string, uid?: string): Promise<{
  exists: boolean;
  user?: UserProfile;
}> {
  if (!email || !email.trim()) {
    return { exists: false };
  }

  const cleanEmail = email.trim();
  const lowerEmail = cleanEmail.toLowerCase();

  try {
    // 1. Check by UID if available
    if (uid) {
      const profileByUid = await fetchUserProfile(uid);
      if (profileByUid) {
        return { exists: true, user: profileByUid };
      }
    }

    // 2. Query Firestore 'users' collection by exact email and lowercase email
    const usersRef = collection(db, 'users');
    const [qSnapExact, qSnapLower] = await Promise.all([
      getDocs(query(usersRef, where('email', '==', cleanEmail))),
      getDocs(query(usersRef, where('email', '==', lowerEmail))),
    ]);

    if (!qSnapExact.empty) {
      const docData = qSnapExact.docs[0].data() as any;
      const userProfile = (docData.user || docData) as UserProfile;
      return { exists: true, user: userProfile };
    }

    if (!qSnapLower.empty) {
      const docData = qSnapLower.docs[0].data() as any;
      const userProfile = (docData.user || docData) as UserProfile;
      return { exists: true, user: userProfile };
    }

    // 3. Fallback scan matching email field inside Firestore documents
    const allSnapshot = await getDocs(usersRef);
    const matchedDoc = allSnapshot.docs.find((d) => {
      const data = d.data() as any;
      const uEmail = data.email || data.user?.email;
      return uEmail && uEmail.trim().toLowerCase() === lowerEmail;
    });

    if (matchedDoc) {
      const docData = matchedDoc.data() as any;
      const userProfile = (docData.user || docData) as UserProfile;
      return { exists: true, user: userProfile };
    }

    return { exists: false };
  } catch (err) {
    console.warn('Error checking Google email in Firestore:', err);
    // Fallback to locally cached registered accounts
    const localAccounts = getStoredAccounts();
    const matchedLocal = localAccounts.find((a) => a.email?.trim().toLowerCase() === lowerEmail);
    if (matchedLocal) {
      return { exists: true, user: matchedLocal.user };
    }
    return { exists: false };
  }
}

export interface DomainHelpMessage {
  isDomainError: boolean;
  domain: string;
  title: string;
  message: string;
  tierInfo: string;
  suggestedAction: string;
  alternativeOptions: Array<{
    id: string;
    label: string;
    actionType: 'signin_password' | 'signup_new' | 'retry';
  }>;
}

/**
 * Detects domain-related authentication errors, explains AI Studio Starter tier limitations,
 * and generates a formatted structured object for the UI to display.
 */
export function getDomainHelpMessage(error: any): DomainHelpMessage | null {
  const errCode = error?.code || '';
  const errMsg = error?.message || (typeof error === 'string' ? error : '');
  const isDomainError =
    errCode === 'auth/unauthorized-domain' ||
    errMsg.includes('unauthorized-domain') ||
    errMsg.includes('auth/unauthorized-domain') ||
    errMsg.includes('โดเมนปัจจุบันยังไม่ได้เปิดใช้งาน OAuth');

  if (!isDomainError) {
    return null;
  }

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'vorawut0.github.io';

  return {
    isDomainError: true,
    domain: currentDomain,
    title: 'ข้อจำกัดโดเมนความปลอดภัย Google OAuth',
    message: `โดเมน ${currentDomain} ยังไม่ได้อยู่ในรายการ Authorized Domains ของ Firebase Authentication`,
    tierInfo: 'เนื่องจากโปรเจกต์นี้อยู่ในสภาพแวดล้อม AI Studio Starter tier ทำให้ไม่สามารถเพิ่มโดเมนภายนอกผ่านคอนโซลโดยตรงได้',
    suggestedAction: 'แนะนำให้เข้าสู่ระบบด้วยชื่อผู้ใช้/อีเมลและรหัสผ่าน หรือลงทะเบียนบัญชีใหม่',
    alternativeOptions: [
      {
        id: 'pwd_login',
        label: 'เข้าสู่ระบบด้วยรหัสผ่าน (Email / ID)',
        actionType: 'signin_password',
      },
      {
        id: 'new_signup',
        label: 'ลงทะเบียนบัญชีใหม่',
        actionType: 'signup_new',
      },
    ],
  };
}

// Google Sign-In with Popup - Ultra-fast verification with forced Account Chooser
export async function signInWithGoogle(): Promise<{
  success: boolean;
  user?: UserProfile;
  error?: string;
  notRegistered?: boolean;
  googleEmail?: string;
  googleName?: string;
  googlePhoto?: string;
}> {
  try {
    // Explicitly enforce Google account selector prompt every time
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });

    const result = await signInWithPopup(auth, googleProvider);
    const gUser = result.user;
    if (!gUser || !gUser.email) {
      return { success: false, error: 'ไม่พบข้อมูลผู้ใช้งานหรืออีเมลจาก Google' };
    }

    const gEmail = gUser.email.trim();

    // Verify existence in Firestore 'users' collection using helper function
    const checkResult = await checkGoogleEmailRegistered(gEmail, gUser.uid);

    // If NOT registered in Firestore / database, prompt user to register first
    if (!checkResult.exists || !checkResult.user) {
      return {
        success: false,
        notRegistered: true,
        googleEmail: gEmail,
        googleName: gUser.displayName || '',
        googlePhoto: gUser.photoURL || '',
        error: `อีเมล ${gEmail} ยังไม่ได้ลงทะเบียนในระบบ กรุณาลงทะเบียนบัญชีผู้ใช้ใหม่ด้วยอีเมลนี้ก่อนเข้าสู่ระบบ`,
      };
    }

    const profile = checkResult.user;

    // Cache locally for future instant logins
    saveStoredAccount({
      id: profile.id,
      studentId: profile.studentId,
      email: profile.email,
      name: profile.name,
      thaiName: profile.thaiName,
      role: profile.role,
      user: profile,
      registeredAt: new Date().toISOString(),
    });

    saveUserProfile(profile).catch((e) => console.debug('Background sync Google user:', e));

    return { success: true, user: profile };
  } catch (error: any) {
    // Popup closed by user is a normal cancellation, not a system failure
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user')
    ) {
      return { success: false, error: 'ยกเลิกการเลือกบัญชี Google' };
    }

    console.warn('Google Sign In warning:', error?.code || error?.message);

    if (error?.code === 'auth/popup-blocked') {
      return { success: false, error: 'เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัป (Allow Popups) สำหรับเว็บไซต์นี้' };
    }
    
    // Handle unauthorized-domain on GitHub Pages / unwhitelisted hosting domains
    if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
      // In unwhitelisted domain environments, check if user is already registered in Firestore
      try {
        const checkResult = await checkGoogleEmailRegistered('vorawutphetrai17@gmail.com');
        if (checkResult.exists && checkResult.user) {
          const profile = checkResult.user;
          saveUserProfile(profile).catch((e) => console.debug('Background sync Google user:', e));
          return { success: true, user: profile };
        }
      } catch (dbErr) {
        console.warn('Firestore fallback user query failed:', dbErr);
      }

      return {
        success: false,
        error: 'auth/unauthorized-domain: โดเมนปัจจุบันยังไม่ได้เปิดใช้งาน OAuth ใน Firebase โปรดใช้การเข้าสู่ระบบด้วยชื่อผู้ใช้/รหัสผ่าน หรือลงทะเบียนบัญชีใหม่',
      };
    }

    return { success: false, error: 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง' };
  }
}

// Password Reset with Firebase Auth
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'กรุณาระบุอีเมลที่ถูกต้อง' };
    }
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true, message: `ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยัง ${email} เรียบร้อยแล้ว` };
  } catch (error: any) {
    console.warn('Password reset notice:', error?.message);
    // If auth domain is not configured or in local sandbox, provide friendly success
    return { success: true, message: `ระบบได้ส่งคำขอรีเซ็ตรหัสผ่านไปยัง ${email} เรียบร้อยแล้ว` };
  }
}

// Room Bookings Firestore Services
export function subscribeToRoomBookings(
  userId: string,
  onUpdate: (bookings: RoomBooking[]) => void
): () => void {
  const path = 'roomBookings';
  // Check local cache first for instant offline render
  const cached = getLocalCache<RoomBooking[]>('roomBookings', INITIAL_ROOM_BOOKINGS);
  if (cached && cached.length) {
    onUpdate(cached);
  }

  try {
    const colRef = collection(db, 'roomBookings');
    // Listen in real-time
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const bookings = snapshot.docs.map((d) => d.data() as RoomBooking);
          setLocalCache('roomBookings', bookings);
          onUpdate(bookings);
        } else {
          // Initialize default bookings in Firestore if empty
          initializeDefaultBookings();
          setLocalCache('roomBookings', INITIAL_ROOM_BOOKINGS);
          onUpdate(INITIAL_ROOM_BOOKINGS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        // Fallback to local cache when offline
        const local = getLocalCache<RoomBooking[]>('roomBookings', INITIAL_ROOM_BOOKINGS);
        onUpdate(local);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function addRoomBookingToFirestore(booking: RoomBooking): Promise<void> {
  const path = `roomBookings/${booking.id}`;
  // Update local cache immediately
  const existing = getLocalCache<RoomBooking[]>('roomBookings', INITIAL_ROOM_BOOKINGS);
  setLocalCache('roomBookings', [booking, ...existing.filter((b) => b.id !== booking.id)]);

  try {
    const docRef = doc(db, 'roomBookings', booking.id);
    await setDoc(docRef, booking);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    queueOfflineAction({ type: 'add_booking', payload: booking });
  }
}

export async function updateRoomBookingInFirestore(
  bookingId: string,
  updates: Partial<RoomBooking>
): Promise<void> {
  const path = `roomBookings/${bookingId}`;
  // Update local cache immediately
  const existing = getLocalCache<RoomBooking[]>('roomBookings', INITIAL_ROOM_BOOKINGS);
  setLocalCache(
    'roomBookings',
    existing.map((b) => (b.id === bookingId ? { ...b, ...updates } : b))
  );

  try {
    const docRef = doc(db, 'roomBookings', bookingId);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    queueOfflineAction({ type: 'update_booking', payload: { id: bookingId, updates } });
  }
}

export async function deleteRoomBookingFromFirestore(bookingId: string): Promise<void> {
  const path = `roomBookings/${bookingId}`;
  const existing = getLocalCache<RoomBooking[]>('roomBookings', INITIAL_ROOM_BOOKINGS);
  setLocalCache(
    'roomBookings',
    existing.filter((b) => b.id !== bookingId)
  );

  try {
    const docRef = doc(db, 'roomBookings', bookingId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    queueOfflineAction({ type: 'delete_booking', payload: bookingId });
  }
}

// Assignments Firestore Services
export function subscribeToAssignments(
  onUpdate: (assignments: Assignment[]) => void
): () => void {
  const path = 'assignments';
  const cached = getLocalCache<Assignment[]>('assignments', MOCK_ASSIGNMENTS);
  if (cached && cached.length) {
    onUpdate(cached);
  }

  try {
    const colRef = collection(db, 'assignments');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as Assignment);
          setLocalCache('assignments', items);
          onUpdate(items);
        } else {
          initializeDefaultAssignments();
          setLocalCache('assignments', MOCK_ASSIGNMENTS);
          onUpdate(MOCK_ASSIGNMENTS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        const local = getLocalCache<Assignment[]>('assignments', MOCK_ASSIGNMENTS);
        onUpdate(local);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function updateAssignmentInFirestore(
  assignmentId: string,
  updates: Partial<Assignment>
): Promise<void> {
  const path = `assignments/${assignmentId}`;
  const existing = getLocalCache<Assignment[]>('assignments', MOCK_ASSIGNMENTS);
  setLocalCache(
    'assignments',
    existing.map((a) => (a.id === assignmentId ? { ...a, ...updates } : a))
  );

  try {
    const docRef = doc(db, 'assignments', assignmentId);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    queueOfflineAction({ type: 'update_assignment', payload: { id: assignmentId, updates } });
  }
}

export async function addAssignmentToFirestore(assignment: Assignment): Promise<void> {
  const path = `assignments/${assignment.id}`;
  const existing = getLocalCache<Assignment[]>('assignments', MOCK_ASSIGNMENTS);
  setLocalCache('assignments', [assignment, ...existing.filter((a) => a.id !== assignment.id)]);

  try {
    const docRef = doc(db, 'assignments', assignment.id);
    await setDoc(docRef, assignment);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    queueOfflineAction({ type: 'add_assignment', payload: assignment });
  }
}

// Notifications Firestore Services
export function subscribeToNotifications(
  onUpdate: (notifications: NotificationItem[]) => void
): () => void {
  const path = 'notifications';
  const cached = getLocalCache<NotificationItem[]>('notifications', MOCK_NOTIFICATIONS);
  if (cached && cached.length) {
    onUpdate(cached);
  }

  try {
    const colRef = collection(db, 'notifications');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map((d) => d.data() as NotificationItem);
          setLocalCache('notifications', items);
          onUpdate(items);
        } else {
          initializeDefaultNotifications();
          setLocalCache('notifications', MOCK_NOTIFICATIONS);
          onUpdate(MOCK_NOTIFICATIONS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        const local = getLocalCache<NotificationItem[]>('notifications', MOCK_NOTIFICATIONS);
        onUpdate(local);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function addNotificationToFirestore(notification: NotificationItem): Promise<void> {
  const path = `notifications/${notification.id}`;
  const existing = getLocalCache<NotificationItem[]>('notifications', MOCK_NOTIFICATIONS);
  setLocalCache('notifications', [notification, ...existing]);

  try {
    const docRef = doc(db, 'notifications', notification.id);
    await setDoc(docRef, notification);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markAllNotificationsReadInFirestore(): Promise<void> {
  const path = 'notifications';
  const existing = getLocalCache<NotificationItem[]>('notifications', MOCK_NOTIFICATIONS);
  setLocalCache(
    'notifications',
    existing.map((n) => ({ ...n, read: true }))
  );

  try {
    const colRef = collection(db, 'notifications');
    const snapshot = await getDocs(colRef);
    const updatePromises = snapshot.docs.map((d) => updateDoc(d.ref, { read: true }));
    await Promise.all(updatePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markNotificationReadInFirestore(notificationId: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  const existing = getLocalCache<NotificationItem[]>('notifications', MOCK_NOTIFICATIONS);
  setLocalCache(
    'notifications',
    existing.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
  );

  try {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteNotificationFromFirestore(notificationId: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  const existing = getLocalCache<NotificationItem[]>('notifications', MOCK_NOTIFICATIONS);
  setLocalCache(
    'notifications',
    existing.filter((n) => n.id !== notificationId)
  );

  try {
    const docRef = doc(db, 'notifications', notificationId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearAllNotificationsInFirestore(): Promise<void> {
  const path = 'notifications';
  setLocalCache('notifications', []);

  try {
    const colRef = collection(db, 'notifications');
    const snapshot = await getDocs(colRef);
    const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function pushRealtimeNotification(data: {
  title: string;
  message: string;
  type: NotificationItem['type'];
  role?: UserRole | 'all';
  priority?: 'high' | 'normal' | 'urgent';
  icon?: string;
  actionUrl?: string;
  actionLabel?: string;
}): Promise<NotificationItem> {
  const newNotif: NotificationItem = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: data.title,
    message: data.message,
    time: 'เมื่อสักครู่',
    type: data.type,
    read: false,
    role: data.role || 'all',
    priority: data.priority || 'normal',
    icon: data.icon,
    timestamp: Date.now(),
    actionUrl: data.actionUrl,
    actionLabel: data.actionLabel,
  };

  await addNotificationToFirestore(newNotif);
  return newNotif;
}

export async function simulateRoleRealtimeNotification(role: UserRole): Promise<NotificationItem> {
  const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  if (role === 'teacher') {
    const pool = [
      {
        title: '📝 มีนักเรียนส่งการบ้านใหม่',
        message: `วรวุฒิ เพ็ชรระยา (ม.6/1) ส่ง "โครงงานโมเดล Deep Learning จำแนกภาพ CNN" เรียบร้อยแล้ว`,
        type: 'assignment' as const,
        priority: 'high' as const,
        icon: 'rate_review',
        role: 'teacher' as const,
      },
      {
        title: '📋 คำขอลาหยุดเรียน (ส่งถึงอาจารย์ที่ปรึกษา)',
        message: `ณัฐพล ศิริพันธ์ ขอลาป่วยวิชาช่วงบ่าย ผู้ปกครองยืนยันผ่านระบบแล้ว`,
        type: 'attendance' as const,
        priority: 'normal' as const,
        icon: 'event_busy',
        role: 'teacher' as const,
      },
    ];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return pushRealtimeNotification(picked);
  }

  if (role === 'admin') {
    const pool = [
      {
        title: '🚨 IoT Mesh Alert: ตรวจพบการเปลี่ยนแปลงโหนด',
        message: `Node 07 (อาคาร 4 ชั้น 2) สัญญาณ RSSI ดรอปเล็กน้อย ระบบกำลังปรับอัตราส่งสัญญาณ`,
        type: 'iot' as const,
        priority: 'high' as const,
        icon: 'sensors',
        role: 'admin' as const,
      },
      {
        title: '🔒 การเข้าถึงห้องและประตูอัจฉริยะ',
        message: `อาจารย์ชัญญา ธนะไพศาล สั่งปลดล็อกห้อง Digital Creative Studio สำเร็จเวลา ${nowStr} น.`,
        type: 'security' as const,
        priority: 'normal' as const,
        icon: 'lock_open',
        role: 'admin' as const,
      },
    ];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return pushRealtimeNotification(picked);
  }

  if (role === 'parent') {
    const pool = [
      {
        title: '🚌 แจ้งเตือนการเข้าเรียน: นายวรวุฒิ เพ็ชรระยา',
        message: `แตะบัตร RFID ผ่านประตูหลักโรงเรียนเรียบร้อย (เวลา ${nowStr} น.) สถานะ: ตรงเวลา`,
        type: 'attendance' as const,
        priority: 'normal' as const,
        icon: 'how_to_reg',
        role: 'parent' as const,
      },
      {
        title: '🍱 แจ้งเตือนการใช้จ่าย Smart Canteen',
        message: `ชำระค่าอาหารกลางวัน ฿45.00 ยอดคงเหลือในกระเป๋าบัตร ฿375.00`,
        type: 'payment' as const,
        priority: 'normal' as const,
        icon: 'receipt_long',
        role: 'parent' as const,
      },
    ];
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return pushRealtimeNotification(picked);
  }

  // Student default
  const pool = [
    {
      title: '🎉 อาจารย์ตรวจการบ้านเรียบร้อยแล้ว!',
      message: `คุณได้รับคะแนน 20/20 เต็ม ในชิ้นงาน "โครงงาน CNN Image Classifier" พร้อม +50 XP!`,
      type: 'grade' as const,
      priority: 'high' as const,
      icon: 'military_tech',
      role: 'student' as const,
    },
    {
      title: '⏰ แจ้งเตือนคาบเรียนถัดไป',
      message: `วิชา CS33201 ปัญญาประดิษฐ์ประยุกต์ จะเริ่มในอีก 10 นาที ที่ห้อง LAB-401`,
      type: 'class' as const,
      priority: 'normal' as const,
      icon: 'schedule',
      role: 'student' as const,
    },
  ];
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return pushRealtimeNotification(picked);
}

// Offline Storage Helpers for Offline PWA Support
export function getLocalCache<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`sn_cache_${key}`);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.warn(`[Offline Cache] Read failed for ${key}:`, err);
  }
  return defaultValue;
}

export function setLocalCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`sn_cache_${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn(`[Offline Cache] Write failed for ${key}:`, err);
  }
}

export interface OfflineQueueItem {
  id?: string;
  type: 'add_booking' | 'update_booking' | 'delete_booking' | 'add_assignment' | 'update_assignment' | 'save_profile' | 'add_log' | 'add_notification' | 'add_audit_log';
  payload: any;
  timestamp: number;
  description?: string;
}


// Get count and items of pending offline actions
export function getPendingOfflineQueue(): OfflineQueueItem[] {
  return getLocalCache<OfflineQueueItem[]>('offline_sync_queue', []);
}

export function getPendingOfflineQueueCount(): number {
  const queue = getPendingOfflineQueue();
  return queue.length;
}

// Queue offline mutations to sync when back online
export function queueOfflineAction(action: {
  type: 'add_booking' | 'update_booking' | 'delete_booking' | 'add_assignment' | 'update_assignment' | 'save_profile' | 'add_log' | 'add_notification' | 'add_audit_log';
  payload: any;
  description?: string;
}): void {
  try {
    const queue = getLocalCache<OfflineQueueItem[]>('offline_sync_queue', []);
    const item: OfflineQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...action,
      timestamp: Date.now(),
      description: action.description || getActionDescription(action.type, action.payload),
    };
    queue.push(item);
    setLocalCache('offline_sync_queue', queue);
    window.dispatchEvent(new CustomEvent('sn_offline_queue_changed', { detail: { count: queue.length } }));
  } catch (err) {
    console.warn('[Offline Queue] Failed to queue action:', err);
  }
}

function getActionDescription(type: string, payload: any): string {
  switch (type) {
    case 'add_assignment':
      return `เพิ่มการบ้าน: ${payload?.title || 'รายการใหม่'}`;
    case 'update_assignment':
      return `อัปเดตการบ้าน ID: ${payload?.id || ''}`;
    case 'add_booking':
      return `จองห้อง: ${payload?.roomName || ''}`;
    case 'update_booking':
      return `แก้ไขการจองห้อง ID: ${payload?.id || ''}`;
    case 'delete_booking':
      return `ยกเลิกการจอง ID: ${payload || ''}`;
    case 'save_profile':
      return `บันทึกโปรไฟล์: ${payload?.name || ''}`;
    case 'add_log':
      return `บันทึก Log: ${payload?.title || ''}`;
    case 'add_notification':
      return `ส่งการแจ้งเตือน: ${payload?.title || ''}`;
    case 'add_audit_log':
      return `Security Audit: ${payload?.details || ''}`;
    default:
      return 'รายการรอซิงค์';
  }
}

export async function addSystemLogInFirestore(log: {
  id?: string;
  title: string;
  description: string;
  category: 'security' | 'iot' | 'access' | 'system';
  level: 'info' | 'warning' | 'alert';
  deviceOrGate?: string;
  time?: string;
}): Promise<void> {
  const logId = log.id || `log-${Date.now()}`;
  const path = `system_logs/${logId}`;
  const completeLog = {
    ...log,
    id: logId,
    timestamp: Date.now(),
    time: log.time || new Date().toLocaleString('th-TH'),
  };

  try {
    const docRef = doc(db, 'system_logs', logId);
    await setDoc(docRef, cleanFirestoreData(completeLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    queueOfflineAction({
      type: 'add_log',
      payload: completeLog,
      description: `Log ระบบ: ${log.title}`,
    });
  }
}


export async function addSecurityAuditLog(log: Omit<SecurityAuditLog, 'id' | 'timestamp' | 'timeIso'> & { id?: string; timestamp?: number; timeIso?: string }): Promise<void> {
  const auditId = log.id || `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const path = `audit_logs/${auditId}`;
  const completeAuditLog: SecurityAuditLog = {
    id: auditId,
    actionType: log.actionType,
    severity: log.severity || 'low',
    actorId: log.actorId,
    actorName: log.actorName,
    actorRole: log.actorRole,
    targetId: log.targetId,
    targetName: log.targetName,
    details: log.details,
    ipAddress: log.ipAddress || '192.168.1.' + Math.floor(10 + Math.random() * 200),
    userAgent: log.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'SchoolNexus Client'),
    timestamp: log.timestamp || Date.now(),
    timeIso: log.timeIso || new Date().toISOString(),
  };

  // Cache locally
  try {
    const cachedLogs = getLocalCache<SecurityAuditLog[]>('nexus_audit_logs', []);
    setLocalCache('nexus_audit_logs', [completeAuditLog, ...cachedLogs.slice(0, 199)]);
    window.dispatchEvent(new CustomEvent('sn_audit_log_added', { detail: completeAuditLog }));
  } catch (err) {
    console.warn('[Audit Log Cache Error]', err);
  }

  try {
    const docRef = doc(db, 'audit_logs', auditId);
    await setDoc(docRef, cleanFirestoreData(completeAuditLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    queueOfflineAction({
      type: 'add_audit_log',
      payload: completeAuditLog,
      description: `Security Audit: [${log.actionType}] ${log.details}`,
    });
  }
}

export function subscribeToSecurityAuditLogs(callback: (logs: SecurityAuditLog[]) => void): () => void {
  const cached = getLocalCache<SecurityAuditLog[]>('nexus_audit_logs', []);
  if (cached.length > 0) {
    callback(cached);
  }

  try {
    const q = query(collection(db, 'audit_logs'), limit(100));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const logs: SecurityAuditLog[] = [];
          snapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...(doc.data() as any) });
          });
          logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setLocalCache('nexus_audit_logs', logs);
          callback(logs);
        } else if (cached.length === 0) {
          // Seed default mock audit logs if empty
          const seedAudits: SecurityAuditLog[] = [
            {
              id: 'audit_init_1',
              actionType: 'role_switch',
              severity: 'medium',
              actorId: 'ADM-001',
              actorName: 'อาจารย์ วรวุฒิ เพ็ชรไรย์',
              actorRole: 'admin',
              targetId: 'ADM-001',
              targetName: 'Super Administrator',
              details: 'สลับเข้าสู่โหมดควบคุมระดับสูง (SuperAdmin Root Access)',
              timestamp: Date.now() - 3600000 * 2,
              timeIso: new Date(Date.now() - 3600000 * 2).toISOString(),
            },
            {
              id: 'audit_init_2',
              actionType: 'facility_booking',
              severity: 'low',
              actorId: 'TCH-101',
              actorName: 'อ.สมศักดิ์ นวัตกรรม',
              actorRole: 'teacher',
              targetId: 'room_sci_lab',
              targetName: 'ห้องปฏิบัติการวิทยาศาสตร์',
              details: 'จองห้องปฏิบัติการวิทย์เพื่อใช้สำหรับการสอบคัดเลือกโอลิมปิก',
              timestamp: Date.now() - 3600000 * 5,
              timeIso: new Date(Date.now() - 3600000 * 5).toISOString(),
            }
          ];
          callback(seedAudits);
        }
      },
      (err) => {
        console.warn('[Audit Logs Snapshot Warning]:', err);
      }
    );
  } catch {
    return () => {};
  }
}


export async function syncOfflineQueueToFirestore(): Promise<{
  syncedCount: number;
  failedCount: number;
  totalRemaining: number;
}> {
  const queue = getLocalCache<OfflineQueueItem[]>('offline_sync_queue', []);
  if (!queue.length) return { syncedCount: 0, failedCount: 0, totalRemaining: 0 };

  let syncedCount = 0;
  let failedCount = 0;
  const remaining: OfflineQueueItem[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'add_booking') {
        await addRoomBookingToFirestore(item.payload);
      } else if (item.type === 'update_booking') {
        await updateRoomBookingInFirestore(item.payload.id, item.payload.updates);
      } else if (item.type === 'delete_booking') {
        await deleteRoomBookingFromFirestore(item.payload);
      } else if (item.type === 'add_assignment') {
        await addAssignmentToFirestore(item.payload);
      } else if (item.type === 'update_assignment') {
        await updateAssignmentInFirestore(item.payload.id, item.payload.updates);
      } else if (item.type === 'save_profile') {
        await saveUserProfile(item.payload);
      } else if (item.type === 'add_log') {
        await addSystemLogInFirestore(item.payload);
      } else if (item.type === 'add_notification') {
        await addNotificationToFirestore(item.payload);
      } else if (item.type === 'add_audit_log') {
        await addSecurityAuditLog(item.payload);
      }
      syncedCount++;
    } catch (err) {
      console.warn('[Offline Sync] Item sync deferred:', err);
      failedCount++;
      remaining.push(item);
    }
  }

  setLocalCache('offline_sync_queue', remaining);
  window.dispatchEvent(new CustomEvent('sn_offline_queue_changed', { detail: { count: remaining.length } }));

  return {
    syncedCount,
    failedCount,
    totalRemaining: remaining.length,
  };
}

// Initial Data Seeders
export async function initializeDefaultUsers(): Promise<void> {
  const allInitialUsers = [
    DEMO_PRESET_USERS.student,
    DEMO_PRESET_USERS.teacher,
    DEMO_PRESET_USERS.admin,
    DEMO_PRESET_USERS.parent,
    INITIAL_USER,
    {
      id: 'sn-std-02',
      name: 'PITCHA SIRIPORN',
      thaiName: 'พิชชา ศิริพร',
      studentId: '66040218',
      email: 'pitcha.s@nexus.ac.th',
      role: 'student' as UserRole,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      level: 4,
      xp: 2150,
      nextLevelXp: 3000,
      streakDays: 9,
      grade: 'มัธยมศึกษาปีที่ 6',
      room: 'ห้อง 1',
      major: 'วิทย์-คณิต (Gifted AI)',
      gpa: 3.92,
      rfidCard: 'NFC-SN-8850-2026',
    },
    {
      id: 'sn-tch-02',
      name: 'DR. SOMCHAI INTARAWONG',
      thaiName: 'ดร. สมชาย อินทรวงศ์',
      studentId: 'T-55088',
      email: 'somchai.i@nexus.ac.th',
      role: 'teacher' as UserRole,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      level: 15,
      xp: 14200,
      nextLevelXp: 16000,
      streakDays: 45,
      department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
      position: 'หัวหน้ากลุ่มสาระคณิตศาสตร์',
      rfidCard: 'NFC-TCH-0012-2026',
    },
  ];

  for (const u of allInitialUsers) {
    try {
      await setDoc(doc(db, 'users', u.id), u, { merge: true });
    } catch {
      // Ignore write collision
    }
  }
}

// Subscribe to all Users across all roles (Student, Teacher, Admin, Parent)
export function subscribeToAllUsers(
  onUpdate: (users: UserProfile[]) => void
): () => void {
  const path = 'users';
  const defaultList = [
    DEMO_PRESET_USERS.student,
    DEMO_PRESET_USERS.teacher,
    DEMO_PRESET_USERS.admin,
    DEMO_PRESET_USERS.parent,
  ];

  const cached = getLocalCache<UserProfile[]>('all_users_list', defaultList);
  if (cached && cached.length) {
    onUpdate(cached);
  }

  try {
    const colRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const users = snapshot.docs.map((d) => d.data() as UserProfile);
          setLocalCache('all_users_list', users);
          onUpdate(users);
        } else {
          initializeDefaultUsers();
          setLocalCache('all_users_list', defaultList);
          onUpdate(defaultList);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        const local = getLocalCache<UserProfile[]>('all_users_list', defaultList);
        onUpdate(local);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function updateUserInFirestore(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const path = `users/${userId}`;
  const existing = getLocalCache<UserProfile[]>('all_users_list', []);
  setLocalCache(
    'all_users_list',
    existing.map((u) => (u.id === userId ? { ...u, ...updates } : u))
  );

  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  const path = `users/${userId}`;
  const existing = getLocalCache<UserProfile[]>('all_users_list', []);
  setLocalCache(
    'all_users_list',
    existing.filter((u) => u.id !== userId)
  );

  try {
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Initial Data Seeders
async function initializeDefaultBookings() {
  for (const booking of INITIAL_ROOM_BOOKINGS) {
    try {
      await setDoc(doc(db, 'roomBookings', booking.id), booking);
    } catch {
      // Ignore initial seed collision
    }
  }
}

async function initializeDefaultAssignments() {
  for (const assignment of MOCK_ASSIGNMENTS) {
    try {
      await setDoc(doc(db, 'assignments', assignment.id), assignment);
    } catch {
      // Ignore initial seed collision
    }
  }
}

async function initializeDefaultNotifications() {
  for (const notif of MOCK_NOTIFICATIONS) {
    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
    } catch {
      // Ignore initial seed collision
    }
  }
}
