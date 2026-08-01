'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Award, Plus, Archive, Trash2, Pencil } from 'lucide-react';
import { Priority } from '@/types';

export const WeeklyGoalsView = () => {
  const { weeklyGoals, createGoal, updateGoal, deleteGoal, archiveGoal, triggerConfetti } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('High');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createGoal({ title: title.trim(), description, priority });
    setTitle('');
    setDescription('');
    triggerConfetti();
  };

  const active = weeklyGoals.filter((g) => g.status !== 'Archived');
  const archived = weeklyGoals.filter((g) => g.status === 'Archived');

  const fieldClass =
    'bg-muted border border-border rounded-xl p-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary min-h-12';

  return (
    <div className="space-y-8 pb-8 font-body">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Outcomes</p>
        <h1 className="font-display text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
          <Award className="w-7 h-7 text-primary" />
          Weekly goals
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create and track weekly objectives linked to daily tasks.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" /> Create weekly goal
        </h2>
        <form onSubmit={handleCreateGoal} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Goal title (required)"
            className={fieldClass}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Success metric…"
            className={fieldClass}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={fieldClass}
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <button type="submit" className="btn-primary min-h-12 text-sm">
            Add goal (+100 XP)
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {active.length === 0 && (
          <p className="text-sm text-muted-foreground bg-card border border-border rounded-xl p-5">
            No active weekly goals yet.
          </p>
        )}
        {active.map((goal) => (
          <div key={goal.goalId} className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
            {editingId === goal.goalId ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  updateGoal(goal.goalId, { title: editTitle });
                  setEditingId(null);
                }}
              >
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={`flex-1 ${fieldClass}`}
                />
                <button type="submit" className="text-xs font-bold text-primary px-3 min-h-12">
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-primary tracking-wider">
                    {goal.priority} · {goal.status}
                  </p>
                  <h3 className="font-display text-lg font-bold text-foreground mt-1">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2 font-mono">
                    Week {goal.weekStart} → {goal.weekEnd}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(goal.goalId);
                      setEditTitle(goal.title);
                    }}
                    className="p-2.5 min-h-11 min-w-11 text-muted-foreground hover:text-foreground"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => archiveGoal(goal.goalId)}
                    className="p-2.5 min-h-11 min-w-11 text-muted-foreground hover:text-accent"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteGoal(goal.goalId)}
                    className="p-2.5 min-h-11 min-w-11 text-muted-foreground hover:text-danger"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-primary font-bold font-mono tabular-nums">
                  {goal.progress}% · {goal.completedTasks}/{goal.totalTasks}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {archived.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Archived</h2>
          {archived.map((g) => (
            <div
              key={g.goalId}
              className="flex justify-between items-center p-3.5 rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground"
            >
              <span>{g.title}</span>
              <button
                type="button"
                onClick={() => deleteGoal(g.goalId)}
                className="text-danger text-xs font-bold min-h-11 px-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
