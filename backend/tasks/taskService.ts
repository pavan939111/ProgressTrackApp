import { Task } from '../src/types';
import { dbService } from '../database/dbService';

export const taskService = {
  getTodayTasks(): Task[] {
    const { tasks } = dbService.getTodayPlan();
    return tasks;
  },

  completeTask(taskId: string, logData?: { notes?: string; blockers?: string; confidence?: number }) {
    return dbService.updateTaskStatus(taskId, 'Completed', logData);
  },

  skipTask(taskId: string, reason?: string) {
    return dbService.updateTaskStatus(taskId, 'Skipped', { notes: reason });
  },

  moveTask(taskId: string, targetDate: string) {
    const res = dbService.updateTaskStatus(taskId, 'Moved');
    return { ...res.task, movedToDate: targetDate };
  },
};
