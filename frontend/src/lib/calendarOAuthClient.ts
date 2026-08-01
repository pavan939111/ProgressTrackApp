import { Session, Task } from '@/types';

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
}

export async function fetchCalendarStatus(uid: string) {
  const res = await fetch(`${apiBase()}/api/calendar/sync?uid=${encodeURIComponent(uid)}`);
  return res.json();
}

export function startGoogleOAuth(uid: string, returnPath = '/') {
  const url = `${apiBase()}/api/oauth/google/start?uid=${encodeURIComponent(uid)}&returnPath=${encodeURIComponent(returnPath)}`;
  window.location.href = url;
}

export async function disconnectCalendar(uid: string, provider: 'google') {
  const res = await fetch(
    `${apiBase()}/api/calendar/sync?uid=${encodeURIComponent(uid)}&provider=${provider}`,
    { method: 'DELETE' }
  );
  return res.json();
}

export async function syncCalendarTwoWay(opts: {
  uid: string;
  provider: 'google';
  direction: 'push' | 'pull' | 'both';
  date: string;
  goal: string;
  sessions: Session[];
  tasks: Task[];
  timezone?: string;
}) {
  const sessions = opts.sessions.map((s) => ({
    sessionId: s.sessionId,
    name: s.name,
    date: opts.date,
    startTime: s.startTime,
    endTime: s.endTime,
    goal: opts.goal,
    tasks: opts.tasks.filter((t) => t.sessionId === s.sessionId).map((t) => t.title),
  }));

  const start = new Date(`${opts.date}T00:00:00.000Z`).toISOString();
  const end = new Date(new Date(opts.date).getTime() + 8 * 86400000).toISOString();

  const res = await fetch(`${apiBase()}/api/calendar/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: opts.uid,
      provider: opts.provider,
      direction: opts.direction,
      sessions,
      timezone: opts.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      timeMin: start,
      timeMax: end,
    }),
  });
  return res.json();
}

export type PulledEvent = {
  id: string;
  title: string;
  start?: string;
  end?: string;
  description?: string;
  provider: 'google';
  ptaSessionId?: string;
};

const PULLED_KEY = 'pta_pulled_calendar_events';

export function savePulledEvents(events: PulledEvent[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PULLED_KEY, JSON.stringify(events));
}

export function loadPulledEvents(): PulledEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(PULLED_KEY) || '[]');
  } catch {
    return [];
  }
}
