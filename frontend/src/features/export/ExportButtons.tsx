'use client';

import React from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  buildDailyPdfPayload,
  exportDailyReportCsv,
  exportReportPdf,
  exportWeeklyReportCsv,
} from '@/lib/exportReports';

export function ExportButtons({ variant = 'daily' }: { variant?: 'daily' | 'weekly' }) {
  const { todayPlan, tasks, user, weeklyReports, dailyReports } = useApp();

  const onCsv = () => {
    if (variant === 'weekly') {
      const report = weeklyReports[0] || {
        reportId: 'wr-fallback',
        uid: user.uid,
        weekStart: todayPlan.date,
        weekEnd: todayPlan.date,
        completedTasks: todayPlan.completedTasks,
        pendingTasks: todayPlan.pendingTasks,
        completionPercentage: todayPlan.completionPercentage,
        achievements: [],
        weeklyGoalSummary: todayPlan.goal,
        consistencyScore: user.streak * 10,
        generatedAt: new Date().toISOString(),
      };
      exportWeeklyReportCsv(report, user);
      return;
    }
    exportDailyReportCsv(todayPlan, tasks, user);
  };

  const onPdf = () => {
    if (variant === 'weekly') {
      const report = weeklyReports[0];
      exportReportPdf({
        title: `Weekly Report â€” ${report?.weekStart || todayPlan.date}`,
        subtitle: user.fullName,
        stats: [
          { label: 'Completion', value: `${report?.completionPercentage ?? todayPlan.completionPercentage}%` },
          { label: 'Consistency', value: `${report?.consistencyScore ?? user.streak * 10}` },
          { label: 'Done', value: String(report?.completedTasks ?? todayPlan.completedTasks) },
          { label: 'Pending', value: String(report?.pendingTasks ?? todayPlan.pendingTasks) },
        ],
        sections: [
          {
            heading: 'Summary',
            lines: [
              report?.weeklyGoalSummary || todayPlan.goal,
              ...(report?.achievements || ['Keep executing daily sessions.']),
            ],
          },
        ],
      });
      return;
    }
    exportReportPdf(buildDailyPdfPayload(todayPlan, tasks, user, dailyReports[0]));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onCsv}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted border border-border text-xs font-bold text-secondary hover:border-emerald-500/40"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        Export CSV
      </button>
      <button
        type="button"
        onClick={onPdf}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted border border-border text-xs font-bold text-primary hover:border-primary/40"
      >
        <FileText className="w-3.5 h-3.5" />
        Export PDF
      </button>
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Download className="w-3 h-3" /> PDF opens print dialog â€” choose Save as PDF
      </span>
    </div>
  );
}
