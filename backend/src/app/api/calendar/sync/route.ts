import { NextRequest, NextResponse } from 'next/server';
import { tokenStore } from '../../../../../oauth/tokenStore';
import {
  googleConfigured,
  pullGoogleEvents,
  pushSessionsToGoogle,
  type SyncSessionInput,
} from '../../../../../oauth/calendarOAuth';
import { apiSuccess, apiError } from '../../../../../shared/errors/apiResponse';

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid');
  if (!uid) return apiError('uid required', 'CAL_001', 400);

  const google = tokenStore.get(uid, 'google');

  return apiSuccess({
    googleConfigured: googleConfigured(),
    google: google
      ? { connected: true, email: google.email, updatedAt: google.updatedAt }
      : { connected: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      uid,
      provider,
      direction = 'push',
      sessions = [],
      timezone = 'UTC',
      timeMin,
      timeMax,
    } = body as {
      uid: string;
      provider: 'google';
      direction?: 'push' | 'pull' | 'both';
      sessions?: SyncSessionInput[];
      timezone?: string;
      timeMin?: string;
      timeMax?: string;
    };

    if (!uid) return apiError('uid required', 'CAL_001', 400);
    if (provider !== 'google') return apiError('Only google provider supported', 'CAL_003', 400);

    const out: Record<string, unknown> = {};

    if (direction === 'push' || direction === 'both') {
      out.googlePush = await pushSessionsToGoogle(uid, sessions, timezone);
    }

    if (direction === 'pull' || direction === 'both') {
      const start = timeMin || new Date().toISOString();
      const end =
        timeMax || new Date(Date.now() + 7 * 86400000).toISOString();
      out.googlePull = await pullGoogleEvents(uid, start, end);
    }

    return apiSuccess(out, 'Calendar sync complete');
  } catch (e: any) {
    return apiError(e.message || 'Calendar sync failed', 'CAL_002', 500);
  }
}

export async function DELETE(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid');
  const provider = req.nextUrl.searchParams.get('provider') as 'google' | null;
  if (!uid || !provider) return apiError('uid and provider required', 'CAL_001', 400);
  if (provider !== 'google') return apiError('Only google provider supported', 'CAL_003', 400);
  tokenStore.remove(uid, provider);
  return apiSuccess({ disconnected: true });
}
