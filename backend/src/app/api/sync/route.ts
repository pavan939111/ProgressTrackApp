import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '../../../../shared/errors/apiResponse';
import { requireUser } from '../../../../auth/sessionAuth';

async function getAdminDb() {
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
        return null;
      }
    }
    return admin.firestore();
  } catch {
    return null;
  }
}

/** Mirror client localStorage writes into Firestore (server-side only). */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return apiError('Unauthorized', 'AUTH_401', 401);

  try {
    const body = await req.json();
    const items = (body.items || [body]) as Array<{
      collection: string;
      docId: string;
      data: Record<string, unknown>;
    }>;

    const db = await getAdminDb();
    if (!db) {
      return apiError('Firestore Admin not configured on server', 'SYNC_503', 503);
    }

    const allowed = new Set([
      'users',
      'userSettings',
      'weeklyGoals',
      'dailyPlans',
      'sessions',
      'tasks',
      'progressLogs',
      'dailyReports',
      'weeklyReports',
      'achievements',
    ]);

    let written = 0;
    for (const item of items) {
      if (!item.collection || !item.docId || !item.data) continue;
      if (!allowed.has(item.collection)) continue;
      const data = { ...item.data, uid: user.uid };
      await db.collection(item.collection).doc(item.docId).set(data, { merge: true });
      written++;
    }

    return apiSuccess({ written }, 'Synced');
  } catch (e: any) {
    return apiError(e.message || 'Sync failed', 'SYNC_500', 500);
  }
}

/** Hydrate profile/settings/goals for the authenticated user. */
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return apiError('Unauthorized', 'AUTH_401', 401);

  try {
    const db = await getAdminDb();
    if (!db) {
      return apiSuccess({ profile: null, settings: null, goals: [] }, 'No Firestore');
    }

    const [profileSnap, settingsSnap, goalsSnap] = await Promise.all([
      db.collection('users').doc(user.uid).get(),
      db.collection('userSettings').doc(user.uid).get(),
      db.collection('weeklyGoals').where('uid', '==', user.uid).get(),
    ]);

    return apiSuccess({
      profile: profileSnap.exists ? profileSnap.data() : null,
      settings: settingsSnap.exists ? settingsSnap.data() : null,
      goals: goalsSnap.docs.map((d: { data: () => unknown }) => d.data()),
    });
  } catch (e: any) {
    return apiError(e.message || 'Hydrate failed', 'SYNC_500', 500);
  }
}
