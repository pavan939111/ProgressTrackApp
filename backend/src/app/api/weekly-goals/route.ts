import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '../../../../shared/errors/apiResponse';
import { weeklyGoalService } from '../../../../weekly-goals/weeklyGoalService';

export async function GET() {
  const goals = weeklyGoalService.getGoals();
  return apiSuccess(goals, 'Weekly goals retrieved');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, priority } = body;

    if (!title) {
      return apiError('Title is required for weekly goal', 'VALIDATION_001', 400);
    }

    const saved = weeklyGoalService.saveGoal({
      uid: 'demo-user-123',
      title,
      description: description || '',
      priority: priority || 'High',
      weekStart: '2026-07-27',
      weekEnd: '2026-08-02',
      status: 'Active',
      progress: 0,
      completedTasks: 0,
      totalTasks: 5,
      achievements: ['Created Goal'],
    });

    return apiSuccess(saved, 'Weekly goal created', 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to create weekly goal', 'SERVER_001', 500);
  }
}
