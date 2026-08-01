import { dbService } from '../database/dbService';

export const dashboardService = {
  getSummary() {
    const { plan, sessions } = dbService.getTodayPlan();
    const weeklyGoals = dbService.getWeeklyGoals();
    const user = dbService.getUserProfile();
    const nextSession = sessions.find((s) => s.status === 'Active') || sessions[0] || null;

    return {
      todayGoal: plan.goal,
      progress: plan.completionPercentage,
      completedTasks: plan.completedTasks,
      pendingTasks: plan.pendingTasks,
      weeklyProgress: weeklyGoals[0]?.progress || 0,
      userLevel: user.level,
      totalXP: user.totalXP,
      streak: user.streak,
      nextSession,
    };
  },
};
