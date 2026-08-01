"use client";

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { buildIcsFromSessions, downloadIcs } from '@/lib/calendarExport';
import { CalendarIntegrationsPanel } from '@/features/integrations/CalendarIntegrationsPanel';

export const CalendarView = () => {
  const { sessions, tasks, todayPlan } = useApp();
  const [selectedDate, setSelectedDate] = useState(todayPlan.date);
  const [showIntegrations, setShowIntegrations] = useState(false);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (3 - i));
    const date = d.toISOString().split('T')[0];
    const isToday = date === todayPlan.date;
    return {
      date,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      score: isToday ? todayPlan.completionPercentage : 60 + ((i * 11) % 40),
      completed: !isToday || todayPlan.completionPercentage >= 80,
      isToday,
    };
  });

  const exportToday = () => {
    const ics = buildIcsFromSessions(sessions, tasks, todayPlan.date, todayPlan.goal);
    downloadIcs(`pta-${todayPlan.date}.ics`, ics);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-cyan-400" />
            Execution History Calendar
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Navigate past daily plans, completion scores, and calendar sync.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportToday}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-cyan-400"
          >
            <Download className="w-3.5 h-3.5" /> Export ICS
          </button>
          <button
            type="button"
            onClick={() => setShowIntegrations((v) => !v)}
            className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white"
          >
            {showIntegrations ? 'Hide Sync' : 'Integrations'}
          </button>
        </div>
      </div>

      {showIntegrations && (
        <div className="glass-panel rounded-3xl p-6 border border-white/10 bg-slate-950/80">
          <CalendarIntegrationsPanel />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        {days.map((item) => (
          <div
            key={item.date}
            onClick={() => setSelectedDate(item.date)}
            className={`glass-panel rounded-2xl p-5 border cursor-pointer transition-all ${
              item.date === selectedDate
                ? 'border-cyan-500/80 bg-cyan-950/40 shadow-lg shadow-cyan-500/10 scale-105'
                : 'border-white/10 bg-slate-950/60 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
              <span>{item.day}</span>
              {item.isToday && <span className="text-cyan-400 font-bold">TODAY</span>}
            </div>
            <p className="text-lg font-extrabold text-white">{item.date.slice(8)}</p>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-slate-400">Score</span>
              <span className={`font-bold ${item.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {item.score}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
