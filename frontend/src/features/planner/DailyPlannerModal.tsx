'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Plus, Trash2, Moon, Target } from 'lucide-react';
import { Priority, SessionName } from '@/types';
import { VoiceInputButton } from '@/features/voice/VoiceInputButton';
import { ptaStore } from '@/lib/ptaStore';
import { useAuth } from '@/context/AuthContext';

export const DailyPlannerModal = () => {
  const { isPlannerOpen, closePlanner, saveTomorrowPlan, weeklyGoals, deleteTomorrowPlan } = useApp();
  const { user } = useAuth();
  const uid = user?.uid || 'demo-user-123';
  const sessionNames = ptaStore.listSessionDefs(uid).map((s) => s.name);
  const [goal, setGoal] = useState('');
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState<
    { title: string; session: SessionName; priority: Priority; weeklyGoalId?: string }[]
  >([{ title: '', session: 'Morning', priority: 'High' }]);

  if (!isPlannerOpen) return null;

  const submit = (asDraft: boolean) => {
    const cleaned = tasks.filter((t) => t.title.trim());
    saveTomorrowPlan({
      goal: goal.trim() || 'Execute top priority tasks',
      notes,
      asDraft,
      tasks: cleaned.length
        ? cleaned
        : [{ title: 'Define first task', session: 'Morning', priority: 'Medium' }],
    });
    setGoal('');
    setNotes('');
    setTasks([{ title: '', session: 'Morning', priority: 'High' }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(false);
  };

  const selectClass =
    'bg-card border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-foreground/40 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 md:p-8 border border-border shadow-2xl relative bg-card text-foreground space-y-6 max-h-[92vh] overflow-y-auto font-body">
        <button
          onClick={closePlanner}
          className="absolute top-5 right-5 p-2.5 text-muted-foreground hover:text-foreground rounded-full bg-muted min-h-11 min-w-11 flex items-center justify-center"
          aria-label="Close planner"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-12">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl">
            <Moon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Night planning</span>
            <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">Plan tomorrow</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <Target className="w-4 h-4 text-primary" /> Core goal
              </label>
              <VoiceInputButton currentValue={goal} mode="replace" onResult={setGoal} />
            </div>
            <input
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Tomorrow's primary outcome"
              className="w-full bg-muted border border-border rounded-xl p-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary min-h-12"
            />
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes / draft thoughts (optional)"
            rows={2}
            className="w-full bg-muted border border-border rounded-xl p-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Session tasks ({tasks.length})
              </label>
              <button
                type="button"
                onClick={() =>
                  setTasks((prev) => [...prev, { title: '', session: 'Morning', priority: 'Medium' }])
                }
                className="flex items-center gap-1 text-xs font-bold text-primary min-h-11 px-2"
              >
                <Plus className="w-4 h-4" /> Add task
              </button>
            </div>

            {tasks.map((t, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center gap-2 p-3.5 rounded-2xl border border-border bg-muted/50"
              >
                <span className="w-1 self-stretch min-h-8 rounded-full bg-primary shrink-0" />
                <input
                  required
                  value={t.title}
                  onChange={(e) => {
                    const updated = [...tasks];
                    updated[idx].title = e.target.value;
                    setTasks(updated);
                  }}
                  placeholder="Task title"
                  className="flex-1 min-w-[140px] bg-transparent text-sm text-foreground focus:outline-none min-h-11"
                />
                <select
                  value={t.session}
                  onChange={(e) => {
                    const updated = [...tasks];
                    updated[idx].session = e.target.value as SessionName;
                    setTasks(updated);
                  }}
                  className={selectClass}
                >
                  {sessionNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={t.priority}
                  onChange={(e) => {
                    const updated = [...tasks];
                    updated[idx].priority = e.target.value as Priority;
                    setTasks(updated);
                  }}
                  className={selectClass}
                >
                  <option value="High">P1 High</option>
                  <option value="Medium">P2 Medium</option>
                  <option value="Low">P3 Low</option>
                </select>
                <select
                  value={t.weeklyGoalId || ''}
                  onChange={(e) => {
                    const updated = [...tasks];
                    updated[idx].weeklyGoalId = e.target.value || undefined;
                    setTasks(updated);
                  }}
                  className={`${selectClass} max-w-[140px]`}
                >
                  <option value="">No weekly goal</option>
                  {weeklyGoals
                    .filter((g) => g.status === 'Active')
                    .map((g) => (
                      <option key={g.goalId} value={g.goalId}>
                        {g.title}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => setTasks((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-2.5 min-h-11 min-w-11 text-muted-foreground hover:text-danger"
                  aria-label="Remove task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                deleteTomorrowPlan();
                closePlanner();
              }}
              className="px-5 py-3 rounded-xl border border-danger/40 text-xs font-bold text-danger min-h-12"
            >
              Delete tomorrow plan
            </button>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={closePlanner}
                className="px-5 py-3 rounded-xl border border-border text-xs font-bold text-muted-foreground min-h-12"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => submit(true)}
                className="px-5 py-3 rounded-xl border border-border text-xs font-bold text-foreground min-h-12"
              >
                Save draft
              </button>
              <button type="submit" className="btn-primary px-6 py-3 text-xs min-h-12">
                Activate plan (+15 XP)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
