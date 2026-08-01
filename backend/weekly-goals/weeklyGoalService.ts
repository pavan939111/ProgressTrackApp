import { WeeklyGoal } from '../src/types';
import { dbService } from '../database/dbService';

export const weeklyGoalService = {
  getGoals(): WeeklyGoal[] {
    return dbService.getWeeklyGoals();
  },

  getGoalById(goalId: string): WeeklyGoal | undefined {
    const goals = dbService.getWeeklyGoals();
    return goals.find((g) => g.goalId === goalId);
  },

  saveGoal(goal: Omit<WeeklyGoal, 'goalId' | 'createdAt' | 'updatedAt'> & { goalId?: string }): WeeklyGoal {
    return dbService.saveWeeklyGoal(goal);
  },

  recalculateProgress(goalId: string) {
    dbService.recalculateWeeklyGoal(goalId);
  },
};
