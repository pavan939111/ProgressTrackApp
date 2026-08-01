import { NextRequest, NextResponse } from 'next/server';
import {
  completeGoogleOAuth,
  frontendRedirect,
  parseState,
} from '../../../../../../oauth/calendarOAuth';
import {
  exchangeGoogleLoginCode,
  frontendLoginErrorRedirect,
  frontendLoginSuccessRedirect,
  googleLoginRedirectUri,
} from '../../../../../../auth/googleLoginOAuth';
import { signInWithGoogleIdp } from '../../../../../../auth/firebaseAuthRest';

function parsePurpose(state: string): 'login' | 'calendar' {
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    return parsed.purpose === 'login' ? 'login' : 'calendar';
  } catch {
    return 'calendar';
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state') || '';
  const purpose = parsePurpose(state);

  if (purpose === 'login') {
    let returnPath = '/';
    try {
      returnPath = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')).returnPath || '/';
    } catch {
      /* keep default */
    }

    if (!code) {
      return NextResponse.redirect(frontendLoginErrorRedirect(returnPath, 'missing_code'));
    }

    try {
      const google = await exchangeGoogleLoginCode(code);
      const firebase = await signInWithGoogleIdp({
        idToken: google.id_token,
        accessToken: google.access_token,
        requestUri: googleLoginRedirectUri(),
      });

      return NextResponse.redirect(
        frontendLoginSuccessRedirect(returnPath, {
          idToken: firebase.idToken,
          refreshToken: firebase.refreshToken,
          expiresIn: firebase.expiresIn || '3600',
          uid: firebase.localId,
          email: firebase.email || '',
          fullName: firebase.displayName || firebase.email?.split('@')[0] || 'Google User',
        })
      );
    } catch (e: any) {
      const msg = String(e?.message || 'google_login_failed').replace(/_/g, ' ');
      return NextResponse.redirect(frontendLoginErrorRedirect(returnPath, msg));
    }
  }

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
