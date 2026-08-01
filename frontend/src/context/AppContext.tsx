"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile, UserSettings, WeeklyGoal, DailyPlan, Session, Task, DailyReport, WeeklyReport, Achievement } from '@/types';
import { apiClient } from '@/services/api/apiClient';

interface AppContextType {
  user: UserProfile;
  settings: UserSettings;
  weeklyGoals: WeeklyGoal[];
  todayPlan: DailyPlan;
  sessions: Session[];
  tasks: Task[];
  dailyReports: DailyReport[];
  weeklyReports: WeeklyReport[];
  achievements: Achievement[];
  activeSession: Session | null;
  activeCheckInSession: Session | null;
  isPlannerOpen: boolean;
  isSettingsOpen: boolean;
  xpGain: { amount: number; reason: string } | null;
  openCheckIn: (session: Session) => void;
  closeCheckIn: () => void;
  openPlanner: () => void;
  closePlanner: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  completeTask: (taskId: string, notes?: string, blockers?: string, confidence?: number) => void;
  triggerConfetti: () => void;
}

const initialPlan: DailyPlan = {
  planId: 'dp-today',
  uid: 'demo-user-123',
  date: new Date().toISOString().split('T')[0],
  title: 'High Focus Core Application Execution',
  goal: 'Complete session check-ins, verify Firestore & Cloudinary sync',
  notes: 'Stay accountable with session reminders and review daily progress.',
  overallPriority: 'High',
  completionPercentage: 35,
  completedTasks: 2,
  pendingTasks: 4,
  weeklyGoalIds: ['wg-1'],
  status: 'In Progress',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultUser: UserProfile = {
  uid: 'demo-user-123',
  email: 'alex.developer@pta.io',
  fullName: 'Alex Morgan',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  timezone: 'UTC',
  notificationPermission: true,
  pwaInstalled: false,
  streak: 5,
  totalXP: 1450,
  level: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  onboardingCompleted: true,
};

const defaultSettings: UserSettings = {
  uid: 'demo-user-123',
  morningReminder: '08:00',
  beforeLunchReminder: '12:00',
  afternoonReminder: '15:00',
  eveningReminder: '18:00',
  nightReminder: '21:00',
  planningReminder: '22:00',
  weeklyReminder: 'Sunday 20:00',
  notificationsEnabled: true,
  theme: 'dark',
  workDays: [1, 2, 3, 4, 5, 6],
  syncEnabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [todayPlan, setTodayPlan] = useState<DailyPlan>(initialPlan);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeCheckInSession, setActiveCheckInSession] = useState<Session | null>(null);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [xpGain, setXpGain] = useState<{ amount: number; reason: string } | null>(null);

  const fetchAppData = () => {
    apiClient.getDashboard().then((res) => {
      if (res.success && res.data) {
        const data = res.data as any;
        setUser((prev) => ({
          ...prev,
          totalXP: data.totalXP ?? prev.totalXP,
          level: data.userLevel ?? prev.level,
          streak: data.streak ?? prev.streak,
        }));
        if (data.todayGoal) {
          setTodayPlan((prev) => ({ ...prev, goal: data.todayGoal }));
        }
      }
    });

    apiClient.getTodayPlan().then((res) => {
      if (res.success && res.data) {
        const data = res.data as any;
        if (data.plan) setTodayPlan(data.plan);
        if (Array.isArray(data.sessions) && data.sessions.length > 0) setSessions(data.sessions);
        if (Array.isArray(data.tasks) && data.tasks.length > 0) setTasks(data.tasks);
      }
    });

    apiClient.getWeeklyGoals().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setWeeklyGoals(res.data as WeeklyGoal[]);
      }
    });
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  const activeSession = sessions.find((s) => s.status === 'Active') || sessions[0] || null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const openCheckIn = (session: Session) => setActiveCheckInSession(session);
  const closeCheckIn = () => setActiveCheckInSession(null);
  const openPlanner = () => setIsPlannerOpen(true);
  const closePlanner = () => setIsPlannerOpen(false);
  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  const completeTask = (taskId: string, notes?: string, blockers?: string, confidence?: number) => {
    apiClient.completeTask(taskId, { notes, blockers, confidence }).then((res) => {
      if (res.success && res.data) {
        const { task, xpEarned } = res.data as any;
        if (task) {
          setTasks((prev) => prev.map((t) => (t.taskId === taskId ? task : t)));
        }

        if (xpEarned > 0) {
          triggerConfetti();
          setXpGain({ amount: xpEarned, reason: `Completed Task: ${task?.title || 'Task'}` });
          setUser((prev) => ({
            ...prev,
            totalXP: prev.totalXP + xpEarned,
            level: Math.floor((prev.totalXP + xpEarned) / 500) + 1,
          }));
          setTimeout(() => setXpGain(null), 3000);
        }

        fetchAppData();
      }
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        settings,
        weeklyGoals,
        todayPlan,
        sessions,
        tasks,
        dailyReports,
        weeklyReports,
        achievements,
        activeSession,
        activeCheckInSession,
        isPlannerOpen,
        isSettingsOpen,
        xpGain,
        openCheckIn,
        closeCheckIn,
        openPlanner,
        closePlanner,
        openSettings,
        closeSettings,
        completeTask,
        triggerConfetti,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
