'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { usePwa } from '@/components/PwaRegister';

const DISMISS_KEY = 'pta_install_banner_dismissed';

function isIos() {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function InstallAppBanner() {
  const { canInstall, isStandalone, isInstalled, install } = usePwa();
  const [dismissed, setDismissed] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (isStandalone || isInstalled || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const onInstall = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (canInstall) {
        const ok = await install();
        setMsg(ok ? 'Installing…' : 'Install cancelled');
        if (ok) dismiss();
      } else if (isIos()) {
        setMsg('Tap Share → Add to Home Screen');
      } else {
        setMsg('Use browser menu → Install app / Add to Home screen');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/10 p-3.5 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
        <Download className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="text-sm font-bold text-foreground">Download as app</p>
          <p className="text-xs text-muted-foreground">
            Install PTA on your phone or desktop for full-screen use, faster open, and offline shell.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onInstall()}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60"
          >
            {canInstall ? <Download className="w-3.5 h-3.5" /> : <Share className="w-3.5 h-3.5" />}
            {canInstall ? 'Download as app' : isIos() ? 'How to add on iPhone' : 'How to install'}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="px-3 py-2 min-h-11 rounded-xl border border-border text-xs font-bold text-muted-foreground"
          >
            Not now
          </button>
        </div>
        {msg && <p className="text-xs font-semibold text-secondary">{msg}</p>}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="p-2 text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Dismiss install banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
