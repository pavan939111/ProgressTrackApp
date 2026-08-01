'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Achievement,
  DailyPlan,
  DailyReport,
  Priority,
  Session,
  SessionName,
  Task,
  UserProfile,
  UserSettings,
  WeeklyGoal,
  WeeklyReport,
} from '@/types';
import { useAuth } from '@/context/AuthContext';
import { defaultSettings, ptaStore } from '@/lib/ptaStore';
import { requestNotificationPermission, scheduleReminders, getNextReminder, sendTestNotification } from '@/lib/reminders';
import { initWebPush, sendServerPush } from '@/lib/fcmClient';
import { recordTodaySnapshot } from '@/lib/analytics';
import { levelFromXp } from '@/lib/gamification';

interface AppContextType {
  user: UserProfile;
  settings: UserSettings;
  weeklyGoals: WeeklyGoal[];
  todayPlan: DailyPlan;
  sessions: Session[];
  tasks: Task[];
  dailyReports: DailyReport[];
  weeklyReports: WeeklyReport[];
  achievements: Achievement[];
  activeSession: Session | null;
  activeCheckInSession: Session | null;
  xpGain: { amount: number; reason: string } | null;
  calendarDays: { date: string; completion: number; completed: boolean; goal: string }[];
  nextReminder: { label: string; time: string; isTomorrow: boolean } | null;
  refresh: () => void;
  openCheckIn: (session: Session) => void;
  closeCheckIn: () => void;
  openPlanner: () => void;
  openSettings: () => void;
  triggerConfetti: () => void;
  saveSettings: (updates: Partial<UserSettings>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  createGoal: (input: { title: string; description?: string; priority?: Priority }) => void;
  updateGoal: (goalId: string, updates: Partial<WeeklyGoal>) => void;
  deleteGoal: (goalId: string) => void;
  archiveGoal: (goalId: string) => void;
  saveTomorrowPlan: (input: {
    goal: string;
    notes?: string;
    tasks: {
      title: string;
      description?: string;
      session: SessionName;
      priority: Priority;
      weeklyGoalId?: string;
    }[];
    asDraft?: boolean;
  }) => void;
  deleteTomorrowPlan: () => void;
  completeTask: (taskId: string, notes?: string, blockers?: string, confidence?: number) => void;
  skipTask: (taskId: string, reason: string) => void;
  moveTask: (taskId: string, toDate: string) => void;
  deleteTask: (taskId: string) => void;
  startTask: (taskId: string) => void;
  completeSession: (
    sessionId: string,
    meta?: { notes?: string; blockers?: string; confidence?: number }
  ) => void;
  generateDailyReport: () => DailyReport;
  generateWeeklyReport: () => WeeklyReport;
  enableNotifications: () => Promise<{ ok: boolean; message: string }>;
  sendTestReminder: () => Promise<{ ok: boolean; message: string }>;
  addCustomSession: (def: { name: string; start: string; end: string; reminder: string }) => void;
  removeCustomSession: (name: string) => void;
}

const emptyPlan = (uid: string): DailyPlan => ({
  planId: 'empty',
  uid,
  date: new Date().toISOString().split('T')[0],
  title: 'No plan yet',
  goal: 'Open Plan Tomorrow to create your day',
  overallPriority: 'Medium',
  completionPercentage: 0,
  completedTasks: 0,
  pendingTasks: 0,
  status: 'In Progress',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { user: authUser, refreshProfile } = useAuth();
  const uid = authUser?.uid || 'demo-user-123';

  const [user, setUser] = useState<UserProfile>(
    authUser || {
      uid,
      email: 'demo.user@example.com',
      fullName: 'Demo User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timezone: 'UTC',
      notificationPermission: false,
      pwaInstalled: false,
      streak: 0,
      totalXP: 0,
      level: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      onboardingCompleted: false,
    }
  );
  const [settings, setSettings] = useState<UserSettings>(defaultSettings(uid));
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [todayPlan, setTodayPlan] = useState<DailyPlan>(emptyPlan(uid));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [calendarDays, setCalendarDays] = useState<
    { date: string; completion: number; completed: boolean; goal: string }[]
  >([]);
  const [activeCheckInSession, setActiveCheckInSession] = useState<Session | null>(null);
  const [xpGain, setXpGain] = useState<{ amount: number; reason: string } | null>(null);

  const refresh = useCallback(() => {
    if (!authUser) return;
    ptaStore.ensureSeeded(authUser.uid, authUser.email, authUser.fullName);
    const profile = ptaStore.getProfile(authUser.uid) || authUser;
    setUser(profile);
    setSettings(ptaStore.getSettings(authUser.uid));
    setWeeklyGoals(ptaStore.listGoals(authUser.uid));
    const bundle = ptaStore.getTodayBundle(authUser.uid);
    setTodayPlan(bundle.plan);
    setSessions(bundle.sessions);
    setTasks(bundle.tasks);
    setDailyReports(ptaStore.listDailyReports(authUser.uid));
    setWeeklyReports(ptaStore.listWeeklyReports(authUser.uid));
    setAchievements(ptaStore.listAchievements(authUser.uid));
    setCalendarDays(ptaStore.calendarDays(authUser.uid, 35));
    recordTodaySnapshot(bundle.plan, profile);
    ptaStore.maybeAutoDailyReport(authUser.uid);
    ptaStore.maybeAutoWeeklyReport(authUser.uid);
    refreshProfile();
  }, [authUser, refreshProfile]);

  useEffect(() => {
    if (authUser) {
      refresh();
      void ptaStore.hydrateFromBackend().then((r) => {
        if (r.hydrated) refresh();
      });
    }
  }, [authUser, refresh]);

  useEffect(() => {
    if (!authUser) return;

    const getUpdateNag = () => {
      const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
      const windows: { name: string; start: string; end: string }[] = [
        { name: 'Morning', start: settings.morningReminder || '08:00', end: '11:59' },
        { name: 'Before Lunch', start: settings.beforeLunchReminder || '12:00', end: '13:59' },
        { name: 'Afternoon', start: settings.afternoonReminder || '14:00', end: '16:59' },
        { name: 'Evening', start: settings.eveningReminder || '17:00', end: '19:59' },
        { name: 'Night', start: settings.nightReminder || '20:00', end: '22:59' },
      ];
      const toMins = (hhmm: string) => {
        const [h, m] = hhmm.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };
      const current =
        windows.find((w) => nowMins >= toMins(w.start) && nowMins <= toMins(w.end)) ||
        sessions.find((s) => s.status === 'Active') ||
        null;
      if (!current) return null;
      const name = 'name' in current ? current.name : (current as { name: string }).name;
      const ses = sessions.find((s) => s.name === name);
      if (!ses) return null;
      const pending = tasks.filter(
        (t) =>
          t.sessionId === ses.sessionId && (t.status === 'Pending' || t.status === 'In Progress')
      ).length;
      return {
        sessionName: String(name),
        pendingCount: pending,
        sessionCompleted: ses.status === 'Completed',
      };
    };

    scheduleReminders(
      settings,
      (payload) => {
        void sendServerPush(authUser.uid, 'PTA Reminder', `${payload.label} — open PTA and check in.`);
        if (payload.action === 'checkin' && payload.sessionHint) {
          const ses = sessions.find((s) => s.name === payload.sessionHint);
          if (ses) setActiveCheckInSession(ses);
        } else if (payload.action === 'planner') {
          window.dispatchEvent(new CustomEvent('pta-navigate', { detail: { tab: 'planner' } }));
        }
      },
      { lastActiveDate: user.lastActiveDate, getUpdateNag }
    );
    return () => scheduleReminders({ ...settings, notificationsEnabled: false });
  }, [settings, authUser, sessions, tasks, user.lastActiveDate]);

  // Deep-link from notification click / URL ?action=
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const applyAction = (action?: string | null, sessionHint?: string | null) => {
      if (action === 'checkin') {
        const ses =
          (sessionHint && sessions.find((s) => s.name === sessionHint)) ||
          sessions.find((s) => s.status === 'Active') ||
          sessions[0];
        if (ses) setActiveCheckInSession(ses);
      } else if (action === 'planner') {
        window.dispatchEvent(new CustomEvent('pta-navigate', { detail: { tab: 'planner' } }));
      } else if (action === 'weekly') {
        ptaStore.generateWeeklyReport(uid);
        refresh();
      }
    };
    const params = new URLSearchParams(window.location.search);
    if (params.get('action')) {
      applyAction(params.get('action'), params.get('session'));
      window.history.replaceState({}, '', window.location.pathname);
    }
    const onReminder = (e: Event) => {
      const detail = (e as CustomEvent).detail as { action?: string; sessionHint?: string };
      applyAction(detail?.action, detail?.sessionHint);
    };
    window.addEventListener('pta-reminder-action', onReminder);
    return () => window.removeEventListener('pta-reminder-action', onReminder);
  }, [sessions, uid, refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => {
      void ptaStore.flushPendingSync();
    };
    window.addEventListener('online', onOnline);
    if (navigator.onLine) onOnline();
    return () => window.removeEventListener('online', onOnline);
  }, []);

  const triggerConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const showXp = (amount: number, reason: string) => {
    setXpGain({ amount, reason });
    setTimeout(() => setXpGain(null), 2800);
  };

  const activeSession = useMemo(
    () => sessions.find((s) => s.status === 'Active') || sessions[0] || null,
    [sessions]
  );

  const value: AppContextType = {
    user,
    settings,
    weeklyGoals,
    todayPlan,
    sessions,
    tasks,
    dailyReports,
    weeklyReports,
    achievements,
    activeSession,
    activeCheckInSession,
    xpGain,
    calendarDays,
    nextReminder: getNextReminder(settings),
    refresh,
    openCheckIn: (s) => setActiveCheckInSession(s),
    closeCheckIn: () => setActiveCheckInSession(null),
    openPlanner: () => {
      window.dispatchEvent(new CustomEvent('pta-navigate', { detail: { tab: 'planner' } }));
    },
    openSettings: () => {
      window.dispatchEvent(new CustomEvent('pta-navigate', { detail: { tab: 'settings' } }));
    },
    triggerConfetti,
    saveSettings: (updates) => {
      const next = ptaStore.saveSettings({ ...settings, ...updates, uid });
      setSettings(next);
      scheduleReminders(next, undefined, { lastActiveDate: user.lastActiveDate });
    },
    updateProfile: (updates) => {
      const next = ptaStore.saveProfile({ ...user, ...updates, updatedAt: new Date().toISOString() });
      setUser(next);
      refreshProfile();
    },
    createGoal: (input) => {
      ptaStore.createGoal(uid, input);
      const profile = awardLocal(100, 'New weekly goal');
      setUser(profile);
      triggerConfetti();
      refresh();
    },
    updateGoal: (goalId, updates) => {
      ptaStore.updateGoal(uid, goalId, updates);
      refresh();
    },
    deleteGoal: (goalId) => {
      ptaStore.deleteGoal(uid, goalId);
      refresh();
    },
    archiveGoal: (goalId) => {
      ptaStore.archiveGoal(uid, goalId);
      refresh();
    },
    saveTomorrowPlan: (input) => {
      const result = ptaStore.saveTomorrowPlan(uid, input);
      setUser(result.profile);
      if (result.xpEarned) showXp(result.xpEarned, input.asDraft ? 'Draft saved' : 'Night planning saved');
      if (!input.asDraft) triggerConfetti();
      refresh();
    },
    deleteTomorrowPlan: () => {
      ptaStore.deletePlan(uid, ptaStore.tomorrowDate());
      refresh();
    },
    completeTask: (taskId, notes, blockers, confidence) => {
      const result = ptaStore.completeTask(uid, taskId, { notes, blockers, confidence });
      if (!result) return;
      setUser(result.profile);
      showXp(result.xpEarned, `Completed: ${result.task.title}`);
      triggerConfetti();
      refresh();
    },
    skipTask: (taskId, reason) => {
      ptaStore.skipTask(uid, taskId, reason);
      refresh();
    },
    moveTask: (taskId, toDate) => {
      ptaStore.moveTask(uid, taskId, toDate);
      refresh();
    },
    deleteTask: (taskId) => {
      ptaStore.deleteTask(uid, taskId);
      refresh();
    },
    startTask: (taskId) => {
      ptaStore.startTask(uid, taskId);
      refresh();
    },
    completeSession: (sessionId, meta) => {
      const result = ptaStore.completeSession(uid, sessionId, meta);
      if (result) {
        setUser(result.profile);
        if (result.xpEarned) showXp(result.xpEarned, `${result.session.name} complete`);
        if (result.xpEarned) triggerConfetti();
      }
      setActiveCheckInSession(null);
      refresh();
    },
    generateDailyReport: () => {
      const report = ptaStore.generateDailyReport(uid);
      refresh();
      return report;
    },
    generateWeeklyReport: () => {
      const report = ptaStore.generateWeeklyReport(uid);
      refresh();
      return report;
    },
    enableNotifications: async () => {
      const perm = await requestNotificationPermission();
      if (!perm.granted) {
        const nextOff = ptaStore.saveSettings({
          ...settings,
          notificationsEnabled: false,
          updatedAt: new Date().toISOString(),
        });
        setSettings(nextOff);
        return { ok: false, message: perm.message };
      }

      // Ensure SW is ready before mobile notifications (Android requires SW showNotification)
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          await navigator.serviceWorker.ready;
        } catch {
          /* continue with local Notification API */
        }
      }

      let fcmMsg = '';
      if (authUser) {
        const fcm = await initWebPush(authUser.uid);
        if (!fcm.ok) fcmMsg = fcm.message ? ` Push: ${fcm.message}` : '';
      }

      const next = ptaStore.saveSettings({
        ...settings,
        notificationsEnabled: true,
        updatedAt: new Date().toISOString(),
      });
      setSettings(next);
      const profile = ptaStore.saveProfile({
        ...user,
        notificationPermission: true,
        updatedAt: new Date().toISOString(),
      });
      setUser(profile);
      refreshProfile();

      scheduleReminders(
        next,
        (payload) => {
          if (authUser) {
            void sendServerPush(authUser.uid, 'PTA Reminder', `${payload.label} — open PTA and check in.`);
          }
        },
        { lastActiveDate: user.lastActiveDate }
      );

      await sendTestNotification().catch(() => undefined);

      return {
        ok: true,
        message: `Reminders & notifications enabled.${fcmMsg}`,
      };
    },
    sendTestReminder: async () => sendTestNotification(),
    addCustomSession: (def) => {
      ptaStore.addCustomSession(uid, def);
      refresh();
    },
    removeCustomSession: (name) => {
      ptaStore.removeCustomSession(uid, name);
      refresh();
    },
  };

  function awardLocal(amount: number, reason: string) {
    const totalXP = user.totalXP + amount;
    const profile = ptaStore.saveProfile({
      ...user,
      totalXP,
      level: levelFromXp(totalXP),
      updatedAt: new Date().toISOString(),
    });
    showXp(amount, reason);
    return profile;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
