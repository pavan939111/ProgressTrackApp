import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '../../../../../shared/errors/apiResponse';
import {
  firebaseAuthConfigured,
  signInWithPassword,
  signUp,
} from '../../../../../auth/firebaseAuthRest';
import { toProfile } from '../../../../../auth/sessionAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, mode } = body as {
      email?: string;
      password?: string;
      fullName?: string;
      mode?: 'login' | 'register';
    };

    // Demo / passwordless bypass removed — all sessions must use Firebase Auth.

    if (!firebaseAuthConfigured()) {
      return apiError(
        'Auth not configured on server. Set FIREBASE_WEB_API_KEY (or NEXT_PUBLIC_FIREBASE_API_KEY) on the backend.',
        'AUTH_003',
        503
      );
    }

    if (!email || !password) {
      return apiError('Email and password are required', 'AUTH_001', 400);
    }

    const tokens =
      mode === 'register'
        ? await signUp(email, password, fullName || '')
        : await signInWithPassword(email, password);

    const user = toProfile(
      { uid: tokens.localId, email: tokens.email || email, name: tokens.displayName || fullName },
      fullName || tokens.displayName
    );

    return apiSuccess(
      {
        user,
        idToken: tokens.idToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        mode: mode === 'register' ? 'register' : 'login',
      },
      mode === 'register' ? 'Registered' : 'Logged in'
    );
  } catch (error: any) {
    return apiError(error.message || 'Login failed', 'AUTH_002', 401);
  }
}
