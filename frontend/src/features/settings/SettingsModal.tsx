'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Settings, Bell, Sun, Moon, Monitor, Upload, Plus, Trash2 } from 'lucide-react';
import { CalendarIntegrationsPanel } from '@/features/integrations/CalendarIntegrationsPanel';
import { applyDocumentTheme } from '@/components/ThemeSync';

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
}

export const SettingsModal = () => {
  const {
    isSettingsOpen,
    closeSettings,
    settings,
    saveSettings,
    user,
    updateProfile,
    enableNotifications,
    addCustomSession,
    removeCustomSession,
  } = useApp();
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
  const [customName, setCustomName] = useState('');
  const [customStart, setCustomStart] = useState('09:00');
  const [customEnd, setCustomEnd] = useState('10:00');
  const [customReminder, setCustomReminder] = useState('09:00');

  useEffect(() => {
    if (!isSettingsOpen) return;
    setFullName(user.fullName);
    setMorning(settings.morningReminder);
    setLunch(settings.beforeLunchReminder);
    setAfternoon(settings.afternoonReminder);
    setEvening(settings.eveningReminder);
    setNight(settings.nightReminder);
    setPlanning(settings.planningReminder);
    setWeekly(settings.weeklyReminder);
  }, [isSettingsOpen, user.fullName, settings]);

  if (!isSettingsOpen) return null;

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
    closeSettings();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-md">
      <div className="glass-modal w-full max-w-lg rounded-3xl p-6 md:p-8 border border-border shadow-2xl relative text-foreground space-y-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeSettings}
          className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground rounded-full bg-muted"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 border border-primary/25 rounded-2xl">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Preferences</span>
            <h2 className="font-display text-2xl font-extrabold text-foreground">Settings</h2>
          </div>
        </div>

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
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-xs font-bold cursor-pointer">
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
                className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-foreground"
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
                      ? 'border-primary bg-primary/10 shadow-glow'
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
                  className="bg-card border border-border rounded-xl px-3 py-1.5 text-xs text-foreground"
                />
              </div>
            ))}
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Weekly review (e.g. Sunday 20:00)</span>
              <input
                value={weekly}
                onChange={(e) => setWeekly(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl p-3 text-sm"
                placeholder="Sunday 20:00"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
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
                className="col-span-2 bg-muted border border-border rounded-xl p-3 text-sm"
              />
              <input
                type="time"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-muted border border-border rounded-xl p-2 text-xs"
              />
              <input
                type="time"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-muted border border-border rounded-xl p-2 text-xs"
              />
              <input
                type="time"
                value={customReminder}
                onChange={(e) => setCustomReminder(e.target.value)}
                className="col-span-2 bg-muted border border-border rounded-xl p-2 text-xs"
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
              className="flex items-center gap-2 text-xs font-bold text-primary"
            >
              <Plus className="w-4 h-4" /> Add custom session
            </button>
          </div>
        )}

        {section === 'calendar' && <CalendarIntegrationsPanel />}

        <div className="flex justify-end pt-4 border-t border-border">
          <button onClick={save} className="btn-primary px-6 py-2.5 text-xs">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
