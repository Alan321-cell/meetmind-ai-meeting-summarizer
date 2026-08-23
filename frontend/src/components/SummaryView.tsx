import React, { useState } from 'react';
import { Copy, Check, FileDown, Sparkles, Quote } from 'lucide-react';

interface SummaryViewProps {
  executiveSummary?: string | null;
  summaryMarkdown?: string | null;
  meetingTitle: string;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  executiveSummary,
  summaryMarkdown,
  meetingTitle,
}) => {
  const [copied, setCopied] = useState(false);

  const fullContent = `${meetingTitle}\n\nEXECUTIVE SUMMARY:\n${executiveSummary || ''}\n\nDETAILS:\n${summaryMarkdown || ''}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meetingTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_summary.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-400" />
          Executive Intelligence Summary
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-sm"
            title="Copy summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-sm"
            title="Download summary as Markdown file"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Download .MD</span>
          </button>
        </div>
      </div>

      {/* Executive Callout Card */}
      {executiveSummary && (
        <div className="relative p-5 rounded-2xl bg-gradient-to-r from-brand-950/40 via-slate-900/80 to-slate-900/60 border border-brand-500/20 shadow-lg">
          <Quote className="absolute top-4 right-4 w-8 h-8 text-brand-500/10 pointer-events-none" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-400 block mb-2">
            Executive Briefing
          </span>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
            {executiveSummary}
          </p>
        </div>
      )}

      {/* Structured Summary Content */}
      <div className="glass-panel rounded-2xl p-6 prose prose-invert prose-slate max-w-none text-sm leading-relaxed">
        {summaryMarkdown ? (
          <div className="whitespace-pre-line text-slate-300 space-y-3 font-normal">
            {summaryMarkdown}
          </div>
        ) : (
          <p className="text-slate-400 italic">No detailed summary markdown generated for this meeting.</p>
        )}
      </div>
    </div>
  );
};
