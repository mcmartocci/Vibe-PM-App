'use client';

import { useState, useEffect } from 'react';
import { X, Timer, BarChart3, Clock, Loader2 } from 'lucide-react';
import { ProjectColumn } from '@/hooks/useColumns';
import { ProjectTimeReport } from '@/types';
import { useWorkTime, formatWorkTime, formatWorkTimeLong } from '@/hooks/useWorkTime';
import { TaskTimeBreakdown } from './TaskTimeBreakdown';
import { cn } from '@/lib/utils';

interface TimeReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  columns: ProjectColumn[];
}

type TabType = 'tasks' | 'columns';

export function TimeReportPanel({
  isOpen,
  onClose,
  projectId,
  projectName,
  columns,
}: TimeReportPanelProps) {
  const [report, setReport] = useState<ProjectTimeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const { calculateProjectWorkTime } = useWorkTime();

  // Fetch report when panel opens
  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      calculateProjectWorkTime(projectId, projectName, columns)
        .then(setReport)
        .finally(() => setLoading(false));
    }
  }, [isOpen, projectId, projectName, columns, calculateProjectWorkTime]);

  if (!isOpen) return null;

  // Get work columns for display (excluding first column and done columns)
  const workColumns = columns.filter(c => c.order > 0 && !c.is_done_column);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl mx-4 glass rounded-2xl shadow-2xl animate-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber/10">
              <Timer size={20} className="text-amber" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-text">
                Time Report
              </h2>
              <p className="text-sm text-text-muted">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-elevated transition-all duration-150"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={32} className="text-amber animate-spin mb-4" />
              <p className="text-sm text-text-muted">Calculating work time...</p>
            </div>
          ) : report ? (
            <>
              {/* Summary Stats */}
              <div className="p-5 border-b border-line-subtle">
                <div className="grid grid-cols-3 gap-4">
                  {/* Total Work Time */}
                  <div className="bg-elevated rounded-xl p-4 border border-line-subtle">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-amber" />
                      <span className="text-xs text-text-muted uppercase tracking-wide">
                        Total Work Time
                      </span>
                    </div>
                    <p className="text-xl font-medium text-text">
                      {formatWorkTime(report.totalWorkTimeMs)}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {formatWorkTimeLong(report.totalWorkTimeMs)}
                    </p>
                  </div>

                  {/* Tasks Tracked */}
                  <div className="bg-elevated rounded-xl p-4 border border-line-subtle">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 size={14} className="text-sage" />
                      <span className="text-xs text-text-muted uppercase tracking-wide">
                        Tasks Tracked
                      </span>
                    </div>
                    <p className="text-xl font-medium text-text">
                      {report.taskBreakdown.length}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      with work time
                    </p>
                  </div>

                  {/* Work Columns */}
                  <div className="bg-elevated rounded-xl p-4 border border-line-subtle">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer size={14} className="text-mist" />
                      <span className="text-xs text-text-muted uppercase tracking-wide">
                        Work Columns
                      </span>
                    </div>
                    <p className="text-xl font-medium text-text">
                      {workColumns.length}
                    </p>
                    <p className="text-xs text-text-muted mt-1 truncate">
                      {workColumns.map(c => c.name).join(', ') || 'None configured'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-4 pb-0">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    activeTab === 'tasks'
                      ? 'bg-amber text-void'
                      : 'text-text-muted hover:text-text hover:bg-elevated'
                  )}
                >
                  By Task
                </button>
                <button
                  onClick={() => setActiveTab('columns')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    activeTab === 'columns'
                      ? 'bg-amber text-void'
                      : 'text-text-muted hover:text-text hover:bg-elevated'
                  )}
                >
                  By Column
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'tasks' ? (
                  <TasksTab report={report} />
                ) : (
                  <ColumnsTab report={report} />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Timer size={48} className="text-text-muted mb-4" />
              <h3 className="text-text font-medium mb-2">No time data</h3>
              <p className="text-sm text-text-muted max-w-xs">
                Time is tracked automatically as tasks move through work columns.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line-subtle">
          <p className="text-xs text-text-muted text-center">
            Work time is calculated from task changelog. First column and done columns are excluded.
          </p>
        </div>
      </div>
    </div>
  );
}

interface TasksTabProps {
  report: ProjectTimeReport;
}

function TasksTab({ report }: TasksTabProps) {
  if (report.taskBreakdown.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock size={32} className="text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-muted">
          No tasks have been tracked yet.
        </p>
        <p className="text-xs text-text-muted mt-1">
          Move tasks through work columns to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {report.taskBreakdown.map((task, index) => (
        <TaskTimeBreakdown
          key={task.taskId}
          taskId={task.taskId}
          taskTitle={task.taskTitle || 'Unknown Task'}
          totalWorkTimeMs={task.totalWorkTimeMs}
          entries={task.entries}
          rank={index + 1}
        />
      ))}
    </div>
  );
}

interface ColumnsTabProps {
  report: ProjectTimeReport;
}

function ColumnsTab({ report }: ColumnsTabProps) {
  if (report.columnBreakdown.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 size={32} className="text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-muted">
          No column data available.
        </p>
        <p className="text-xs text-text-muted mt-1">
          Time will appear here as tasks move through columns.
        </p>
      </div>
    );
  }

  const maxTime = Math.max(...report.columnBreakdown.map(c => c.totalTimeMs));

  return (
    <div className="space-y-4">
      {report.columnBreakdown.map((column) => {
        const percentage = Math.round((column.totalTimeMs / report.totalWorkTimeMs) * 100);
        const barWidth = Math.round((column.totalTimeMs / maxTime) * 100);

        return (
          <div key={column.columnSlug} className="bg-elevated rounded-xl p-4 border border-line-subtle">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber" />
                <span className="text-sm font-medium text-text">
                  {column.columnName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-text">
                  {formatWorkTime(column.totalTimeMs)}
                </span>
                <span className="text-xs text-text-muted ml-2">
                  ({percentage}%)
                </span>
              </div>
            </div>
            <div className="h-2 bg-line-subtle rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber to-amber/70 rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">
              {formatWorkTimeLong(column.totalTimeMs)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
