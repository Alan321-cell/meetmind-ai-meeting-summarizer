import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, User, AlertTriangle, ListTodo, Filter } from 'lucide-react';
import { ActionItem, ActionItemStatus, PriorityLevel } from '../api/types';

interface ActionItemsTableProps {
  actionItems: ActionItem[];
  onToggleStatus: (itemId: string, newStatus: ActionItemStatus) => Promise<void>;
}

export const ActionItemsTable: React.FC<ActionItemsTableProps> = ({
  actionItems,
  onToggleStatus,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredItems = actionItems.filter((item) => {
    if (filter === 'PENDING') return item.status === 'PENDING' || item.status === 'IN_PROGRESS';
    if (filter === 'COMPLETED') return item.status === 'COMPLETED';
    return true;
  });

  const handleToggle = async (item: ActionItem) => {
    const nextStatus: ActionItemStatus = item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setUpdatingId(item.id);
    try {
      await onToggleStatus(item.id, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" /> Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
            High
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Low
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
            Medium
          </span>
        );
    }
  };

  if (actionItems.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
        <ListTodo className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-medium">No actionable tasks were detected in this meeting transcript.</p>
      </div>
    );
  }

  const completedCount = actionItems.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-4">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-emerald-400" />
            Action Items & Deliverables ({completedCount}/{actionItems.length} Completed)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Click the checkbox to mark tasks as completed</p>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              filter === 'ALL' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({actionItems.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              filter === 'PENDING' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending ({actionItems.length - completedCount})
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              filter === 'COMPLETED' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-2.5">
        {filteredItems.map((item) => {
          const isDone = item.status === 'COMPLETED';
          const isUpdating = updatingId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => handleToggle(item)}
              className={`glass-card rounded-xl p-4 flex items-start gap-3.5 cursor-pointer transition-all duration-200 hover:bg-slate-900/90 group ${
                isDone ? 'opacity-65 bg-slate-950/40 border-slate-800/60' : 'border-slate-800'
              }`}
            >
              {/* Checkbox button */}
              <button
                disabled={isUpdating}
                className="mt-0.5 text-slate-400 group-hover:text-emerald-400 transition"
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 group-hover:text-brand-400 shrink-0" />
                )}
              </button>

              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium leading-relaxed transition-all ${
                    isDone ? 'line-through text-slate-400' : 'text-slate-100 group-hover:text-white'
                  }`}
                >
                  {item.task}
                </p>

                {/* Metadata Pills */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                  {/* Assignee */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium">
                    <User className="w-3 h-3 text-sky-400" />
                    {item.assignee || 'Unassigned'}
                  </span>

                  {/* Deadline */}
                  {item.deadline && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800/80 text-amber-300/90 border border-slate-700/60 font-medium">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Due: {item.deadline}
                    </span>
                  )}

                  {/* Priority */}
                  {getPriorityBadge(item.priority)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
