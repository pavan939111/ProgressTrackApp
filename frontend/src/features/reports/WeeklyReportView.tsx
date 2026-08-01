'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { BarChart3, Trophy } from 'lucide-react';

export const WeeklyReportView = () => {
  const { user, weeklyReports, weeklyGoals } = useApp();
  const report = weeklyReports[weeklyReports.length - 1];

  return (
    <div className="space-y-6 font-body">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Consistency</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-primary" />
          Weekly report
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          {report ? `${report.weekStart} → ${report.weekEnd}` : 'Generate a weekly report to see aggregates'}
        </p>
      </div>

      <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-sm space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full">
              Weekly aggregate
            </span>
            <h2 className="font-display text-2xl font-bold text-foreground mt-3">
              Consistency: {report?.consistencyScore ?? 0}%
            </h2>
          </div>
          <Trophy className="w-10 h-10 text-accent shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
          <div className="p-4 bg-muted/60 rounded-2xl border border-border">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Tasks completed</p>
            <p className="text-2xl font-display font-bold text-secondary mt-1 tabular-nums">
              {report?.completedTasks ?? 0}
            </p>
          </div>
          <div className="p-4 bg-muted/60 rounded-2xl border border-border">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Streak</p>
            <p className="text-2xl font-display font-bold text-accent mt-1 tabular-nums">{user.streak}d</p>
          </div>
          <div className="p-4 bg-muted/60 rounded-2xl border border-border">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Completion</p>
            <p className="text-2xl font-display font-bold text-primary mt-1 tabular-nums">
              {report?.completionPercentage ?? 0}%
            </p>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-[10px] uppercase text-muted-foreground font-bold mb-2 tracking-wider">Goal summary</p>
          <p className="text-sm text-foreground">
            {report?.weeklyGoalSummary ||
              weeklyGoals
                .filter((g) => g.status === 'Active')
                .map((g) => `${g.title} (${g.progress}%)`)
                .join('; ') ||
              'No goals yet'}
          </p>
        </div>
      </div>
    </div>
  );
};
