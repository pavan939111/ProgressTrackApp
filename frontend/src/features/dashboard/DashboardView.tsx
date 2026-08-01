'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Check, ArrowRight, Award } from 'lucide-react';

function ProgressRing({ percent, size = 176 }: { percent: number; size?: number }) {
  const stroke = size >= 200 ? 6 : 8;
  const r = (size / 2) - stroke * 1.5;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="transparent"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl md:text-5xl font-bold text-foreground tracking-tighter tabular-nums">
          {percent}%
        </span>
        <span className="text-[10px] md:text-xs text-muted-foreground font-medium tracking-wide uppercase">
          Complete
        </span>
      </div>
    </div>
  );
}

function priorityBadge(priority: string) {
  if (priority === 'High') return { label: 'P1', className: 'bg-danger/10 text-danger' };
  if (priority === 'Medium') return { label: 'P2', className: 'bg-accent/10 text-accent' };
  return { label: 'P3', className: 'bg-primary/10 text-primary' };
}

export const DashboardView = () => {
  const {
    todayPlan,
    sessions,
    tasks,
    weeklyGoals,
    openCheckIn,
    completeTask,
    startTask,
    activeSession,
    nextReminder,
  } = useApp();

  const pct = todayPlan.completionPercentage;
  const focusTasks = tasks.slice(0, 8);

  return (
    <div className="space-y-8 pb-4 font-body">
      {/* Hero — Stitch mobile card / desktop centered */}
      <section className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-0 rounded-2xl pointer-events-none" />
        <div className="relative z-10 w-full flex flex-col items-center">
          <p className="text-muted-foreground text-sm font-medium mb-1 tracking-wide uppercase">
            Today&apos;s goal
          </p>
          <h2 className="font-display text-2xl md:text-4xl font-bold mb-2 text-foreground tracking-tight">
            Execution Phase
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mb-2 line-clamp-2">
            {todayPlan.goal}
          </p>
          {nextReminder && (
            <p className="text-xs text-primary font-semibold mb-6">
              Next reminder: {nextReminder.label} at {nextReminder.time}
              {nextReminder.isTomorrow ? ' (tomorrow)' : ''}
            </p>
          )}
          {!nextReminder && <div className="mb-6" />}

          <div className="mb-8 md:mb-10">
            <div className="md:hidden">
              <ProgressRing percent={pct} size={160} />
            </div>
            <div className="hidden md:block">
              <ProgressRing percent={pct} size={240} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => activeSession && openCheckIn(activeSession)}
            className="w-full max-w-md pulse-btn bg-primary text-primary-foreground font-display font-bold py-4 px-6 rounded-xl hover:brightness-110 transition-all flex justify-center items-center gap-2 active:scale-[0.98] min-h-12 shadow-lg shadow-primary/20"
          >
            Continue {activeSession?.name || 'Morning'} Session
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Session track strip */}
      <section>
        <h3 className="font-display text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
          Session track
        </h3>
        <div className="flex items-center justify-between relative px-1">
          <div className="absolute left-4 right-4 top-4 h-0.5 bg-border -z-0" />
          {(() => {
            const completedCount = sessions.filter((s) => s.status === 'Completed').length;
            const activeIdx = sessions.findIndex((s) => s.status === 'Active');
            const fillTo = activeIdx >= 0 ? activeIdx : completedCount - 1;
            const fillPct =
              sessions.length <= 1 ? 0 : Math.max(0, Math.min(100, (fillTo / (sessions.length - 1)) * 100));
            return (
              <div
                className="absolute left-4 top-4 h-0.5 bg-primary -z-0 transition-all duration-500"
                style={{ width: `calc((100% - 2rem) * ${fillPct / 100})` }}
              />
            );
          })()}
          {sessions.map((session) => {
            const isCompleted = session.status === 'Completed';
            const isActive = session.status === 'Active';
            return (
              <button
                key={session.sessionId}
                type="button"
                onClick={() => openCheckIn(session)}
                className="relative z-10 flex flex-col items-center gap-2 min-w-0 flex-1"
                title={session.name}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-secondary text-secondary-foreground shadow-sm'
                      : isActive
                        ? 'bg-card border-2 border-primary text-primary shadow-md ring-4 ring-primary/15'
                        : 'bg-muted border border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" strokeWidth={3} />
                  ) : isActive ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  ) : null}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground truncate max-w-full px-0.5 hidden sm:block">
                  {session.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Current focus tasks */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-display text-lg font-bold text-foreground">Current focus</h3>
          <span className="text-sm text-muted-foreground font-mono">{focusTasks.length} tasks</span>
        </div>
        <div className="space-y-3">
          {focusTasks.length === 0 && (
            <p className="text-sm text-muted-foreground bg-card border border-border rounded-xl p-5">
              No tasks yet — open Planner to plan tomorrow.
            </p>
          )}
          {focusTasks.map((task) => {
            const isDone = task.status === 'Completed';
            const badge = priorityBadge(task.priority);
            return (
              <label
                key={task.taskId}
                className={`flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm cursor-pointer group hover:border-primary/40 transition-colors min-h-[4.5rem] ${
                  isDone ? 'opacity-60' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => !isDone && completeTask(task.taskId)}
                  className={`relative flex items-center justify-center w-6 h-6 shrink-0 rounded-md border-2 transition-colors ${
                    isDone
                      ? 'bg-secondary border-secondary text-secondary-foreground'
                      : 'border-border group-hover:border-primary'
                  }`}
                  aria-label={isDone ? 'Completed' : 'Complete task'}
                >
                  {isDone && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </button>
                <div className={`flex-1 min-w-0 ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.session}
                    {isDone ? ' · Completed' : ` · ${task.priority} priority · ${task.status}`}
                  </p>
                </div>
                {!isDone && task.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      startTask(task.taskId);
                    }}
                    className="text-[10px] font-bold uppercase text-primary shrink-0 px-2 py-1 border border-primary/30 rounded-lg"
                  >
                    Start
                  </button>
                )}
                {isDone ? (
                  <span className="text-secondary text-xs font-mono font-bold shrink-0">Done</span>
                ) : (
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase shrink-0 ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </section>

      {/* Weekly goals compact */}
      {weeklyGoals.filter((g) => g.status !== 'Archived').length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Weekly goals
          </h3>
          {weeklyGoals
            .filter((g) => g.status !== 'Archived')
            .slice(0, 3)
            .map((goal) => (
              <div key={goal.goalId} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex justify-between gap-2">
                  <h4 className="font-semibold text-foreground text-sm truncate">{goal.title}</h4>
                  <span className="text-xs font-mono font-bold text-primary shrink-0">{goal.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
        </section>
      )}
    </div>
  );
};
