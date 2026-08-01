import {
  AnalyticsSnapshot,
  DailyPlan,
  Session,
  SessionName,
  Task,
  UserProfile,
} from '@/types';

const HISTORY_KEY = 'pta_analytics_history';

export interface DayHistoryPoint {
  date: string;
  completion: number;
  tasksDone: number;
  xp: number;
}

export function loadHistory(): DayHistoryPoint[] {
  if (typeof window === 'undefined') return seedHistory();
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      const seed = seedHistory();
      localStorage.setItem(HISTORY_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as DayHistoryPoint[];
  } catch {
    return seedHistory();
  }
}

export function recordTodaySnapshot(plan: DailyPlan, user: UserProfile) {
  if (typeof window === 'undefined') return;
  const history = loadHistory();
  const idx = history.findIndex((h) => h.date === plan.date);
  const point: DayHistoryPoint = {
    date: plan.date,
    completion: plan.completionPercentage,
    tasksDone: plan.completedTasks,
    xp: user.totalXP,
  };
  if (idx >= 0) history[idx] = point;
  else history.push(point);
  history.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-90)));
}

function seedHistory(): DayHistoryPoint[] {
  const out: DayHistoryPoint[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = d.toISOString().split('T')[0];
    const completion = 55 + Math.round(Math.sin(i) * 20) + (i % 3) * 5;
    out.push({
      date,
      completion: Math.min(100, Math.max(20, completion)),
      tasksDone: 2 + (i % 5),
      xp: 1000 + (14 - i) * 40,
    });
  }
  return out;
}

export function computeAnalytics(
  tasks: Task[],
  sessions: Session[],
  user: UserProfile,
  rangeDays = 14
): AnalyticsSnapshot {
  const history = loadHistory().slice(-rangeDays);
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const totalTasks = tasks.length || 1;
  const completionRate = Math.round((completedTasks / totalTasks) * 100);

  const avgDailyCompletion =
    history.length === 0
      ? completionRate
      : Math.round(history.reduce((s, h) => s + h.completion, 0) / history.length);

  const consistentDays = history.filter((h) => h.completion >= 70).length;
  const consistencyScore =
    history.length === 0 ? user.streak * 10 : Math.round((consistentDays / history.length) * 100);

  const best = [...history].sort((a, b) => b.completion - a.completion)[0];
  const sessionNames: SessionName[] = ['Morning', 'Before Lunch', 'Afternoon', 'Evening', 'Night'];
  const sessionBreakdown = sessionNames.map((session) => {
    const related = tasks.filter((t) => t.session === session);
    return {
      session,
      completed: related.filter((t) => t.status === 'Completed').length,
      total: related.length,
    };
  });

  const weakest = [...sessionBreakdown]
    .filter((s) => s.total > 0)
    .sort((a, b) => a.completed / a.total - b.completed / b.total)[0];

  const insights: string[] = [];
  if (consistencyScore >= 80) insights.push('Strong consistency — keep the streak alive.');
  else if (consistencyScore < 50) insights.push('Consistency is low; protect morning sessions first.');
  if (weakest && weakest.total > 0)
    insights.push(`${weakest.session} is your weakest block — schedule fewer high-friction tasks there.`);
  if (avgDailyCompletion >= 85) insights.push('Execution rate is elite; consider raising weekly goal ambition.');
  if (user.streak >= 5) insights.push(`${user.streak}-day streak compounding — don’t break the chain tonight.`);
  if (insights.length === 0) insights.push('Complete today’s check-ins to unlock deeper productivity insights.');

  return {
    rangeDays,
    totalTasks: tasks.length,
    completedTasks,
    completionRate,
    avgDailyCompletion,
    consistencyScore: Math.min(100, consistencyScore),
    bestDay: best?.date || '—',
    weakestSession: weakest?.session || null,
    sessionBreakdown,
    dailySeries: history.map((h) => ({
      date: h.date,
      completion: h.completion,
      tasksDone: h.tasksDone,
    })),
    xpTrend: history.map((h) => ({ date: h.date, xp: h.xp })),
    insights,
  };
}
