"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, CheckCircle2, Star, MessageSquare, AlertCircle } from 'lucide-react';

export const SessionCheckInModal = () => {
  const { activeCheckInSession, closeCheckIn, tasks, completeTask } = useApp();
  const [notes, setNotes] = useState('');
  const [blockers, setBlockers] = useState('');
  const [confidence, setConfidence] = useState(5);

  if (!activeCheckInSession) return null;

  const sessionTasks = tasks.filter((t) => t.sessionId === activeCheckInSession.sessionId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionTasks.forEach((t) => {
      if (t.status !== 'Completed') {
        completeTask(t.taskId, notes, blockers, confidence);
      }
    });
    closeCheckIn();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="glass-modal w-full max-w-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl relative bg-slate-950/90 text-white space-y-6 animate-glow-pulse">
        <button
          onClick={closeCheckIn}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 rounded-full">
            Session Check-In
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-2">
            {activeCheckInSession.name} Progress Review
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Execution Window: {activeCheckInSession.startTime} – {activeCheckInSession.endTime}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tasks checklist */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Planned Session Tasks
            </label>
            {sessionTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No tasks assigned to this session.</p>
            ) : (
              sessionTasks.map((t) => (
                <div
                  key={t.taskId}
                  onClick={() => completeTask(t.taskId, notes, blockers, confidence)}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-slate-900/60 cursor-pointer hover:border-cyan-500/40 transition-all"
                >
                  <CheckCircle2
                    className={`w-5 h-5 ${t.status === 'Completed' ? 'text-emerald-400 fill-emerald-950' : 'text-slate-600'}`}
                  />
                  <span className={`text-sm font-semibold ${t.status === 'Completed' ? 'line-through text-slate-400' : 'text-white'}`}>
                    {t.title}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              Reflection Notes & Outcomes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you achieve or learn during this session?"
              rows={2}
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Blockers */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Blockers or Delays
            </label>
            <input
              type="text"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Any unexpected blockers?"
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Confidence Stars */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Session Focus & Confidence Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setConfidence(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${star <= confidence ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={closeCheckIn}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold shadow-lg transition-all"
            >
              Complete Check-In (+75 XP)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
