"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Settings } from 'lucide-react';
import { CalendarIntegrationsPanel } from '@/features/integrations/CalendarIntegrationsPanel';

export const SettingsModal = () => {
  const { isSettingsOpen, closeSettings, settings } = useApp();
  const [morning, setMorning] = useState(settings.morningReminder);
  const [lunch, setLunch] = useState(settings.beforeLunchReminder);
  const [afternoon, setAfternoon] = useState(settings.afternoonReminder);
  const [evening, setEvening] = useState(settings.eveningReminder);
  const [section, setSection] = useState<'reminders' | 'calendar'>('reminders');

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="glass-modal w-full max-w-lg rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl relative bg-slate-950/95 text-white space-y-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeSettings}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-950/60 border border-cyan-800/40 rounded-2xl">
            <Settings className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">App Preferences</span>
            <h2 className="text-2xl font-extrabold text-white">Settings</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSection('reminders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
              section === 'reminders'
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : 'bg-slate-900 border-white/10 text-slate-400'
            }`}
          >
            Reminders
          </button>
          <button
            type="button"
            onClick={() => setSection('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
              section === 'calendar'
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : 'bg-slate-900 border-white/10 text-slate-400'
            }`}
          >
            Calendar Sync
          </button>
        </div>

        {section === 'reminders' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-slate-900/60">
              <span className="text-sm font-semibold text-slate-300">Morning Session Reminder</span>
              <input
                type="time"
                value={morning}
                onChange={(e) => setMorning(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-slate-900/60">
              <span className="text-sm font-semibold text-slate-300">Before Lunch Session</span>
              <input
                type="time"
                value={lunch}
                onChange={(e) => setLunch(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-slate-900/60">
              <span className="text-sm font-semibold text-slate-300">Afternoon Session</span>
              <input
                type="time"
                value={afternoon}
                onChange={(e) => setAfternoon(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-slate-900/60">
              <span className="text-sm font-semibold text-slate-300">Evening Session</span>
              <input
                type="time"
                value={evening}
                onChange={(e) => setEvening(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        ) : (
          <CalendarIntegrationsPanel />
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={closeSettings}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg transition-all"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
