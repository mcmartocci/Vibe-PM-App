'use client';

import { useState } from 'react';
import { ChevronDown, Clock, Layers } from 'lucide-react';
import { WorkTimeEntry } from '@/types';
import { formatWorkTime } from '@/hooks/useWorkTime';
import { cn } from '@/lib/utils';

interface TaskTimeBreakdownProps {
  taskId: string;
  taskTitle: string;
  totalWorkTimeMs: number;
  entries: WorkTimeEntry[];
  rank?: number;
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function TaskTimeBreakdown({
  taskTitle,
  totalWorkTimeMs,
  entries,
  rank,
}: TaskTimeBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group entries by column for a summary view
  const columnSummary: Record<string, { columnName: string; totalMs: number }> = {};
  for (const entry of entries) {
    if (!columnSummary[entry.columnSlug]) {
      columnSummary[entry.columnSlug] = {
        columnName: entry.columnName,
        totalMs: 0,
      };
    }
    columnSummary[entry.columnSlug].totalMs += entry.durationMs;
  }

  const sortedColumnSummary = Object.entries(columnSummary)
    .map(([slug, data]) => ({ slug, ...data }))
    .sort((a, b) => b.totalMs - a.totalMs);

  return (
    <div className="bg-elevated border border-line-subtle rounded-xl overflow-hidden transition-all duration-200 hover:border-line">
      {/* Header - Clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface/50 transition-colors"
      >
        {/* Rank badge */}
        {rank !== undefined && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber/10 text-amber flex items-center justify-center text-xs font-medium">
            {rank}
          </div>
        )}

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-text text-sm font-medium truncate">{taskTitle}</h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Clock size={12} />
              {formatWorkTime(totalWorkTimeMs)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Layers size={12} />
              {entries.length} session{entries.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Expand indicator */}
        <ChevronDown
          size={16}
          className={cn(
            'text-text-muted transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-line-subtle bg-surface/30">
          {/* Column summary */}
          <div className="p-4 border-b border-line-subtle">
            <h5 className="text-xs font-medium text-text-secondary mb-3">Time by Column</h5>
            <div className="space-y-2">
              {sortedColumnSummary.map(({ slug, columnName, totalMs }) => {
                const percentage = Math.round((totalMs / totalWorkTimeMs) * 100);
                return (
                  <div key={slug} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-secondary truncate">
                          {columnName}
                        </span>
                        <span className="text-xs text-text-muted ml-2">
                          {formatWorkTime(totalMs)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-line-subtle rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-text-muted w-10 text-right">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual entries timeline */}
          <div className="p-4">
            <h5 className="text-xs font-medium text-text-secondary mb-3">Work Sessions</h5>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {entries.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg bg-elevated/50"
                >
                  <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary truncate">
                        {entry.columnName}
                      </span>
                      <span className="text-xs font-medium text-text ml-2">
                        {formatWorkTime(entry.durationMs)}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {formatDateTime(entry.startTime)}
                      {entry.endTime ? (
                        <span> - {formatDateTime(entry.endTime)}</span>
                      ) : (
                        <span className="text-sage ml-1">(ongoing)</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
