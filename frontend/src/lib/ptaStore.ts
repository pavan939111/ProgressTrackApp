/**
 * PTA domain store — localStorage primary, optional Firestore when configured.
 * Covers FRS modules: profile, goals, planner, sessions, tasks, progress, reports, gamification.
 */
import {
  Achievement,
  CustomSessionDef,
  DailyPlan,
  DailyReport,
  Priority,
  ProgressLog,
  Session,
  SessionName,
  Task,
  TaskStatus,
  UserProfile,
  UserSettings,
  WeeklyGoal,
  WeeklyReport,
} from '@/types';
import { enqueueSync, resolveConflict, flushSyncQueue } from '@/lib/offlineSync';
import { awardXp, checkAchievements, recomputeStreak, xpForPriority, XP } from '@/lib/gamification';
import { authHeaders, backendHydrate, backendSync } from '@/lib/authClient';

const DEFAULT_SESSION_DEFS: CustomSessionDef[] = [
  { name: 'Morning', order: 1, start: '08:00', end: '11:59', reminder: '08:00' },
  { name: 'Before Lunch', order: 2, start: '12:00', end: '13:59', reminder: '12:00' },
  { name: 'Afternoon', order: 3, start: '14:00', end: '16:59', reminder: '14:00' },
  { name: 'Evening', order: 4, start: '17:00', end: '19:59', reminder: '17:00' },
  { name: 'Night', order: 5, start: '20:00', end: '22:00', reminder: '20:00' },
];

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function weekBounds(d = new Date()) {
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    weekStart: start.toISOString().split('T')[0],
    weekEnd: end.toISOString().split('T')[0],
  };
}

function key(uid: string, name: string) {
  return `pta:${uid}:${name}`;
}

function getLocal<T>(k: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(k: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k, JSON.stringify(value));
}

async function mirrorFirestore(collectionName: string, docId: string, data: object) {
  // Never talk to Firestore from the browser — queue + backend /api/sync
  enqueueSync({ collection: collectionName, docId, data });
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return;
  if (!authHeaders().Authorization) return;
  try {
    await backendSync([{ collection: collectionName, docId, data }]);
  } catch {
    // stays queued
  }
}

function sessionDefsFor(uid: string): CustomSessionDef[] {
  const settings = getLocal<UserSettings | null>(key(uid, 'settings'), null);
  const custom = settings?.customSessions || [];
  return [...DEFAULT_SESSION_DEFS, ...custom].sort((a, b) => a.order - b.order);
}

export function defaultSettings(uid: string): UserSettings {
  const now = new Date().toISOString();
  return {
    uid,
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
    customSessions: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function defaultProfile(partial: Partial<UserProfile> & { uid: string; email: string }): UserProfile {
  const now = new Date().toISOString();
  return {
    fullName: partial.fullName || partial.email.split('@')[0] || 'PTA User',
    createdAt: now,
    updatedAt: now,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    notificationPermission: false,
    pwaInstalled: false,
    streak: 0,
    totalXP: 0,
    level: 1,
    lastActiveDate: today(),
    onboardingCompleted: false,
    ...partial,
  };
}

export const ptaStore = {
  getProfile(uid: string): UserProfile | null {
    return getLocal<UserProfile | null>(key(uid, 'profile'), null);
  },

  saveProfile(profile: UserProfile) {
    const local = this.getProfile(profile.uid);
    const winner = resolveConflict(local, profile) || profile;
    setLocal(key(winner.uid, 'profile'), winner);
    void mirrorFirestore('users', winner.uid, winner);
    return winner;
  },

  getSettings(uid: string): UserSettings {
    return getLocal(key(uid, 'settings'), defaultSettings(uid));
  },

  saveSettings(settings: UserSettings) {
    settings = { ...settings, updatedAt: new Date().toISOString() };
    setLocal(key(settings.uid, 'settings'), settings);
    void mirrorFirestore('userSettings', settings.uid, settings);
    return settings;
  },

  addCustomSession(uid: string, def: Omit<CustomSessionDef, 'order'>) {
    const settings = this.getSettings(uid);
    const order = 100 + (settings.customSessions?.length || 0);
    const next = [...(settings.customSessions || []), { ...def, order }];
    return this.saveSettings({ ...settings, customSessions: next });
  },

  updateCustomSession(uid: string, name: string, updates: Partial<CustomSessionDef>) {
    const settings = this.getSettings(uid);
    const next = (settings.customSessions || []).map((s) =>
      s.name === name ? { ...s, ...updates, name: updates.name || s.name } : s
    );
    return this.saveSettings({ ...settings, customSessions: next });
  },

  removeCustomSession(uid: string, name: string) {
    const settings = this.getSettings(uid);
    return this.saveSettings({
      ...settings,
      customSessions: (settings.customSessions || []).filter((s) => s.name !== name),
    });
  },

  listSessionDefs(uid: string) {
    return sessionDefsFor(uid);
  },

  listGoals(uid: string): WeeklyGoal[] {
    return getLocal<WeeklyGoal[]>(key(uid, 'goals'), []);
  },

  saveGoal(goal: WeeklyGoal) {
    const goals = this.listGoals(goal.uid);
    const idx = goals.findIndex((g) => g.goalId === goal.goalId);
    if (idx >= 0) {
      const winner = resolveConflict(goals[idx], goal) || goal;
      goals[idx] = winner;
    } else goals.unshift(goal);
    setLocal(key(goal.uid, 'goals'), goals);
    void mirrorFirestore('weeklyGoals', goal.goalId, goal);
    return goal;
  },

  createGoal(
    uid: string,
    input: { title: string; description?: string; priority?: Priority }
  ): WeeklyGoal {
    const { weekStart, weekEnd } = weekBounds();
    const now = new Date().toISOString();
    const goal: WeeklyGoal = {
      goalId: id('wg'),
      uid,
      title: input.title,
      description: input.description,
      priority: input.priority || 'High',
      weekStart,
      weekEnd,
      status: 'Active',
      progress: 0,
      completedTasks: 0,
      totalTasks: 0,
      achievements: [],
      createdAt: now,
      updatedAt: now,
    };
    return this.saveGoal(goal);
  },

  updateGoal(uid: string, goalId: string, updates: Partial<WeeklyGoal>): WeeklyGoal | null {
    const goals = this.listGoals(uid);
    const g = goals.find((x) => x.goalId === goalId);
    if (!g) return null;
    const updated = { ...g, ...updates, updatedAt: new Date().toISOString() };
    return this.saveGoal(updated);
  },

  deleteGoal(uid: string, goalId: string) {
    const goals = this.listGoals(uid).filter((g) => g.goalId !== goalId);
    setLocal(key(uid, 'goals'), goals);
  },

  archiveGoal(uid: string, goalId: string) {
    return this.updateGoal(uid, goalId, { status: 'Archived' });
  },

  listPlans(uid: string): DailyPlan[] {
    return getLocal<DailyPlan[]>(key(uid, 'plans'), []);
  },

  listSessions(uid: string): Session[] {
    return getLocal<Session[]>(key(uid, 'sessions'), []);
  },

  listTasks(uid: string): Task[] {
    return getLocal<Task[]>(key(uid, 'tasks'), []);
  },

  listLogs(uid: string): ProgressLog[] {
    return getLocal<ProgressLog[]>(key(uid, 'logs'), []);
  },

  listAchievements(uid: string): Achievement[] {
    return getLocal<Achievement[]>(key(uid, 'achievements'), []);
  },

  listDailyReports(uid: string): DailyReport[] {
    return getLocal<DailyReport[]>(key(uid, 'dailyReports'), []);
  },

  listWeeklyReports(uid: string): WeeklyReport[] {
    return getLocal<WeeklyReport[]>(key(uid, 'weeklyReports'), []);
  },

  getPlanForDate(uid: string, date: string): DailyPlan | null {
    return this.listPlans(uid).find((p) => p.date === date) || null;
  },

  getDayDetail(uid: string, date: string) {
    const plan = this.getPlanForDate(uid, date);
    if (!plan) {
      return { plan: null, sessions: [] as Session[], tasks: [] as Task[], report: null as DailyReport | null };
    }
    const sessions = this.listSessions(uid).filter((s) => s.dailyPlanId === plan.planId);
    const tasks = this.listTasks(uid).filter((t) => t.dailyPlanId === plan.planId);
    const report = this.listDailyReports(uid).find((r) => r.date === date) || null;
    return { plan, sessions, tasks, report };
  },

  getTodayBundle(uid: string) {
    const date = today();
    let plan = this.getPlanForDate(uid, date);
    if (!plan) {
      plan = this.createEmptyPlan(uid, date, 'Focus on top priorities', 'In Progress');
    } else if (plan.status === 'Draft') {
      plan = this.savePlan({ ...plan, status: 'In Progress', updatedAt: new Date().toISOString() });
    }
    const sessions = this.listSessions(uid).filter((s) => s.dailyPlanId === plan!.planId);
    const tasks = this.listTasks(uid).filter((t) => t.dailyPlanId === plan!.planId);
    return { plan, sessions, tasks, date };
  },

  createEmptyPlan(
    uid: string,
    date: string,
    goal: string,
    status: DailyPlan['status'] = 'In Progress'
  ): DailyPlan {
    const now = new Date().toISOString();
    const plan: DailyPlan = {
      planId: id('dp'),
      uid,
      date,
      title: `Plan ${date}`,
      goal,
      notes: '',
      overallPriority: 'High',
      completionPercentage: 0,
      completedTasks: 0,
      pendingTasks: 0,
      weeklyGoalIds: this.listGoals(uid)
        .filter((g) => g.status === 'Active')
        .map((g) => g.goalId),
      status,
      createdAt: now,
      updatedAt: now,
    };
    const plans = this.listPlans(uid).filter((p) => p.date !== date);
    plans.push(plan);
    setLocal(key(uid, 'plans'), plans);
    void mirrorFirestore('dailyPlans', plan.planId, plan);

    const defs = sessionDefsFor(uid);
    const sessions: Session[] = defs.map((s) => ({
      sessionId: id('ses'),
      uid,
      dailyPlanId: plan.planId,
      name: s.name,
      order: s.order,
      startTime: s.start,
      endTime: s.end,
      reminderTime: s.reminder,
      status: s.order === 1 ? 'Active' : 'Pending',
      completionPercentage: 0,
      taskCount: 0,
      completedTaskCount: 0,
      createdAt: now,
      updatedAt: now,
    }));
    const allSessions = this.listSessions(uid).filter((s) => s.dailyPlanId !== plan.planId);
    setLocal(key(uid, 'sessions'), [...allSessions, ...sessions]);
    sessions.forEach((s) => void mirrorFirestore('sessions', s.sessionId, s));
    return plan;
  },

  deletePlan(uid: string, date: string) {
    const existing = this.getPlanForDate(uid, date);
    if (!existing) return;
    setLocal(
      key(uid, 'tasks'),
      this.listTasks(uid).filter((t) => t.dailyPlanId !== existing.planId)
    );
    setLocal(
      key(uid, 'sessions'),
      this.listSessions(uid).filter((s) => s.dailyPlanId !== existing.planId)
    );
    setLocal(
      key(uid, 'plans'),
      this.listPlans(uid).filter((p) => p.planId !== existing.planId)
    );
  },

  saveTomorrowPlan(
    uid: string,
    input: {
      goal: string;
      notes?: string;
      tasks: { title: string; session: SessionName | string; priority: Priority; weeklyGoalId?: string }[];
      asDraft?: boolean;
    }
  ) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const date = d.toISOString().split('T')[0];
    const existing = this.getPlanForDate(uid, date);
    if (existing) {
      setLocal(
        key(uid, 'tasks'),
        this.listTasks(uid).filter((t) => t.dailyPlanId !== existing.planId)
      );
      setLocal(
        key(uid, 'sessions'),
        this.listSessions(uid).filter((s) => s.dailyPlanId !== existing.planId)
      );
      setLocal(
        key(uid, 'plans'),
        this.listPlans(uid).filter((p) => p.planId !== existing.planId)
      );
    }

    const status: DailyPlan['status'] = input.asDraft ? 'Draft' : 'In Progress';
    const plan = this.createEmptyPlan(uid, date, input.goal, status);
    plan.notes = input.notes || '';
    plan.pendingTasks = input.tasks.length;
    this.savePlan(plan);

    const sessions = this.listSessions(uid).filter((s) => s.dailyPlanId === plan.planId);
    const now = new Date().toISOString();
    const newTasks: Task[] = input.tasks.map((t) => {
      const session = sessions.find((s) => s.name === t.session) || sessions[0];
      return {
        taskId: id('task'),
        uid,
        dailyPlanId: plan.planId,
        sessionId: session.sessionId,
        session: session.name as SessionName,
        weeklyGoalId: t.weeklyGoalId,
        title: t.title,
        priority: t.priority,
        status: 'Pending' as TaskStatus,
        createdAt: now,
        updatedAt: now,
      };
    });
    setLocal(key(uid, 'tasks'), [...this.listTasks(uid), ...newTasks]);
    newTasks.forEach((t) => void mirrorFirestore('tasks', t.taskId, t));

    const updatedSessions = sessions.map((s) => {
      const count = newTasks.filter((t) => t.sessionId === s.sessionId).length;
      return { ...s, taskCount: count, updatedAt: now };
    });
    const other = this.listSessions(uid).filter((s) => s.dailyPlanId !== plan.planId);
    setLocal(key(uid, 'sessions'), [...other, ...updatedSessions]);

    let profile = this.getProfile(uid) || defaultProfile({ uid, email: 'demo.user@example.com' });
    let xpEarned = 0;
    if (!input.asDraft) {
      profile = awardXp(profile, XP.PLANNING, 'Night planning');
      xpEarned = XP.PLANNING;
      profile.onboardingCompleted = true;
      this.saveProfile(profile);
      this.maybeUnlock(uid, profile, 'Planner');
    }

    return { plan, sessions: updatedSessions, tasks: newTasks, profile, xpEarned };
  },

  updateSession(
    uid: string,
    sessionId: string,
    updates: Partial<Pick<Session, 'name' | 'startTime' | 'endTime' | 'reminderTime' | 'order' | 'status'>>
  ) {
    const sessions = this.listSessions(uid);
    const idx = sessions.findIndex((s) => s.sessionId === sessionId);
    if (idx < 0) return null;
    sessions[idx] = { ...sessions[idx], ...updates, updatedAt: new Date().toISOString() };
    setLocal(key(uid, 'sessions'), sessions);
    void mirrorFirestore('sessions', sessions[idx].sessionId, sessions[idx]);
    return sessions[idx];
  },

  savePlan(plan: DailyPlan) {
    const plans = this.listPlans(plan.uid);
    const idx = plans.findIndex((p) => p.planId === plan.planId);
    if (idx >= 0) {
      plans[idx] = resolveConflict(plans[idx], plan) || plan;
    } else plans.push(plan);
    setLocal(key(plan.uid, 'plans'), plans);
    void mirrorFirestore('dailyPlans', plan.planId, plan);
    return plan;
  },

  recalculatePlan(uid: string, dailyPlanId: string) {
    const tasks = this.listTasks(uid).filter((t) => t.dailyPlanId === dailyPlanId);
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const pending = tasks.filter((t) => t.status === 'Pending' || t.status === 'In Progress').length;
    const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const plan = this.listPlans(uid).find((p) => p.planId === dailyPlanId);
    if (!plan) return;
    const wasIncomplete = plan.completionPercentage < 100;
    plan.completedTasks = completed;
    plan.pendingTasks = pending;
    plan.completionPercentage = pct;
    if (plan.status !== 'Draft') {
      plan.status = pct === 100 && tasks.length > 0 ? 'Completed' : 'In Progress';
    }
    plan.updatedAt = new Date().toISOString();
    this.savePlan(plan);

    if (wasIncomplete && pct === 100 && tasks.length > 0 && plan.status === 'Completed') {
      let profile = this.getProfile(uid) || defaultProfile({ uid, email: 'demo.user@example.com' });
      profile = awardXp(profile, XP.DAILY_COMPLETE, 'Daily completion bonus');
      this.saveProfile(profile);
    }

    const sessions = this.listSessions(uid).filter((s) => s.dailyPlanId === dailyPlanId);
    const other = this.listSessions(uid).filter((s) => s.dailyPlanId !== dailyPlanId);
    const updatedSessions = sessions.map((s) => {
      const st = tasks.filter((t) => t.sessionId === s.sessionId);
      const done = st.filter((t) => t.status === 'Completed').length;
      const allDone = st.length > 0 && done === st.length;
      return {
        ...s,
        taskCount: st.length,
        completedTaskCount: done,
        completionPercentage: st.length ? Math.round((done / st.length) * 100) : 0,
        status: allDone
          ? ('Completed' as const)
          : s.status === 'Completed'
            ? ('Completed' as const)
            : s.status,
        updatedAt: new Date().toISOString(),
      };
    });
    setLocal(key(uid, 'sessions'), [...other, ...updatedSessions]);

    this.listGoals(uid)
      .filter((g) => g.status === 'Active')
      .forEach((g) => {
        const linked = this.listTasks(uid).filter((t) => t.weeklyGoalId === g.goalId);
        if (!linked.length) return;
        const c = linked.filter((t) => t.status === 'Completed').length;
        const wasActive = g.status === 'Active';
        const nextStatus = c === linked.length ? ('Completed' as const) : ('Active' as const);
        this.saveGoal({
          ...g,
          totalTasks: linked.length,
          completedTasks: c,
          progress: Math.round((c / linked.length) * 100),
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        });
        if (wasActive && nextStatus === 'Completed') {
          let profile = this.getProfile(uid) || defaultProfile({ uid, email: 'demo.user@example.com' });
          profile = awardXp(profile, XP.WEEKLY_GOAL_COMPLETE, `Weekly goal: ${g.title}`);
          this.saveProfile(profile);
        }
      });
  },

  completeTask(
    uid: string,
    taskId: string,
    meta?: { notes?: string; blockers?: string; confidence?: number }
  ) {
    const tasks = this.listTasks(uid);
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task || task.status === 'Completed') return null;

    const now = new Date().toISOString();
    task.status = 'Completed';
    task.completedAt = now;
    task.updatedAt = now;
    setLocal(key(uid, 'tasks'), tasks);
    void mirrorFirestore('tasks', task.taskId, task);

    const log: ProgressLog = {
      logId: id('log'),
      uid,
      taskId,
      dailyPlanId: task.dailyPlanId,
      sessionId: task.sessionId,
      session: task.session,
      completed: true,
      progressNotes: meta?.notes,
      blockers: meta?.blockers,
      confidence: meta?.confidence,
      timestamp: now,
    };
    const logs = this.listLogs(uid);
    logs.push(log);
    setLocal(key(uid, 'logs'), logs);
    void mirrorFirestore('progressLogs', log.logId, log);

    this.recalculatePlan(uid, task.dailyPlanId);

    let profile = this.getProfile(uid) || defaultProfile({ uid, email: 'demo.user@example.com' });
    const xp = xpForPriority(task.priority);
    profile = awardXp(profile, xp, `Task: ${task.title}`);
    profile = recomputeStreak(profile);
    this.saveProfile(profile);
    this.maybeUnlock(uid, profile, 'Execution');

    return { task, xpEarned: xp, profile, log };
  },

  skipTask(uid: string, taskId: string, reason: string) {
    const tasks = this.listTasks(uid);
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task) return null;
    task.status = 'Skipped';
    task.skippedReason = reason;
    task.updatedAt = new Date().toISOString();
    setLocal(key(uid, 'tasks'), tasks);
    this.recalculatePlan(uid, task.dailyPlanId);
    return task;
  },

  moveTask(uid: string, taskId: string, toDate: string) {
    const tasks = this.listTasks(uid);
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task) return null;
    task.status = 'Moved';
    task.movedToDate = toDate;
    task.updatedAt = new Date().toISOString();
    setLocal(key(uid, 'tasks'), tasks);
    this.recalculatePlan(uid, task.dailyPlanId);

    let plan = this.getPlanForDate(uid, toDate);
    if (!plan) plan = this.createEmptyPlan(uid, toDate, 'Carried-over focus');
    const sessions = this.listSessions(uid).filter((s) => s.dailyPlanId === plan!.planId);
    const session = sessions.find((s) => s.name === task.session) || sessions[0];
    const clone: Task = {
      ...task,
      taskId: id('task'),
      dailyPlanId: plan.planId,
      sessionId: session.sessionId,
      status: 'Pending',
      movedToDate: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLocal(key(uid, 'tasks'), [...this.listTasks(uid), clone]);
    this.recalculatePlan(uid, plan.planId);
    return { task, clone };
  },

  deleteTask(uid: string, taskId: string) {
    const task = this.listTasks(uid).find((t) => t.taskId === taskId);
    if (!task) return;
    setLocal(
      key(uid, 'tasks'),
      this.listTasks(uid).filter((t) => t.taskId !== taskId)
    );
    this.recalculatePlan(uid, task.dailyPlanId);
  },

  updateTask(uid: string, taskId: string, updates: Partial<Task>) {
    const tasks = this.listTasks(uid);
    const idx = tasks.findIndex((t) => t.taskId === taskId);
    if (idx < 0) return null;
    tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
    setLocal(key(uid, 'tasks'), tasks);
    this.recalculatePlan(uid, tasks[idx].dailyPlanId);
    return tasks[idx];
  },

  startTask(uid: string, taskId: string) {
    return this.updateTask(uid, taskId, { status: 'In Progress' });
  },

  completeSession(uid: string, sessionId: string) {
    const sessions = this.listSessions(uid);
    const s = sessions.find((x) => x.sessionId === sessionId);
    if (!s) return null;
    const sessionTasks = this.listTasks(uid).filter((t) => t.sessionId === sessionId);
    const allDone = sessionTasks.length > 0 && sessionTasks.every((t) => t.status === 'Completed');
    s.status = 'Completed';
    s.updatedAt = new Date().toISOString();
    setLocal(key(uid, 'sessions'), sessions);
    let profile = this.getProfile(uid) || defaultProfile({ uid, email: 'demo.user@example.com' });
    let xpEarned = 0;
    if (allDone) {
      profile = awardXp(profile, XP.SESSION_COMPLETE, `${s.name} session complete`);
      xpEarned = XP.SESSION_COMPLETE;
      this.saveProfile(profile);
    }
    return { session: s, profile, xpEarned };
  },

  maybeUnlock(uid: string, profile: UserProfile, type: Achievement['type']) {
    const unlocked = checkAchievements(uid, profile, this.listAchievements(uid), type);
    if (unlocked.length) {
      const all = [...this.listAchievements(uid), ...unlocked];
      setLocal(key(uid, 'achievements'), all);
      unlocked.forEach((a) => void mirrorFirestore('achievements', a.achievementId, a));
      let p = profile;
      unlocked.forEach((a) => {
        p = awardXp(p, a.xpEarned, a.title);
      });
      this.saveProfile(p);
    }
    return unlocked;
  },

  generateDailyReport(uid: string, date = today()): DailyReport {
    const plan = this.getPlanForDate(uid, date);
    const tasks = this.listTasks(uid).filter((t) => plan && t.dailyPlanId === plan.planId);
    const completed = tasks.filter((t) => t.status === 'Completed');
    const missed = tasks.filter((t) => t.status === 'Skipped' || t.status === 'Pending');
    const report: DailyReport = {
      reportId: id('dr'),
      uid,
      date,
      goal: plan?.goal || '',
      totalTasks: tasks.length,
      completedTasks: completed.length,
      pendingTasks: tasks.filter((t) => t.status === 'Pending').length,
      completionPercentage: plan?.completionPercentage || 0,
      achievements: completed.map((t) => t.title),
      missedTasks: missed.map((t) => t.title),
      reflection: this.listLogs(uid)
        .filter((l) => plan && l.dailyPlanId === plan.planId)
        .map((l) => l.progressNotes)
        .filter(Boolean)
        .join(' · '),
      generatedAt: new Date().toISOString(),
    };
    const reports = this.listDailyReports(uid).filter((r) => r.date !== date);
    reports.push(report);
    setLocal(key(uid, 'dailyReports'), reports);
    void mirrorFirestore('dailyReports', report.reportId, report);
    return report;
  },

  generateWeeklyReport(uid: string): WeeklyReport {
    const { weekStart, weekEnd } = weekBounds();
    const plans = this.listPlans(uid).filter((p) => p.date >= weekStart && p.date <= weekEnd);
    const planIds = new Set(plans.map((p) => p.planId));
    const tasks = this.listTasks(uid).filter((t) => planIds.has(t.dailyPlanId));
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const consistentDays = plans.filter((p) => p.completionPercentage >= 70).length;
    const goals = this.listGoals(uid).filter((g) => g.status !== 'Archived');
    const report: WeeklyReport = {
      reportId: id('wr'),
      uid,
      weekStart,
      weekEnd,
      completedTasks: completed,
      pendingTasks: pending,
      completionPercentage: pct,
      achievements: this.listAchievements(uid)
        .slice(0, 5)
        .map((a) => a.title),
      weeklyGoalSummary: goals.map((g) => `${g.title} (${g.progress}%)`).join('; ') || 'No active goals',
      consistencyScore: plans.length ? Math.round((consistentDays / plans.length) * 100) : 0,
      generatedAt: new Date().toISOString(),
    };
    const reports = this.listWeeklyReports(uid).filter(
      (r) => !(r.weekStart === weekStart && r.weekEnd === weekEnd)
    );
    reports.push(report);
    setLocal(key(uid, 'weeklyReports'), reports);
    void mirrorFirestore('weeklyReports', report.reportId, report);
    return report;
  },

  maybeAutoDailyReport(uid: string) {
    const date = today();
    const flag = key(uid, `autoDaily:${date}`);
    if (typeof window !== 'undefined' && localStorage.getItem(flag)) return null;
    const plan = this.getPlanForDate(uid, date);
    if (!plan || plan.status === 'Draft') return null;
    const hour = new Date().getHours();
    if (hour < 22) return null;
    const report = this.generateDailyReport(uid, date);
    if (typeof window !== 'undefined') localStorage.setItem(flag, '1');
    return report;
  },

  maybeAutoWeeklyReport(uid: string) {
    const { weekStart } = weekBounds();
    const flag = key(uid, `autoWeekly:${weekStart}`);
    if (typeof window !== 'undefined' && localStorage.getItem(flag)) return null;
    const day = new Date().getDay();
    const hour = new Date().getHours();
    if (!(day === 0 && hour >= 20)) return null;
    const report = this.generateWeeklyReport(uid);
    if (typeof window !== 'undefined') localStorage.setItem(flag, '1');
    return report;
  },

  calendarDays(uid: string, days = 30) {
    const out: { date: string; completion: number; completed: boolean; goal: string }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split('T')[0];
      const plan = this.getPlanForDate(uid, date);
      out.push({
        date,
        completion: plan?.completionPercentage || 0,
        completed: (plan?.completionPercentage || 0) >= 80,
        goal: plan?.goal || '',
      });
    }
    return out;
  },

  calendarMonth(uid: string, year: number, month: number) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: { date: string; completion: number; completed: boolean; goal: string; status?: string }[] =
      [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const plan = this.getPlanForDate(uid, date);
      out.push({
        date,
        completion: plan?.completionPercentage || 0,
        completed: (plan?.completionPercentage || 0) >= 80,
        goal: plan?.goal || '',
        status: plan?.status,
      });
    }
    return out;
  },

  async hydrateFromBackend() {
    try {
      const res = await backendHydrate();
      if (!res.success || !res.data) return { hydrated: false };
      const { profile, settings, goals } = res.data;
      if (profile?.uid) {
        const local = this.getProfile(profile.uid);
        const winner = resolveConflict(local, profile as UserProfile);
        if (winner) setLocal(key(winner.uid, 'profile'), winner);
      }
      if (settings?.uid) {
        const local = this.getSettings(settings.uid);
        const winner = resolveConflict(local, settings as UserSettings);
        if (winner) setLocal(key(winner.uid, 'settings'), winner);
      }
      if (Array.isArray(goals) && goals.length && profile?.uid) {
        const uid = profile.uid as string;
        const local = this.listGoals(uid);
        const byId = new Map(local.map((g) => [g.goalId, g]));
        goals.forEach((r: WeeklyGoal) => {
          const winner = resolveConflict(byId.get(r.goalId), r);
          if (winner) byId.set(r.goalId, winner);
        });
        setLocal(key(uid, 'goals'), Array.from(byId.values()));
      }
      return { hydrated: true };
    } catch {
      return { hydrated: false };
    }
  },

  /** @deprecated use hydrateFromBackend — no client Firestore */
  async hydrateFromFirestore(uid: string) {
    void uid;
    return this.hydrateFromBackend();
  },

  async flushPendingSync() {
    return flushSyncQueue(async (collection, docId, data) => {
      const res = await backendSync([{ collection, docId, data }]);
      if (!res.success) throw new Error(res.message || 'sync failed');
    });
  },

  ensureSeeded(uid: string, email: string, fullName?: string) {
    let profile = this.getProfile(uid);
    if (!profile) {
      profile = defaultProfile({ uid, email, fullName });
      this.saveProfile(profile);
    }
    this.getSettings(uid);
    if (!this.getPlanForDate(uid, today())) {
      this.createEmptyPlan(uid, today(), 'Execute planned session tasks');
    }
    return profile;
  },
};
