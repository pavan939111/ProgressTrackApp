import { tokenStore, type OAuthProvider, type OAuthTokenRecord } from './tokenStore';

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_USER = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_EVENTS = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

function appUrl() {
  return (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function apiUrl() {
  return (process.env.BACKEND_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(
    /\/$/,
    ''
  );
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleAuthUrl(uid: string, returnPath = '/') {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${apiUrl()}/api/oauth/google/callback`,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ].join(' '),
    state: Buffer.from(JSON.stringify({ uid, returnPath })).toString('base64url'),
  });
  return `${GOOGLE_AUTH}?${params}`;
}

export function parseState(state: string): { uid: string; returnPath: string } {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    return { uid: 'anonymous', returnPath: '/' };
  }
}

async function exchangeGoogle(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: `${apiUrl()}/api/oauth/google/callback`,
    grant_type: 'authorization_code',
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  }>;
}

async function refreshGoogle(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Google refresh failed: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function completeGoogleOAuth(uid: string, code: string): Promise<OAuthTokenRecord> {
  const tokens = await exchangeGoogle(code);
  const profileRes = await fetch(GOOGLE_USER, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = profileRes.ok ? await profileRes.json() : {};
  const record: OAuthTokenRecord = {
    uid,
    provider: 'google',
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    email: profile.email,
    scope: tokens.scope,
    updatedAt: new Date().toISOString(),
  };
  // preserve refresh if Google omitted it on re-consent
  const prev = tokenStore.get(uid, 'google');
  if (!record.refreshToken && prev?.refreshToken) record.refreshToken = prev.refreshToken;
  tokenStore.save(record);
  return record;
}

export async function getValidToken(uid: string, provider: OAuthProvider): Promise<OAuthTokenRecord | null> {
  let record = tokenStore.get(uid, provider);
  if (!record) return null;
  if (record.expiresAt > Date.now() + 60_000) return record;
  if (!record.refreshToken) return record;

  const refreshed = await refreshGoogle(record.refreshToken);
  record = {
    ...record,
    accessToken: refreshed.access_token,
    expiresAt: Date.now() + refreshed.expires_in * 1000,
    updatedAt: new Date().toISOString(),
  };
  tokenStore.save(record);
  return record;
}

export type SyncSessionInput = {
  sessionId: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  goal?: string;
  tasks?: string[];
};

function toRfc3339(date: string, time: string) {
  const [h, m] = (time || '09:00').split(':');
  return `${date}T${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}:00`;
}

export async function pushSessionsToGoogle(uid: string, sessions: SyncSessionInput[], timezone = 'UTC') {
  const token = await getValidToken(uid, 'google');
  if (!token) throw new Error('Google Calendar not connected');

  const results = [];
  for (const s of sessions) {
    const body = {
      summary: `PTA ${s.name}${s.goal ? `: ${s.goal}` : ''}`,
      description: (s.tasks || []).map((t) => `• ${t}`).join('\n') || 'PTA session',
      start: { dateTime: toRfc3339(s.date, s.startTime), timeZone: timezone },
      end: { dateTime: toRfc3339(s.date, s.endTime), timeZone: timezone },
      extendedProperties: { private: { ptaSessionId: s.sessionId } },
    };

    // upsert by private extended property search
    const q = encodeURIComponent(`ptaSessionId=${s.sessionId}`);
    const existingRes = await fetch(`${GOOGLE_EVENTS}?privateExtendedProperty=${q}&maxResults=1`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    });
    const existing = existingRes.ok ? await existingRes.json() : { items: [] };
    const eventId = existing.items?.[0]?.id;

    const url = eventId ? `${GOOGLE_EVENTS}/${eventId}` : GOOGLE_EVENTS;
    const method = eventId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Google sync failed: ${await res.text()}`);
    results.push(await res.json());
  }
  return results;
}

export async function pullGoogleEvents(uid: string, timeMin: string, timeMax: string) {
  const token = await getValidToken(uid, 'google');
  if (!token) throw new Error('Google Calendar not connected');
  const url = `${GOOGLE_EVENTS}?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token.accessToken}` } });
  if (!res.ok) throw new Error(`Google pull failed: ${await res.text()}`);
  const data = await res.json();
  return (data.items || []).map((e: any) => ({
    id: e.id,
    title: e.summary || 'Untitled',
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    description: e.description || '',
    provider: 'google' as const,
    ptaSessionId: e.extendedProperties?.private?.ptaSessionId,
  }));
}

export function frontendRedirect(returnPath: string, params: Record<string, string>) {
  const base = appUrl();
  const path = returnPath.startsWith('http') ? returnPath : `${base}${returnPath.startsWith('/') ? '' : '/'}${returnPath}`;
  const url = new URL(path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}
