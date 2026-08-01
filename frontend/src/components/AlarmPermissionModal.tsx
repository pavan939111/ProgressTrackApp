'use client';

import React, { useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { notificationsSupported } from '@/lib/reminders';

const SEEN_KEY = 'pta_alarm_perm_modal_seen';

/** Full-screen style prompt so the system permission dialog is offered on first login. */
export function AlarmPermissionModal() {
  const { enableNotifications } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !notificationsSupported()) return;
    if (Notification.permission !== 'default') return;
    try {
      if (localStorage.getItem(SEEN_KEY) === '1') return;
    } catch {
      /* show anyway */
    }
    const t = window.setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  const close = (remember: boolean) => {
    setOpen(false);
    if (remember) {
      try {
        localStorage.setItem(SEEN_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  };

  const onAllow = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await enableNotifications();
      setMsg(res.message);
      if (res.ok) {
        close(true);
        return;
      }
      // Keep modal open with message if denied / needs install
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alarm-perm-title"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h2 id="alarm-perm-title" className="text-lg font-bold text-foreground">
                Turn on session alarms?
              </h2>
              <p className="text-xs text-muted-foreground">Required for reminders at your set times</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => close(true)}
            className="p-2 text-muted-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          PTA will ask your phone for <strong className="text-foreground">notification permission</strong>.
          There is no separate Alarm permission on the web — Allow Notifications so session alarms can
          reach you.
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onAllow()}
            className="w-full min-h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60"
          >
            {busy ? 'Waiting for your choice…' : 'Allow alarms'}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className="w-full min-h-11 rounded-xl border border-border text-sm font-bold text-muted-foreground"
          >
            Not now
          </button>
        </div>
        {msg && <p className="text-xs font-semibold text-secondary">{msg}</p>}
      </div>
    </div>
  );
}
