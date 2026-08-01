'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Team } from '@/types';
import {
  createTeam,
  getActiveTeamId,
  getSharedGoals,
  joinTeamByCode,
  loadTeams,
  setActiveTeamId,
  shareGoalWithTeam,
} from '@/lib/teamsStore';
import { Users, Copy, UserPlus, Share2, Check } from 'lucide-react';

export function TeamsView() {
  const { user, weeklyGoals } = useApp();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = () => {
    setTeams(loadTeams());
    setActiveId(getActiveTeamId());
  };

  useEffect(() => {
    refresh();
  }, []);

  const active = useMemo(
    () => teams.find((t) => t.teamId === activeId) || teams[0] || null,
    [teams, activeId]
  );

  const shared = active ? getSharedGoals(active, weeklyGoals) : [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createTeam(name.trim(), user);
    setName('');
    setMessage('Team created.');
    refresh();
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const team = joinTeamByCode(code.trim(), user);
    setMessage(team ? `Joined ${team.name}` : 'Invalid invite code.');
    setCode('');
    refresh();
  };

  const copyInvite = async () => {
    if (!active) return;
    await navigator.clipboard.writeText(active.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareGoal = (goalId: string) => {
    if (!active) return;
    shareGoalWithTeam(active.teamId, goalId);
    refresh();
    setMessage('Goal shared with team.');
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Teams & Shared Goals
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Collaborate on weekly goals, invite members, and keep the squad accountable.
        </p>
      </div>

      {message && (
        <div className="text-xs font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 rounded-xl px-4 py-2">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleCreate}
          className="glass-panel rounded-3xl p-6 border border-border bg-background/80 space-y-4"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Create team</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Team nameâ€¦"
            className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-foreground"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-cyan-500 text-xs font-bold text-foreground"
          >
            Create
          </button>
        </form>

        <form
          onSubmit={handleJoin}
          className="glass-panel rounded-3xl p-6 border border-border bg-background/80 space-y-4"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" /> Join with invite code
          </h2>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. PTA2026"
            className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-foreground uppercase"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-foreground"
          >
            Join team
          </button>
        </form>
      </div>

      {teams.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {teams.map((t) => (
            <button
              key={t.teamId}
              type="button"
              onClick={() => {
                setActiveTeamId(t.teamId);
                setActiveId(t.teamId);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                active?.teamId === t.teamId
                  ? 'bg-primary border-primary text-foreground'
                  : 'bg-muted border-border text-muted-foreground hover:border-border'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel rounded-3xl p-6 border border-border bg-background/80 space-y-4 lg:col-span-1">
            <h2 className="text-lg font-bold text-foreground">{active.name}</h2>
            <div className="flex items-center gap-2">
              <code className="px-3 py-1.5 rounded-lg bg-muted border border-border text-primary text-sm font-mono">
                {active.inviteCode}
              </code>
              <button
                type="button"
                onClick={copyInvite}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground">Members</p>
              {active.members.map((m) => (
                <div
                  key={m.memberId}
                  className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-muted/60 border border-border"
                >
                  <span className="text-foreground font-semibold">{m.fullName}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">{m.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-border bg-background/80 space-y-4 lg:col-span-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" /> Shared weekly goals
            </h2>
            {shared.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shared goals yet. Share one below.</p>
            ) : (
              <div className="space-y-2">
                {shared.map((g) => (
                  <div
                    key={g.goalId}
                    className="p-4 rounded-2xl border border-primary/30 bg-cyan-950/20"
                  >
                    <p className="font-bold text-foreground">{g.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Progress {g.progress}% Â· {g.completedTasks}/{g.totalTasks} tasks
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground">Share a personal goal</p>
              {weeklyGoals.length === 0 ? (
                <p className="text-xs text-muted-foreground">Create a weekly goal first.</p>
              ) : (
                weeklyGoals.map((g) => (
                  <div
                    key={g.goalId}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/50"
                  >
                    <span className="text-sm text-foreground">{g.title}</span>
                    <button
                      type="button"
                      onClick={() => shareGoal(g.goalId)}
                      disabled={active.sharedGoalIds.includes(g.goalId)}
                      className="text-xs font-bold text-primary disabled:text-muted-foreground"
                    >
                      {active.sharedGoalIds.includes(g.goalId) ? 'Shared' : 'Share'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
