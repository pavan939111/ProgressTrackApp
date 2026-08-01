'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Flame, Mail, Lock, User, ArrowRight } from 'lucide-react';

type Mode = 'login' | 'register' | 'reset';

const fieldClass =
  'w-full bg-card border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all min-h-12';

function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12.24 10.27v3.54h5.37c-.22 1.22-.9 2.25-1.91 2.94l3.09 2.4c1.8-1.66 2.84-4.1 2.84-7 0-.67-.06-1.32-.17-1.95H12.24z"
      />
      <path
        fill="#34A853"
        d="M5.48 14.3l-.84.64-2.53 1.97C3.7 19.7 7.66 22 12.24 22c2.7 0 4.96-.89 6.61-2.41l-3.09-2.4c-.9.6-2.05.96-3.52.96-2.71 0-5-1.83-5.82-4.3z"
      />
      <path
        fill="#4A90E2"
        d="M2.11 7.09C1.4 8.5 1 10.06 1 11.73c0 1.67.4 3.23 1.11 4.64l3.37-2.62c-.2-.6-.32-1.24-.32-1.92s.12-1.32.32-1.92z"
      />
      <path
        fill="#FBBC05"
        d="M12.24 4.75c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.18 1.74 14.05.75 12.24.75 7.66.75 3.7 3.05 2.11 7.09l3.37 2.62c.82-2.47 3.11-4.3 5.76-4.3z"
      />
    </svg>
  );
}

export function AuthScreen() {
  const { login, register, resetPassword, loginWithGoogle, loading, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authError) return;
    const friendly = /INVALID IDP RESPONSE|not allowed to be used with this application|audience/i.test(
      authError
    )
      ? 'Google sign-in is misconfigured on the server (OAuth client not linked to Firebase). Try again after the backend update, or use email sign-in.'
      : authError;
    setError(friendly);
  }, [authError]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearAuthError();
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
          {mode !== 'reset' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={loginWithGoogle}
                disabled={busy}
                className="w-full min-h-14 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-3 shadow-md shadow-primary/25 hover:opacity-95 transition-opacity disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-background">
                  <GoogleIcon />
                </span>
                Continue with Google
              </button>
              <p className="text-[10px] text-muted-foreground text-center">
                Recommended — sign in with your Google account
              </p>
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                <div className="flex-1 h-px bg-border" />
                or email
                <div className="flex-1 h-px bg-border" />
              </div>
            </div>
          )}

          <div className="flex p-1 rounded-xl bg-muted gap-1">
            {(['login', 'register', 'reset'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                  clearAuthError();
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
                  ? 'Sign in with email'
                  : mode === 'register'
                    ? 'Create account'
                    : 'Send reset link'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-[10px] text-muted-foreground text-center px-2">
          Secured with Firebase Authentication via the PTA backend. Continue with Google, or use email.
        </p>
      </div>
    </div>
  );
}
