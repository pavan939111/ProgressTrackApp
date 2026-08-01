'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { CalendarProvider } from '@/types';
import {
  buildIcsFromSessions,
  downloadIcs,
  loadCalendarConnections,
  saveCalendarConnections,
} from '@/lib/calendarExport';
import {
  disconnectCalendar,
  fetchCalendarStatus,
  loadPulledEvents,
  savePulledEvents,
  startGoogleOAuth,
  syncCalendarTwoWay,
  type PulledEvent,
} from '@/lib/calendarOAuthClient';
import { RefreshCw, Download, Link2, Unlink, ArrowDownUp } from 'lucide-react';

const LABELS: Record<CalendarProvider, string> = {
  google: 'Google Calendar',
  apple: 'Apple Calendar',
  ics: 'ICS File Export',
};

export function CalendarIntegrationsPanel() {
  const { sessions, tasks, todayPlan } = useApp();
  const { user } = useAuth();
  const uid = user?.uid || 'demo-user-123';
  const [connections, setConnections] = useState(loadCalendarConnections());
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pulled, setPulled] = useState<PulledEvent[]>(loadPulledEvents());
  const [serverStatus, setServerStatus] = useState<any>(null);

  const refreshStatus = useCallback(async () => {
    const res = await fetchCalendarStatus(uid);
    if (res.success) {
      setServerStatus(res.data);
      const next = loadCalendarConnections().map((c) => {
        if (c.provider === 'google' && res.data.google?.connected) {
          return {
            ...c,
            connected: true,
            accountEmail: res.data.google.email,
            lastSyncedAt: res.data.google.updatedAt,
          };
        }
        if (c.provider === 'google' && res.data.google && !res.data.google.connected) {
          return { ...c, connected: false, accountEmail: undefined };
        }
        return c;
      });
      setConnections(next);
      saveCalendarConnections(next);
    }
  }, [uid]);

  useEffect(() => {
    void refreshStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar') === 'connected') {
      setStatusMsg(`Connected ${params.get('provider')} (${params.get('email') || 'ok'})`);
      void refreshStatus();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('calendar') === 'error') {
      setStatusMsg(`OAuth error: ${params.get('message') || 'failed'}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshStatus]);

  const persist = (next: typeof connections) => {
    setConnections(next);
    saveCalendarConnections(next);
  };

  const connect = async (provider: CalendarProvider) => {
    if (provider === 'google') {
      if (serverStatus && serverStatus.googleConfigured === false) {
        setStatusMsg('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the backend.');
        return;
      }
      startGoogleOAuth(uid, '/');
      return;
    }
    if (provider === 'ics' || provider === 'apple') {
      exportIcs();
    }
  };

  const disconnect = async (provider: CalendarProvider) => {
    if (provider === 'google') {
      await disconnectCalendar(uid, provider);
      await refreshStatus();
    }
    persist(
      connections.map((c) =>
        c.provider === provider ? { ...c, connected: false, accountEmail: undefined } : c
      )
    );
  };

  const exportIcs = () => {
    const ics = buildIcsFromSessions(sessions, tasks, todayPlan.date, todayPlan.goal);
    downloadIcs(`pta-${todayPlan.date}.ics`, ics);
    persist(
      connections.map((c) =>
        c.provider === 'ics' ? { ...c, connected: true, lastSyncedAt: new Date().toISOString() } : c
      )
    );
  };

  const runSync = async (direction: 'push' | 'pull' | 'both') => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await syncCalendarTwoWay({
        uid,
        provider: 'google',
        direction,
        date: todayPlan.date,
        goal: todayPlan.goal,
        sessions,
        tasks,
      });
      if (!res.success) {
        setStatusMsg(res.message || 'Sync failed');
      } else {
        const pulledEvents = (res.data?.googlePull || []) as PulledEvent[];
        if (pulledEvents.length) {
          savePulledEvents(pulledEvents);
          setPulled(pulledEvents);
        }
        setStatusMsg(
          direction === 'pull'
            ? `Pulled ${pulledEvents.length} events`
            : direction === 'push'
              ? 'Pushed PTA sessions to calendar'
              : 'Two-way sync complete'
        );
        persist(
          connections.map((c) =>
            c.connected ? { ...c, lastSyncedAt: new Date().toISOString() } : c
          )
        );
      }
    } catch (e: any) {
      setStatusMsg(e.message || 'Sync error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            Calendar OAuth Sync
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Google Calendar OAuth with push (PTA → calendar) and pull (calendar → PTA). Apple and ICS use file export.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => runSync('both')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-cyan-500 text-foreground text-xs font-bold disabled:opacity-50"
        >
          <ArrowDownUp className="w-3.5 h-3.5" />
          Sync Google
        </button>
      </div>

      {statusMsg && (
        <p className="text-xs text-primary bg-cyan-950/30 border border-cyan-800/40 rounded-xl px-3 py-2">
          {statusMsg}
        </p>
      )}

      <div className="space-y-2">
        {connections.map((c) => (
          <div
            key={c.provider}
            className="flex flex-col gap-2 p-3.5 rounded-2xl border border-border bg-muted/60"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{LABELS[c.provider]}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {c.connected
                    ? `Connected${c.accountEmail ? ` · ${c.accountEmail}` : ''}${
                        c.lastSyncedAt ? ` · ${new Date(c.lastSyncedAt).toLocaleString()}` : ''
                      }`
                    : 'Not connected'}
                </p>
              </div>
              {c.connected && c.provider !== 'ics' && c.provider !== 'apple' ? (
                <button
                  type="button"
                  onClick={() => void disconnect(c.provider)}
                  className="flex items-center gap-1 text-xs font-bold text-rose-400"
                >
                  <Unlink className="w-3.5 h-3.5" /> Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void connect(c.provider)}
                  className="flex items-center gap-1 text-xs font-bold text-primary"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {c.provider === 'ics' || c.provider === 'apple' ? 'Download ICS' : 'Connect OAuth'}
                </button>
              )}
            </div>
            {c.connected && c.provider === 'google' && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runSync('push')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-border text-emerald-300"
                >
                  Push sessions →
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runSync('pull')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-border text-primary"
                >
                  ← Pull events
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runSync('both')}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-primary/40 text-primary"
                >
                  Two-way
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={exportIcs}
        className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground"
      >
        <Download className="w-3.5 h-3.5" /> Also export ICS
      </button>

      {pulled.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-bold uppercase text-muted-foreground">Pulled external events</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {pulled.slice(0, 20).map((e) => (
              <div key={`${e.provider}-${e.id}`} className="text-xs text-muted-foreground p-2 rounded-lg bg-background/60 border border-border">
                <span className="text-primary font-bold uppercase">{e.provider}</span> · {e.title}
                <div className="text-[10px] text-muted-foreground">{e.start}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
