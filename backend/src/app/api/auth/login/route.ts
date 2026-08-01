import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '../../../../../shared/errors/apiResponse';
import { userService } from '../../../../../users/userService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError('Email and password are required', 'AUTH_001', 400);
    }

    const user = userService.getProfile();
    return apiSuccess({ user, token: 'mock-session-token-123' }, 'Login successful');
  } catch (error: any) {
    return apiError(error.message || 'Login failed', 'SERVER_001', 500);
  }
}
