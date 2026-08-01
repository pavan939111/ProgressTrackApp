import { NextRequest, NextResponse } from 'next/server';
import { googleAuthUrl, googleConfigured } from '../../../../../../oauth/calendarOAuth';

export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.json(
      { success: false, message: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured' },
      { status: 503 }
    );
  }
  const uid = req.nextUrl.searchParams.get('uid') || 'anonymous';
  const returnPath = req.nextUrl.searchParams.get('returnPath') || '/';
  return NextResponse.redirect(googleAuthUrl(uid, returnPath));
}
