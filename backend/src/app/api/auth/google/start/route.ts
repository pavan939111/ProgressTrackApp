import { NextRequest, NextResponse } from 'next/server';
import { googleLoginAuthUrl, googleLoginConfigured } from '../../../../../../auth/googleLoginOAuth';
import { firebaseAuthConfigured } from '../../../../../../auth/firebaseAuthRest';

export async function GET(req: NextRequest) {
  if (!googleLoginConfigured()) {
    return NextResponse.json(
      { success: false, message: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured' },
      { status: 503 }
    );
  }
  if (!firebaseAuthConfigured()) {
    return NextResponse.json(
      { success: false, message: 'Firebase Auth is not configured on the server' },
      { status: 503 }
    );
  }
  const returnPath = req.nextUrl.searchParams.get('returnPath') || '/';
  return NextResponse.redirect(googleLoginAuthUrl(returnPath));
}
