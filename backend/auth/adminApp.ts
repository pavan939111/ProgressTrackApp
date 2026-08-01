/**
 * Shared Firebase Admin bootstrap for backend routes (firebase-admin v12+ modular API).
 */
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let ready: boolean | null = null;

function loadServiceAccount():
  | { projectId: string; clientEmail: string; privateKey: string }
  | Record<string, unknown>
  | null {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim()) as Record<string, unknown>;
      if (cred?.private_key) {
        cred.private_key = String(cred.private_key).replace(/\\n/g, '\n');
      }
      if (cred?.project_id && cred?.client_email && cred?.private_key) return cred;
    } catch {
      /* fall through */
    }
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: String(process.env.FIREBASE_PRIVATE_KEY)
        .replace(/^"|"$/g, '')
        .replace(/\\n/g, '\n'),
    };
  }
  return null;
}

export function ensureFirebaseAdmin(): boolean {
  if (ready != null) return ready;
  try {
    if (!getApps().length) {
      const cred = loadServiceAccount();
      if (!cred) {
        ready = false;
        return false;
      }
      const projectId =
        (cred as { project_id?: string; projectId?: string }).project_id ||
        (cred as { projectId?: string }).projectId ||
        process.env.FIREBASE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        '';
      const storageBucket =
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        process.env.FIREBASE_STORAGE_BUCKET ||
        (projectId ? `${projectId}.firebasestorage.app` : undefined);
      initializeApp({
        credential: cert(cred as any),
        projectId: projectId || undefined,
        storageBucket,
      });
    }
    ready = true;
    return true;
  } catch (e) {
    console.warn('Firebase Admin init failed:', e);
    ready = false;
    return false;
  }
}

export function getFirebaseAdminApp(): App | null {
  if (!ensureFirebaseAdmin()) return null;
  return getApps()[0] || null;
}

export function getAdminFirestore(): Firestore | null {
  if (!ensureFirebaseAdmin()) return null;
  return getFirestore();
}

/** @deprecated use ensureFirebaseAdmin / getAdminFirestore */
export async function getFirebaseAdmin() {
  if (!ensureFirebaseAdmin()) return null;
  return { apps: getApps(), firestore: getFirestore };
}
