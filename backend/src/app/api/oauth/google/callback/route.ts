import { NextRequest, NextResponse } from 'next/server';
import {
  completeGoogleOAuth,
  frontendRedirect,
  parseState,
} from '../../../../../../oauth/calendarOAuth';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state') || '';
  const { uid, returnPath } = parseState(state);

  if (!code) {
    return NextResponse.redirect(
      frontendRedirect(returnPath, { calendar: 'error', provider: 'google', message: 'missing_code' })
    );
  }

  try {
    const record = await completeGoogleOAuth(uid, code);
    return NextResponse.redirect(
      frontendRedirect(returnPath, {
        calendar: 'connected',
        provider: 'google',
        email: record.email || '',
      })
    );
  } catch (e: any) {
    return NextResponse.redirect(
      frontendRedirect(returnPath, {
        calendar: 'error',
        provider: 'google',
        message: encodeURIComponent(e.message || 'oauth_failed'),
      })
    );
  }
}
