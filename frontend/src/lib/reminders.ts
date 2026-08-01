import { UserSettings } from '@/types';

type ReminderHandle = ReturnType<typeof setTimeout>;

const handles: ReminderHandle[] = [];
let nagInterval: ReturnType<typeof setInterval> | null = null;

const NAG_MS = 5 * 60 * 1000;

export type UpdateNagContext = {
  sessionName: string;
  pendingCount: number;
  sessionCompleted: boolean;
};

export type ReminderAction = 'checkin' | 'planner' | 'weekly' | 'inactivity';

export type ReminderFirePayload = {
  label: string;
  action: ReminderAction;
  sessionHint?: string;
};

export type NotificationPermissionState = 'unsupported' | 'granted' | 'denied' | 'default' | 'prompt';

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

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(display-mode: standalone)').matches;
  const ios = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return mq || ios;
}

export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Request notification permission from a user gesture. */
export async function requestNotificationPermission(): Promise<{
  granted: boolean;
  permission: NotificationPermissionState;
  message: string;
}> {
  if (!notificationsSupported()) {
    return {
      granted: false,
      permission: 'unsupported',
      message: 'This browser does not support web notifications.',
    };
  }

  if (Notification.permission === 'granted') {
    return { granted: true, permission: 'granted', message: 'Notifications already allowed.' };
  }

  if (Notification.permission === 'denied') {
    return {
      granted: false,
      permission: 'denied',
      message: isIosDevice()
        ? 'Notifications blocked. On iPhone: Settings → Notifications → PTA (or Safari) → Allow Notifications. Also install PTA to Home Screen first.'
        : 'Notifications blocked. Open your browser site settings and allow Notifications for this app, then try again.',
    };
  }

  // iOS only delivers web push/notifications reliably when installed to Home Screen
  if (isIosDevice() && !isStandalonePwa()) {
    return {
      granted: false,
      permission: 'default',
      message: 'On iPhone/iPad: tap Share → Add to Home Screen, open PTA from the icon, then enable notifications.',
    };
  }

  try {
    const result = await Notification.requestPermission();
    const permission = result as NotificationPermissionState;
    if (result === 'granted') {
      return { granted: true, permission, message: 'Notification permission granted.' };
    }
    if (result === 'denied') {
      return {
        granted: false,
        permission,
        message: 'Permission denied. Enable Notifications in system/browser settings for PTA.',
      };
    }
    return { granted: false, permission, message: 'Permission not granted yet.' };
  } catch (e: any) {
    return {
      granted: false,
      permission: getNotificationPermission(),
      message: e?.message || 'Could not request notification permission.',
    };
  }
}

async function showViaServiceWorker(
  title: string,
  options: NotificationOptions & { data?: Record<string, unknown> }
): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = (await navigator.serviceWorker.getRegistration('/')) || (await navigator.serviceWorker.ready);
    if (!reg?.showNotification) return false;
    await reg.showNotification(title, options);
    return true;
  } catch {
    return false;
  }
}

/** Show a local reminder — prefers Service Worker (required on Android/mobile). */
export async function sendReminder(
  title: string,
  body: string,
  action?: ReminderAction,
  sessionHint?: string
) {
  if (typeof window === 'undefined' || !notificationsSupported()) return;
  if (Notification.permission !== 'granted') return;

  const options: NotificationOptions = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: `pta-${action || 'generic'}-${sessionHint || title}`,
    data: {
      action,
      sessionHint,
      link: action
        ? `/?action=${encodeURIComponent(action)}${sessionHint ? `&session=${encodeURIComponent(sessionHint)}` : ''}`
        : '/',
    },
  };

  const viaSw = await showViaServiceWorker(title, options);
  if (viaSw) return;

  try {
    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      window.dispatchEvent(new CustomEvent('pta-reminder-action', { detail: { action, sessionHint } }));
      n.close();
    };
  } catch {
    // ignore
  }
}

export async function sendTestNotification(): Promise<{ ok: boolean; message: string }> {
  const perm = await requestNotificationPermission();
  if (!perm.granted) return { ok: false, message: perm.message };
  await sendReminder('PTA', 'Reminders are working. You’ll get session alerts at your set times.', 'checkin', 'Morning');
  return { ok: true, message: 'Test notification sent. Check your notification shade.' };
}

export function clearReminders() {
  while (handles.length) {
    const h = handles.pop();
    if (h) clearTimeout(h);
  }
  clearUpdateNags();
}

export function clearUpdateNags() {
  if (nagInterval) {
    clearInterval(nagInterval);
    nagInterval = null;
  }
}

/**
 * Every 5 minutes, remind the user to update task progress for the current
 * session until pending tasks are done or the session is marked complete.
 */
export function scheduleUpdateNags(
  settings: UserSettings,
  getContext: () => UpdateNagContext | null,
  onFire?: (payload: ReminderFirePayload) => void
) {
  clearUpdateNags();
  if (!settings.notificationsEnabled) return;
  if (typeof window !== 'undefined' && notificationsSupported() && Notification.permission !== 'granted') {
    return;
  }

  const tick = () => {
    const ctx = getContext();
    if (!ctx || ctx.sessionCompleted || ctx.pendingCount <= 0) return;
    void sendReminder(
      'PTA — update your progress',
      `${ctx.sessionName}: ${ctx.pendingCount} open task(s). What have you done? Tap to check in.`,
      'checkin',
      ctx.sessionName
    );
    onFire?.({
      label: `${ctx.sessionName} update nag`,
      action: 'checkin',
      sessionHint: ctx.sessionName,
    });
  };

  nagInterval = setInterval(tick, NAG_MS);
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
  opts?: {
    lastActiveDate?: string;
    getUpdateNag?: () => UpdateNagContext | null;
  }
) {
  clearReminders();
  if (!settings.notificationsEnabled) return;
  if (typeof window !== 'undefined' && notificationsSupported() && Notification.permission !== 'granted') {
    return;
  }

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
      void sendReminder('PTA Reminder', `${label} — tap to open.`, action, sessionHint);
      onFire?.({ label, action, sessionHint });
      scheduleReminders(settings, onFire, opts);
    }, Math.min(delay, 2147483647));
    handles.push(handle);
  });

  if (settings.weeklyReminder) {
    const delay = msUntilWeekly(settings.weeklyReminder);
    const handle = setTimeout(() => {
      void sendReminder('PTA Weekly Review', 'Review your week and generate your weekly report.', 'weekly');
      onFire?.({ label: 'Weekly review', action: 'weekly' });
      scheduleReminders(settings, onFire, opts);
    }, Math.min(delay, 2147483647));
    handles.push(handle);
  }

  if (opts?.lastActiveDate) {
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    if (opts.lastActiveDate < localToday) {
      const delay = msUntil('10:00');
      const handle = setTimeout(() => {
        void sendReminder('PTA Misses You', 'You have pending plans — open PTA and check in.', 'inactivity');
        onFire?.({ label: 'Inactivity', action: 'inactivity' });
      }, Math.min(delay, 2147483647));
      handles.push(handle);
    }
  }

  if (opts?.getUpdateNag) {
    scheduleUpdateNags(settings, opts.getUpdateNag, onFire);
  }
}
