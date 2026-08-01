'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { computeAnalytics, recordTodaySnapshot } from '@/lib/analytics';
import { exportAnalyticsCsv } from '@/lib/exportReports';
import { BarChart3, Download, Lightbulb, TrendingUp } from 'lucide-react';

export function AnalyticsView() {
  const { tasks, sessions, user, todayPlan } = useApp();
  const [range, setRange] = useState(14);

  useEffect(() => {
    recordTodaySnapshot(todayPlan, user);
  }, [todayPlan, user]);

  const analytics = useMemo(
    () => computeAnalytics(tasks, sessions, user, range),
    [tasks, sessions, user, range]
  );

  const maxCompletion = Math.max(...analytics.dailySeries.map((d) => d.completion), 1);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-cyan-400" />
            Advanced Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Consistency, session strength, and execution trends over the last {range} days.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                range === d
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : 'bg-slate-900 border-white/10 text-slate-400'
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            type="button"
            onClick={() => exportAnalyticsCsv(analytics.dailySeries)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 border border-white/10 text-cyan-400"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg completion', value: `${analytics.avgDailyCompletion}%`, color: 'text-cyan-400' },
          { label: 'Consistency', value: `${analytics.consistencyScore}%`, color: 'text-emerald-400' },
          { label: 'Today done', value: `${analytics.completedTasks}/${analytics.totalTasks}`, color: 'text-amber-400' },
          { label: 'Best day', value: analytics.bestDay.slice(5) || '—', color: 'text-violet-400' },
        ].map((card) => (
          <div
            key={card.label}
            className="glass-panel rounded-2xl p-5 border border-white/10 bg-slate-950/60"
          >
            <p className="text-xs font-medium text-slate-400 uppercase">{card.label}</p>
            <p className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 bg-slate-950/80">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-6">
          <TrendingUp className="w-4 h-4 text-cyan-400" /> Daily completion trend
        </h2>
        <div className="flex items-end gap-1.5 h-40">
          {analytics.dailySeries.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-[9px] text-slate-500 opacity-0 group-hover:opacity-100">
                {d.completion}%
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-cyan-700 to-cyan-400 min-h-[4px] transition-all"
                style={{ height: `${(d.completion / maxCompletion) * 100}%` }}
                title={`${d.date}: ${d.completion}%`}
              />
              <span className="text-[9px] text-slate-500 rotate-0 md:rotate-0">
                {d.date.slice(8)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6 border border-white/10 bg-slate-950/80 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Session strength
          </h2>
          {analytics.sessionBreakdown.map((s) => {
            const pct = s.total === 0 ? 0 : Math.round((s.completed / s.total) * 100);
            return (
              <div key={s.session}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">{s.session}</span>
                  <span className="text-slate-400">
                    {s.completed}/{s.total} · {pct}%
                  </span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {analytics.weakestSession && (
            <p className="text-xs text-amber-300/90 pt-2">
              Weakest block: <strong>{analytics.weakestSession}</strong>
            </p>
          )}
        </div>

        <div className="glass-panel rounded-3xl p-6 border border-white/10 bg-slate-950/80 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" /> Insights
          </h2>
          {analytics.insights.map((insight) => (
            <div
              key={insight}
              className="p-3.5 rounded-2xl border border-white/10 bg-slate-900/60 text-sm text-slate-200"
            >
              {insight}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
