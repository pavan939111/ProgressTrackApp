'use client';

import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';

function resolveTheme(preference: 'dark' | 'light' | 'system'): 'dark' | 'light' {
  if (preference === 'system') {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

export function applyDocumentTheme(preference: 'dark' | 'light' | 'system') {
  const resolved = resolveTheme(preference);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.dataset.theme = resolved;
  try {
    localStorage.setItem('pta_theme', preference);
  } catch {
    /* ignore quota / private mode */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#0B0F14' : '#F4F4F4');
  }
}

/** Keeps <html> class + theme-color in sync with user settings (Stitch light/dark). */
export function ThemeSync() {
  const { settings } = useApp();

  useEffect(() => {
    applyDocumentTheme(settings.theme);
    if (settings.theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyDocumentTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [settings.theme]);

  return null;
}
