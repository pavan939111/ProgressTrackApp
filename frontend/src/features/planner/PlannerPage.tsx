'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Trash2, Moon, Target, Link2, ArrowRightLeft } from 'lucide-react';
import { Priority, SessionName } from '@/types';
import { VoiceInputButton } from '@/features/voice/VoiceInputButton';
import { ptaStore } from '@/lib/ptaStore';
import { useAuth } from '@/context/AuthContext';

type DraftTask = {
  key: string;
  title: string;
  description: string;
  session: SessionName;
  priority: Priority;
  weeklyGoalId?: string;
};

const SESSION_COLUMNS: { name: SessionName; hint: string }[] = [
  { name: 'Morning', hint: '08:00–11:59' },
  { name: 'Before Lunch', hint: '12:00–13:59' },
  { name: 'Afternoon', hint: '14:00–16:59' },
  { name: 'Evening', hint: '17:00–19:59' },
  { name: 'Night', hint: '20:00–22:00' },
];

function goHome() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('pta-navigate', { detail: { tab: 'dashboard' } }));
}

function newKey() {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyTask(session: SessionName, partial?: Partial<DraftTask>): DraftTask {
  return {
    key: newKey(),
    title: '',
    description: '',
    session,
    priority: 'Medium',
    ...partial,
  };
}

export function PlannerPage() {
  const { saveTomorrowPlan, weeklyGoals, deleteTomorrowPlan } = useApp();
  const { user } = useAuth();
  const uid = user?.uid || 'demo-user-123';

  const [goal, setGoal] = useState('');
  const [notes, setNotes] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [weeklyOpen, setWeeklyOpen] = useState(true);
  const [addTarget, setAddTarget] = useState<Record<string, SessionName>>({});

  // Preload tomorrow's plan if it already exists
  useEffect(() => {
    const bundle = ptaStore.getTomorrowBundle(uid);
    if (bundle.plan) {
      setGoal(bundle.plan.goal || '');
      setNotes(bundle.plan.notes || '');
      if (bundle.tasks.length) {
        setTasks(
          bundle.tasks.map((t) => ({
            key: t.taskId,
            title: t.title,
            description: t.description || '',
            session: t.session,
            priority: t.priority,
            weeklyGoalId: t.weeklyGoalId,
          }))
        );
        return;
      }
    }
    setTasks([]);
  }, [uid]);

  const activeGoals = useMemo(
    () => weeklyGoals.filter((g) => g.status === 'Active'),
    [weeklyGoals]
  );

  const linkedGoalIds = useMemo(
    () => new Set(tasks.map((t) => t.weeklyGoalId).filter(Boolean) as string[]),
    [tasks]
  );

  const bySession = useMemo(() => {
    const map = Object.fromEntries(SESSION_COLUMNS.map((c) => [c.name, [] as DraftTask[]])) as Record<
      SessionName,
      DraftTask[]
    >;
    tasks.forEach((t) => {
      if (map[t.session]) map[t.session].push(t);
      else map.Morning.push(t);
    });
    return map;
  }, [tasks]);

  const updateTask = (key: string, patch: Partial<DraftTask>) => {
    setTasks((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  };

  const removeTask = (key: string) => {
    setTasks((prev) => prev.filter((t) => t.key !== key));
  };

  const addBlank = (session: SessionName) => {
    setTasks((prev) => [...prev, emptyTask(session, { priority: 'High' })]);
  };

  const addFromWeekly = (goalId: string, session: SessionName) => {
    const g = activeGoals.find((x) => x.goalId === goalId);
    if (!g) return;
    setTasks((prev) => [
      ...prev,
      emptyTask(session, {
        title: g.title,
        description: g.description || '',
        priority: g.priority,
        weeklyGoalId: g.goalId,
      }),
    ]);
    setInfo(`Added “${g.title}” to ${session}`);
    window.setTimeout(() => setInfo(null), 2000);
  };

  const syncWeeklyToMorning = () => {
    const missing = activeGoals.filter((g) => !linkedGoalIds.has(g.goalId));
    if (!missing.length) {
      setInfo('All active weekly goals are already on the board');
      window.setTimeout(() => setInfo(null), 2000);
      return;
    }
    setTasks((prev) => [
      ...prev,
      ...missing.map((g) =>
        emptyTask('Morning', {
          title: g.title,
          description: g.description || '',
          priority: g.priority,
          weeklyGoalId: g.goalId,
        })
      ),
    ]);
    setInfo(`Synced ${missing.length} weekly goal${missing.length === 1 ? '' : 's'} into Morning`);
    window.setTimeout(() => setInfo(null), 2500);
  };

  const submit = (asDraft: boolean) => {
    const cleaned = tasks
      .map((t) => ({
        title: t.title.trim(),
        description: t.description.trim() || undefined,
        session: t.session,
        priority: t.priority,
        weeklyGoalId: t.weeklyGoalId,
      }))
      .filter((t) => t.title);

    saveTomorrowPlan({
      goal: goal.trim() || 'Execute top priority tasks',
      notes,
      asDraft,
      tasks: cleaned.length
        ? cleaned
        : [{ title: 'Define first task', session: 'Morning', priority: 'Medium' }],
    });

    setInfo(asDraft ? 'Draft saved' : 'Plan activated');
    if (!asDraft) {
      window.setTimeout(() => goHome(), 600);
    } else {
      // Reload from store so keys stay stable after save
      const bundle = ptaStore.getTomorrowBundle(uid);
      if (bundle.plan) {
        setGoal(bundle.plan.goal || '');
        setNotes(bundle.plan.notes || '');
        setTasks(
          bundle.tasks.map((t) => ({
            key: t.taskId,
            title: t.title,
            description: t.description || '',
            session: t.session,
            priority: t.priority,
            weeklyGoalId: t.weeklyGoalId,
          }))
        );
      }
      window.setTimeout(() => setInfo(null), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(false);
  };

  const tomorrowLabel = ptaStore.tomorrowDate();

  return (
    <div className="space-y-5 pb-4 font-body">
      <header className="flex items-start gap-3">
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl shrink-0">
          <Moon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Night planning</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan {tomorrowLabel} — title + brief in each time column. Pull weekly goals into sessions.
          </p>
        </div>
      </header>

      {info && (
        <p className="text-xs font-semibold text-secondary bg-secondary/10 border border-secondary/25 rounded-xl px-3 py-2.5">
          {info}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <Target className="w-4 h-4 text-primary" /> Tomorrow&apos;s core goal
            </label>
            <VoiceInputButton currentValue={goal} mode="replace" onResult={setGoal} />
          </div>
          <input
            required
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What should tomorrow deliver?"
            className="w-full bg-muted border border-border rounded-xl p-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary min-h-12"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Overall notes (optional)"
            rows={2}
            className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </section>

        {/* Weekly goals dock */}
        <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setWeeklyOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 min-h-12 text-left"
          >
            <span className="text-sm font-bold text-foreground">
              Weekly goals ({activeGoals.length})
            </span>
            <span className="text-xs text-muted-foreground">{weeklyOpen ? 'Hide' : 'Show'}</span>
          </button>
          {weeklyOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={syncWeeklyToMorning}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-xl border border-primary/30 text-xs font-bold text-primary bg-primary/5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Sync unfinished into Morning
                </button>
              </div>
              {activeGoals.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No active weekly goals. Create some under Weekly Goals, then add them here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {activeGoals.map((g) => {
                    const onBoard = linkedGoalIds.has(g.goalId);
                    const target = addTarget[g.goalId] || 'Morning';
                    return (
                      <li
                        key={g.goalId}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border border-border bg-muted/40"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{g.title}</p>
                          {g.description ? (
                            <p className="text-xs text-muted-foreground line-clamp-2">{g.description}</p>
                          ) : null}
                          {onBoard && (
                            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary mt-1">
                              On tomorrow&apos;s board
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={target}
                            onChange={(e) =>
                              setAddTarget((prev) => ({
                                ...prev,
                                [g.goalId]: e.target.value as SessionName,
                              }))
                            }
                            className="bg-card border border-border rounded-lg px-2 py-2 text-xs min-h-11"
                            aria-label={`Session for ${g.title}`}
                          >
                            {SESSION_COLUMNS.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => addFromWeekly(g.goalId, target)}
                            className="px-3 py-2 min-h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                          >
                            Add
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Session columns board */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Session board · {tasks.length} task{tasks.length === 1 ? '' : 's'}
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row lg:overflow-x-auto gap-3 lg:pb-2 lg:snap-x">
            {SESSION_COLUMNS.map((col) => {
              const colTasks = bySession[col.name];
              return (
                <div
                  key={col.name}
                  className="lg:min-w-[240px] lg:max-w-[260px] lg:flex-1 lg:snap-start rounded-2xl border border-border bg-muted/30 flex flex-col"
                >
                  <div className="px-3 py-3 border-b border-border flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">{col.name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{col.hint}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="p-2 space-y-2 flex-1 min-h-[120px]">
                    {colTasks.map((t) => (
                      <article
                        key={t.key}
                        className="rounded-xl border border-border bg-card p-3 space-y-2 shadow-sm"
                      >
                        <input
                          value={t.title}
                          onChange={(e) => updateTask(t.key, { title: e.target.value })}
                          placeholder="Task title"
                          className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none min-h-10 placeholder:text-muted-foreground"
                        />
                        <textarea
                          value={t.description}
                          onChange={(e) => updateTask(t.key, { description: e.target.value })}
                          placeholder="Brief — what / why / outcome"
                          rows={2}
                          className="w-full bg-muted/60 border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/25 resize-none"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={t.priority}
                            onChange={(e) => updateTask(t.key, { priority: e.target.value as Priority })}
                            className="bg-muted border border-border rounded-lg px-2 py-1.5 text-[10px] font-bold min-h-9"
                          >
                            <option value="High">P1</option>
                            <option value="Medium">P2</option>
                            <option value="Low">P3</option>
                          </select>
                          <select
                            value={t.session}
                            onChange={(e) => updateTask(t.key, { session: e.target.value as SessionName })}
                            className="bg-muted border border-border rounded-lg px-2 py-1.5 text-[10px] font-bold min-h-9 max-w-[110px]"
                            aria-label="Move to session"
                          >
                            {SESSION_COLUMNS.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeTask(t.key)}
                            className="p-2 min-h-9 min-w-9 text-muted-foreground hover:text-danger"
                            aria-label="Remove task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {t.weeklyGoalId && (
                          <p className="flex items-center gap-1 text-[10px] font-bold text-secondary">
                            <Link2 className="w-3 h-3" /> Weekly goal
                          </p>
                        )}
                      </article>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addBlank(col.name)}
                    className="m-2 mt-0 flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-11 rounded-xl border border-dashed border-border text-xs font-bold text-primary hover:bg-primary/5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add task
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => {
              deleteTomorrowPlan();
              setGoal('');
              setNotes('');
              setTasks([]);
              setInfo('Tomorrow plan deleted');
              window.setTimeout(() => setInfo(null), 2000);
            }}
            className="px-5 py-3 rounded-xl border border-danger/40 text-xs font-bold text-danger min-h-12"
          >
            Delete tomorrow plan
          </button>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
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
  );
}
