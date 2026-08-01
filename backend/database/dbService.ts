import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import {
  UserProfile,
  UserSettings,
  WeeklyGoal,
  DailyPlan,
  Session,
  Task,
  ProgressLog,
  DailyReport,
  WeeklyReport,
  Achievement,
  XPHistory,
  StreakHistory,
} from '@/types';

const STORAGE_KEYS = {
  USER: 'pta_user_profile',
  SETTINGS: 'pta_user_settings',
  WEEKLY_GOALS: 'pta_weekly_goals',
  DAILY_PLANS: 'pta_daily_plans',
  SESSIONS: 'pta_sessions',
  TASKS: 'pta_tasks',
  PROGRESS_LOGS: 'pta_progress_logs',
  DAILY_REPORTS: 'pta_daily_reports',
  WEEKLY_REPORTS: 'pta_weekly_reports',
  ACHIEVEMENTS: 'pta_achievements',
  XP_HISTORY: 'pta_xp_history',
};

/** Narrow Firestore | null for callbacks (forEach) where TS loses the guard. */
function firestoreDb(): Firestore | null {
  return db;
}

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
}

export const initialUser: UserProfile = {
  uid: 'demo-user-123',
  email: 'demo.user@example.com',
  fullName: 'Demo User',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notificationPermission: true,
  pwaInstalled: false,
  streak: 5,
  totalXP: 1450,
  level: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  onboardingCompleted: true,
};

export const initialSettings: UserSettings = {
  uid: 'demo-user-123',
  morningReminder: '08:00',
  beforeLunchReminder: '12:00',
  afternoonReminder: '15:00',
  eveningReminder: '18:00',
  nightReminder: '21:00',
  planningReminder: '22:00',
  weeklyReminder: 'Sunday 20:00',
  notificationsEnabled: true,
  theme: 'dark',
  workDays: [1, 2, 3, 4, 5, 6],
  syncEnabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const defaultSessions: Omit<Session, 'sessionId' | 'dailyPlanId'>[] = [
  {
    uid: 'demo-user-123',
    name: 'Morning',
    order: 1,
    startTime: '08:00',
    endTime: '11:59',
    reminderTime: '08:00',
    status: 'Active',
    completionPercentage: 0,
    taskCount: 2,
    completedTaskCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'demo-user-123',
    name: 'Before Lunch',
    order: 2,
    startTime: '12:00',
    endTime: '13:59',
    reminderTime: '12:00',
    status: 'Pending',
    completionPercentage: 0,
    taskCount: 1,
    completedTaskCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'demo-user-123',
    name: 'Afternoon',
    order: 3,
    startTime: '14:00',
    endTime: '17:59',
    reminderTime: '14:00',
    status: 'Pending',
    completionPercentage: 0,
    taskCount: 2,
    completedTaskCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'demo-user-123',
    name: 'Evening',
    order: 4,
    startTime: '18:00',
    endTime: '20:59',
    reminderTime: '18:00',
    status: 'Pending',
    completionPercentage: 0,
    taskCount: 1,
    completedTaskCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'demo-user-123',
    name: 'Night',
    order: 5,
    startTime: '21:00',
    endTime: '23:59',
    reminderTime: '21:00',
    status: 'Pending',
    completionPercentage: 0,
    taskCount: 1,
    completedTaskCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const dbService = {
  getUserProfile(): UserProfile {
    return getLocal(STORAGE_KEYS.USER, initialUser);
  },

  async syncUserProfileToFirestore(user: UserProfile) {
    try {
      if (db) {
        await setDoc(doc(db, 'users', user.uid), user, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore user sync warning:', e);
    }
  },

  updateUserProfile(updates: Partial<UserProfile>): UserProfile {
    const current = this.getUserProfile();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    setLocal(STORAGE_KEYS.USER, updated);
    this.syncUserProfileToFirestore(updated);
    return updated;
  },

  getUserSettings(): UserSettings {
    return getLocal(STORAGE_KEYS.SETTINGS, initialSettings);
  },

  updateUserSettings(updates: Partial<UserSettings>): UserSettings {
    const current = this.getUserSettings();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    setLocal(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  getWeeklyGoals(): WeeklyGoal[] {
    const fallback: WeeklyGoal[] = [
      {
        goalId: 'wg-1',
        uid: 'demo-user-123',
        title: 'Ship PTA MVP & Core PWA Modules',
        description: 'Complete full execution engine, notifications, gamification & Firestore sync',
        priority: 'High',
        weekStart: '2026-07-27',
        weekEnd: '2026-08-02',
        status: 'Active',
        progress: 65,
        completedTasks: 8,
        totalTasks: 12,
        achievements: ['PWA Bootstrap', 'Firestore & Cloudinary Sync Active'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    return getLocal(STORAGE_KEYS.WEEKLY_GOALS, fallback);
  },

  saveWeeklyGoal(goal: Omit<WeeklyGoal, 'goalId' | 'createdAt' | 'updatedAt'> & { goalId?: string }): WeeklyGoal {
    const goals = this.getWeeklyGoals();
    const now = new Date().toISOString();
    let saved: WeeklyGoal;
    if (goal.goalId) {
      const idx = goals.findIndex((g) => g.goalId === goal.goalId);
      saved = { ...goals[idx], ...goal, updatedAt: now };
      if (idx >= 0) goals[idx] = saved;
    } else {
      saved = {
        ...goal,
        goalId: `wg-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      goals.unshift(saved);
    }
    setLocal(STORAGE_KEYS.WEEKLY_GOALS, goals);
    try {
      if (db) {
        setDoc(doc(db, 'weeklyGoals', saved.goalId), saved, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore weekly goal sync warning:', e);
    }
    return saved;
  },

  recalculateWeeklyGoal(weeklyGoalId: string) {
    if (!weeklyGoalId) return;
    const allTasks = getLocal<Task[]>(STORAGE_KEYS.TASKS, []);
    const linkedTasks = allTasks.filter((t) => t.weeklyGoalId === weeklyGoalId);
    if (linkedTasks.length === 0) return;

    const completedCount = linkedTasks.filter((t) => t.status === 'Completed').length;
    const totalCount = linkedTasks.length;
    const progress = Math.round((completedCount / totalCount) * 100);
    const isCompleted = progress === 100;

    const goals = this.getWeeklyGoals();
    const idx = goals.findIndex((g) => g.goalId === weeklyGoalId);
    if (idx >= 0) {
      const updatedGoal: WeeklyGoal = {
        ...goals[idx],
        completedTasks: completedCount,
        totalTasks: totalCount,
        progress,
        status: isCompleted ? 'Completed' : 'Active',
        updatedAt: new Date().toISOString(),
      };
      goals[idx] = updatedGoal;
      setLocal(STORAGE_KEYS.WEEKLY_GOALS, goals);

      if (isCompleted && goals[idx].status !== 'Completed') {
        this.addXP(200, 'weeklyBonus', weeklyGoalId, `Achieved Weekly Goal: ${updatedGoal.title}`);
      }

      try {
        if (db) {
          setDoc(doc(db, 'weeklyGoals', weeklyGoalId), updatedGoal, { merge: true });
        }
      } catch (e) {
        console.warn('Firestore weekly goal recalculation sync warning:', e);
      }
    }
  },

  getTodayPlan(): { plan: DailyPlan; sessions: Session[]; tasks: Task[] } {
    const date = getTodayString();
    const plans = getLocal<DailyPlan[]>(STORAGE_KEYS.DAILY_PLANS, []);
    let todayPlan = plans.find((p) => p.date === date);

    if (!todayPlan) {
      todayPlan = {
        planId: `dp-${date}`,
        uid: 'demo-user-123',
        date,
        title: 'High Focus Core Application Execution',
        goal: 'Complete session check-ins, verify Firestore & Cloudinary sync',
        notes: 'Stay accountable with session reminders and review daily progress.',
        overallPriority: 'High',
        completionPercentage: 35,
        completedTasks: 2,
        pendingTasks: 4,
        weeklyGoalIds: ['wg-1'],
        status: 'In Progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      plans.unshift(todayPlan);
      setLocal(STORAGE_KEYS.DAILY_PLANS, plans);
    }

    const allSessions = getLocal<Session[]>(STORAGE_KEYS.SESSIONS, []);
    let todaySessions = allSessions.filter((s) => s.dailyPlanId === todayPlan!.planId);

    if (todaySessions.length === 0) {
      todaySessions = defaultSessions.map((ds) => ({
        ...ds,
        sessionId: `sess-${todayPlan!.planId}-${ds.order}`,
        dailyPlanId: todayPlan!.planId,
      }));
      setLocal(STORAGE_KEYS.SESSIONS, [...allSessions, ...todaySessions]);
    }

    const allTasks = getLocal<Task[]>(STORAGE_KEYS.TASKS, []);
    let todayTasks = allTasks.filter((t) => t.dailyPlanId === todayPlan!.planId);

    if (todayTasks.length === 0) {
      const morningSess = todaySessions.find((s) => s.name === 'Morning')!;
      const lunchSess = todaySessions.find((s) => s.name === 'Before Lunch')!;
      const afternoonSess = todaySessions.find((s) => s.name === 'Afternoon')!;
      const eveningSess = todaySessions.find((s) => s.name === 'Evening')!;
      const nightSess = todaySessions.find((s) => s.name === 'Night')!;

      todayTasks = [
        {
          taskId: 't-1',
          uid: 'demo-user-123',
          dailyPlanId: todayPlan.planId,
          sessionId: morningSess.sessionId,
          session: 'Morning',
          weeklyGoalId: 'wg-1',
          title: 'Connect Live Firebase & Firestore Database',
          description: 'Verify 13 flat collections and SDK initialization',
          priority: 'High',
          estimatedMinutes: 45,
          expectedOutcome: 'Firestore connected',
          status: 'Completed',
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          taskId: 't-2',
          uid: 'demo-user-123',
          dailyPlanId: todayPlan.planId,
          sessionId: morningSess.sessionId,
          session: 'Morning',
          weeklyGoalId: 'wg-1',
          title: 'Integrate Cloudinary Image Transformations',
          description: 'Setup auto-format, quality, and square crop URLs',
          priority: 'High',
          estimatedMinutes: 60,
          expectedOutcome: 'Cloudinary active',
          status: 'Completed',
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          taskId: 't-3',
          uid: 'demo-user-123',
          dailyPlanId: todayPlan.planId,
          sessionId: lunchSess.sessionId,
          session: 'Before Lunch',
          weeklyGoalId: 'wg-1',
          title: 'Execute Session Progress Check-Ins',
          description: 'Log task completion, notes, and focus ratings',
          priority: 'High',
          estimatedMinutes: 50,
          expectedOutcome: 'Session check-ins logged',
          status: 'In Progress',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          taskId: 't-4',
          uid: 'demo-user-123',
          dailyPlanId: todayPlan.planId,
          sessionId: afternoonSess.sessionId,
          session: 'Afternoon',
          weeklyGoalId: 'wg-1',
          title: 'Build Gamification XP & Leveling Ticker',
          description: 'Award XP popup animations and level unlocks',
          priority: 'Medium',
          estimatedMinutes: 40,
          expectedOutcome: 'Gamification ticker operating',
          status: 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          taskId: 't-5',
          uid: 'demo-user-123',
          dailyPlanId: todayPlan.planId,
          sessionId: eveningSess.sessionId,
          session: 'Evening',
          weeklyGoalId: 'wg-1',
          title: 'Generate Automated Daily & Weekly Reports',
          description: 'Compute progress snapshots and consistency metrics',
          priority: 'High',
          estimatedMinutes: 45,
          expectedOutcome: 'Reports snapshot stored',
          status: 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          taskId: 't-6',
          uid: 'demo-user-123',
          dailyPlanId: todayPlan.planId,
          sessionId: nightSess.sessionId,
          session: 'Night',
          weeklyGoalId: 'wg-1',
          title: 'Complete Tomorrow Night Planning Flow',
          description: 'Review achievements and plan tomorrow by session',
          priority: 'Medium',
          estimatedMinutes: 30,
          expectedOutcome: "Tomorrow's execution plan saved",
          status: 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setLocal(STORAGE_KEYS.TASKS, [...allTasks, ...todayTasks]);
    }

    return { plan: todayPlan, sessions: todaySessions, tasks: todayTasks };
  },

  updateTaskStatus(
    taskId: string,
    status: Task['status'],
    logData?: { notes?: string; blockers?: string; confidence?: number }
  ): { task: Task; xpEarned: number } {
    const allTasks = getLocal<Task[]>(STORAGE_KEYS.TASKS, []);
    const taskIndex = allTasks.findIndex((t) => t.taskId === taskId);
    if (taskIndex < 0) throw new Error('Task not found');

    const task = allTasks[taskIndex];
    const previousStatus = task.status;
    const now = new Date().toISOString();
    const updatedTask: Task = {
      ...task,
      status,
      completedAt: status === 'Completed' ? now : undefined,
      updatedAt: now,
    };
    allTasks[taskIndex] = updatedTask;
    setLocal(STORAGE_KEYS.TASKS, allTasks);

    let xpEarned = 0;
    if (status === 'Completed' && previousStatus !== 'Completed') {
      xpEarned = updatedTask.priority === 'High' ? 50 : updatedTask.priority === 'Medium' ? 30 : 15;

      const logs = getLocal<ProgressLog[]>(STORAGE_KEYS.PROGRESS_LOGS, []);
      const newLog: ProgressLog = {
        logId: `log-${Date.now()}`,
        uid: updatedTask.uid,
        taskId: updatedTask.taskId,
        dailyPlanId: updatedTask.dailyPlanId,
        sessionId: updatedTask.sessionId,
        session: updatedTask.session,
        completed: true,
        progressNotes: logData?.notes || 'Task completed via session check-in',
        achievements: [updatedTask.title],
        blockers: logData?.blockers,
        confidence: logData?.confidence || 5,
        timestamp: now,
      };
      logs.unshift(newLog);
      setLocal(STORAGE_KEYS.PROGRESS_LOGS, logs);

      this.addXP(xpEarned, 'task', taskId, `Completed task: ${updatedTask.title}`);
    }

    this.recalculateDailyPlan(updatedTask.dailyPlanId);

    if (updatedTask.weeklyGoalId) {
      this.recalculateWeeklyGoal(updatedTask.weeklyGoalId);
    }

    try {
      if (db) {
        setDoc(doc(db, 'tasks', updatedTask.taskId), updatedTask, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore task sync warning:', e);
    }

    return { task: updatedTask, xpEarned };
  },

  recalculateDailyPlan(dailyPlanId: string) {
    const allTasks = getLocal<Task[]>(STORAGE_KEYS.TASKS, []);
    const planTasks = allTasks.filter((t) => t.dailyPlanId === dailyPlanId);
    const completedCount = planTasks.filter((t) => t.status === 'Completed').length;
    const pendingCount = planTasks.length - completedCount;
    const completionPct = planTasks.length > 0 ? Math.round((completedCount / planTasks.length) * 100) : 0;

    const plans = getLocal<DailyPlan[]>(STORAGE_KEYS.DAILY_PLANS, []);
    const planIdx = plans.findIndex((p) => p.planId === dailyPlanId);
    if (planIdx >= 0) {
      plans[planIdx] = {
        ...plans[planIdx],
        completedTasks: completedCount,
        pendingTasks: pendingCount,
        completionPercentage: completionPct,
        status: completionPct === 100 ? 'Completed' : 'In Progress',
        updatedAt: new Date().toISOString(),
      };
      setLocal(STORAGE_KEYS.DAILY_PLANS, plans);
      try {
        if (db) {
          setDoc(doc(db, 'dailyPlans', dailyPlanId), plans[planIdx], { merge: true });
        }
      } catch (e) {
        console.warn('Firestore plan sync warning:', e);
      }
    }
  },

  addXP(amount: number, source: XPHistory['source'], sourceId: string, reason: string) {
    const user = this.getUserProfile();
    const newTotal = Math.max(0, user.totalXP + amount);
    const newLevel = Math.floor(newTotal / 500) + 1;

    this.updateUserProfile({ totalXP: newTotal, level: newLevel });

    const xpLogs = getLocal<XPHistory[]>(STORAGE_KEYS.XP_HISTORY, []);
    const newXpLog: XPHistory = {
      xpLogId: `xp-${Date.now()}`,
      uid: user.uid,
      amount,
      source,
      sourceId,
      reason,
      timestamp: new Date().toISOString(),
    };
    xpLogs.unshift(newXpLog);
    setLocal(STORAGE_KEYS.XP_HISTORY, xpLogs);

    try {
      if (db) {
        setDoc(doc(db, 'xpHistory', newXpLog.xpLogId), newXpLog, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore XP log sync warning:', e);
    }
  },

  saveDailyPlan(plan: DailyPlan, sessions: Session[], tasks: Task[]) {
    const allPlans = getLocal<DailyPlan[]>(STORAGE_KEYS.DAILY_PLANS, []);
    const planIdx = allPlans.findIndex((p) => p.planId === plan.planId);
    if (planIdx >= 0) allPlans[planIdx] = plan;
    else allPlans.unshift(plan);
    setLocal(STORAGE_KEYS.DAILY_PLANS, allPlans);

    const allSessions = getLocal<Session[]>(STORAGE_KEYS.SESSIONS, []);
    const filteredSessions = allSessions.filter((s) => s.dailyPlanId !== plan.planId);
    setLocal(STORAGE_KEYS.SESSIONS, [...filteredSessions, ...sessions]);

    const allTasks = getLocal<Task[]>(STORAGE_KEYS.TASKS, []);
    const filteredTasks = allTasks.filter((t) => t.dailyPlanId !== plan.planId);
    setLocal(STORAGE_KEYS.TASKS, [...filteredTasks, ...tasks]);

    try {
      const firestore = firestoreDb();
      if (firestore) {
        setDoc(doc(firestore, 'dailyPlans', plan.planId), plan, { merge: true });
        sessions.forEach((s) => setDoc(doc(firestore, 'sessions', s.sessionId), s, { merge: true }));
        tasks.forEach((t) => setDoc(doc(firestore, 'tasks', t.taskId), t, { merge: true }));
      }
    } catch (e) {
      console.warn('Firestore plan batch sync warning:', e);
    }
  },

  getDailyReports(): DailyReport[] {
    const fallback: DailyReport[] = [
      {
        reportId: 'dr-yesterday',
        uid: 'demo-user-123',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        goal: 'Complete architecture readiness and initial component structure',
        totalTasks: 6,
        completedTasks: 5,
        pendingTasks: 1,
        completionPercentage: 83,
        achievements: ['Setup Constellation rules', 'Configured flat Firestore collections'],
        missedTasks: ['Optional semantic embeddings index'],
        reflection: 'High focus session execution during afternoon window.',
        generatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    return getLocal(STORAGE_KEYS.DAILY_REPORTS, fallback);
  },

  getWeeklyReports(): WeeklyReport[] {
    const fallback: WeeklyReport[] = [
      {
        reportId: 'wr-prev',
        uid: 'demo-user-123',
        weekStart: '2026-07-20',
        weekEnd: '2026-07-26',
        completedTasks: 28,
        pendingTasks: 4,
        completionPercentage: 88,
        achievements: ['Maintained 5-day streak', 'Unlocked Level 3 Productivity Master'],
        weeklyGoalSummary: 'Successfully laid foundation for PTA execution engine.',
        consistencyScore: 92,
        generatedAt: '2026-07-26T23:59:59Z',
      },
    ];
    return getLocal(STORAGE_KEYS.WEEKLY_REPORTS, fallback);
  },

  getAchievements(): Achievement[] {
    const fallback: Achievement[] = [
      {
        achievementId: 'ach-1',
        uid: 'demo-user-123',
        type: 'Streak',
        title: '5-Day Execution Streak',
        description: 'Completed planned sessions consistently for 5 consecutive days',
        xpEarned: 250,
        unlockedAt: new Date().toISOString(),
        iconName: 'Flame',
      },
      {
        achievementId: 'ach-2',
        uid: 'demo-user-123',
        type: 'Planner',
        title: 'Night Planner Master',
        description: 'Planned tomorrow before 22:00 for 3 days in a row',
        xpEarned: 150,
        unlockedAt: new Date().toISOString(),
        iconName: 'Moon',
      },
      {
        achievementId: 'ach-3',
        uid: 'demo-user-123',
        type: 'Execution',
        title: 'High Priority Crusher',
        description: 'Completed 10 High-priority session tasks',
        xpEarned: 300,
        unlockedAt: new Date().toISOString(),
        iconName: 'Zap',
      },
    ];
    return getLocal(STORAGE_KEYS.ACHIEVEMENTS, fallback);
  },
};
