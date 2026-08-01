import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '../../../../../shared/errors/apiResponse';
import { requireUser, toProfile } from '../../../../../auth/sessionAuth';
import { refreshIdToken, firebaseAuthConfigured } from '../../../../../auth/firebaseAuthRest';

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return apiError('Unauthorized', 'AUTH_401', 401);
  return apiSuccess({ user: toProfile(user) }, 'Session valid');
}

export async function POST(req: NextRequest) {
  try {
    if (!firebaseAuthConfigured()) {
      return apiError('Auth not configured on server', 'AUTH_003', 503);
    }
    const { refreshToken } = await req.json();
    if (!refreshToken) return apiError('refreshToken required', 'AUTH_001', 400);
    const tokens = await refreshIdToken(refreshToken);
    return apiSuccess(
      {
        idToken: tokens.idToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        uid: tokens.localId,
      },
      'Token refreshed'
    );
  } catch (error: any) {
    return apiError(error.message || 'Refresh failed', 'AUTH_005', 401);
  }
}
