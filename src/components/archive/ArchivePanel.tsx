'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Archive, ArchiveRestore, Trash2, ChevronDown, FolderOpen, Search, Clock } from 'lucide-react';
import { Task, Project } from '@/types';
import { cn } from '@/lib/utils';

interface ArchivePanelProps {
  isOpen: boolean;
  onClose: () => void;
  archivedTasks: Task[];
  projects: Project[];
  onUnarchive: (taskId: string, projectId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onFetchArchived: (projectId?: string) => Promise<void>;
}

interface GroupedTasks {
  projectId: string;
  projectName: string;
  projectColor: string;
  tasks: Task[];
}

export function ArchivePanel({
  isOpen,
  onClose,
  archivedTasks,
  projects,
  onUnarchive,
  onDelete,
  onFetchArchived,
}: ArchivePanelProps) {
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch archived tasks when panel opens
  useEffect(() => {
    if (isOpen) {
      onFetchArchived(selectedProjectFilter || undefined);
    }
  }, [isOpen, selectedProjectFilter, onFetchArchived]);

  // Group tasks by project
  const groupedTasks = useMemo((): GroupedTasks[] => {
    const filtered = archivedTasks.filter((task) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
        );
      }
      return true;
    });

    const projectMap = new Map<string, GroupedTasks>();

    filtered.forEach((task) => {
      // Find the project this task belongs to
      const project = projects.find((p) => p.tasks.some((t) => t.id === task.id));
      const projectId = project?.id || 'unknown';
      const projectName = project?.name || 'Unknown Project';
      const projectColor = project?.color || '#64748b';

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          projectId,
          projectName,
          projectColor,
          tasks: [],
        });
      }

      projectMap.get(projectId)!.tasks.push(task);
    });

    // Sort groups by project name, then tasks by archivedAt (newest first)
    return Array.from(projectMap.values())
      .sort((a, b) => a.projectName.localeCompare(b.projectName))
      .map((group) => ({
        ...group,
        tasks: group.tasks.sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0)),
      }));
  }, [archivedTasks, projects, searchQuery]);

  const handleUnarchive = async (taskId: string, projectId: string) => {
    setProcessingTaskId(taskId);
    try {
      await onUnarchive(taskId, projectId);
    } finally {
      setProcessingTaskId(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    setProcessingTaskId(taskId);
    try {
      await onDelete(taskId);
    } finally {
      setProcessingTaskId(null);
      setConfirmDeleteId(null);
    }
  };

  const formatArchivedDate = (timestamp?: number): string => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (!isOpen) return null;

  const totalArchivedCount = archivedTasks.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel - Slide in from right */}
      <div className="relative h-full w-full max-w-lg bg-surface border-l border-line shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber/10">
              <Archive size={20} className="text-amber" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-text">
                Archive
              </h2>
              <p className="text-sm text-text-muted">
                {totalArchivedCount} archived task{totalArchivedCount !== 1 ? 's' : ''}
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

        {/* Filters */}
        <div className="p-4 border-b border-line-subtle space-y-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search archived tasks..."
              className={cn(
                'w-full pl-9 pr-4 py-2.5 rounded-lg text-sm',
                'bg-elevated border border-line',
                'text-text placeholder:text-text-muted',
                'focus:outline-none focus:border-amber',
                'transition-colors duration-150'
              )}
            />
          </div>

          {/* Project Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm',
                'bg-elevated border border-line',
                'text-text hover:border-amber/50',
                'transition-all duration-150'
              )}
            >
              <span className="flex items-center gap-2">
                {selectedProjectFilter ? (
                  <>
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          projects.find((p) => p.id === selectedProjectFilter)?.color ||
                          '#64748b',
                      }}
                    />
                    <span>
                      {projects.find((p) => p.id === selectedProjectFilter)?.name ||
                        'Unknown'}
                    </span>
                  </>
                ) : (
                  <>
                    <FolderOpen size={14} className="text-text-muted" />
                    <span className="text-text-secondary">All Projects</span>
                  </>
                )}
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  'text-text-muted transition-transform duration-150',
                  isFilterOpen && 'rotate-180'
                )}
              />
            </button>

            {isFilterOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-elevated border border-line rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setSelectedProjectFilter(null);
                    setIsFilterOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                    'hover:bg-hover transition-colors duration-150',
                    !selectedProjectFilter && 'text-amber'
                  )}
                >
                  <FolderOpen size={14} />
                  <span>All Projects</span>
                </button>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProjectFilter(project.id);
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                      'hover:bg-hover transition-colors duration-150',
                      selectedProjectFilter === project.id && 'text-amber'
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span>{project.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4">
          {groupedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Archive size={48} className="text-text-muted mb-4" />
              <h3 className="text-text font-medium mb-2">No archived tasks</h3>
              <p className="text-sm text-text-muted max-w-xs">
                {searchQuery
                  ? 'No tasks match your search query.'
                  : 'Tasks moved to the done column will appear here after archiving.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedTasks.map((group) => (
                <div key={group.projectId}>
                  {/* Project Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.projectColor }}
                    />
                    <h3 className="text-sm font-medium text-text-secondary">
                      {group.projectName}
                    </h3>
                    <span className="text-xs text-text-muted">
                      ({group.tasks.length})
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    {group.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          'group bg-elevated border border-line-subtle rounded-xl p-4',
                          'hover:border-line transition-all duration-150',
                          processingTaskId === task.id && 'opacity-50 pointer-events-none'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-text text-sm font-medium leading-relaxed">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-text-secondary text-xs mt-1 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-2 text-text-muted">
                              <Clock size={12} />
                              <span className="text-xs">
                                Archived {formatArchivedDate(task.archivedAt)}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUnarchive(task.id, group.projectId)}
                              disabled={processingTaskId === task.id}
                              className={cn(
                                'p-2 rounded-lg',
                                'text-text-muted hover:text-sage hover:bg-sage/10',
                                'transition-all duration-150',
                                'opacity-0 group-hover:opacity-100'
                              )}
                              title="Restore task"
                            >
                              <ArchiveRestore size={16} />
                            </button>

                            {confirmDeleteId === task.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  disabled={processingTaskId === task.id}
                                  className={cn(
                                    'px-2 py-1 rounded text-xs font-medium',
                                    'bg-coral text-white',
                                    'hover:bg-coral/90',
                                    'transition-all duration-150'
                                  )}
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className={cn(
                                    'px-2 py-1 rounded text-xs font-medium',
                                    'text-text-muted hover:text-text hover:bg-elevated',
                                    'transition-all duration-150'
                                  )}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(task.id)}
                                disabled={processingTaskId === task.id}
                                className={cn(
                                  'p-2 rounded-lg',
                                  'text-text-muted hover:text-coral hover:bg-coral/10',
                                  'transition-all duration-150',
                                  'opacity-0 group-hover:opacity-100'
                                )}
                                title="Delete permanently"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {totalArchivedCount > 0 && (
          <div className="p-4 border-t border-line-subtle">
            <p className="text-xs text-text-muted text-center">
              Archived tasks are kept indefinitely. Delete to remove permanently.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
