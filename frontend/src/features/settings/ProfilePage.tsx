'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Settings, Bell, Sun, Moon, Monitor, Upload, Plus, Trash2, User, Download } from 'lucide-react';
import { CalendarIntegrationsPanel } from '@/features/integrations/CalendarIntegrationsPanel';
import { applyDocumentTheme } from '@/components/ThemeSync';
import { useAuth } from '@/context/AuthContext';
import { usePwa } from '@/components/PwaRegister';

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
}

export function ProfilePage() {
  const {
    settings,
    saveSettings,
    user,
    updateProfile,
    enableNotifications,
    addCustomSession,
    removeCustomSession,
  } = useApp();
  const { logout } = useAuth();
  const { canInstall, isInstalled, isStandalone, swReady, install } = usePwa();
  const [installMsg, setInstallMsg] = useState<string | null>(null);
  const [section, setSection] = useState<'profile' | 'appearance' | 'reminders' | 'sessions' | 'calendar'>(
    'profile'
  );
  const [fullName, setFullName] = useState(user.fullName);
  const [morning, setMorning] = useState(settings.morningReminder);
  const [lunch, setLunch] = useState(settings.beforeLunchReminder);
  const [afternoon, setAfternoon] = useState(settings.afternoonReminder);
  const [evening, setEvening] = useState(settings.eveningReminder);
  const [night, setNight] = useState(settings.nightReminder);
  const [planning, setPlanning] = useState(settings.planningReminder);
  const [weekly, setWeekly] = useState(settings.weeklyReminder);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customStart, setCustomStart] = useState('09:00');
  const [customEnd, setCustomEnd] = useState('10:00');
  const [customReminder, setCustomReminder] = useState('09:00');

  useEffect(() => {
    setFullName(user.fullName);
    setMorning(settings.morningReminder);
    setLunch(settings.beforeLunchReminder);
    setAfternoon(settings.afternoonReminder);
    setEvening(settings.eveningReminder);
    setNight(settings.nightReminder);
    setPlanning(settings.planningReminder);
    setWeekly(settings.weeklyReminder);
  }, [user.fullName, settings]);

  const save = () => {
    if (section === 'profile') {
      updateProfile({ fullName });
    } else if (section === 'reminders') {
      saveSettings({
        morningReminder: morning,
        beforeLunchReminder: lunch,
        afternoonReminder: afternoon,
        eveningReminder: evening,
        nightReminder: night,
        planningReminder: planning,
        weeklyReminder: weekly,
      });
    }
    setSaveMsg('Saved');
    window.setTimeout(() => setSaveMsg(null), 2000);
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    saveSettings({ theme });
    applyDocumentTheme(theme);
  };

  const onPickImage = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(`${apiBase()}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, uid: user.uid }),
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        updateProfile({ profileImage: json.data.url });
        setUploadMsg('Profile photo updated');
      } else {
        updateProfile({ profileImage: dataUrl });
        setUploadMsg(json.message || 'Saved locally (Cloudinary unavailable)');
      }
    } catch {
      setUploadMsg('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-4 font-body">
      <header className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Account</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account, reminders, and preferences.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(['profile', 'appearance', 'reminders', 'sessions', 'calendar'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={`px-3 py-2 min-h-11 rounded-lg text-xs font-bold border capitalize ${
              section === s
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-muted border-border text-muted-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <section className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5 shadow-sm">
        {section === 'profile' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center text-xl font-bold">
                {user.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-bold cursor-pointer min-h-11">
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading…' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void onPickImage(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            {uploadMsg && <p className="text-xs text-muted-foreground">{uploadMsg}</p>}
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Full name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-foreground min-h-12"
              />
            </label>
            <p className="text-xs text-muted-foreground">Email: {user.email}</p>
            <p className="text-xs text-muted-foreground">
              Level {user.level} · {user.totalXP} XP · {user.streak}-day streak
            </p>
            <button
              type="button"
              onClick={() => void enableNotifications()}
              className="flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-xl border border-border text-xs font-bold text-primary"
            >
              <Bell className="w-4 h-4" />
              {user.notificationPermission ? 'Notifications + FCM enabled' : 'Enable reminders + FCM push'}
            </button>

            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progressive Web App</p>
              <p className="text-sm text-foreground">
                {isStandalone || isInstalled
                  ? 'PTA is installed on this device.'
                  : swReady
                    ? 'Install PTA for a full-screen app experience and offline shell.'
                    : 'Preparing install service…'}
              </p>
              {canInstall ? (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await install();
                    setInstallMsg(ok ? 'Installed' : 'Install dismissed');
                    if (ok) updateProfile({ pwaInstalled: true });
                    window.setTimeout(() => setInstallMsg(null), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                >
                  <Download className="w-4 h-4" />
                  Install PTA app
                </button>
              ) : !isStandalone && !isInstalled ? (
                <p className="text-xs text-muted-foreground">
                  On iPhone: Share → Add to Home Screen. On desktop Chrome: menu → Install app.
                </p>
              ) : null}
              {installMsg && <p className="text-xs text-secondary font-semibold">{installMsg}</p>}
            </div>

            <button
              type="button"
              onClick={() => void logout()}
              className="flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-xl border border-danger/30 text-xs font-bold text-danger"
            >
              <User className="w-4 h-4" />
              Log out
            </button>
          </div>
        )}

        {section === 'appearance' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose light, dark, or follow system preference.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { id: 'light' as const, label: 'Light', icon: Sun },
                  { id: 'dark' as const, label: 'Dark', icon: Moon },
                  { id: 'system' as const, label: 'System', icon: Monitor },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-2xl border text-left min-h-11 transition-all ${
                    settings.theme === id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${settings.theme === id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-display font-bold text-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {section === 'reminders' && (
          <div className="space-y-3">
            {(
              [
                ['Morning', morning, setMorning],
                ['Before Lunch', lunch, setLunch],
                ['Afternoon', afternoon, setAfternoon],
                ['Evening', evening, setEvening],
                ['Night', night, setNight],
                ['Planning', planning, setPlanning],
              ] as const
            ).map(([label, value, setter]) => (
              <div
                key={label}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-muted/60"
              >
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <input
                  type="time"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="bg-card border border-border rounded-xl px-3 py-1.5 text-xs text-foreground min-h-11"
                />
              </div>
            ))}
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Weekly review (e.g. Sunday 20:00)</span>
              <input
                value={weekly}
                onChange={(e) => setWeekly(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl p-3 text-sm min-h-12"
                placeholder="Sunday 20:00"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground min-h-11">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => saveSettings({ notificationsEnabled: e.target.checked })}
              />
              Reminders enabled
            </label>
          </div>
        )}

        {section === 'sessions' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Five default sessions are always included. Add custom sessions for your schedule.
            </p>
            <ul className="space-y-2">
              {(settings.customSessions || []).map((s) => (
                <li
                  key={s.name}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/50 text-sm"
                >
                  <span>
                    {s.name} · {s.start}–{s.end}
                  </span>
                  <button type="button" onClick={() => removeCustomSession(s.name)} aria-label="Remove">
                    <Trash2 className="w-4 h-4 text-danger" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Session name"
                className="col-span-2 bg-muted border border-border rounded-xl p-3 text-sm min-h-12"
              />
              <input
                type="time"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-muted border border-border rounded-xl p-2 text-xs min-h-11"
              />
              <input
                type="time"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-muted border border-border rounded-xl p-2 text-xs min-h-11"
              />
              <input
                type="time"
                value={customReminder}
                onChange={(e) => setCustomReminder(e.target.value)}
                className="col-span-2 bg-muted border border-border rounded-xl p-2 text-xs min-h-11"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!customName.trim()) return;
                addCustomSession({
                  name: customName.trim(),
                  start: customStart,
                  end: customEnd,
                  reminder: customReminder,
                });
                setCustomName('');
              }}
              className="flex items-center gap-2 text-xs font-bold text-primary min-h-11"
            >
              <Plus className="w-4 h-4" /> Add custom session
            </button>
          </div>
        )}

        {section === 'calendar' && <CalendarIntegrationsPanel />}

        {(section === 'profile' || section === 'reminders') && (
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
            {saveMsg ? <p className="text-xs text-secondary font-semibold">{saveMsg}</p> : <span />}
            <button type="button" onClick={save} className="btn-primary px-6 py-2.5 text-xs min-h-11">
              <Settings className="w-4 h-4" />
              Save
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
