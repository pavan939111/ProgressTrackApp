import { apiSuccess } from '../../../../shared/errors/apiResponse';
import { taskService } from '../../../../tasks/taskService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tasks = taskService.getTodayTasks();
  return apiSuccess(tasks, 'Tasks retrieved successfully');
}
