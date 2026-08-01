/**
 * Frontend must not embed Firebase/auth/database credentials.
 * Only the public API base URL belongs in NEXT_PUBLIC_*.
 */

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
}

const SESSION_KEY = 'pta_auth_session';

export type AuthSession = {
  idToken: string;
  refreshToken: string;
  uid: string;
  email: string;
  fullName: string;
  expiresAt: number;
};

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null) {
  if (typeof window === 'undefined') return;
  if (!session) {
    sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function authHeaders(): Record<string, string> {
  const s = getSession();
  if (!s?.idToken) return {};
  return { Authorization: `Bearer ${s.idToken}` };
}

async function api<T>(path: string, options?: RequestInit): Promise<{ success: boolean; data?: T; message?: string }> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options?.headers || {}),
    },
  });
  return res.json();
}

export async function backendLogin(email: string, password: string) {
  return api<{
    user: any;
    idToken: string;
    refreshToken: string;
    expiresIn: string;
    mode: string;
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, mode: 'login' }),
  });
}

export async function backendRegister(email: string, password: string, fullName: string) {
  return api<{
    user: any;
    idToken: string;
    refreshToken: string;
    expiresIn: string;
    mode: string;
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName, mode: 'register' }),
  });
}

export async function backendDemoLogin() {
  return api<{ user: any; idToken: null; mode: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ demo: true }),
  });
}

export async function backendResetPassword(email: string) {
  return api('/api/auth/reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function backendMe() {
  return api<{ user: any }>('/api/auth/me');
}

export async function backendRefresh(refreshToken: string) {
  return api<{ idToken: string; refreshToken: string; expiresIn: string; uid: string }>('/api/auth/me', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function backendSync(items: { collection: string; docId: string; data: object }[]) {
  return api('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function backendHydrate() {
  return api<{ profile: any; settings: any; goals: any[] }>('/api/sync');
}

export async function fetchMessagingConfig() {
  const res = await fetch(`${apiBase()}/api/firebase-messaging-config`, { method: 'POST' });
  return res.json() as Promise<{
    success: boolean;
    data?: { config: Record<string, string>; vapidKey: string; configured: boolean };
  }>;
}

export { apiBase };
