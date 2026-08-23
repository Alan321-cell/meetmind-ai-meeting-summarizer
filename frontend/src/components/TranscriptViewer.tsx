import React, { useState } from 'react';
import { Search, Copy, Check, Download, AlignLeft, ListFilter, User } from 'lucide-react';
import { TranscriptSegment } from '../api/types';

interface TranscriptViewerProps {
  transcriptText?: string | null;
  segments?: TranscriptSegment[] | null;
  meetingTitle: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcriptText,
  segments,
  meetingTitle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'SEGMENTS' | 'RAW'>('SEGMENTS');
  const [copied, setCopied] = useState(false);

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = async () => {
    if (!transcriptText) return;
    try {
      await navigator.clipboard.writeText(transcriptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy transcript:', err);
    }
  };

  const handleDownload = () => {
    if (!transcriptText) return;
    const blob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meetingTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_transcript.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredSegments = (segments || []).filter((seg) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      seg.text.toLowerCase().includes(q) ||
      (seg.speaker && seg.speaker.toLowerCase().includes(q))
    );
  });

  if (!transcriptText && (!segments || segments.length === 0)) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
        <AlignLeft className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-medium">No transcript available for this meeting.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search transcript text or speaker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* View mode toggle & Export actions */}
        <div className="flex items-center gap-2">
          {segments && segments.length > 0 && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setViewMode('SEGMENTS')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  viewMode === 'SEGMENTS' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Timestamped speaker segments view"
              >
                Dialogue View
              </button>
              <button
                onClick={() => setViewMode('RAW')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  viewMode === 'RAW' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Continuous paragraph text view"
              >
                Text View
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            title="Copy full transcript"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            title="Download full transcript text file"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>.TXT</span>
          </button>
        </div>
      </div>

      {/* Transcript Body */}
      <div className="glass-panel rounded-2xl p-5 max-h-[550px] overflow-y-auto space-y-4">
        {viewMode === 'SEGMENTS' && segments && segments.length > 0 ? (
          filteredSegments.length > 0 ? (
            filteredSegments.map((seg) => (
              <div
                key={seg.id}
                className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/60 hover:border-slate-700/80 transition flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center text-[10px] font-bold">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="font-semibold text-slate-200">{seg.speaker || 'Speaker'}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {formatTimestamp(seg.start)} - {formatTimestamp(seg.end)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-7">
                  {seg.text}
                </p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No transcript lines match your search query "{searchQuery}".
            </div>
          )
        ) : (
          <div className="text-xs sm:text-sm text-slate-300 leading-loose whitespace-pre-line p-2">
            {transcriptText}
          </div>
        )}
      </div>
    </div>
  );
};
