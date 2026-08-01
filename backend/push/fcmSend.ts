import { getMessaging } from 'firebase-admin/messaging';
import { fcmTokenStore } from './fcmTokenStore';
import { ensureFirebaseAdmin } from '../auth/adminApp';

type AdminMessaging = {
  sendEachForMulticast: (msg: {
    tokens: string[];
    notification?: { title: string; body: string };
    data?: Record<string, string>;
    webpush?: { fcmOptions?: { link?: string } };
  }) => Promise<{
    successCount: number;
    failureCount: number;
    responses: { success: boolean; error?: { code?: string } }[];
  }>;
};

export function fcmAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      (process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY)
  );
}

async function getMessagingClient(): Promise<AdminMessaging | null> {
  if (!fcmAdminConfigured()) return null;
  if (!ensureFirebaseAdmin()) return null;
  try {
    return getMessaging() as unknown as AdminMessaging;
  } catch (e) {
    console.warn('firebase-admin messaging unavailable:', e);
    return null;
  }
}

export async function sendPushToUser(
  uid: string,
  payload: { title: string; body: string; link?: string; data?: Record<string, string> }
) {
  const tokens = fcmTokenStore.list(uid).map((t) => t.token);
  if (!tokens.length) {
    return { success: false, message: 'No device tokens registered', sent: 0 };
  }

  const msg = await getMessagingClient();
  if (!msg) {
    return {
      success: false,
      message:
        'FCM Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (or PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY) and install firebase-admin.',
      sent: 0,
      queuedTokens: tokens.length,
    };
  }

  const result = await msg.sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    data: payload.data,
    webpush: payload.link ? { fcmOptions: { link: payload.link } } : undefined,
  });

  result.responses.forEach((r, i) => {
    if (!r.success && r.error?.code?.includes('registration-token-not-registered')) {
      fcmTokenStore.remove(uid, tokens[i]);
    }
  });

  return {
    success: result.successCount > 0,
    sent: result.successCount,
    failed: result.failureCount,
  };
}
