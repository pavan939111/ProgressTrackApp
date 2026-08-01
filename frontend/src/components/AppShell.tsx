'use client';

import React from 'react';
import {
  LayoutDashboard,
  Award,
  CalendarDays,
  FileText,
  ClipboardList,
  Settings,
  Users,
  BarChart3,
  LogOut,
  Plus,
  Search,
  Bell,
  Sun,
  Moon,
  Monitor,
  Home,
  User,
  Flame,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { applyDocumentTheme } from '@/components/ThemeSync';
import { SyncStatusBar } from '@/components/SyncStatusBar';

export type AppTab =
  | 'dashboard'
  | 'goals'
  | 'reports'
  | 'calendar'
  | 'teams'
  | 'analytics';

type Props = {
  activeTab: AppTab;
  setActiveTab: (t: AppTab) => void;
  logout: () => Promise<void>;
  isDemo: boolean;
  children: React.ReactNode;
};

const DESKTOP_NAV: { id: AppTab | 'planner' | 'settings'; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'goals', label: 'Weekly Goals', icon: <Award className="w-5 h-5" /> },
  { id: 'planner', label: 'Planner', icon: <ClipboardList className="w-5 h-5" /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="w-5 h-5" /> },
  { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'teams', label: 'Teams', icon: <Users className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

const MOBILE_NAV: { id: AppTab | 'planner' | 'settings'; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Home', icon: <Home className="w-6 h-6" /> },
  { id: 'planner', label: 'Planner', icon: <ClipboardList className="w-6 h-6" /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="w-6 h-6" /> },
  { id: 'reports', label: 'Reports', icon: <FileText className="w-6 h-6" /> },
  { id: 'settings', label: 'Profile', icon: <User className="w-6 h-6" /> },
];

function ThemeCycleButton({ className = '' }: { className?: string }) {
  const { settings, saveSettings } = useApp();
  const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
  const next = () => {
    const i = order.indexOf(settings.theme);
    const theme = order[(i + 1) % order.length];
    saveSettings({ theme });
    applyDocumentTheme(theme);
  };
  const Icon = settings.theme === 'light' ? Sun : settings.theme === 'dark' ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={next}
      className={`w-10 h-10 rounded-full flex items-center justify-center border border-border bg-card text-primary hover:shadow-sm transition-all ${className}`}
      title={`Theme: ${settings.theme}`}
      aria-label={`Theme ${settings.theme}`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

export function AppShell({ activeTab, setActiveTab, logout, isDemo, children }: Props) {
  const { user, openSettings, openPlanner } = useApp();
  const mainRef = React.useRef<HTMLElement | null>(null);

  const handleNav = (id: AppTab | 'planner' | 'settings') => {
    if (id === 'planner') {
      openPlanner();
      return;
    }
    if (id === 'settings') {
      openSettings();
      return;
    }
    setActiveTab(id);
    // Keep sticky mobile header from covering the first controls after tab switch.
    requestAnimationFrame(() => {
      mainRef.current?.scrollTo({ top: 0 });
      window.scrollTo(0, 0);
    });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground font-body flex">
      {/* Desktop sidebar — Stitch */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-dvh w-60 bg-card border-r border-border flex-col py-6 px-4 z-30">
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-xl">
            P
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tighter text-foreground leading-none">PTA</h1>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-0.5">
              {isDemo ? 'Demo Mode' : 'Engineers Productivity'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openPlanner}
          className="mb-6 w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2 min-h-11"
        >
          <Plus className="w-4 h-4" />
          Plan Tomorrow
        </button>

        <nav className="flex-1 overflow-y-auto space-y-1 pr-1">
          {DESKTOP_NAV.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm tracking-tight transition-colors border-l-4 min-h-11 ${
                  isActive
                    ? 'text-primary font-bold border-primary bg-primary/10'
                    : 'text-muted-foreground font-medium border-transparent hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-border space-y-2">
          <button
            type="button"
            onClick={openSettings}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display font-bold text-sm overflow-hidden">
              {user.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                user.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.fullName}</p>
              <p className="text-[10px] text-muted-foreground truncate">Lvl {user.level} · {user.totalXP} XP</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-danger hover:bg-muted"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col lg:ml-60 min-h-dvh min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex justify-between items-center px-4 py-3 max-w-lg mx-auto w-full">
            <div className="flex items-center gap-2 text-primary">
              <Flame className="w-5 h-5 fill-primary" />
              <span className="font-display font-bold text-xl tracking-tight text-foreground">PTA</span>
            </div>
            <div className="flex items-center gap-2">
              <SyncStatusBar />
              <span className="bg-muted text-accent px-3 py-1 rounded-full text-sm font-mono font-bold">
                {user.totalXP} XP
              </span>
              <ThemeCycleButton />
            </div>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex justify-between items-center w-full px-8 py-4 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Search tasks, goals…"
              type="search"
              aria-label="Search"
            />
          </div>
          <div className="flex items-center gap-3">
            <SyncStatusBar className="hidden md:inline-flex" />
            <span className="hidden xl:inline text-xs font-semibold text-muted-foreground">
              {user.streak}d streak · Lvl {user.level}
            </span>
            <button
              type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-card border border-transparent hover:border-border transition-all"
              aria-label="Open settings"
              onClick={openSettings}
            >
              <Bell className="w-5 h-5" />
            </button>
            <ThemeCycleButton />
          </div>
        </header>

        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto px-4 md:px-8 pb-28 lg:pb-12 pt-4 scroll-smooth"
        >
          <div className="w-full max-w-3xl mx-auto lg:max-w-2xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav — Stitch */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center px-1 pt-2 pb-2 max-w-lg mx-auto">
          {MOBILE_NAV.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`flex flex-col items-center justify-center min-w-[4.25rem] min-h-14 px-2 py-1 rounded-xl text-[11px] font-medium transition-all ${
                  isActive
                    ? 'text-primary bg-primary/15 font-semibold scale-[0.98]'
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {item.icon}
                <span className="mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
