'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CalendarConnection, CalendarProvider } from '@/types';
import {
  buildIcsFromSessions,
  downloadIcs,
  loadCalendarConnections,
  openProviderAddEvent,
  saveCalendarConnections,
} from '@/lib/calendarExport';
import { RefreshCw, Download, Link2, Unlink } from 'lucide-react';

const LABELS: Record<CalendarProvider, string> = {
  google: 'Google Calendar',
  outlook: 'Outlook',
  apple: 'Apple Calendar',
  ics: 'ICS File Export',
};

export function CalendarIntegrationsPanel() {
  const { sessions, tasks, todayPlan } = useApp();
  const [connections, setConnections] = useState<CalendarConnection[]>([]);

  useEffect(() => {
    setConnections(loadCalendarConnections());
  }, []);

  const persist = (next: CalendarConnection[]) => {
    setConnections(next);
    saveCalendarConnections(next);
  };

  const connect = (provider: CalendarProvider) => {
    const next = connections.map((c) =>
      c.provider === provider
        ? {
            ...c,
            connected: true,
            accountEmail:
              provider === 'google'
                ? 'demo.user@example.com'
                : provider === 'outlook'
                  ? 'demo.user@example.com'
                  : c.accountEmail || 'local@example.com',
            lastSyncedAt: new Date().toISOString(),
          }
        : c
    );
    persist(next);

    if (provider === 'ics' || provider === 'apple') {
      exportIcs();
      return;
    }

    const first = sessions[0];
    if (first) openProviderAddEvent(provider, first, todayPlan.date, todayPlan.goal);
  };

  const disconnect = (provider: CalendarProvider) => {
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
        c.provider === 'ics'
          ? { ...c, connected: true, lastSyncedAt: new Date().toISOString() }
          : c
      )
    );
  };

  const syncAll = () => {
    exportIcs();
    const google = connections.find((c) => c.provider === 'google' && c.connected);
    const outlook = connections.find((c) => c.provider === 'outlook' && c.connected);
    const first = sessions[0];
    if (first && google) openProviderAddEvent('google', first, todayPlan.date, todayPlan.goal);
    if (first && outlook) openProviderAddEvent('outlook', first, todayPlan.date, todayPlan.goal);
    persist(
      connections.map((c) =>
        c.connected ? { ...c, lastSyncedAt: new Date().toISOString() } : c
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            Calendar Integrations
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Export sessions as ICS or push add-event links to Google / Outlook. Full OAuth sync
            uses your provider credentials when configured.
          </p>
        </div>
        <button
          type="button"
          onClick={syncAll}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
        >
          <Download className="w-3.5 h-3.5" />
          Sync / Export
        </button>
      </div>

      <div className="space-y-2">
        {connections.map((c) => (
          <div
            key={c.provider}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-slate-900/60"
          >
            <div>
              <p className="text-sm font-semibold text-white">{LABELS[c.provider]}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {c.connected
                  ? `Connected${c.accountEmail ? ` · ${c.accountEmail}` : ''}${
                      c.lastSyncedAt
                        ? ` · synced ${new Date(c.lastSyncedAt).toLocaleString()}`
                        : ''
                    }`
                  : 'Not connected'}
              </p>
            </div>
            {c.connected && c.provider !== 'ics' ? (
              <button
                type="button"
                onClick={() => disconnect(c.provider)}
                className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300"
              >
                <Unlink className="w-3.5 h-3.5" /> Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => connect(c.provider)}
                className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300"
              >
                <Link2 className="w-3.5 h-3.5" />
                {c.provider === 'ics' || c.provider === 'apple' ? 'Download ICS' : 'Connect'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
