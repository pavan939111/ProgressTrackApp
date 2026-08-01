import { NextRequest } from 'next/server';
import { fcmTokenStore } from '../../../../push/fcmTokenStore';
import { sendPushToUser, fcmAdminConfigured } from '../../../../push/fcmSend';
import { apiSuccess, apiError } from '../../../../shared/errors/apiResponse';

export async function GET() {
  return apiSuccess({
    adminConfigured: fcmAdminConfigured(),
    message: fcmAdminConfigured()
      ? 'FCM send pipeline ready'
      : 'Register tokens now; configure FIREBASE_SERVICE_ACCOUNT_JSON to enable server sends',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'register', uid, token, title, message, link, data } = body as {
      action?: 'register' | 'send' | 'unregister';
      uid?: string;
      token?: string;
      title?: string;
      message?: string;
      link?: string;
      data?: Record<string, string>;
    };

    if (!uid) return apiError('uid required', 'PUSH_001', 400);

    if (action === 'register') {
      if (!token) return apiError('token required', 'PUSH_002', 400);
      await fcmTokenStore.register(uid, token);
      return apiSuccess({ registered: true }, 'Device token registered');
    }

    if (action === 'unregister') {
      if (!token) return apiError('token required', 'PUSH_002', 400);
      await fcmTokenStore.remove(uid, token);
      return apiSuccess({ unregistered: true });
    }

    if (action === 'send') {
      const result = await sendPushToUser(uid, {
        title: title || 'PTA Reminder',
        body: message || 'Open PTA and check in on your session.',
        link: link || process.env.FRONTEND_URL || 'http://localhost:3000',
        data,
      });
      if (!result.success) {
        return apiError(result.message || 'Push send failed', 'PUSH_003', 503);
      }
      return apiSuccess(result, 'Push sent');
    }

    return apiError('Unknown action', 'PUSH_004', 400);
  } catch (e: any) {
    return apiError(e.message || 'Push pipeline error', 'PUSH_500', 500);
  }
}
