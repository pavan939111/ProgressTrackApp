import { UserSettings } from '@/types';

type ReminderHandle = ReturnType<typeof setTimeout>;

const handles: ReminderHandle[] = [];

export type ReminderAction = 'checkin' | 'planner' | 'weekly' | 'inactivity';

export type ReminderFirePayload = {
  label: string;
  action: ReminderAction;
  sessionHint?: string;
};

function msUntil(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const target = new Date();
  target.setHours(h || 0, m || 0, 0, 0);
  const now = Date.now();
  let diff = target.getTime() - now;
  if (diff < 0) diff += 24 * 60 * 60 * 1000;
  return diff;
}

function msUntilWeekly(weeklyReminder: string): number {
  // Format: "Sunday 20:00" or "20:00" (defaults to Sunday)
  const parts = weeklyReminder.trim().split(/\s+/);
  let dayName = 'Sunday';
  let time = '20:00';
  if (parts.length >= 2) {
    dayName = parts[0];
    time = parts[1];
  } else if (parts[0]?.includes(':')) {
    time = parts[0];
  }
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  const targetDay = dayMap[dayName.toLowerCase()] ?? 0;
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  const delta = (targetDay - now.getDay() + 7) % 7;
  target.setDate(now.getDate() + delta);
  target.setHours(h || 20, m || 0, 0, 0);
  let diff = target.getTime() - now.getTime();
  if (diff <= 0) diff += 7 * 24 * 60 * 60 * 1000;
  return diff;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendReminder(title: string, body: string, action?: ReminderAction, sessionHint?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: `pta-${title}-${action || 'generic'}`,
      data: { action, sessionHint },
    });
    n.onclick = () => {
      window.focus();
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      if (sessionHint) params.set('session', sessionHint);
      const url = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', url);
      window.dispatchEvent(new CustomEvent('pta-reminder-action', { detail: { action, sessionHint } }));
      n.close();
    };
  } catch {
    // ignore
  }
}

export function clearReminders() {
  while (handles.length) {
    const h = handles.pop();
    if (h) clearTimeout(h);
  }
}

export function getNextReminder(
  settings: UserSettings
): { label: string; time: string; isTomorrow: boolean } | null {
  if (!settings.notificationsEnabled) return null;
  const slots: { label: string; time: string }[] = [
    { label: 'Morning', time: settings.morningReminder },
    { label: 'Before Lunch', time: settings.beforeLunchReminder },
    { label: 'Afternoon', time: settings.afternoonReminder },
    { label: 'Evening', time: settings.eveningReminder },
    { label: 'Night', time: settings.nightReminder },
    { label: 'Planning', time: settings.planningReminder },
  ].filter((s) => s.time);

  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const parsed = slots
    .map((s) => {
      const [h, m] = s.time.split(':').map(Number);
      return { ...s, mins: (h || 0) * 60 + (m || 0) };
    })
    .sort((a, b) => a.mins - b.mins);

  const next = parsed.find((p) => p.mins > mins);
  if (next) return { label: next.label, time: next.time, isTomorrow: false };
  if (parsed[0]) return { label: parsed[0].label, time: parsed[0].time, isTomorrow: true };
  return null;
}

/** Schedule session + planning + weekly + inactivity reminders (FR-07 / Notif Spec). */
export function scheduleReminders(
  settings: UserSettings,
  onFire?: (payload: ReminderFirePayload) => void,
  opts?: { lastActiveDate?: string }
) {
  clearReminders();
  if (!settings.notificationsEnabled) return;

  const slots: { label: string; time: string; action: ReminderAction; sessionHint?: string }[] = [
    { label: 'Morning session', time: settings.morningReminder, action: 'checkin', sessionHint: 'Morning' },
    {
      label: 'Before Lunch session',
      time: settings.beforeLunchReminder,
      action: 'checkin',
      sessionHint: 'Before Lunch',
    },
    { label: 'Afternoon session', time: settings.afternoonReminder, action: 'checkin', sessionHint: 'Afternoon' },
    { label: 'Evening session', time: settings.eveningReminder, action: 'checkin', sessionHint: 'Evening' },
    { label: 'Night session', time: settings.nightReminder, action: 'checkin', sessionHint: 'Night' },
    { label: 'Night planning', time: settings.planningReminder, action: 'planner' },
  ];

  slots.forEach(({ label, time, action, sessionHint }) => {
    if (!time) return;
    const delay = msUntil(time);
    const handle = setTimeout(() => {
      sendReminder('PTA Reminder', `${label} — tap to open.`, action, sessionHint);
      onFire?.({ label, action, sessionHint });
      scheduleReminders(settings, onFire, opts);
    }, Math.min(delay, 2147483647));
    handles.push(handle);
  });

  // Weekly review (R-04)
  if (settings.weeklyReminder) {
    const delay = msUntilWeekly(settings.weeklyReminder);
    const handle = setTimeout(() => {
      sendReminder('PTA Weekly Review', 'Review your week and generate your weekly report.', 'weekly');
      onFire?.({ label: 'Weekly review', action: 'weekly' });
      scheduleReminders(settings, onFire, opts);
    }, Math.min(delay, 2147483647));
    handles.push(handle);
  }

  // Inactivity nudge (R-05) — if last active was yesterday or earlier, remind once today at 10:00
  if (opts?.lastActiveDate) {
    const today = new Date().toISOString().split('T')[0];
    if (opts.lastActiveDate < today) {
      const delay = msUntil('10:00');
      const handle = setTimeout(() => {
        sendReminder('PTA Misses You', 'You have pending plans — open PTA and check in.', 'inactivity');
        onFire?.({ label: 'Inactivity', action: 'inactivity' });
      }, Math.min(delay, 2147483647));
      handles.push(handle);
    }
  }
}
