'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { WeeklyGoalsView } from '@/features/weekly-goals/WeeklyGoalsView';
import { DailyReportView } from '@/features/reports/DailyReportView';
import { CalendarView } from '@/features/calendar/CalendarView';
import { SessionCheckInModal } from '@/features/sessions/SessionCheckInModal';
import { PlannerPage } from '@/features/planner/PlannerPage';
import { GamificationOverlay } from '@/features/gamification/GamificationOverlay';
import { ProfilePage } from '@/features/settings/ProfilePage';
import { TeamsView } from '@/features/teams/TeamsView';
import { AnalyticsView } from '@/features/analytics/AnalyticsView';
import { AppShell, type AppTab } from '@/components/AppShell';

export default function Home() {
  const { user: authUser, loading, logout, isDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  useEffect(() => {
    const onNavigate = (e: Event) => {
      const tab = (e as CustomEvent).detail?.tab as AppTab | undefined;
      if (!tab) return;
      setActiveTab(tab);
      window.scrollTo(0, 0);
    };
    window.addEventListener('pta-navigate', onNavigate);
    return () => window.removeEventListener('pta-navigate', onNavigate);
  }, []);

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
        {activeTab === 'planner' && <PlannerPage />}
        {activeTab === 'reports' && <DailyReportView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'teams' && <TeamsView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'settings' && <ProfilePage />}
      </AppShell>

      <SessionCheckInModal />
      <GamificationOverlay />
    </>
  );
}
