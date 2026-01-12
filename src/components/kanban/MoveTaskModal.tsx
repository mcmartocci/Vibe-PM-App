'use client';

import { useState } from 'react';
import { X, ArrowRight, FolderInput } from 'lucide-react';
import { Task, TaskStatus, Project } from '@/types';
import { cn } from '@/lib/utils';

interface MoveTaskModalProps {
  task: Task;
  currentProjectId: string;
  projects: Project[];
  onMove: (taskId: string, targetProjectId: string, targetStatus: TaskStatus) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'complete', label: 'Done' },
];

export function MoveTaskModal({
  task,
  currentProjectId,
  projects,
  onMove,
  onClose,
}: MoveTaskModalProps) {
  const [targetProjectId, setTargetProjectId] = useState<string>(currentProjectId);
  const [targetStatus, setTargetStatus] = useState<TaskStatus>(task.status);

  const currentProject = projects.find(p => p.id === currentProjectId);
  const targetProject = projects.find(p => p.id === targetProjectId);
  const otherProjects = projects.filter(p => p.id !== currentProjectId);

  const canMove = targetProjectId !== currentProjectId || targetStatus !== task.status;

  const handleMove = () => {
    if (canMove) {
      onMove(task.id, targetProjectId, targetStatus);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 glass rounded-2xl shadow-2xl animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber/10">
              <FolderInput size={20} className="text-amber" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-text">
                Move Task
              </h2>
              <p className="text-sm text-text-muted truncate max-w-[250px]">
                {task.title}
              </p>
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
        <div className="p-5 space-y-5">
          {/* Current Location */}
          <div className="p-3 rounded-lg bg-elevated/50 border border-line-subtle">
            <p className="text-xs text-text-muted mb-1">Currently in</p>
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: currentProject?.color }}
              />
              <span className="text-sm text-text-secondary font-medium">
                {currentProject?.name}
              </span>
              <span className="text-text-muted">→</span>
              <span className="text-xs text-text-muted px-2 py-0.5 rounded bg-surface">
                {STATUS_OPTIONS.find(s => s.id === task.status)?.label}
              </span>
            </div>
          </div>

          {/* Target Project */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Move to Project
            </label>
            <div className="space-y-2">
              {/* Current project option */}
              <button
                onClick={() => setTargetProjectId(currentProjectId)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-150',
                  targetProjectId === currentProjectId
                    ? 'border-amber bg-amber/10'
                    : 'border-line-subtle hover:border-line hover:bg-elevated/50'
                )}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentProject?.color }}
                />
                <span className={cn(
                  'text-sm font-medium',
                  targetProjectId === currentProjectId ? 'text-text' : 'text-text-secondary'
                )}>
                  {currentProject?.name}
                </span>
                <span className="text-xs text-text-muted">(current)</span>
              </button>

              {/* Other projects */}
              {otherProjects.map(project => (
                <button
                  key={project.id}
                  onClick={() => setTargetProjectId(project.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-150',
                    targetProjectId === project.id
                      ? 'border-amber bg-amber/10'
                      : 'border-line-subtle hover:border-line hover:bg-elevated/50'
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className={cn(
                    'text-sm font-medium',
                    targetProjectId === project.id ? 'text-text' : 'text-text-secondary'
                  )}>
                    {project.name}
                  </span>
                  <span className="text-xs text-text-muted ml-auto">
                    {project.tasks.length} tasks
                  </span>
                </button>
              ))}

              {otherProjects.length === 0 && (
                <p className="text-sm text-text-muted text-center py-3">
                  No other projects available
                </p>
              )}
            </div>
          </div>

          {/* Target Status */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Set Status
            </label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(status => (
                <button
                  key={status.id}
                  onClick={() => setTargetStatus(status.id)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150',
                    targetStatus === status.id
                      ? 'border-amber bg-amber/10 text-text'
                      : 'border-line-subtle text-text-secondary hover:border-line hover:bg-elevated/50'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-line-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-elevated transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={!canMove}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              canMove
                ? 'bg-amber text-void hover:bg-amber/90'
                : 'bg-elevated text-text-muted cursor-not-allowed'
            )}
          >
            <ArrowRight size={16} />
            Move Task
          </button>
        </div>
      </div>
    </div>
  );
}
