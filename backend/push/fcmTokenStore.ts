import { getAdminFirestore } from '../auth/adminApp';

export type DeviceToken = {
  uid: string;
  token: string;
  platform: 'web';
  updatedAt: string;
};

const COLLECTION = 'deviceTokens';

/** Stable doc id from token (avoids Firestore path issues with long FCM tokens). */
function tokenDocId(token: string): string {
  let h = 0;
  for (let i = 0; i < token.length; i++) h = (Math.imul(31, h) + token.charCodeAt(i)) | 0;
  return `t_${(h >>> 0).toString(16)}_${token.slice(0, 12)}`;
}

export const fcmTokenStore = {
  async register(uid: string, token: string): Promise<void> {
    const db = getAdminFirestore();
    if (!db) {
      console.warn('FCM token register skipped: Firestore Admin not configured');
      return;
    }
    const doc: DeviceToken = {
      uid,
      token,
      platform: 'web',
      updatedAt: new Date().toISOString(),
    };
    await db.collection(COLLECTION).doc(tokenDocId(token)).set(doc, { merge: true });
  },

  async list(uid: string): Promise<DeviceToken[]> {
    const db = getAdminFirestore();
    if (!db) return [];
    const snap = await db.collection(COLLECTION).where('uid', '==', uid).get();
    return snap.docs.map((d) => d.data() as DeviceToken);
  },

  async listAllUids(): Promise<string[]> {
    const db = getAdminFirestore();
    if (!db) return [];
    const snap = await db.collection(COLLECTION).select('uid').get();
    const set = new Set<string>();
    snap.docs.forEach((d) => {
      const uid = (d.data() as { uid?: string }).uid;
      if (uid) set.add(uid);
    });
    return [...set];
  },

  async remove(uid: string, token: string): Promise<void> {
    const db = getAdminFirestore();
    if (!db) return;
    await db.collection(COLLECTION).doc(tokenDocId(token)).delete().catch(() => undefined);
    // Also clean any legacy docs that match by query
    const snap = await db.collection(COLLECTION).where('uid', '==', uid).where('token', '==', token).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  },
};
