"use client";

import React from 'react';
import { useApp } from '@/context/AppContext';
import { FileText, CheckCircle2, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';

export const DailyReportView = () => {
  const { todayPlan, user } = useApp();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-cyan-400" />
            Automated Executive Daily Report
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generated accountability snapshot for {todayPlan.date}
          </p>
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
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Connected Live Firebase & Firestore Database (pta-1-8f439) with 13 security-bound collections.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Integrated Cloudinary image transformation URLs (square crop, quality auto).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
