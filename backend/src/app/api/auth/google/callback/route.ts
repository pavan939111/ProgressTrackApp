import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeGoogleLoginCode,
  frontendLoginErrorRedirect,
  frontendLoginSuccessRedirect,
  googleLoginRedirectUri,
  parseLoginState,
} from '../../../../../../auth/googleLoginOAuth';
import { signInWithGoogleIdp } from '../../../../../../auth/firebaseAuthRest';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state') || '';
  const { returnPath } = parseLoginState(state);

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
