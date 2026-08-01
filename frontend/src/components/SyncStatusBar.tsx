'use client';

import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { getSyncQueue } from '@/lib/offlineSync';

export type SyncUiStatus = 'synced' | 'syncing' | 'pending' | 'offline';

export function SyncStatusBar({ className = '' }: { className?: string }) {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tick = () => {
      setOnline(navigator.onLine);
      setPending(getSyncQueue().length);
    };
    tick();
    const id = window.setInterval(tick, 2500);
    const onOnline = () => {
      setOnline(true);
      setSyncing(true);
      window.setTimeout(() => setSyncing(false), 1200);
      tick();
    };
    const onOffline = () => {
      setOnline(false);
      tick();
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('storage', tick);
    window.addEventListener('pta-sync-queue', tick);
    return () => {
      clearInterval(id);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('storage', tick);
      window.removeEventListener('pta-sync-queue', tick);
    };
  }, []);

  const status: SyncUiStatus = !online
    ? 'offline'
    : syncing
      ? 'syncing'
      : pending > 0
        ? 'pending'
        : 'synced';

  const label =
    status === 'offline'
      ? 'Offline'
      : status === 'syncing'
        ? 'Syncing…'
        : status === 'pending'
          ? `Pending (${pending})`
          : 'Synced';

  const color =
    status === 'offline'
      ? 'text-amber-500 border-amber-500/40'
      : status === 'pending'
        ? 'text-accent border-accent/40'
        : status === 'syncing'
          ? 'text-primary border-primary/40'
          : 'text-emerald-500 border-emerald-500/30';

  const Icon = status === 'offline' ? CloudOff : status === 'syncing' ? RefreshCw : Cloud;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${color} bg-card/80 ${className}`}
      title={`Sync status: ${label}`}
      role="status"
    >
      <Icon className={`w-3 h-3 ${status === 'syncing' ? 'animate-spin' : ''}`} />
      {label}
    </div>
  );
}
