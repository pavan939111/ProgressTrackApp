/**
 * Audible alarm for PTA session reminders.
 * OS notification sound is unreliable (Focus Assist / silent mode);
 * we always play an in-app tone when a PTA window can play audio.
 */

let sharedCtx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new Ctx();
  }
  return sharedCtx;
}

/** Call from a user gesture (Allow alarms / Test alarm) so browsers permit playback later. */
export async function armAlarmAudio(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getCtx();
    if (!ctx) {
      unlocked = true;
      return;
    }
    if (ctx.state === 'suspended') await ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.02);
    unlocked = true;
  } catch {
    unlocked = true;
  }
}

/** Play a loud multi-beep alarm (+ WAV). Works while PTA is open enough for AudioContext. */
export async function playAlarmSound(opts?: { beeps?: number }): Promise<void> {
  if (typeof window === 'undefined') return;
  const beeps = opts?.beeps ?? 5;

  // WAV first — more reliable on some Windows browsers than oscillators alone
  void playWavFallback();

  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') await ctx.resume();
    unlocked = true;

    const now = ctx.currentTime;
    for (let i = 0; i < beeps; i++) {
      const t0 = now + i * 0.42;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1040, t0);
      osc.frequency.setValueAtTime(780, t0 + 0.14);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.34);
    }
  } catch {
    // WAV already attempted
  }
}

async function playWavFallback() {
  try {
    const audio = new Audio(`/sounds/alarm.wav?t=${Date.now()}`);
    audio.volume = 1;
    audio.loop = false;
    await audio.play();
  } catch {
    // Autoplay blocked until user taps Allow/Test (armAlarmAudio)
  }
}

export function isAlarmAudioArmed() {
  return unlocked;
}

/**
 * Keep AudioContext unlockable after Allow/Test: browsers can re-suspend audio
 * when the tab backgrounds. First tap/click anywhere re-arms.
 */
export function installAlarmGestureUnlock(): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const onGesture = () => {
    void armAlarmAudio();
  };
  window.addEventListener('pointerdown', onGesture, { passive: true });
  window.addEventListener('keydown', onGesture, { passive: true });
  return () => {
    window.removeEventListener('pointerdown', onGesture);
    window.removeEventListener('keydown', onGesture);
  };
}
