import { NextRequest } from 'next/server';

type Decoded = { uid: string; email?: string; name?: string };

let adminReady: Promise<boolean> | null = null;

async function ensureAdmin(): Promise<boolean> {
  if (!adminReady) {
    adminReady = (async () => {
      try {
        const mod = await import('firebase-admin');
        const admin = (mod as any).default ?? mod;
        if (!admin.apps?.length) {
          if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            const cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            admin.initializeApp({ credential: admin.credential.cert(cred) });
          } else if (
            process.env.FIREBASE_PROJECT_ID &&
            process.env.FIREBASE_CLIENT_EMAIL &&
            process.env.FIREBASE_PRIVATE_KEY
          ) {
            admin.initializeApp({
              credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
              }),
            });
          } else {
            return false;
          }
        }
        return true;
      } catch {
        return false;
      }
    })();
  }
  return adminReady;
}

/** Verify Bearer Firebase ID token. Falls back to Identity Toolkit lookup if Admin missing. */
export async function requireUser(req: NextRequest): Promise<Decoded | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  if (await ensureAdmin()) {
    try {
      const mod = await import('firebase-admin');
      const admin = (mod as any).default ?? mod;
      const decoded = await admin.auth().verifyIdToken(token);
      return { uid: decoded.uid, email: decoded.email, name: decoded.name };
    } catch {
      return null;
    }
  }

  // Fallback without Admin SDK
  try {
    const { lookupAccount } = await import('./firebaseAuthRest');
    const user = await lookupAccount(token);
    return { uid: user.localId, email: user.email, name: user.displayName };
  } catch {
    return null;
  }
}

export function toProfile(decoded: Decoded, fullName?: string) {
  const now = new Date().toISOString();
  return {
    uid: decoded.uid,
    email: decoded.email || '',
    fullName: fullName || decoded.name || (decoded.email || 'User').split('@')[0],
    createdAt: now,
    updatedAt: now,
    timezone: 'UTC',
    notificationPermission: false,
    pwaInstalled: false,
    streak: 0,
    totalXP: 0,
    level: 1,
    lastActiveDate: now.split('T')[0],
    onboardingCompleted: false,
  };
}
