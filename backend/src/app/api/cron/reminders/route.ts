import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { apiSuccess, apiError } from '../../../../../shared/errors/apiResponse';
import { fcmAdminConfigured } from '../../../../../push/fcmSend';
import { runReminderAlarms } from '../../../../../notifications/reminderScheduler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function safeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Allow when secret unset in local/dev only
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  if (safeEqualString(auth, expected)) return true;
  const q = req.nextUrl.searchParams.get('secret') || '';
  return safeEqualString(q, secret);
}

/**
 * Session alarm cron — fires FCM at configured reminder times (works when app is closed).
 * Vercel Cron: every minute. Secure with CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return apiError('Unauthorized', 'CRON_401', 401);
  }

  if (!fcmAdminConfigured()) {
    return apiError(
      'FCM Admin not configured — set FIREBASE_SERVICE_ACCOUNT_JSON (or PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)',
      'CRON_503',
      503
    );
  }

  try {
    const out = await runReminderAlarms(new Date());
    return apiSuccess(out, `Alarms checked (${out.due} due)`);
  } catch (e: any) {
    return apiError(e?.message || 'Alarm cron failed', 'CRON_500', 500);
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
