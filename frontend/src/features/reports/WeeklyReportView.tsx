"use client";

import React from 'react';
import { useApp } from '@/context/AppContext';
import { BarChart3, Trophy, Flame, Zap } from 'lucide-react';

export const WeeklyReportView = () => {
  const { user } = useApp();

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-violet-400" />
          Weekly Consistency Report
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Weekly aggregate execution score and streak metrics
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-8 border border-white/10 bg-slate-950/80 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="px-3 py-1 text-xs font-semibold text-violet-400 bg-violet-950/60 border border-violet-800/40 rounded-full">
              Weekly Aggregate
            </span>
            <h2 className="text-2xl font-bold text-white mt-2">Week Consistency Score: 92%</h2>
          </div>
          <Trophy className="w-10 h-10 text-amber-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5">
            <p className="text-xs font-medium text-slate-400 uppercase">Tasks Completed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">28 Tasks</p>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5">
            <p className="text-xs font-medium text-slate-400 uppercase">Streak Maintained</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{user.streak} Days 🔥</p>
          </div>
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5">
            <p className="text-xs font-medium text-slate-400 uppercase">XP Earned This Week</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">+1,250 XP ⚡</p>
          </div>
        </div>
      </div>
    </div>
  );
};
