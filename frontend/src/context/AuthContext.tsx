"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types';

const defaultProfile: UserProfile = {
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

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: defaultProfile,
  loading: false,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(defaultProfile);
  const [loading, setLoading] = useState(false);

  return (
    <AuthContext.Provider value={{ user, loading, logout: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
