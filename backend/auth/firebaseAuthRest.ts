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
