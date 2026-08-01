import { getAdminFirestore } from '../auth/adminApp';
import { fcmTokenStore } from '../push/fcmTokenStore';
import { sendPushToUser } from '../push/fcmSend';

type UserSettingsDoc = {
  uid?: string;
  notificationsEnabled?: boolean;
  timezone?: string;
  morningReminder?: string;
  beforeLunchReminder?: string;
  afternoonReminder?: string;
  eveningReminder?: string;
  nightReminder?: string;
  planningReminder?: string;
  weeklyReminder?: string;
  customSessions?: Array<{ name: string; start: string; end: string; reminder: string }>;
};

type PlanDoc = {
  uid?: string;
  planId?: string;
  date?: string;
};

type SessionDoc = {
  uid?: string;
  sessionId?: string;
  dailyPlanId?: string;
  name?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
};

type TaskDoc = {
  uid?: string;
  dailyPlanId?: string;
  sessionId?: string;
  status?: string;
};

export type DueAlarm = {
  uid: string;
  slotId: string;
  title: string;
  body: string;
  action: string;
  sessionHint?: string;
};

function frontendBase() {
  return (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
}

/** Local calendar parts in a timezone. */
export function localClock(timeZone: string, now = new Date()) {
  const tz = timeZone || 'UTC';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  let hour = get('hour');
  if (hour === '24') hour = '00';
  const minute = get('minute');
  const month = get('month');
  const day = get('day');
  const year = get('year');
  const weekday = get('weekday');

  return {
    timeZone: tz,
    weekday,
    dateKey: `${year}-${month}-${day}`,
    hhmm: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
  };
}

function parseWeekly(weeklyReminder: string): { day: string; time: string } | null {
  if (!weeklyReminder?.trim()) return null;
  const parts = weeklyReminder.trim().split(/\s+/);
  if (parts.length >= 2) return { day: parts[0], time: parts[1] };
  if (parts[0]?.includes(':')) return { day: 'Sunday', time: parts[0] };
  return null;
}

function slotsFromSettings(settings: UserSettingsDoc): Array<{
  slotId: string;
  time: string;
  title: string;
  body: string;
  action: string;
  sessionHint?: string;
}> {
  const base = [
    {
      slotId: 'morning',
      time: settings.morningReminder || '',
      title: 'PTA — Morning',
      body: "Today's goal is ready. Start your Morning session.",
      action: 'checkin',
      sessionHint: 'Morning',
    },
    {
      slotId: 'beforeLunch',
      time: settings.beforeLunchReminder || '',
      title: 'PTA — Before Lunch',
      body: 'Session check: update your Before Lunch progress.',
      action: 'checkin',
      sessionHint: 'Before Lunch',
    },
    {
      slotId: 'afternoon',
      time: settings.afternoonReminder || '',
      title: 'PTA — Afternoon',
      body: 'Session check: update your Afternoon progress.',
      action: 'checkin',
      sessionHint: 'Afternoon',
    },
    {
      slotId: 'evening',
      time: settings.eveningReminder || '',
      title: 'PTA — Evening',
      body: 'Session check: update your Evening progress.',
      action: 'checkin',
      sessionHint: 'Evening',
    },
    {
      slotId: 'night',
      time: settings.nightReminder || '',
      title: 'PTA — Night',
      body: 'Session check: update your Night progress.',
      action: 'checkin',
      sessionHint: 'Night',
    },
    {
      slotId: 'planning',
      time: settings.planningReminder || '',
      title: 'PTA — Plan tomorrow',
      body: 'Take a few minutes to plan tomorrow.',
      action: 'planner',
    },
  ];

  for (const s of settings.customSessions || []) {
    if (!s?.name || !s.reminder) continue;
    base.push({
      slotId: `custom_${s.name}`,
      time: s.reminder,
      title: `PTA — ${s.name}`,
      body: `Session check: update your ${s.name} progress.`,
      action: 'checkin',
      sessionHint: s.name,
    });
  }

  return base.filter((s) => /^\d{1,2}:\d{2}$/.test(s.time));
}

async function alreadyDelivered(uid: string, dateKey: string, slotId: string): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;
  const id = `${uid}_${dateKey}_${slotId}`.replace(/[^\w.-]/g, '_');
  const snap = await db.collection('reminderDeliveries').doc(id).get();
  return snap.exists;
}

async function markDelivered(uid: string, dateKey: string, slotId: string): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;
  const id = `${uid}_${dateKey}_${slotId}`.replace(/[^\w.-]/g, '_');
  await db.collection('reminderDeliveries').doc(id).set(
    {
      uid,
      dateKey,
      slotId,
      deliveredAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

function inSessionWindow(nowHHmm: string, start?: string, end?: string): boolean {
  if (!start || !end) return false;
  // Simple lexical compare works for HH:MM same-day windows
  if (start <= end) return nowHHmm >= start && nowHHmm <= end;
  // overnight
  return nowHHmm >= start || nowHHmm <= end;
}

async function pendingNagForUser(
  uid: string,
  dateKey: string,
  hhmm: string,
  _settings: UserSettingsDoc
): Promise<DueAlarm | null> {
  const db = getAdminFirestore();
  if (!db) return null;

  const plansSnap = await db.collection('dailyPlans').where('uid', '==', uid).get();
  const plan = plansSnap.docs
    .map((d) => d.data() as PlanDoc)
    .find((p) => p.date === dateKey && p.planId);
  if (!plan?.planId) return null;

  const [sessionsSnap, tasksSnap] = await Promise.all([
    db.collection('sessions').where('uid', '==', uid).get(),
    db.collection('tasks').where('uid', '==', uid).get(),
  ]);

  const sessions = sessionsSnap.docs
    .map((d) => d.data() as SessionDoc)
    .filter((s) => s.dailyPlanId === plan.planId);
  const tasks = tasksSnap.docs
    .map((d) => d.data() as TaskDoc)
    .filter((t) => t.dailyPlanId === plan.planId);

  const active =
    sessions.find((s) => s.status === 'Active') ||
    sessions.find((s) => inSessionWindow(hhmm, s.startTime, s.endTime) && s.status !== 'Completed');

  if (!active || active.status === 'Completed') return null;

  const pending = tasks.filter(
    (t) =>
      t.sessionId === active.sessionId && (t.status === 'Pending' || t.status === 'In Progress')
  ).length;

  if (pending <= 0) return null;

  // Fire nag every 5 minutes (minute % 5 === 0), distinct from the on-the-hour session alarm
  const minute = Number(hhmm.split(':')[1] || 0);
  if (minute % 5 !== 0) return null;

  const slotId = `nag_${active.name || 'session'}_${hhmm}`;
  return {
    uid,
    slotId,
    title: 'PTA — update your progress',
    body: `${active.name || 'Session'}: ${pending} open task(s). Tap to check in.`,
    action: 'checkin',
    sessionHint: active.name,
  };
}

export async function collectDueAlarms(now = new Date()): Promise<DueAlarm[]> {
  const db = getAdminFirestore();
  if (!db) return [];

  const uids = await fcmTokenStore.listAllUids();
  const due: DueAlarm[] = [];

  for (const uid of uids) {
    const settingsSnap = await db.collection('userSettings').doc(uid).get();
    if (!settingsSnap.exists) continue;
    const settings = settingsSnap.data() as UserSettingsDoc;
    if (!settings.notificationsEnabled) continue;

    const clock = localClock(settings.timezone || 'UTC', now);

    for (const slot of slotsFromSettings(settings)) {
      if (slot.time !== clock.hhmm) continue;
      if (await alreadyDelivered(uid, clock.dateKey, slot.slotId)) continue;
      due.push({
        uid,
        slotId: slot.slotId,
        title: slot.title,
        body: slot.body,
        action: slot.action,
        sessionHint: slot.sessionHint,
      });
    }

    const weekly = parseWeekly(settings.weeklyReminder || '');
    if (weekly && weekly.time === clock.hhmm) {
      const dayMatch = weekly.day.toLowerCase() === clock.weekday.toLowerCase();
      if (dayMatch && !(await alreadyDelivered(uid, clock.dateKey, 'weekly'))) {
        due.push({
          uid,
          slotId: 'weekly',
          title: 'PTA — Weekly review',
          body: 'Review your week and generate your weekly report.',
          action: 'weekly',
        });
      }
    }

    const nag = await pendingNagForUser(uid, clock.dateKey, clock.hhmm, settings);
    if (nag && !(await alreadyDelivered(uid, clock.dateKey, nag.slotId))) {
      due.push(nag);
    }
  }

  return due;
}

export async function runReminderAlarms(now = new Date()) {
  const due = await collectDueAlarms(now);
  const results: Array<{ uid: string; slotId: string; sent: boolean; message?: string }> = [];
  const base = frontendBase();
  const db = getAdminFirestore();

  for (const alarm of due) {
    const settingsSnap = await db?.collection('userSettings').doc(alarm.uid).get();
    const tz = (settingsSnap?.data() as UserSettingsDoc | undefined)?.timezone || 'UTC';
    const dateKey = localClock(tz, now).dateKey;

    const link = `${base}/?action=${encodeURIComponent(alarm.action)}${
      alarm.sessionHint ? `&session=${encodeURIComponent(alarm.sessionHint)}` : ''
    }`;

    const push = await sendPushToUser(alarm.uid, {
      title: alarm.title,
      body: alarm.body,
      link,
      data: {
        action: alarm.action,
        sessionHint: alarm.sessionHint || '',
        link,
        type: alarm.slotId.startsWith('nag_') ? 'nag' : 'alarm',
      },
    });

    if (push.success) {
      await markDelivered(alarm.uid, dateKey, alarm.slotId);
    }

    results.push({
      uid: alarm.uid,
      slotId: alarm.slotId,
      sent: !!push.success,
      message: push.message,
    });
  }

  return { checkedAt: now.toISOString(), due: due.length, results };
}
