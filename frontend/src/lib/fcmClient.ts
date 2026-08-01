'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging';
import { apiBase, authHeaders, fetchMessagingConfig } from '@/lib/authClient';

let messaging: Messaging | null = null;
let fcmApp: FirebaseApp | null = null;

async function ensureFcmApp(): Promise<{ app: FirebaseApp; vapidKey: string } | null> {
  const res = await fetchMessagingConfig();
  if (!res.success || !res.data?.configured || !res.data.config) return null;
  const { config, vapidKey } = res.data;
  if (!vapidKey) return null;
  fcmApp =
    getApps().length > 0
      ? getApp()
      : initializeApp(config);
  return { app: fcmApp, vapidKey };
}

export async function initWebPush(uid: string): Promise<{ ok: boolean; token?: string; message?: string }> {
  if (typeof window === 'undefined') return { ok: false, message: 'Window required' };

  const supported = await isSupported();
  if (!supported) return { ok: false, message: 'FCM not supported in this browser' };

  const ready = await ensureFcmApp();
  if (!ready) return { ok: false, message: 'Push config unavailable from backend' };

  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, message: 'Notification permission denied' };
  }

  // Load SW config from backend (no secrets in frontend env)
  const cfgUrl = `${apiBase()}/api/firebase-messaging-config`;
  const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  // Inject config into SW scope via importScripts-compatible endpoint fetch in SW file
  try {
    await fetch(cfgUrl);
  } catch {
    /* SW loads config itself if updated */
  }
  await navigator.serviceWorker.ready;

  messaging = getMessaging(ready.app);
  const token = await getToken(messaging, {
    vapidKey: ready.vapidKey,
    serviceWorkerRegistration: reg,
  });

  if (!token) return { ok: false, message: 'Failed to get FCM token' };

  await fetch(`${apiBase()}/api/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ action: 'register', uid, token }),
  });

  localStorage.setItem('pta_fcm_token', token);

  onMessage(messaging, (payload) => {
    const title = payload.notification?.title || 'PTA';
    const body = payload.notification?.body || '';
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-192x192.png' });
    }
  });

  return { ok: true, token };
}

export async function sendServerPush(
  uid: string,
  title: string,
  message: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${apiBase()}/api/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ action: 'send', uid, title, message }),
    });
    const json = await res.json();
    return { success: !!json.success, message: json.message };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export function getSavedFcmToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pta_fcm_token');
}
