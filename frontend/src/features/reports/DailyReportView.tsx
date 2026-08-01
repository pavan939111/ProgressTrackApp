'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FileText, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import { ExportButtons } from '@/features/export/ExportButtons';
import { WeeklyReportView } from '@/features/reports/WeeklyReportView';

export const DailyReportView = () => {
  const { todayPlan, user, tasks, dailyReports, generateDailyReport, generateWeeklyReport } = useApp();
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily');

  const report = dailyReports.find((r) => r.date === todayPlan.date);
  const completed = tasks.filter((t) => t.status === 'Completed');
  const wins = report?.achievements?.length ? report.achievements : completed.map((t) => t.title);

  const ModeToggle = () => (
    <div className="flex p-1 rounded-xl bg-muted gap-1">
      {(['daily', 'weekly'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`px-4 py-2 min-h-11 rounded-lg text-xs font-bold capitalize transition-all ${
            mode === m
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );

  if (mode === 'weekly') {
    return (
      <div className="space-y-6 font-body pb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <ModeToggle />
          <div className="flex gap-2 items-center flex-wrap">
            <button
              type="button"
              onClick={() => generateWeeklyReport()}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border border-border text-primary bg-card min-h-11"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
            </button>
            <ExportButtons variant="weekly" />
          </div>
        </div>
        <WeeklyReportView />
      </div>
    );
  }

  const metrics = [
    { label: 'Execution', value: `${todayPlan.completionPercentage}%`, color: 'text-primary' },
    { label: 'Completed', value: String(todayPlan.completedTasks), color: 'text-secondary' },
    { label: 'Pending', value: String(todayPlan.pendingTasks), color: 'text-accent' },
    { label: 'Streak', value: `${user.streak}d`, color: 'text-primary' },
  ];

  return (
    <div className="space-y-8 pb-8 font-body">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Accountability</p>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary" />
            Daily report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Snapshot for {todayPlan.date}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <ModeToggle />
          <div className="flex gap-2 items-center flex-wrap">
            <button
              type="button"
              onClick={() => generateDailyReport()}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border border-border text-primary bg-card min-h-11"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Generate
            </button>
            <ExportButtons variant="daily" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{m.label}</p>
            <p className={`text-2xl md:text-3xl font-display font-black mt-1 tabular-nums ${m.color}`}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-4">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" /> Wins
        </h2>
        <ul className="space-y-2.5 text-sm text-foreground">
          {wins.length === 0 ? (
            <li className="text-muted-foreground italic text-xs">Generate a report or complete tasks.</li>
          ) : (
            wins.map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>{line}</span>
              </li>
            ))
          )}
        </ul>
        {report?.reflection && (
          <p className="text-sm text-muted-foreground border-t border-border pt-4">
            Reflection: {report.reflection}
          </p>
        )}
      </div>
    </div>
  );
};
