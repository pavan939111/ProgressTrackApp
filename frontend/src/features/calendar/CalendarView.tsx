'use client';

import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { ptaStore } from '@/lib/ptaStore';
import { buildIcsFromSessions, downloadIcs } from '@/lib/calendarExport';
import { CalendarIntegrationsPanel } from '@/features/integrations/CalendarIntegrationsPanel';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarView = () => {
  const { sessions, tasks, todayPlan } = useApp();
  const { user } = useAuth();
  const uid = user?.uid || 'demo-user-123';
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayPlan.date);
  const [showIntegrations, setShowIntegrations] = useState(false);

  const monthDays = useMemo(() => ptaStore.calendarMonth(uid, year, month), [uid, year, month, todayPlan, sessions, tasks]);
  const detail = useMemo(() => ptaStore.getDayDetail(uid, selectedDate), [uid, selectedDate, todayPlan, tasks, sessions]);

  const firstDow = (() => {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1; // Monday-first
  })();

  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const exportToday = () => {
    const ics = buildIcsFromSessions(sessions, tasks, todayPlan.date, todayPlan.goal);
    downloadIcs(`pta-${todayPlan.date}.ics`, ics);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-cyan-400" />
            Execution History Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Month view, day drill-down, and calendar sync.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportToday}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted border border-border text-xs font-bold text-cyan-400"
          >
            <Download className="w-3.5 h-3.5" /> Export ICS
          </button>
          <button
            type="button"
            onClick={() => setShowIntegrations((v) => !v)}
            className="px-3 py-2 rounded-xl bg-cyan-600 text-xs font-bold text-foreground"
          >
            {showIntegrations ? 'Hide Sync' : 'Integrations'}
          </button>
        </div>
      </div>

      {showIntegrations && (
        <div className="glass-panel rounded-3xl p-6 border border-border bg-background/80">
          <CalendarIntegrationsPanel />
        </div>
      )}

      <div className="glass-panel rounded-3xl p-4 md:p-6 border border-border bg-background/80 space-y-4">
        <div className="flex items-center justify-between">
          <button type="button" onClick={prevMonth} className="p-2 rounded-xl border border-border" aria-label="Previous month">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display text-lg font-bold text-foreground">{monthLabel}</h2>
          <button type="button" onClick={nextMonth} className="p-2 rounded-xl border border-border" aria-label="Next month">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-[10px] font-bold text-muted-foreground text-center py-1">
              {d}
            </div>
          ))}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {monthDays.map((item) => (
            <button
              key={item.date}
              type="button"
              onClick={() => setSelectedDate(item.date)}
              className={`rounded-xl p-2 md:p-3 border text-left min-h-14 transition-all ${
                item.date === selectedDate
                  ? 'border-cyan-500/80 bg-cyan-950/40'
                  : 'border-border bg-muted/40 hover:border-border'
              }`}
            >
              <p className="text-[10px] text-muted-foreground">{item.date.slice(8)}</p>
              <p className={`text-xs font-bold ${item.completion >= 80 ? 'text-emerald-400' : item.completion ? 'text-amber-300' : 'text-muted-foreground'}`}>
                {item.goal ? `${item.completion}%` : '—'}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-border bg-background/80 space-y-4">
        <h2 className="text-lg font-bold text-foreground">{selectedDate}</h2>
        {detail.plan ? (
          <>
            <p className="text-sm text-muted-foreground">
              Status: <span className="text-foreground font-semibold">{detail.plan.status}</span>
              {' · '}
              Score:{' '}
              <span className="text-cyan-400 font-bold">{detail.plan.completionPercentage}%</span>
            </p>
            <p className="text-sm text-foreground font-medium">{detail.plan.goal}</p>
            {detail.plan.notes && <p className="text-xs text-muted-foreground">{detail.plan.notes}</p>}

            <div>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Tasks</h3>
              {detail.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks for this day.</p>
              ) : (
                <ul className="space-y-2">
                  {detail.tasks.map((t) => (
                    <li
                      key={t.taskId}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl border border-border bg-muted/50 text-sm"
                    >
                      <span className="text-foreground">{t.title}</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        {t.session} · {t.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {detail.report && (
              <div className="p-3 rounded-xl border border-border bg-muted/40 text-xs text-muted-foreground">
                Daily report: {detail.report.completedTasks}/{detail.report.totalTasks} done · generated{' '}
                {new Date(detail.report.generatedAt).toLocaleString()}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No plan recorded for this day.</p>
        )}
      </div>
    </div>
  );
};
