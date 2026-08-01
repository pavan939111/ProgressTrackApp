import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '../../../../../shared/errors/apiResponse';
import { firebaseAuthConfigured, sendPasswordReset } from '../../../../../auth/firebaseAuthRest';

export async function POST(req: NextRequest) {
  try {
    if (!firebaseAuthConfigured()) {
      return apiError('Auth not configured on server', 'AUTH_003', 503);
    }
    const { email } = await req.json();
    if (!email) return apiError('Email is required', 'AUTH_001', 400);
    await sendPasswordReset(email);
    return apiSuccess({ sent: true }, 'Password reset email sent');
  } catch (error: any) {
    return apiError(error.message || 'Reset failed', 'AUTH_004', 400);
  }
}
