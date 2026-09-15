import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, testFirestoreConnection } from '../firebase';
import {
  UserProfile,
  Assignment,
  StudentSubmission,
  RoomBooking,
  NotificationItem,
} from '../types';

export { testFirestoreConnection };

// ================= USERS COLLECTION =================
export async function syncUserProfileToCloud(profile: UserProfile): Promise<void> {
  try {
    const userRef = doc(db, 'users', profile.id);
    await setDoc(userRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Failed to sync user profile to cloud:', error);
  }
}

export async function fetchUserProfileFromCloud(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }
  return null;
}

// ================= ASSIGNMENTS COLLECTION =================
export async function fetchAssignmentsFromCloud(): Promise<Assignment[]> {
  try {
    const colRef = collection(db, 'assignments');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Assignment);
    }
  } catch (error) {
    console.error('Failed to fetch assignments from cloud:', error);
  }
  return [];
}

export async function saveAssignmentToCloud(assignment: Assignment): Promise<void> {
  try {
    const ref = doc(db, 'assignments', assignment.id);
    await setDoc(ref, assignment, { merge: true });
  } catch (error) {
    console.error('Failed to save assignment to cloud:', error);
  }
}

export function subscribeToAssignments(callback: (assignments: Assignment[]) => void) {
  const colRef = collection(db, 'assignments');
  return onSnapshot(colRef, (snap) => {
    const items = snap.docs.map((d) => d.data() as Assignment);
    callback(items);
  }, (err) => {
    console.warn('Assignments subscription error:', err);
  });
}

// ================= SUBMISSIONS COLLECTION =================
export async function saveSubmissionToCloud(submission: StudentSubmission): Promise<void> {
  try {
    const ref = doc(db, 'submissions', submission.id);
    await setDoc(ref, {
      ...submission,
      savedAt: serverTimestamp(),
    }, { merge: true });

    // Also update assignment status if submitted
    const assignRef = doc(db, 'assignments', submission.assignmentId);
    await updateDoc(assignRef, {
      status: 'submitted',
      progress: 100,
      submittedAt: submission.submittedAt,
    }).catch(() => {});
  } catch (error) {
    console.error('Failed to save submission to cloud:', error);
  }
}

export async function fetchSubmissionsFromCloud(assignmentId?: string): Promise<StudentSubmission[]> {
  try {
    const colRef = collection(db, 'submissions');
    const q = assignmentId
      ? query(colRef, where('assignmentId', '==', assignmentId))
      : colRef;
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as StudentSubmission);
  } catch (error) {
    console.error('Failed to fetch submissions from cloud:', error);
    return [];
  }
}

export function subscribeToSubmissions(
  callback: (submissions: StudentSubmission[]) => void,
  assignmentId?: string
) {
  const colRef = collection(db, 'submissions');
  const q = assignmentId
    ? query(colRef, where('assignmentId', '==', assignmentId))
    : colRef;

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => d.data() as StudentSubmission);
    callback(items);
  }, (err) => {
    console.warn('Submissions subscription error:', err);
  });
}

export async function gradeSubmissionInCloud(
  submissionId: string,
  assignmentId: string,
  score: number,
  feedback: string,
  teacherName: string
): Promise<void> {
  try {
    const ref = doc(db, 'submissions', submissionId);
    await updateDoc(ref, {
      score,
      feedback,
      status: 'graded',
      gradedBy: teacherName,
      gradedAt: new Date().toISOString(),
    });

    // Update assignment currentScore
    const assignRef = doc(db, 'assignments', assignmentId);
    await updateDoc(assignRef, {
      currentScore: score,
      status: 'submitted',
      progress: 100,
    }).catch(() => {});
  } catch (error) {
    console.error('Failed to grade submission:', error);
  }
}

// ================= ROOM BOOKINGS =================
export async function saveRoomBookingToCloud(booking: RoomBooking): Promise<void> {
  try {
    const ref = doc(db, 'roomBookings', booking.id);
    await setDoc(ref, booking, { merge: true });
  } catch (error) {
    console.error('Failed to save room booking:', error);
  }
}

export function subscribeToRoomBookings(callback: (bookings: RoomBooking[]) => void) {
  const colRef = collection(db, 'roomBookings');
  return onSnapshot(colRef, (snap) => {
    const items = snap.docs.map((d) => d.data() as RoomBooking);
    callback(items);
  }, (err) => {
    console.warn('Room bookings subscription error:', err);
  });
}

// ================= NOTIFICATIONS =================
export async function saveNotificationToCloud(notif: NotificationItem): Promise<void> {
  try {
    const ref = doc(db, 'notifications', notif.id);
    await setDoc(ref, notif, { merge: true });
  } catch (error) {
    console.error('Failed to save notification:', error);
  }
}

export function subscribeToNotifications(callback: (notifs: NotificationItem[]) => void) {
  const colRef = collection(db, 'notifications');
  return onSnapshot(colRef, (snap) => {
    const items = snap.docs.map((d) => d.data() as NotificationItem);
    callback(items);
  }, (err) => {
    console.warn('Notifications subscription error:', err);
  });
}
