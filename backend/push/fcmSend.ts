import { fcmTokenStore } from './fcmTokenStore';

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

let messaging: AdminMessaging | null = null;
let initAttempted = false;

export function fcmAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      (process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY)
  );
}

async function getMessaging(): Promise<AdminMessaging | null> {
  if (messaging) return messaging;
  if (initAttempted) return null;
  initAttempted = true;

  if (!fcmAdminConfigured()) return null;

  try {
    const mod = await import('firebase-admin');
    const admin = (mod as any).default ?? mod;

    if (!admin.apps?.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({ credential: admin.credential.cert(cred) });
      } else {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID!,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          }),
        });
      }
    }
    messaging = admin.messaging() as AdminMessaging;
    return messaging;
  } catch (e) {
    console.warn('firebase-admin unavailable for FCM:', e);
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

  const msg = await getMessaging();
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
