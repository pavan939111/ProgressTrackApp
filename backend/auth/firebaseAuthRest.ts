/**
 * Firebase Auth via Identity Toolkit REST — API key stays on the server only.
 */
function apiKey() {
  return (
    process.env.FIREBASE_WEB_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    ''
  );
}

export function firebaseAuthConfigured() {
  return Boolean(apiKey());
}

async function postJson<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.error?.errors?.[0]?.message ||
      `Auth request failed (${res.status})`;
    throw new Error(String(msg).replace(/_/g, ' '));
  }
  return data as T;
}

export type AuthTokens = {
  idToken: string;
  refreshToken: string;
  localId: string;
  email: string;
  displayName?: string;
  expiresIn: string;
};

export async function signInWithPassword(email: string, password: string): Promise<AuthTokens> {
  const key = apiKey();
  if (!key) throw new Error('Firebase Auth is not configured on the server');
  return postJson(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`, {
    email,
    password,
    returnSecureToken: true,
  });
}

export async function signUp(email: string, password: string, fullName: string): Promise<AuthTokens> {
  const key = apiKey();
  if (!key) throw new Error('Firebase Auth is not configured on the server');
  const created = await postJson<AuthTokens>(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`,
    { email, password, returnSecureToken: true }
  );
  if (fullName) {
    await postJson(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${key}`, {
      idToken: created.idToken,
      displayName: fullName,
      returnSecureToken: true,
    });
  }
  return { ...created, displayName: fullName || created.displayName };
}

export async function sendPasswordReset(email: string) {
  const key = apiKey();
  if (!key) throw new Error('Firebase Auth is not configured on the server');
  await postJson(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${key}`, {
    requestType: 'PASSWORD_RESET',
    email,
  });
  return { sent: true };
}

export async function refreshIdToken(refreshToken: string): Promise<AuthTokens> {
  const key = apiKey();
  if (!key) throw new Error('Firebase Auth is not configured on the server');
  const data = await postJson<{
    id_token: string;
    refresh_token: string;
    user_id: string;
    expires_in: string;
  }>(`https://securetoken.googleapis.com/v1/token?key=${key}`, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  return {
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    localId: data.user_id,
    email: '',
    expiresIn: data.expires_in,
  };
}

export async function lookupAccount(idToken: string): Promise<{
  localId: string;
  email?: string;
  displayName?: string;
}> {
  const key = apiKey();
  if (!key) throw new Error('Firebase Auth is not configured on the server');
  const data = await postJson<{ users: Array<{ localId: string; email?: string; displayName?: string }> }>(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`,
    { idToken }
  );
  const user = data.users?.[0];
  if (!user) throw new Error('Invalid session');
  return user;
}

/**
 * Exchange a Google ID token (or access token) for Firebase Auth tokens.
 * Tries Identity Toolkit signInWithIdp first; on audience mismatch (OAuth client
 * not allowlisted on the Firebase project), falls back to Admin custom tokens.
 */
export async function signInWithGoogleIdp(params: {
  idToken?: string;
  accessToken?: string;
  requestUri: string;
}): Promise<AuthTokens> {
  const key = apiKey();
  if (!key) throw new Error('Firebase Auth is not configured on the server');
  if (!params.idToken && !params.accessToken) {
    throw new Error('Google id_token or access_token required');
  }

  try {
    const postBody = params.idToken
      ? `id_token=${encodeURIComponent(params.idToken)}&providerId=google.com`
      : `access_token=${encodeURIComponent(params.accessToken!)}&providerId=google.com`;

    return await postJson(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${key}`, {
      postBody,
      requestUri: params.requestUri,
      returnIdpCredential: true,
      returnSecureToken: true,
    });
  } catch (err: any) {
    const msg = String(err?.message || '');
    const audienceMismatch =
      /INVALID IDP RESPONSE|not allowed to be used with this application|audience/i.test(msg);
    if (!audienceMismatch) throw err;
    return signInWithGoogleViaAdmin(params);
  }
}

type GoogleProfile = {
  sub: string;
  email: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
};

async function fetchGoogleProfile(params: {
  idToken?: string;
  accessToken?: string;
}): Promise<GoogleProfile> {
  const expectedAud = process.env.GOOGLE_CLIENT_ID || '';

  if (params.idToken) {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(params.idToken)}`
    );
    if (res.ok) {
      const info = (await res.json()) as GoogleProfile & { aud?: string; azp?: string };
      if (expectedAud && info.aud !== expectedAud && info.azp !== expectedAud) {
        throw new Error('Google ID token audience does not match GOOGLE_CLIENT_ID');
      }
      if (!info.email || !info.sub) throw new Error('Google ID token missing email/sub');
      return info;
    }
  }

  if (params.accessToken) {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${params.accessToken}` },
    });
    if (!res.ok) throw new Error(`Google userinfo failed: ${await res.text()}`);
    const info = (await res.json()) as GoogleProfile;
    if (!info.email || !info.sub) throw new Error('Google userinfo missing email/sub');
    return info;
  }

  throw new Error('Could not verify Google account profile');
}

/**
 * Verify Google tokens ourselves, then mint Firebase session via Admin custom token.
 * Works when GOOGLE_CLIENT_ID is not the Firebase-console Web client (common when
 * Calendar OAuth client lives in a different GCP project).
 */
export async function signInWithGoogleViaAdmin(params: {
  idToken?: string;
  accessToken?: string;
}): Promise<AuthTokens> {
  const key = apiKey();
  if (!key) throw new Error('Firebase Auth is not configured on the server');

  const { ensureFirebaseAdmin } = await import('./adminApp');
  const { getAuth } = await import('firebase-admin/auth');
  if (!ensureFirebaseAdmin()) {
    throw new Error(
      'Google OAuth client is not linked to this Firebase project. Add GOOGLE_CLIENT_ID under Firebase Authentication → Google → Web SDK configuration, or set FIREBASE_SERVICE_ACCOUNT_JSON so login can use Admin custom tokens.'
    );
  }

  const auth = getAuth();
  const profile = await fetchGoogleProfile(params);
  const email = profile.email;
  const displayName = profile.name || email.split('@')[0] || 'Google User';

  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    if (displayName && existing.displayName !== displayName) {
      await auth.updateUser(uid, { displayName }).catch(() => undefined);
    }
  } catch (e: any) {
    if (e?.code !== 'auth/user-not-found') throw e;
    const created = await auth.createUser({
      email,
      emailVerified: profile.email_verified === true || profile.email_verified === 'true',
      displayName,
      photoURL: profile.picture,
    });
    uid = created.uid;
  }

  // Skip provider linking — createCustomToken is enough for a valid session.

  const customToken = await auth.createCustomToken(uid, {
    provider: 'google.com',
    email,
  });

  const session = await postJson<{
    idToken: string;
    refreshToken: string;
    expiresIn: string;
    localId?: string;
  }>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${key}`, {
    token: customToken,
    returnSecureToken: true,
  });

  return {
    idToken: session.idToken,
    refreshToken: session.refreshToken,
    localId: session.localId || uid,
    email,
    displayName,
    expiresIn: session.expiresIn || '3600',
  };
}
