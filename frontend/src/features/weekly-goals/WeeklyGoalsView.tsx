"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Award, Plus, Target, CheckCircle2, Flag } from 'lucide-react';
import { apiClient } from '@/services/api/apiClient';

export const WeeklyGoalsView = () => {
  const { weeklyGoals, triggerConfetti } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    apiClient
      .saveWeeklyGoal({
        title,
        description,
        priority: 'High',
        weekStart: '2026-07-27',
        weekEnd: '2026-08-02',
        status: 'Active',
      })
      .then(() => {
        triggerConfetti();
        setTitle('');
        setDescription('');
      });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Award className="w-8 h-8 text-violet-400" />
            Weekly High-Outcome Goals
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Align daily sessions with macro outcomes for maximum momentum.
          </p>
        </div>
      </div>

      {/* Create New Goal Card */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 bg-slate-950/80">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-cyan-400" />
          Create New Weekly Outcome Goal
        </h2>

        <form onSubmit={handleCreateGoal} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Goal Title..."
            className="bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key success metric or description..."
            className="bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            Add Goal (+200 XP)
          </button>
        </form>
      </div>

      {/* Active Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {weeklyGoals.map((goal) => (
          <div key={goal.goalId} className="glass-panel rounded-3xl p-6 border border-white/10 space-y-5 bg-slate-950/60">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 text-xs font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 rounded-full">
                {goal.priority} Priority Goal
              </span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <Flag className="w-4 h-4" /> {goal.progress}% Completed
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">{goal.title}</h3>
              {goal.description && <p className="text-sm text-slate-300 mt-1">{goal.description}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Task Completion Progress</span>
                <span>{goal.completedTasks} / {goal.totalTasks} Tasks</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
