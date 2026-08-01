'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { defaultProfile, ptaStore } from '@/lib/ptaStore';
import {
  backendDemoLogin,
  backendLogin,
  backendMe,
  backendRegister,
  backendResetPassword,
  backendRefresh,
  getSession,
  saveSession,
  type AuthSession,
} from '@/lib/authClient';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  enterDemo: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function applyUser(profile: UserProfile) {
  ptaStore.ensureSeeded(profile.uid, profile.email, profile.fullName);
  const local = ptaStore.getProfile(profile.uid);
  return local || ptaStore.saveProfile(profile);
}

function persistTokens(data: {
  user: UserProfile;
  idToken: string | null;
  refreshToken?: string | null;
  expiresIn?: string;
}) {
  if (!data.idToken || !data.refreshToken) {
    saveSession(null);
    return;
  }
  const expiresInSec = Number(data.expiresIn || 3600);
  const session: AuthSession = {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    uid: data.user.uid,
    email: data.user.email,
    fullName: data.user.fullName,
    expiresAt: Date.now() + expiresInSec * 1000 - 60_000,
  };
  saveSession(session);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const refreshProfile = () => {
    if (!user) return;
    const p = ptaStore.getProfile(user.uid);
    if (p) setUser(p);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = getSession();
        if (!session) {
          if (!cancelled) setLoading(false);
          return;
        }

        if (session.expiresAt < Date.now() && session.refreshToken) {
          const refreshed = await backendRefresh(session.refreshToken);
          if (refreshed.success && refreshed.data) {
            saveSession({
              ...session,
              idToken: refreshed.data.idToken,
              refreshToken: refreshed.data.refreshToken,
              expiresAt: Date.now() + Number(refreshed.data.expiresIn || 3600) * 1000 - 60_000,
            });
          } else {
            saveSession(null);
            if (!cancelled) setLoading(false);
            return;
          }
        }

        const me = await backendMe();
        if (me.success && me.data?.user) {
          const profile = applyUser({
            ...defaultProfile({
              uid: me.data.user.uid,
              email: me.data.user.email || session.email,
              fullName: me.data.user.fullName || session.fullName,
            }),
            ...me.data.user,
          });
          if (!cancelled) {
            setIsDemo(false);
            setUser(profile);
            void ptaStore.hydrateFromBackend();
          }
        } else {
          saveSession(null);
        }
      } catch {
        saveSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await backendLogin(email, password);
    if (!res.success || !res.data) throw new Error(res.message || 'Login failed');
    const profile = applyUser(res.data.user);
    persistTokens(res.data);
    setIsDemo(false);
    setUser(profile);
    void ptaStore.hydrateFromBackend();
  };

  const register = async (email: string, password: string, fullName: string) => {
    const res = await backendRegister(email, password, fullName);
    if (!res.success || !res.data) throw new Error(res.message || 'Register failed');
    const profile = applyUser({ ...res.data.user, fullName });
    persistTokens(res.data);
    setIsDemo(false);
    setUser(profile);
  };

  const resetPassword = async (email: string) => {
    const res = await backendResetPassword(email);
    if (!res.success) throw new Error(res.message || 'Reset failed');
  };

  const enterDemo = () => {
    saveSession(null);
    const uid = 'demo-user-123';
    const profile = ptaStore.ensureSeeded(uid, 'demo.user@example.com', 'Demo User');
    setIsDemo(true);
    setUser(profile);
    void backendDemoLogin();
  };

  const logout = async () => {
    saveSession(null);
    setUser(null);
    setIsDemo(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemo,
        login,
        register,
        resetPassword,
        enterDemo,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
