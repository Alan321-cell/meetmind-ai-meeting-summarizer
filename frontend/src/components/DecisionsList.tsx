import React from 'react';
import { Lightbulb, CheckCircle, ShieldCheck } from 'lucide-react';

interface DecisionsListProps {
  decisions?: string[] | null;
}

export const DecisionsList: React.FC<DecisionsListProps> = ({ decisions }) => {
  if (!decisions || decisions.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
        <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-medium">No explicit decisions were recorded in this meeting.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          Key Decisions Agreed ({decisions.length})
        </h3>
        <span className="text-xs text-slate-400">Finalized agreements & consensus</span>
      </div>

      <div className="grid gap-3">
        {decisions.map((decision, idx) => (
          <div
            key={idx}
            className="glass-card rounded-xl p-4.5 border-l-4 border-l-amber-500 flex items-start gap-3.5 transition-all hover:bg-slate-900/80"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-mono">
              {idx + 1}
            </div>

            <div className="flex-1">
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {decision}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400/90 font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Binding Decision
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
