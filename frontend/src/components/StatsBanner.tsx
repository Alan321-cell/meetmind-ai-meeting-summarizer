import React from 'react';
import { Mic, CheckCircle2, Clock, ListTodo, TrendingUp } from 'lucide-react';
import { StatsResponse } from '../api/types';

interface StatsBannerProps {
  stats: StatsResponse | null;
  loading: boolean;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ stats, loading }) => {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-900/60 rounded-xl border border-slate-800" />
        ))}
      </div>
    );
  }

  const formatDuration = (totalSeconds: number) => {
    if (totalSeconds < 60) return `${Math.round(totalSeconds)}s`;
    const mins = Math.floor(totalSeconds / 60);
    const hours = (mins / 60).toFixed(1);
    return mins >= 60 ? `${hours} hrs` : `${mins} mins`;
  };

  const totalActions = stats?.total_action_items || 0;
  const completedActions = stats?.completed_action_items || 0;
  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Meetings */}
      <div className="glass-card p-4 rounded-xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Processed Meetings</span>
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 group-hover:scale-110 transition-transform">
            <Mic className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{stats?.total_meetings || 0}</span>
          <span className="text-xs text-emerald-400 flex items-center font-medium">
            <CheckCircle2 className="w-3 h-3 mr-0.5" />
            {stats?.completed_meetings || 0} analyzed
          </span>
        </div>
      </div>

      {/* Transcribed Audio Time */}
      <div className="glass-card p-4 rounded-xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Audio Analyzed</span>
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {formatDuration(stats?.total_duration_seconds || 0)}
          </span>
          <span className="text-xs text-slate-400">Total duration</span>
        </div>
      </div>

      {/* Action Items */}
      <div className="glass-card p-4 rounded-xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Action Items</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
            <ListTodo className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{totalActions}</span>
          <span className="text-xs text-amber-400/90 font-medium">
            {stats?.pending_action_items || 0} pending
          </span>
        </div>
      </div>

      {/* Execution Rate */}
      <div className="glass-card p-4 rounded-xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Task Completion</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-bold text-white tracking-tight">{completionRate}%</span>
            <span className="text-xs text-slate-400">{completedActions}/{totalActions} done</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
