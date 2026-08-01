"use client";

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, Circle, Flame, Award, Clock, ArrowRight, Zap, Target, Plus } from 'lucide-react';

export const DashboardView = () => {
  const { user, todayPlan, sessions, tasks, weeklyGoals, openCheckIn, openPlanner, completeTask } = useApp();

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Card: User Stats & Core Goal */}
      <div className="relative overflow-hidden glass-panel rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 rounded-full">
                Level {user.level} Execution Master
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/40 rounded-full px-3 py-1">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                {user.streak}-Day Streak
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white mt-3 tracking-tight">
              Welcome Back, {user.fullName.split(' ')[0]} 👋
            </h1>
            <p className="text-sm md:text-base text-slate-300 mt-2 max-w-xl">
              Today&apos;s Focus: <span className="font-semibold text-cyan-300">&ldquo;{todayPlan.goal}&rdquo;</span>
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total XP</p>
              <div className="flex items-center gap-1.5 justify-end">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="text-2xl font-black text-amber-300">{user.totalXP}</span>
              </div>
            </div>

            <button
              onClick={openPlanner}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg hover:shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Plan Tomorrow
            </button>
          </div>
        </div>

        {/* Daily Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-slate-300">Daily Execution Completion</span>
            <span className="font-bold text-cyan-400">{todayPlan.completionPercentage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-400 rounded-full transition-all duration-500 shadow-glow"
              style={{ width: `${todayPlan.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5-Session Execution Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          5-Session Execution Timeline
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {sessions.map((session) => {
            const isCompleted = session.status === 'Completed';
            const isActive = session.status === 'Active';
            return (
              <div
                key={session.sessionId}
                onClick={() => openCheckIn(session)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  isActive
                    ? 'glass-panel border-cyan-500/50 bg-cyan-950/30 shadow-lg shadow-cyan-500/10 transform hover:-translate-y-1'
                    : isCompleted
                    ? 'glass-card border-emerald-500/30 bg-emerald-950/10'
                    : 'glass-card border-white/5 bg-slate-900/40 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">{session.startTime}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isActive ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <h3 className="font-bold text-white text-base">{session.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{session.completedTaskCount} / {session.taskCount} Tasks Completed</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Tasks & Weekly Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Tasks Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            Today&apos;s Planned Session Tasks
          </h2>

          <div className="space-y-3">
            {tasks.map((task) => {
              const isDone = task.status === 'Completed';
              return (
                <div
                  key={task.taskId}
                  className={`glass-card rounded-2xl p-5 border transition-all flex items-center justify-between gap-4 ${
                    isDone
                      ? 'border-emerald-500/30 bg-emerald-950/10 opacity-75'
                      : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => !isDone && completeTask(task.taskId)}
                      className="mt-1 transition-transform hover:scale-110"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-950" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-500 hover:text-cyan-400" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                            task.priority === 'High'
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          }`}
                        >
                          {task.priority} Priority
                        </span>
                        <span className="text-xs font-medium text-slate-400">• {task.session} Session</span>
                      </div>
                      <h4 className={`text-base font-bold text-white mt-1 ${isDone ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>

                  {!isDone && (
                    <button
                      onClick={() => completeTask(task.taskId)}
                      className="px-4 py-2 bg-slate-800 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Check-In
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Goals Sidebar */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-violet-400" />
            Weekly Goal Alignment
          </h2>

          <div className="space-y-4">
            {weeklyGoals.map((goal) => (
              <div key={goal.goalId} className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-400 bg-violet-950/60 border border-violet-800/40 px-2.5 py-1 rounded-md">
                    Week Outcome
                  </span>
                  <span className="text-xs font-bold text-white">{goal.progress}% Done</span>
                </div>
                <h3 className="font-bold text-white text-base">{goal.title}</h3>
                <p className="text-xs text-slate-300">{goal.description}</p>

                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
