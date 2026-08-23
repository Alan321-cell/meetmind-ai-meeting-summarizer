import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Clock,
  HardDrive,
  Sparkles,
  ShieldCheck,
  ListTodo,
  MessagesSquare,
  AlignLeft,
  Trash2,
  Share2,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import { MeetingDetail as IMeetingDetail, ActionItemStatus } from '../api/types';
import { ProcessingTimeline } from '../components/ProcessingTimeline';
import { SummaryView } from '../components/SummaryView';
import { DecisionsList } from '../components/DecisionsList';
import { ActionItemsTable } from '../components/ActionItemsTable';
import { DiscussionPoints } from '../components/DiscussionPoints';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { AudioPlayer } from '../components/AudioPlayer';
import { DeleteModal } from '../components/DeleteModal';

interface MeetingDetailProps {
  meetingId: string;
  onBack: () => void;
}

type TabType = 'SUMMARY' | 'DECISIONS' | 'ACTIONS' | 'TOPICS' | 'TRANSCRIPT';

export const MeetingDetail: React.FC<MeetingDetailProps> = ({ meetingId, onBack }) => {
  const [meeting, setMeeting] = useState<IMeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('SUMMARY');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  const fetchMeeting = useCallback(async () => {
    try {
      const data = await api.getMeeting(meetingId);
      setMeeting(data);
    } catch (err) {
      console.error('Failed to load meeting details:', err);
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  // Polling if processing
  useEffect(() => {
    if (!meeting) return;
    if (meeting.status === 'COMPLETED' || meeting.status === 'FAILED') return;

    const interval = setInterval(() => {
      fetchMeeting();
    }, 2500);

    return () => clearInterval(interval);
  }, [meeting, fetchMeeting]);

  const handleToggleActionItem = async (itemId: string, nextStatus: ActionItemStatus) => {
    if (!meeting) return;
    try {
      const updated = await api.updateActionItem(meeting.id, itemId, { status: nextStatus });
      setMeeting({
        ...meeting,
        action_items: meeting.action_items.map((item) =>
          item.id === itemId ? { ...item, status: updated.status } : item
        ),
      });
    } catch (err) {
      console.error('Failed to update action item:', err);
    }
  };

  const handleReprocess = async () => {
    if (!meeting) return;
    setIsReprocessing(true);
    try {
      const updated = await api.processMeeting(meeting.id);
      setMeeting(updated);
    } catch (err) {
      console.error('Reprocess failed:', err);
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!meeting) return;
    try {
      await api.deleteMeeting(meeting.id);
      onBack();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleExportFullJSON = () => {
    if (!meeting) return;
    const blob = new Blob([JSON.stringify(meeting, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meeting.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_intelligence.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateStr));
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

  if (loading && !meeting) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400 mb-3" />
        <span className="text-sm text-slate-400">Loading meeting intelligence...</span>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Meeting Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">The requested meeting does not exist or has been deleted.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-500"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isProcessing = meeting.status === 'TRANSCRIBING' || meeting.status === 'ANALYZING' || meeting.status === 'UPLOADING';
  const completedActions = meeting.action_items.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {meeting.status === 'FAILED' && (
            <button
              onClick={handleReprocess}
              disabled={isReprocessing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
              <span>Retry Processing</span>
            </button>
          )}

          <button
            onClick={handleExportFullJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            title="Export complete intelligence report as JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => setIsDeleteOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
            title="Delete meeting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Meeting Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {meeting.status === 'COMPLETED' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Complete
            </span>
          ) : meeting.status === 'FAILED' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertCircle className="w-3.5 h-3.5" />
              Failed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-500/15 text-brand-300 border border-brand-500/30 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {meeting.current_step || 'Processing...'}
            </span>
          )}

          <span className="text-xs text-slate-500">•</span>

          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {formatDate(meeting.created_at)}
          </span>

          <span className="text-xs text-slate-500">•</span>

          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            {formatDuration(meeting.duration_seconds)}
          </span>

          <span className="text-xs text-slate-500">•</span>

          <span className="text-xs text-slate-400 flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            {(meeting.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
          </span>
        </div>

        <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
          {meeting.title}
        </h1>

        {/* Audio Player */}
        <div className="pt-2">
          <AudioPlayer
            meetingId={meeting.id}
            originalFilename={meeting.original_filename}
            durationSeconds={meeting.duration_seconds}
          />
        </div>
      </div>

      {/* Processing State Timeline Visualizer (shown during processing or if failed) */}
      {isProcessing && (
        <ProcessingTimeline
          status={meeting.status}
          currentStep={meeting.current_step}
          errorMessage={meeting.error_message}
        />
      )}

      {/* If Completed: Render Multi-Tab Intelligence Explorer */}
      {meeting.status === 'COMPLETED' && (
        <div className="space-y-6">
          {/* Tabs Navigation Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
            <button
              onClick={() => setActiveTab('SUMMARY')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'SUMMARY'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('DECISIONS')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'DECISIONS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Decisions ({meeting.decisions?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('ACTIONS')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'ACTIONS'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>Action Items ({completedActions}/{meeting.action_items.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('TOPICS')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'TOPICS'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MessagesSquare className="w-4 h-4" />
              <span>Topics ({meeting.discussion_points?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('TRANSCRIPT')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === 'TRANSCRIPT'
                  ? 'bg-slate-800 text-brand-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <AlignLeft className="w-4 h-4" />
              <span>Full Transcript</span>
            </button>
          </div>

          {/* Tab Content Panes */}
          <div className="pt-2">
            {activeTab === 'SUMMARY' && (
              <SummaryView
                executiveSummary={meeting.executive_summary}
                summaryMarkdown={meeting.summary_markdown}
                meetingTitle={meeting.title}
              />
            )}

            {activeTab === 'DECISIONS' && (
              <DecisionsList decisions={meeting.decisions} />
            )}

            {activeTab === 'ACTIONS' && (
              <ActionItemsTable
                actionItems={meeting.action_items}
                onToggleStatus={handleToggleActionItem}
              />
            )}

            {activeTab === 'TOPICS' && (
              <DiscussionPoints discussionPoints={meeting.discussion_points} />
            )}

            {activeTab === 'TRANSCRIPT' && (
              <TranscriptViewer
                transcriptText={meeting.transcript_text}
                segments={meeting.transcript_segments}
                meetingTitle={meeting.title}
              />
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteOpen}
        meetingTitle={meeting.title}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
