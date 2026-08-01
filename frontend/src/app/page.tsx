'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { WeeklyGoalsView } from '@/features/weekly-goals/WeeklyGoalsView';
import { DailyReportView } from '@/features/reports/DailyReportView';
import { CalendarView } from '@/features/calendar/CalendarView';
import { SessionCheckInModal } from '@/features/sessions/SessionCheckInModal';
import { DailyPlannerModal } from '@/features/planner/DailyPlannerModal';
import { GamificationOverlay } from '@/features/gamification/GamificationOverlay';
import { SettingsModal } from '@/features/settings/SettingsModal';
import { TeamsView } from '@/features/teams/TeamsView';
import { AnalyticsView } from '@/features/analytics/AnalyticsView';
import { AppShell, type AppTab } from '@/components/AppShell';

export default function Home() {
  const { user: authUser, loading, logout, isDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-muted-foreground font-body">
        Loading PTA…
      </div>
    );
  }

  if (!authUser) return <AuthScreen />;

  return (
    <>
      <AppShell activeTab={activeTab} setActiveTab={setActiveTab} logout={logout} isDemo={isDemo}>
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'goals' && <WeeklyGoalsView />}
        {activeTab === 'reports' && <DailyReportView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'teams' && <TeamsView />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </AppShell>

      <SessionCheckInModal />
      <DailyPlannerModal />
      <GamificationOverlay />
      <SettingsModal />
    </>
  );
}
