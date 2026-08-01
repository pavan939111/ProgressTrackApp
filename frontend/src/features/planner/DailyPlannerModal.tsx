"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Plus, Trash2, Moon, Target } from 'lucide-react';
import { Priority, SessionName } from '@/types';
import { apiClient } from '@/services/api/apiClient';
import { VoiceInputButton } from '@/features/voice/VoiceInputButton';

export const DailyPlannerModal = () => {
  const { isPlannerOpen, closePlanner, triggerConfetti } = useApp();
  const [goal, setGoal] = useState('');
  const [tasks, setTasks] = useState<{ title: string; session: SessionName; priority: Priority }[]>([
    { title: 'Morning deep work session', session: 'Morning', priority: 'High' },
    { title: 'Afternoon client architecture sync', session: 'Afternoon', priority: 'Medium' },
  ]);

  if (!isPlannerOpen) return null;

  const handleAddTask = () => {
    setTasks((prev) => [...prev, { title: '', session: 'Morning', priority: 'Medium' }]);
  };

  const handleRemoveTask = (idx: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const planPayload = {
      planId: `dp-${tomorrow}`,
      uid: 'demo-user-123',
      date: tomorrow,
      title: 'High Focus Tomorrow Plan',
      goal: goal || 'Execute top priority tasks',
      overallPriority: 'High',
      completionPercentage: 0,
      completedTasks: 0,
      pendingTasks: tasks.length,
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    apiClient.saveDailyPlan(planPayload).then(() => {
      triggerConfetti();
      closePlanner();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="glass-modal w-full max-w-2xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl relative bg-slate-950/95 text-white space-y-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={closePlanner}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-950/60 border border-violet-800/40 rounded-2xl">
            <Moon className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">Night Planning Flow</span>
            <h2 className="text-2xl font-extrabold text-white mt-0.5">Plan Tomorrow&apos;s Sessions</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Target className="w-4 h-4 text-cyan-400" />
                Tomorrow&apos;s Core Focus & Goal
              </label>
              <VoiceInputButton
                currentValue={goal}
                onResult={setGoal}
                mode="replace"
              />
            </div>
            <input
              type="text"
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Ship Vercel Frontend & verify API integration"
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Session Breakdown Tasks ({tasks.length})
              </label>
              <button
                type="button"
                onClick={handleAddTask}
                className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>

            <div className="space-y-3">
              {tasks.map((t, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-3 p-3 rounded-2xl border border-white/10 bg-slate-900/60">
                  <input
                    type="text"
                    required
                    value={t.title}
                    onChange={(e) => {
                      const updated = [...tasks];
                      updated[idx].title = e.target.value;
                      setTasks(updated);
                    }}
                    placeholder="Task title..."
                    className="flex-1 min-w-[140px] bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                  <VoiceInputButton
                    currentValue={t.title}
                    mode="replace"
                    onResult={(text) => {
                      const updated = [...tasks];
                      updated[idx].title = text;
                      setTasks(updated);
                    }}
                  />
                  <select
                    value={t.session}
                    onChange={(e) => {
                      const updated = [...tasks];
                      updated[idx].session = e.target.value as SessionName;
                      setTasks(updated);
                    }}
                    className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Before Lunch">Before Lunch</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={closePlanner}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg transition-all"
            >
              Save Tomorrow Plan (+100 XP)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
