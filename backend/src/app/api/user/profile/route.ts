import { NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight profile mirror endpoint for API Design compatibility.
 * Primary app still uses client Firestore/localStorage; this accepts upserts for tooling.
 */
const memory = new Map<string, Record<string, unknown>>();

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid');
  if (!uid) {
    return NextResponse.json({ success: false, message: 'uid required' }, { status: 400 });
  }
  const profile = memory.get(uid) || null;
  return NextResponse.json({ success: true, data: profile });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const uid = body.uid as string;
    if (!uid) {
      return NextResponse.json({ success: false, message: 'uid required' }, { status: 400 });
    }
    const prev = memory.get(uid) || {};
    const next = { ...prev, ...body, updatedAt: new Date().toISOString() };
    memory.set(uid, next);
    return NextResponse.json({ success: true, data: next });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message || 'Update failed' }, { status: 500 });
  }
}
