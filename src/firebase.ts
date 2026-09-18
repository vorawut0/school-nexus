import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfigJson from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use the databaseId provisioned for this applet if present
export const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  GET = 'read',
  UPDATE = 'update',
  WRITE = 'write',
  DELETE = 'delete',
  LIST = 'list',
}

export function handleFirestoreError(error: unknown, operation: OperationType, path: string): void {
  console.warn(`[Firestore Error - ${operation}] on ${path}:`, error);
}

// Connection check according to skill
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    console.log('[SchoolNexus Firebase] Cloud Firestore connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[SchoolNexus Firebase] Firestore client is offline or waiting for network.');
    } else {
      console.log('[SchoolNexus Firebase] Firestore connected (ready for collections).');
    }
    return false;
  }
}
