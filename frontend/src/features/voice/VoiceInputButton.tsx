'use client';

import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '@/lib/voice';

interface Props {
  onResult: (text: string) => void;
  /** append vs replace */
  mode?: 'append' | 'replace';
  currentValue?: string;
  className?: string;
  label?: string;
}

export function VoiceInputButton({
  onResult,
  mode = 'append',
  currentValue = '',
  className = '',
  label,
}: Props) {
  const { listening, supported, error, toggle } = useVoiceInput((text, isFinal) => {
    if (!isFinal) return;
    if (mode === 'replace') onResult(text);
    else onResult(currentValue ? `${currentValue} ${text}`.trim() : text);
  });

  if (!supported) {
    return (
      <span className="text-[10px] text-slate-500" title="Voice not supported in this browser">
        Voice N/A
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        title={listening ? 'Stop listening' : 'Dictate with voice'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
          listening
            ? 'bg-rose-600/30 border-rose-500/50 text-rose-300 animate-pulse'
            : 'bg-slate-900 border-white/10 text-cyan-400 hover:border-cyan-500/40'
        }`}
      >
        {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        {label || (listening ? 'Listening…' : 'Voice')}
      </button>
      {error && <span className="text-[10px] text-rose-400 max-w-[140px] truncate">{error}</span>}
    </div>
  );
}
