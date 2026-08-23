import React from 'react';
import { Bot, Plus, Sparkles, AudioWaveform, FileAudio } from 'lucide-react';

interface EmptyStateProps {
  onUploadClick: () => void;
  onDemoClick: () => void;
  isDemoLoading?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onUploadClick,
  onDemoClick,
  isDemoLoading,
}) => {
  return (
    <div className="glass-panel rounded-3xl p-12 text-center max-w-2xl mx-auto my-8 border border-dashed border-slate-800">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600/20 via-sky-500/20 to-brand-400/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto mb-4 shadow-xl shadow-brand-500/10">
        <AudioWaveform className="w-8 h-8 text-brand-400 animate-pulse-subtle" />
      </div>

      <h3 className="text-xl font-bold text-white tracking-tight mb-2">
        No meetings analyzed yet
      </h3>

      <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
        Upload your meeting voice recordings (MP3, WAV, M4A) to automatically transcribe speech, extract
        executive summaries, and detect action items.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onUploadClick}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 shadow-lg shadow-brand-500/25 transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Audio File</span>
        </button>

        <button
          onClick={onDemoClick}
          disabled={isDemoLoading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Load Sample Meeting</span>
        </button>
      </div>

      {/* Feature Pills */}
      <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
          <span className="text-xs font-semibold text-slate-200 block mb-1">🎯 Accurate ASR</span>
          <span className="text-[11px] text-slate-400">OpenAI & Groq Whisper powered speech recognition</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
          <span className="text-xs font-semibold text-slate-200 block mb-1">⚡ Instant Synthesis</span>
          <span className="text-[11px] text-slate-400">Executive takeaways and structured key decisions</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
          <span className="text-xs font-semibold text-slate-200 block mb-1">📋 Action Trackers</span>
          <span className="text-[11px] text-slate-400">Assignees, deadlines, and interactive completion</span>
        </div>
      </div>
    </div>
  );
};
