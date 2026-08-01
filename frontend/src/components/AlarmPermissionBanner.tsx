'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellRing, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  getNotificationPermission,
  isIosDevice,
  isStandalonePwa,
  notificationsSupported,
} from '@/lib/reminders';
import { usePwa } from '@/components/PwaRegister';

const DISMISS_KEY = 'pta_alarm_perm_dismissed';

/**
 * Visible alarm/notification permission CTA — browsers only show the system
 * prompt after a user tap; this banner is that tap target.
 */
export function AlarmPermissionBanner() {
  const { enableNotifications, settings } = useApp();
  const { isStandalone } = usePwa();
  const [perm, setPerm] = useState<string>('default');
  const [dismissed, setDismissed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
    if (!notificationsSupported()) {
      setPerm('unsupported');
      return;
    }
    setPerm(Notification.permission);
    const id = window.setInterval(() => setPerm(Notification.permission), 2000);
    return () => clearInterval(id);
  }, []);

  const needsPermission = perm === 'default' || perm === 'prompt';
  const blocked = perm === 'denied';
  const grantedButOff = perm === 'granted' && !settings.notificationsEnabled;
  const iosNeedsInstall = isIosDevice() && !isStandalonePwa() && !isStandalone && perm !== 'granted';

  // Hide when fully set up
  if (perm === 'granted' && settings.notificationsEnabled) return null;
  if (perm === 'unsupported') return null;
  if (dismissed && !needsPermission && !grantedButOff) return null;
  // Always show when not yet asked (ignore dismiss for first-time prompt)
  if (dismissed && needsPermission) {
    /* still show — permission never requested */
  } else if (dismissed && blocked) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const onAllow = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await enableNotifications();
      setMsg(res.message);
      setPerm(getNotificationPermission());
      if (res.ok) {
        try {
          localStorage.removeItem(DISMISS_KEY);
        } catch {
          /* ignore */
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="mb-4 rounded-2xl border-2 border-primary/40 bg-primary/10 p-4 flex items-start gap-3 shadow-sm"
      role="region"
      aria-label="Alarm permission"
    >
      <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
        <BellRing className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="text-sm font-bold text-foreground">Allow session alarms</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {iosNeedsInstall
              ? 'On iPhone: install PTA to Home Screen first, open it from the icon, then tap Allow below so session alarms can notify you.'
              : blocked
                ? 'Notifications are blocked for PTA. Open your phone/browser site settings → Notifications → Allow, then tap Retry.'
                : grantedButOff
                  ? 'Notifications are allowed, but reminders are turned off. Tap to turn session alarms on.'
                  : 'PTA needs notification permission for session alarms and 5‑minute progress reminders. Tap Allow — your phone will ask for permission.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onAllow()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60"
          >
            <Bell className="w-3.5 h-3.5" />
            {busy ? 'Requesting…' : blocked ? 'Retry permission' : 'Allow alarms'}
          </button>
          {!needsPermission && (
            <button
              type="button"
              onClick={dismiss}
              className="px-3 py-2.5 min-h-11 rounded-xl border border-border text-xs font-bold text-muted-foreground"
            >
              Not now
            </button>
          )}
          {needsPermission && (
            <button
              type="button"
              onClick={dismiss}
              className="px-3 py-2.5 min-h-11 rounded-xl border border-border text-xs font-bold text-muted-foreground"
            >
              Later
            </button>
          )}
        </div>
        {msg && <p className="text-xs font-semibold text-secondary">{msg}</p>}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="p-2 text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Dismiss alarm permission"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
