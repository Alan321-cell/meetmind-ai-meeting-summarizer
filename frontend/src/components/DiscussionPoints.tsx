import React from 'react';
import { MessagesSquare, CheckCircle, ChevronRight } from 'lucide-react';
import { DiscussionPoint } from '../api/types';

interface DiscussionPointsProps {
  discussionPoints?: DiscussionPoint[] | null;
}

export const DiscussionPoints: React.FC<DiscussionPointsProps> = ({ discussionPoints }) => {
  if (!discussionPoints || discussionPoints.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
        <MessagesSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-medium">No discussion points categorizations available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <MessagesSquare className="w-4 h-4 text-sky-400" />
          Key Discussion Topics & Highlights ({discussionPoints.length})
        </h3>
        <span className="text-xs text-slate-400">Thematic breakdown of conversations</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {discussionPoints.map((point, idx) => (
          <div key={idx} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 font-mono font-bold text-xs flex items-center justify-center">
                {idx + 1}
              </span>
              <h4 className="text-sm font-semibold text-slate-100">{point.topic}</h4>
            </div>

            <ul className="space-y-2 text-xs text-slate-300">
              {point.highlights.map((highlight, hIdx) => (
                <li key={hIdx} className="flex items-start gap-2 leading-relaxed">
                  <ChevronRight className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
