"use client";

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Zap } from 'lucide-react';

export const GamificationOverlay = () => {
  const { xpGain } = useApp();

  if (!xpGain) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-bounce-subtle">
      <div className="glass-panel px-6 py-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/90 to-slate-950/90 shadow-2xl flex items-center gap-4 text-foreground">
        <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30">
          <Zap className="w-6 h-6 text-accent fill-amber-400" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">XP Unlocked!</p>
          <p className="text-lg font-black text-foreground">+{xpGain.amount} XP</p>
          <p className="text-xs text-muted-foreground">{xpGain.reason}</p>
        </div>
      </div>
    </div>
  );
};
