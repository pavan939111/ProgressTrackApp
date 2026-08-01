import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { ensureFirebaseAdmin } from './adminApp';

type Decoded = { uid: string; email?: string; name?: string };

/** Verify Bearer Firebase ID token. Falls back to Identity Toolkit lookup if Admin missing. */
export async function requireUser(req: NextRequest): Promise<Decoded | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  if (ensureFirebaseAdmin()) {
    try {
      const decoded = await getAuth().verifyIdToken(token);
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
