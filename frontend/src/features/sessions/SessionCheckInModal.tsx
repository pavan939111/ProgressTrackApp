'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, CheckCircle2, Star, MessageSquare, AlertCircle, SkipForward, CalendarClock } from 'lucide-react';
import { VoiceInputButton } from '@/features/voice/VoiceInputButton';

export const SessionCheckInModal = () => {
  const {
    activeCheckInSession,
    closeCheckIn,
    tasks,
    completeTask,
    skipTask,
    moveTask,
    completeSession,
  } = useApp();
  const [notes, setNotes] = useState('');
  const [blockers, setBlockers] = useState('');
  const [confidence, setConfidence] = useState(5);
  const [skipReason, setSkipReason] = useState('');

  if (!activeCheckInSession) return null;

  const sessionTasks = tasks.filter((t) => t.sessionId === activeCheckInSession.sessionId);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeSession(activeCheckInSession.sessionId);
    setNotes('');
    setBlockers('');
    setConfidence(5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-foreground/40 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 md:p-8 border border-border shadow-2xl relative bg-card text-foreground space-y-6 max-h-[92vh] overflow-y-auto font-body">
        <button
          onClick={closeCheckIn}
          className="absolute top-5 right-5 p-2.5 text-muted-foreground hover:text-foreground rounded-full bg-muted min-h-11 min-w-11 flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pr-12">
          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full">
            Session check-in
          </span>
          <h2 className="font-display text-2xl font-bold text-foreground mt-3 tracking-tight">
            {activeCheckInSession.name} progress
          </h2>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {activeCheckInSession.startTime} – {activeCheckInSession.endTime}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tasks
            </label>
            {sessionTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No tasks in this session.</p>
            ) : (
              sessionTasks.map((t) => (
                <div key={t.taskId} className="p-3.5 rounded-xl border border-border bg-muted/50 space-y-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => completeTask(t.taskId, notes, blockers, confidence)}
                      disabled={t.status === 'Completed'}
                      className="min-h-11 min-w-11 flex items-center justify-center -ml-2"
                      aria-label="Complete task"
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          t.status === 'Completed' ? 'text-secondary' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                    <span
                      className={`text-sm font-semibold flex-1 ${
                        t.status === 'Completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{t.status}</span>
                  </div>
                  {t.status !== 'Completed' && t.status !== 'Skipped' && (
                    <div className="flex flex-wrap gap-2 pl-8">
                      <button
                        type="button"
                        onClick={() => skipTask(t.taskId, skipReason || 'Skipped')}
                        className="flex items-center gap-1 text-[10px] font-bold text-accent min-h-9 px-1"
                      >
                        <SkipForward className="w-3 h-3" /> Skip
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTask(t.taskId, tomorrow)}
                        className="flex items-center gap-1 text-[10px] font-bold text-primary min-h-9 px-1"
                      >
                        <CalendarClock className="w-3 h-3" /> Move to tomorrow
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            <input
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="Skip reason (optional)"
              className="w-full bg-muted border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5 text-primary" /> Reflection
              </label>
              <VoiceInputButton currentValue={notes} onResult={setNotes} />
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
              placeholder="What did you achieve?"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <AlertCircle className="w-3.5 h-3.5 text-accent" /> Blockers
              </label>
              <VoiceInputButton currentValue={blockers} mode="replace" onResult={setBlockers} />
            </div>
            <input
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 min-h-12"
            />
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button type="button" key={star} onClick={() => setConfidence(star)} className="min-h-11 min-w-11 flex items-center justify-center">
                <Star
                  className={`w-6 h-6 ${
                    star <= confidence ? 'text-accent fill-accent' : 'text-muted-foreground/40'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={closeCheckIn}
              className="px-5 py-3 rounded-xl border border-border text-xs font-bold text-muted-foreground min-h-12"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary px-6 py-3 text-xs min-h-12">
              Complete session (+75 XP)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
