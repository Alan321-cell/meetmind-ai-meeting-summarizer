import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, RefreshCw, LayoutGrid, List, Plus, Sparkles, Mic } from 'lucide-react';
import { api } from '../api/client';
import { MeetingListItem, StatsResponse } from '../api/types';
import { StatsBanner } from '../components/StatsBanner';
import { MeetingCard } from '../components/MeetingCard';
import { EmptyState } from '../components/EmptyState';
import { UploadModal } from '../components/UploadModal';
import { DeleteModal } from '../components/DeleteModal';

interface DashboardProps {
  onSelectMeeting: (meetingId: string) => void;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  onDemoCreate: () => void;
  isDemoLoading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectMeeting,
  isUploadOpen,
  setIsUploadOpen,
  onDemoCreate,
  isDemoLoading,
}) => {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const fetchMeetingsAndStats = useCallback(async () => {
    try {
      const [meetingsData, statsData] = await Promise.all([
        api.listMeetings({ search: searchQuery, status: statusFilter }),
        api.getStats(),
      ]);
      setMeetings(meetingsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch meetings/stats:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchMeetingsAndStats();
  }, [fetchMeetingsAndStats]);

  // Periodic polling if any meeting is in a non-terminal processing state
  useEffect(() => {
    const hasActiveProcessing = meetings.some(
      (m) => m.status === 'TRANSCRIBING' || m.status === 'ANALYZING' || m.status === 'UPLOADING'
    );
    if (!hasActiveProcessing) return;

    const interval = setInterval(() => {
      fetchMeetingsAndStats();
    }, 3000);

    return () => clearInterval(interval);
  }, [meetings, fetchMeetingsAndStats]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteMeeting(deleteTarget.id);
      await fetchMeetingsAndStats();
    } catch (err) {
      console.error('Failed to delete meeting:', err);
    }
  };

  const handleUploadSuccess = (newMeeting: any) => {
    fetchMeetingsAndStats();
    onSelectMeeting(newMeeting.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero / Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Meeting Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Turn recorded conversations into executive summaries, key decisions, and actionable deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMeetingsAndStats()}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            title="Refresh meetings list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 shadow-lg shadow-brand-500/25 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Meeting</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Banner */}
      <StatsBanner stats={stats} loading={loading} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search meetings by title or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Status Filter Tabs & View Mode Switcher */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            {['ALL', 'COMPLETED', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition font-medium capitalize ${
                  statusFilter === st
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Meetings' : st === 'COMPLETED' ? 'Analyzed' : 'Failed'}
              </button>
            ))}
          </div>

          {/* Grid/List switch */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-slate-400">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'GRID' ? 'bg-slate-800 text-brand-400' : 'hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'LIST' ? 'bg-slate-800 text-brand-400' : 'hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Meetings Display */}
      {loading && meetings.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 bg-slate-900/50 rounded-2xl border border-slate-800/80" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <EmptyState
          onUploadClick={() => setIsUploadOpen(true)}
          onDemoClick={onDemoCreate}
          isDemoLoading={isDemoLoading}
        />
      ) : (
        <div
          className={
            viewMode === 'GRID'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'space-y-3'
          }
        >
          {meetings.map((m) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onSelect={onSelectMeeting}
              onDelete={(id, title) => setDeleteTarget({ id, title })}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        meetingTitle={deleteTarget?.title || ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
