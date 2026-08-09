import React, { useState } from 'react';
import {
  Calendar, Clock, FileText, Users, ChevronDown, ChevronUp,
  Trash2, Edit3, AlertTriangle, CheckCircle2, Circle, Loader2,
  Paperclip, ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';
import StatusBadge from './ui/StatusBadge';

const priorityConfig = {
  Low:    { color: 'text-slate-500',  bg: 'bg-slate-100 dark:bg-slate-800',    dot: 'bg-slate-400' },
  Medium: { color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20',    dot: 'bg-blue-500' },
  High:   { color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-900/20',  dot: 'bg-amber-500' },
  Urgent: { color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-900/20',      dot: 'bg-red-500 animate-pulse' },
};

const getDeadlineInfo = (deadline) => {
  if (!deadline) return { text: 'No deadline', color: 'text-slate-400', urgent: false };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-500', urgent: true };
  if (diffDays === 0) return { text: 'Due today', color: 'text-red-500', urgent: true };
  if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-amber-500', urgent: false };
  if (diffDays <= 3) return { text: `${diffDays} days left`, color: 'text-amber-500', urgent: false };
  if (diffDays <= 7) return { text: `${diffDays} days left`, color: 'text-blue-500', urgent: false };
  return { text: `${diffDays} days left`, color: 'text-slate-500', urgent: false };
};

const TaskCard = ({ task, onDelete, onStatusChange, categoryColor }) => {
  const [expanded, setExpanded] = useState(false);
  const priority = priorityConfig[task.priority] || priorityConfig.Medium;
  const deadlineInfo = getDeadlineInfo(task.deadline);
  const coordinators = task.coordinators?.map((c) => c.staff).filter(Boolean) || [];

  const catColor = task.category?.color || categoryColor || '#3b82f6';

  return (
    <div
      className={clsx(
        'group glass dark:glass-dark rounded-2xl overflow-hidden transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-0.5',
        'animate-slide-up'
      )}
    >
      {/* Category color accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: catColor }} />

      <div className="p-5">
        {/* Top row: priority + category + status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority dot */}
            <span className={clsx('w-2.5 h-2.5 rounded-full shrink-0', priority.dot)} title={`${task.priority} priority`} />
            {/* Category chip */}
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: catColor + '20', color: catColor }}
            >
              {task.category?.name || 'Uncategorized'}
            </span>
          </div>
          <StatusBadge status={task.status} size="xs" />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug line-clamp-2">
          {task.title}
        </h3>

        {/* Description preview */}
        {task.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3 flex-wrap">
          {/* Deadline */}
          <div className={clsx('flex items-center gap-1', deadlineInfo.color)}>
            {deadlineInfo.urgent ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )}
            <span className="font-medium">{deadlineInfo.text}</span>
          </div>

          {/* Date assigned */}
          {task.date_assigned && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(task.date_assigned).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            </div>
          )}

          {/* Document indicator */}
          {task.document_url && (
            <div className="flex items-center gap-1 text-blue-500">
              <Paperclip className="w-3.5 h-3.5" />
              <span className="font-medium">File</span>
            </div>
          )}
        </div>

        {/* Co-coordinators */}
        {coordinators.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex -space-x-2">
              {coordinators.slice(0, 4).map((person) => (
                <div
                  key={person.id}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white border-2 border-white dark:border-slate-900"
                  title={person.full_name}
                >
                  {person.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
              ))}
              {coordinators.length > 4 && (
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300 border-2 border-white dark:border-slate-900">
                  +{coordinators.length - 4}
                </div>
              )}
            </div>
            <span className="text-[11px] text-slate-400">{coordinators.length} co-coordinator{coordinators.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Expand / actions row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Less' : 'Details'}
          </button>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Status quick-toggle */}
            {task.status !== 'Done' && (
              <button
                onClick={() => onStatusChange?.(task.id, 'Done')}
                className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600 transition-colors"
                title="Mark as done"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
            {task.status === 'Done' && (
              <button
                onClick={() => onStatusChange?.(task.id, 'In Progress')}
                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-colors"
                title="Reopen"
              >
                <Circle className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete?.(task.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-slide-down">
            {/* Notes */}
            {task.notes && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</div>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{task.notes}</p>
              </div>
            )}

            {/* Document */}
            {task.document_url && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Attachment</div>
                <a
                  href={task.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {task.document_name || 'Download file'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Full coordinator list */}
            {coordinators.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Co-Coordinators</div>
                <div className="space-y-1.5">
                  {coordinators.map((person) => (
                    <div key={person.id} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[8px] font-bold text-white">
                        {person.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">{person.full_name}</span>
                      <span className="text-slate-400 text-xs">({person.email})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex gap-4 text-[11px] text-slate-400">
              <span>Created: {new Date(task.created_at).toLocaleDateString('en-IN')}</span>
              {task.updated_at !== task.created_at && (
                <span>Updated: {new Date(task.updated_at).toLocaleDateString('en-IN')}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
