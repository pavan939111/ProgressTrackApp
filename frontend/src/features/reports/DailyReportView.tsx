"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FileText, CheckCircle2, Sparkles } from 'lucide-react';
import { ExportButtons } from '@/features/export/ExportButtons';
import { WeeklyReportView } from '@/features/reports/WeeklyReportView';

export const DailyReportView = () => {
  const { todayPlan, user, tasks } = useApp();
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily');

  const completed = tasks.filter((t) => t.status === 'Completed');

  if (mode === 'weekly') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('daily')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-slate-900 border-white/10 text-slate-400"
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setMode('weekly')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-cyan-600 border-cyan-500 text-white"
            >
              Weekly
            </button>
          </div>
          <ExportButtons variant="weekly" />
        </div>
        <WeeklyReportView />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-cyan-400" />
            Automated Executive Daily Report
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generated accountability snapshot for {todayPlan.date}
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('daily')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-cyan-600 border-cyan-500 text-white"
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setMode('weekly')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-slate-900 border-white/10 text-slate-400"
            >
              Weekly
            </button>
          </div>
          <ExportButtons variant="daily" />
        </div>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-white/10 bg-slate-950/60">
          <p className="text-xs font-medium text-slate-400 uppercase">Execution Score</p>
          <p className="text-3xl font-black text-cyan-400 mt-1">{todayPlan.completionPercentage}%</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-white/10 bg-slate-950/60">
          <p className="text-xs font-medium text-slate-400 uppercase">Tasks Completed</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{todayPlan.completedTasks}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-white/10 bg-slate-950/60">
          <p className="text-xs font-medium text-slate-400 uppercase">Tasks Pending</p>
          <p className="text-3xl font-black text-amber-400 mt-1">{todayPlan.pendingTasks}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-white/10 bg-slate-950/60">
          <p className="text-xs font-medium text-slate-400 uppercase">Streak Maintained</p>
          <p className="text-3xl font-black text-violet-400 mt-1">{user.streak} Days 🔥</p>
        </div>
      </div>

      {/* Report Breakdown */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 bg-slate-950/80 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Key Accomplishments & Wins
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {completed.length === 0 ? (
              <li className="text-slate-500 italic text-xs">No completed tasks yet today.</li>
            ) : (
              completed.map((t) => (
                <li key={t.taskId} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {t.title}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
