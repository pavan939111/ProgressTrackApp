import { DailyPlan, Session, Task } from '../src/types';
import { dbService } from '../database/dbService';

export const dailyPlanService = {
  getTodayPlan(): { plan: DailyPlan; sessions: Session[]; tasks: Task[] } {
    return dbService.getTodayPlan();
  },

  savePlan(plan: DailyPlan, sessions: Session[], tasks: Task[]) {
    dbService.saveDailyPlan(plan, sessions, tasks);
    dbService.addXP(100, 'planningBonus', plan.planId, 'Saved Daily Execution Plan');
  },
};
