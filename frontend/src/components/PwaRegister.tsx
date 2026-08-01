'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type PwaContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  swReady: boolean;
  install: () => Promise<boolean>;
};

const PwaContext = createContext<PwaContextValue | null>(null);

function detectStandalone() {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(display-mode: standalone)').matches;
  const ios = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return mq || ios;
}

export function PwaRegister({ children }: { children?: React.ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    setIsStandalone(detectStandalone());
    const onChange = () => setIsStandalone(detectStandalone());
    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener?.('change', onChange);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setIsStandalone(true);
      try {
        localStorage.setItem('pta_pwa_installed', '1');
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(async (reg) => {
          setSwReady(true);
          // Activate updated SW promptly
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            if (!worker) return;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                worker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });
          await navigator.serviceWorker.ready;
        })
        .catch(() => undefined);
    }

    return () => {
      mq.removeEventListener?.('change', onChange);
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome === 'accepted';
  }, [deferred]);

  const value: PwaContextValue = {
    canInstall: Boolean(deferred) && !isStandalone,
    isInstalled: isStandalone || (typeof window !== 'undefined' && localStorage.getItem('pta_pwa_installed') === '1'),
    isStandalone,
    swReady,
    install,
  };

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) {
    return {
      canInstall: false,
      isInstalled: false,
      isStandalone: false,
      swReady: false,
      install: async () => false,
    } satisfies PwaContextValue;
  }
  return ctx;
}
