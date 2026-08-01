/**
 * Google Sign-In for PTA login (backend-only secrets).
 * Uses the same GOOGLE_CLIENT_ID/SECRET as Calendar OAuth, with a dedicated redirect URI.
 */

function appUrl() {
  return (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
}

function apiUrl() {
  return (process.env.BACKEND_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(
    /\/$/,
    ''
  );
}

export function googleLoginConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleLoginRedirectUri() {
  // Reuse Calendar OAuth redirect URI so Google Cloud Console needs only one backend callback.
  return `${apiUrl()}/api/oauth/google/callback`;
}

export function googleLoginAuthUrl(returnPath = '/') {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleLoginRedirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'select_account',
    scope: ['openid', 'email', 'profile'].join(' '),
    state: Buffer.from(JSON.stringify({ returnPath, purpose: 'login' })).toString('base64url'),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function parseLoginState(state: string): { returnPath: string } {
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    return { returnPath: parsed.returnPath || '/' };
  } catch {
    return { returnPath: '/' };
  }
}

export async function exchangeGoogleLoginCode(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: googleLoginRedirectUri(),
    grant_type: 'authorization_code',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json() as Promise<{
    access_token: string;
    id_token?: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  }>;
}

export function frontendLoginSuccessRedirect(
  returnPath: string,
  payload: {
    idToken: string;
    refreshToken: string;
    expiresIn: string;
    uid: string;
    email: string;
    fullName: string;
  }
) {
  const base = appUrl();
  const path = returnPath.startsWith('http')
    ? returnPath
    : `${base}${returnPath.startsWith('/') ? '' : '/'}${returnPath}`;
  const url = new URL(path);
  // Tokens in hash so they are not sent to the server / not logged in Referer as easily
  url.hash = `google_auth=${encodeURIComponent(JSON.stringify(payload))}`;
  return url.toString();
}

export function frontendLoginErrorRedirect(returnPath: string, message: string) {
  const base = appUrl();
  const path = returnPath.startsWith('http')
    ? returnPath
    : `${base}${returnPath.startsWith('/') ? '' : '/'}${returnPath}`;
  const url = new URL(path);
  url.searchParams.set('auth_error', message.slice(0, 200));
  return url.toString();
}
