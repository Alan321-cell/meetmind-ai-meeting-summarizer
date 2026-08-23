import React, { useEffect, useState } from 'react';
import { Bot, Sparkles, Plus, Activity, RefreshCw, Cpu } from 'lucide-react';
import { api } from '../api/client';
import { HealthResponse } from '../api/types';

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenDemo: () => void;
  isDemoLoading?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenUpload, onOpenDemo, isDemoLoading }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch((err) => console.warn('Could not fetch backend health:', err));
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.hash = ''}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-sky-400 p-[1px] shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                MeetMind
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                AI v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Intelligent Meeting Summarizer & Action Hub</p>
          </div>
        </div>

        {/* Center / Health Status Diagnostics */}
        <div className="hidden md:flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 rounded-full px-3 py-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium capitalize">
              {health ? health.status : 'Connecting...'}
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>ASR: <strong className={`uppercase ${health?.asr_provider === 'mock' ? 'text-amber-300' : 'text-slate-200'}`}>{health?.asr_provider === 'mock' ? 'Offline Engine' : health?.asr_provider || 'Whisper'}</strong></span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>LLM: <strong className={`uppercase ${health?.llm_provider === 'mock' ? 'text-amber-300' : 'text-slate-200'}`}>{health?.llm_provider === 'mock' ? 'Offline Engine' : health?.llm_provider || 'Auto'}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDemo}
            disabled={isDemoLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 transition shadow-sm disabled:opacity-50"
            title="Instantly seed a pre-analyzed demo meeting"
          >
            {isDemoLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span className="hidden sm:inline">Try Demo Meeting</span>
            <span className="sm:hidden">Demo</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-white bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 shadow-md shadow-brand-500/25 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Audio</span>
          </button>
        </div>
      </div>
    </header>
  );
};
