import { Achievement, Priority, UserProfile } from '@/types';

/** Cumulative XP thresholds for levels 1–10+ (Gamification Spec §5). */
const LEVEL_THRESHOLDS = [0, 250, 600, 1100, 1800, 2700, 3800, 5100, 6600, 8300];

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  // Beyond level 10: continue curve (~+2000 per level growing)
  if (xp >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) {
    let threshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    level = 10;
    let step = 2000;
    while (xp >= threshold + step) {
      threshold += step;
      level++;
      step += 200;
    }
  }
  return level;
}

export function xpForPriority(priority: Priority): number {
  if (priority === 'High') return 40;
  if (priority === 'Medium') return 20;
  return 10;
}

export const XP = {
  SESSION_COMPLETE: 20,
  DAILY_COMPLETE: 100,
  WEEKLY_GOAL_COMPLETE: 500,
  PLANNING: 15,
} as const;

export function awardXp(profile: UserProfile, amount: number, _reason: string): UserProfile {
  const totalXP = profile.totalXP + amount;
  return {
    ...profile,
    totalXP,
    level: levelFromXp(totalXP),
    updatedAt: new Date().toISOString(),
  };
}

export function recomputeStreak(profile: UserProfile): UserProfile {
  const today = new Date().toISOString().split('T')[0];
  const last = profile.lastActiveDate;
  if (last === today) return profile;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.toISOString().split('T')[0];

  const streak = last === y ? profile.streak + 1 : 1;
  return {
    ...profile,
    streak,
    lastActiveDate: today,
    updatedAt: new Date().toISOString(),
  };
}

export function checkAchievements(
  uid: string,
  profile: UserProfile,
  existing: Achievement[],
  hint: Achievement['type']
): Achievement[] {
  const have = new Set(existing.map((a) => a.title));
  const unlocked: Achievement[] = [];
  const now = new Date().toISOString();

  const tryAdd = (title: string, type: Achievement['type'], description: string, xp: number) => {
    if (have.has(title)) return;
    unlocked.push({
      achievementId: `ach-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      uid,
      type,
      title,
      description,
      xpEarned: xp,
      unlockedAt: now,
    });
  };

  if (profile.streak >= 3) tryAdd('3-Day Streak', 'Streak', 'Completed work 3 days in a row', 100);
  if (profile.streak >= 5) tryAdd('5-Day Streak', 'Streak', 'Completed work 5 days in a row', 250);
  if (profile.streak >= 7) tryAdd('Week Warrior', 'Streak', '7-day execution streak', 400);
  if (profile.level >= 2) tryAdd('Level Up', 'Milestone', 'Reached level 2', 50);
  if (profile.totalXP >= 1500) tryAdd('Execution Master', 'Milestone', 'Reached 1500 XP', 100);
  if (hint === 'Planner') tryAdd('Night Planner', 'Planner', 'Saved a tomorrow plan', 50);
  if (hint === 'Execution') tryAdd('First Win', 'Execution', 'Completed a tracked task', 75);

  return unlocked;
}
