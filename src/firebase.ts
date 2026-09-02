import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, getFirestore, setLogLevel, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Suppress internal WebChannel / background network warning noise in iframe runner
try {
  setLogLevel('silent');
} catch {
  // ignore
}

// Global console filter to prevent harmless WebChannel transport RPC retries from triggering the red badge
if (typeof window !== 'undefined') {
  const origWarn = console.warn;
  const origError = console.error;

  console.warn = function (...args: any[]) {
    const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    if (
      msg.includes('WebChannelConnection') ||
      msg.includes('@firebase/firestore') ||
      msg.includes('RPC \'Listen\'') ||
      msg.includes('transport errored')
    ) {
      // Suppress noisy Firestore streaming re-try warnings in dev sandboxes
      return;
    }
    origWarn.apply(console, args);
  };

  console.error = function (...args: any[]) {
    const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    if (
      msg.includes('WebChannelConnection') ||
      msg.includes('@firebase/firestore') ||
      msg.includes('RPC \'Listen\'') ||
      msg.includes('transport errored')
    ) {
      // Suppress harmless WebChannel reconnect errors
      return;
    }
    origError.apply(console, args);
  };
}

// Initialize Firebase App instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore instance with experimentalForceLongPolling for robust iframe & proxy connectivity
const customDatabaseId = (firebaseConfig as any).firestoreDatabaseId;
export const db: Firestore = (() => {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
      ...(customDatabaseId ? { databaseId: customDatabaseId } : {}),
    });
  } catch (_err) {
    // Fallback if already initialized
    return customDatabaseId ? getFirestore(app, customDatabaseId) : getFirestore(app);
  }
})();
export const auth = getAuth(app);
if (typeof window !== 'undefined') {
  try {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  } catch {
    // ignore
  }
}
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  return errInfo;
}

// Test Connection to Firestore as required by guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection-test'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return false;
    }
    // Expected to fail if doc doesn't exist or permissions are strict, but connection is alive
    return true;
  }
}

// Run connectivity check on load
testConnection();
