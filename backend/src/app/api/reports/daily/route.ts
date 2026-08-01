import { NextRequest, NextResponse } from 'next/server';

const reports = new Map<string, object>();

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid');
  const date = req.nextUrl.searchParams.get('date');
  if (!uid) {
    return NextResponse.json({ success: false, message: 'uid required' }, { status: 400 });
  }
  if (date) {
    return NextResponse.json({ success: true, data: reports.get(`${uid}:${date}`) || null });
  }
  const all = [...reports.entries()]
    .filter(([k]) => k.startsWith(`${uid}:`))
    .map(([, v]) => v);
  return NextResponse.json({ success: true, data: all });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, date, report } = body;
    if (!uid || !date || !report) {
      return NextResponse.json({ success: false, message: 'uid, date, report required' }, { status: 400 });
    }
    reports.set(`${uid}:${date}`, report);
    return NextResponse.json({ success: true, data: report });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message || 'Failed' }, { status: 500 });
  }
}
