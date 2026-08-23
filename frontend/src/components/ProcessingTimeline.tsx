import React from 'react';
import { CheckCircle2, Loader2, Clock, Mic, Sparkles, Brain, FileCheck } from 'lucide-react';
import { MeetingStatus } from '../api/types';

interface ProcessingTimelineProps {
  status: MeetingStatus;
  currentStep?: string;
  errorMessage?: string | null;
}

interface StepInfo {
  key: string;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

const steps: StepInfo[] = [
  {
    key: 'UPLOADING',
    label: 'Upload Audio',
    description: 'Validating & transferring file stream',
    icon: Mic,
  },
  {
    key: 'TRANSCRIBING',
    label: 'Whisper ASR Transcription',
    description: 'Converting voice recordings to timestamped text',
    icon: FileCheck,
  },
  {
    key: 'ANALYZING',
    label: 'LLM Intelligence Extraction',
    description: 'Identifying decisions, summary, and action items',
    icon: Brain,
  },
  {
    key: 'COMPLETED',
    label: 'Meeting Intelligence Ready',
    description: 'Structured actionable results compiled',
    icon: Sparkles,
  },
];

export const ProcessingTimeline: React.FC<ProcessingTimelineProps> = ({
  status,
  currentStep,
  errorMessage,
}) => {
  const getStepState = (stepIndex: number) => {
    if (status === 'FAILED') {
      return stepIndex === 0 ? 'completed' : 'error';
    }

    const statusOrder: Record<MeetingStatus, number> = {
      PENDING: 0,
      UPLOADING: 0,
      TRANSCRIBING: 1,
      ANALYZING: 2,
      COMPLETED: 3,
      FAILED: -1,
    };

    const currentIdx = statusOrder[status] ?? 0;

    if (stepIndex < currentIdx) return 'completed';
    if (stepIndex === currentIdx && status !== 'COMPLETED') return 'active';
    if (stepIndex === currentIdx && status === 'COMPLETED') return 'completed';
    return 'pending';
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            AI Processing Pipeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {currentStep || 'Executing speech recognition and natural language synthesis'}
          </p>
        </div>

        <div className="px-3 py-1 rounded-full text-xs font-mono font-medium border flex items-center gap-1.5 bg-brand-500/10 text-brand-400 border-brand-500/20">
          {status === 'COMPLETED' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Complete</span>
            </>
          ) : status === 'FAILED' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-400">Failed</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
              <span>Processing</span>
            </>
          )}
        </div>
      </div>

      {/* Steps List */}
      <div className="relative">
        {/* Continuous connector line */}
        <div className="absolute left-6 top-5 bottom-5 w-0.5 bg-slate-800 -z-0" />

        <div className="space-y-6 relative z-10">
          {steps.map((step, idx) => {
            const stepState = getStepState(idx);
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-start gap-4 group">
                {/* Step Circle */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    stepState === 'completed'
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                      : stepState === 'active'
                      ? 'bg-brand-500/20 border-2 border-brand-400 text-brand-300 glow-brand scale-105 animate-pulse-subtle'
                      : stepState === 'error'
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                  }`}
                >
                  {stepState === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : stepState === 'active' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Step Text Details */}
                <div className="pt-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        stepState === 'completed'
                          ? 'text-white'
                          : stepState === 'active'
                          ? 'text-brand-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    {stepState === 'active' && (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <span className="font-semibold text-rose-400">Error:</span>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
