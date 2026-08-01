"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LayoutDashboard, Award, FileText, Calendar as CalendarIcon, Settings, Flame, Zap } from 'lucide-react';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { WeeklyGoalsView } from '@/features/weekly-goals/WeeklyGoalsView';
import { DailyReportView } from '@/features/reports/DailyReportView';
import { CalendarView } from '@/features/calendar/CalendarView';
import { SessionCheckInModal } from '@/features/sessions/SessionCheckInModal';
import { DailyPlannerModal } from '@/features/planner/DailyPlannerModal';
import { GamificationOverlay } from '@/features/gamification/GamificationOverlay';
import { SettingsModal } from '@/features/settings/SettingsModal';

type Tab = 'dashboard' | 'goals' | 'reports' | 'calendar';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { user, openSettings } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-cyan-500 selection:text-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-black text-xl">
            P
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base md:text-lg tracking-tight leading-none">
              PTA Execution System
            </h1>
            <p className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase mt-0.5">
              High Performance Accountability
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 border border-white/10 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'goals'
                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4" /> Weekly Goals
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" /> Reports
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'calendar'
                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarIcon className="w-4 h-4" /> Calendar
          </button>
        </nav>

        {/* Right User Ticker & Settings */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-extrabold text-amber-300">{user.streak}d</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs">
            <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            <span className="font-extrabold text-cyan-300">Lvl {user.level}</span>
          </div>

          <button
            onClick={openSettings}
            className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'goals' && <WeeklyGoalsView />}
        {activeTab === 'reports' && <DailyReportView />}
        {activeTab === 'calendar' && <CalendarView />}
      </main>

      {/* Overlays & Modals */}
      <SessionCheckInModal />
      <DailyPlannerModal />
      <GamificationOverlay />
      <SettingsModal />
    </div>
  );
}
