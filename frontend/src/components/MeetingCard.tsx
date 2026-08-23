import React from 'react';
import { Clock, HardDrive, ListTodo, Lightbulb, Trash2, ArrowUpRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { MeetingListItem, MeetingStatus } from '../api/types';

interface MeetingCardProps {
  meeting: MeetingListItem;
  onSelect: (id: string) => void;
  onDelete: (id: string, title: string) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onSelect, onDelete }) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Analyzed
          </span>
        );
      case 'TRANSCRIBING':
      case 'ANALYZING':
      case 'UPLOADING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            Pending
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelect(meeting.id)}
      className="glass-card rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Top row: Status and Actions */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {getStatusBadge(meeting.status)}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 font-mono">
              {formatDate(meeting.created_at)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(meeting.id, meeting.title);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition ml-1"
              title="Delete meeting"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-1 mb-2">
          {meeting.title}
        </h3>

        {/* Executive summary preview */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {meeting.executive_summary || 'No summary available yet. Click to view transcription and analysis.'}
        </p>
      </div>

      {/* Bottom meta row */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            {formatDuration(meeting.duration_seconds)}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            {formatSize(meeting.file_size_bytes)}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {meeting.decisions_count > 0 && (
            <span className="flex items-center gap-1 text-amber-400 font-medium text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              <Lightbulb className="w-3 h-3" />
              {meeting.decisions_count}
            </span>
          )}

          {meeting.action_items_count > 0 && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <ListTodo className="w-3 h-3" />
              {meeting.action_items_count}
            </span>
          )}

          <div className="p-1 rounded-md text-slate-400 group-hover:text-brand-400 group-hover:bg-brand-500/10 transition">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
