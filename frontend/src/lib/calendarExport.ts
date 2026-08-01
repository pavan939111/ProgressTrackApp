import { Session, Task, CalendarConnection, CalendarProvider } from '@/types';

const STORAGE_KEY = 'pta_calendar_connections';

export function loadCalendarConnections(): CalendarConnection[] {
  if (typeof window === 'undefined') return defaultConnections();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConnections();
    return JSON.parse(raw) as CalendarConnection[];
  } catch {
    return defaultConnections();
  }
}

export function saveCalendarConnections(connections: CalendarConnection[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
}

function defaultConnections(): CalendarConnection[] {
  return [
    { provider: 'google', connected: false, syncSessions: true, syncTasks: true },
    { provider: 'outlook', connected: false, syncSessions: true, syncTasks: true },
    { provider: 'apple', connected: false, syncSessions: true, syncTasks: false },
    { provider: 'ics', connected: true, syncSessions: true, syncTasks: true, lastSyncedAt: new Date().toISOString() },
  ];
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toIcsDate(date: string, time: string): string {
  const [h, m] = (time || '09:00').split(':').map(Number);
  const d = new Date(`${date}T${pad(h || 9)}:${pad(m || 0)}:00`);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcs(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcsFromSessions(
  sessions: Session[],
  tasks: Task[],
  date: string,
  title = 'PTA Daily Plan'
): string {
  const now = new Date();
  const stamp =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const events = sessions.map((session) => {
    const sessionTasks = tasks.filter((t) => t.sessionId === session.sessionId);
    const desc = sessionTasks.map((t) => `• ${t.title} [${t.status}]`).join('\\n') || 'No tasks';
    return [
      'BEGIN:VEVENT',
      `UID:${session.sessionId}@pta.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsDate(date, session.startTime)}`,
      `DTEND:${toIcsDate(date, session.endTime)}`,
      `SUMMARY:${escapeIcs(`${session.name} — ${title}`)}`,
      `DESCRIPTION:${escapeIcs(desc)}`,
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PTA Progress Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Opens provider “add event” deep links for the first upcoming session. */
export function openProviderAddEvent(
  provider: CalendarProvider,
  session: Session,
  date: string,
  goal: string
) {
  const start = `${date}T${session.startTime || '09:00'}:00`;
  const end = `${date}T${session.endTime || '10:00'}:00`;
  const title = encodeURIComponent(`PTA ${session.name}: ${goal}`);
  const details = encodeURIComponent(`Progress Tracker session — ${session.name}`);

  if (provider === 'google') {
    const dates = `${start.replace(/[-:]/g, '').slice(0, 15)}/${end.replace(/[-:]/g, '').slice(0, 15)}`;
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`,
      '_blank'
    );
    return;
  }

  if (provider === 'outlook') {
    window.open(
      `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${encodeURIComponent(start)}&enddt=${encodeURIComponent(end)}&body=${details}`,
      '_blank'
    );
    return;
  }

  // Apple / generic: ICS download handled by caller
}
