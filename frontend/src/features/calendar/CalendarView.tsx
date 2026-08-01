"use client";

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState('2026-08-01');

  const days = [
    { date: '2026-07-27', day: 'Mon', score: 85, completed: true },
    { date: '2026-07-28', day: 'Tue', score: 90, completed: true },
    { date: '2026-07-29', day: 'Wed', score: 100, completed: true },
    { date: '2026-07-30', day: 'Thu', score: 80, completed: true },
    { date: '2026-07-31', day: 'Fri', score: 95, completed: true },
    { date: '2026-08-01', day: 'Sat', score: 65, completed: false, isToday: true },
    { date: '2026-08-02', day: 'Sun', score: 0, completed: false },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-cyan-400" />
            Execution History Calendar
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Navigate past daily plans, completion scores, and reflection logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
