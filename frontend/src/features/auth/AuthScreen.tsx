'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Flame, Mail, Lock, User, ArrowRight } from 'lucide-react';

type Mode = 'login' | 'register' | 'reset';

const fieldClass =
  'w-full bg-card border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all min-h-12';

export function AuthScreen() {
  const { login, register, resetPassword, enterDemo, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else if (mode === 'register') await register(email, password, fullName);
      else {
        await resetPassword(email);
        setInfo('Password reset email sent. Check your inbox.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-muted-foreground font-body">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-4 py-10 relative overflow-hidden font-body">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.1),_transparent_55%)] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-display font-black text-3xl shadow-lg shadow-primary/20">
            P
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tighter">PTA</h1>
          <p className="text-sm text-muted-foreground font-medium">High-focus execution system</p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-accent fill-accent" />
            Plan · Execute · Reflect
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex p-1 rounded-xl bg-muted gap-1">
            {(['login', 'register', 'reset'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setInfo(null);
                }}
                className={`flex-1 px-2 py-2.5 min-h-11 rounded-lg text-xs font-bold capitalize transition-all ${
                  mode === m
                    ? 'bg-card text-primary shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'reset' ? 'Reset' : m}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <label className="block space-y-1.5">
                <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full name
                </span>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={fieldClass} />
              </label>
            )}
            <label className="block space-y-1.5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                autoComplete="email"
              />
            </label>
            {mode !== 'reset' && (
              <label className="block space-y-1.5">
                <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Password
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClass}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </label>
            )}

            {error && (
              <p className="text-xs text-danger bg-danger/10 border border-danger/25 rounded-xl px-3 py-2.5">{error}</p>
            )}
            {info && (
              <p className="text-xs text-secondary bg-secondary/10 border border-secondary/25 rounded-xl px-3 py-2.5">
                {info}
              </p>
            )}

            <button type="submit" disabled={busy} className="w-full btn-primary min-h-12 text-sm disabled:opacity-60">
              {busy
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign in'
                  : mode === 'register'
                    ? 'Create account'
                    : 'Send reset link'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] text-muted-foreground text-center px-2">
            Email auth is handled by the backend. Use Demo mode for offline tryout.
          </p>
          <button
            type="button"
            onClick={enterDemo}
            className="w-full py-3.5 min-h-12 rounded-xl border border-border bg-card text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            Continue in Demo mode
          </button>
        </div>
      </div>
    </div>
  );
}
