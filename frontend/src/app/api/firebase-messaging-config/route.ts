import { NextResponse } from 'next/server';

/**
 * Proxy FCM web config from the backend so the service worker can importScripts
 * a same-origin URL. Firebase keys are never stored in frontend env.
 */
export async function GET() {
  const api = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
  try {
    const res = await fetch(`${api}/api/firebase-messaging-config`, { cache: 'no-store' });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    const body = `self.FIREBASE_CONFIG = {}; self.FIREBASE_VAPID_KEY = ''; console.warn(${JSON.stringify(
      e?.message || 'config proxy failed'
    )});`;
    return new NextResponse(body, {
      status: 200,
      headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
    });
  }
}
