'use client';

import { useState } from 'react';
import { X, Clock, Flag, ArrowRight, Pencil, Check, History, Paperclip } from 'lucide-react';
import { Task, TaskPriority, ChangeType } from '@/types';
import { cn } from '@/lib/utils';
import { useAttachments } from '@/hooks/useAttachments';
import { AttachmentList, AttachmentUploader } from '@/components/attachments';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
}

const priorityConfig: Record<TaskPriority, { color: string; bg: string; label: string }> = {
  low: { color: 'text-[#64748b]', bg: 'bg-[#64748b]/15', label: 'Low' },
  medium: { color: 'text-[#e9a23b]', bg: 'bg-[#e9a23b]/15', label: 'Medium' },
  high: { color: 'text-[#e07a5f]', bg: 'bg-[#e07a5f]/15', label: 'High' },
};

const statusLabels: Record<string, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'complete': 'Done',
};

const changeTypeConfig: Record<ChangeType, { icon: typeof Clock; label: string; color: string }> = {
  created: { icon: Clock, label: 'Created', color: 'text-sage' },
  status: { icon: ArrowRight, label: 'Status changed', color: 'text-amber' },
  priority: { icon: Flag, label: 'Priority changed', color: 'text-coral' },
  title: { icon: Pencil, label: 'Title updated', color: 'text-mist' },
  moved: { icon: ArrowRight, label: 'Moved to project', color: 'text-purple-400' },
  description: { icon: Pencil, label: 'Description updated', color: 'text-mist' },
  attachment_added: { icon: Paperclip, label: 'Attachment added', color: 'text-sage' },
  attachment_removed: { icon: Paperclip, label: 'Attachment removed', color: 'text-coral' },
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

export function TaskDetailModal({
  task,
  onClose,
  onUpdateTitle,
  onUpdateDescription,
}: TaskDetailModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(task.description || '');

  const {
    attachments,
    loading: attachmentsLoading,
    uploading,
    error: attachmentError,
    uploadFile,
    deleteFile,
    canUpload,
    remainingSlots,
    formatFileSize,
    isImage,
  } = useAttachments(task.id);

  const config = priorityConfig[task.priority] || priorityConfig.medium;
  const changelog = task.changelog || [];

  const handleUpload = async (file: File) => {
    await uploadFile(file);
  };

  const handleDeleteAttachment = async (id: string, storagePath: string): Promise<boolean> => {
    return await deleteFile(id, storagePath);
  };

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      onUpdateTitle(task.id, editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSubmit = () => {
    if (editDescription !== (task.description || '')) {
      onUpdateDescription(task.id, editDescription);
    }
    setIsEditingDescription(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 glass rounded-2xl shadow-2xl animate-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-line-subtle">
          <div className="flex-1 min-w-0 pr-4">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSubmit();
                    if (e.key === 'Escape') {
                      setEditTitle(task.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="flex-1 font-[family-name:var(--font-display)] text-lg font-medium text-text bg-transparent border-b-2 border-amber outline-none"
                />
                <button
                  onClick={handleTitleSubmit}
                  className="p-1.5 rounded-lg text-sage hover:bg-sage/10 transition-all"
                >
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <div className="group flex items-start gap-2">
                <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-text leading-snug">
                  {task.title}
                </h2>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 rounded text-text-muted hover:text-amber opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium',
                config.bg,
                config.color
              )}>
                <Flag size={10} />
                {config.label}
              </span>
              <span className="text-xs text-text-muted px-2 py-0.5 rounded bg-surface">
                {statusLabels[task.status] || task.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-elevated transition-all duration-150 flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">Description</label>
              {!isEditingDescription && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="text-xs text-text-muted hover:text-amber transition-colors"
                >
                  {task.description ? 'Edit' : 'Add'}
                </button>
              )}
            </div>
            {isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add a description..."
                  autoFocus
                  rows={3}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm',
                    'bg-elevated border border-line',
                    'text-text placeholder:text-text-muted',
                    'focus:outline-none focus:border-amber',
                    'resize-none'
                  )}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditDescription(task.description || '');
                      setIsEditingDescription(false);
                    }}
                    className="px-3 py-1.5 rounded text-xs text-text-muted hover:text-text transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDescriptionSubmit}
                    className="px-3 py-1.5 rounded text-xs bg-amber text-void font-medium hover:bg-amber/90 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className={cn(
                'text-sm leading-relaxed',
                task.description ? 'text-text-secondary' : 'text-text-muted italic'
              )}>
                {task.description || 'No description'}
              </p>
            )}
          </div>

          {/* Created */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-elevated/50 border border-line-subtle">
            <div className="p-2 rounded-lg bg-sage/10">
              <Clock size={16} className="text-sage" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Created</p>
              <p className="text-sm text-text font-medium">
                {formatDate(task.createdAt)} at {formatTime(task.createdAt)}
              </p>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Paperclip size={16} className="text-text-muted" />
                <h3 className="text-sm font-medium text-text-secondary">Attachments</h3>
                <span className="text-xs text-text-muted">({attachments.length}/5)</span>
              </div>
            </div>

            <div className="space-y-3">
              <AttachmentList
                attachments={attachments}
                onDelete={handleDeleteAttachment}
                loading={attachmentsLoading}
                formatFileSize={formatFileSize}
                isImage={isImage}
              />

              <AttachmentUploader
                onUpload={handleUpload}
                uploading={uploading}
                disabled={!canUpload}
                remainingSlots={remainingSlots}
                error={attachmentError}
              />
            </div>
          </div>

          {/* Changelog */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History size={16} className="text-text-muted" />
              <h3 className="text-sm font-medium text-text-secondary">Activity</h3>
              <span className="text-xs text-text-muted">({changelog.length})</span>
            </div>

            {changelog.length > 0 ? (
              <div className="space-y-1">
                {changelog.map((entry) => {
                  const typeConfig = changeTypeConfig[entry.type];
                  const Icon = typeConfig.icon;

                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-elevated/50 transition-colors group"
                    >
                      <div className={cn('p-1.5 rounded', typeConfig.color, 'bg-current/10')}>
                        <Icon size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-secondary">
                          {entry.type === 'created' && 'Task created'}
                          {entry.type === 'status' && (
                            <>
                              Status: <span className="text-text-muted">{statusLabels[entry.from || ''] || entry.from}</span>
                              {' '}<ArrowRight size={12} className="inline text-text-muted" />{' '}
                              <span className="text-text">{statusLabels[entry.to || ''] || entry.to}</span>
                            </>
                          )}
                          {entry.type === 'priority' && (
                            <>
                              Priority: <span className="text-text-muted">{entry.from}</span>
                              {' '}<ArrowRight size={12} className="inline text-text-muted" />{' '}
                              <span className="text-text">{entry.to}</span>
                            </>
                          )}
                          {entry.type === 'title' && (
                            <>
                              Title updated
                              {entry.from && (
                                <span className="text-text-muted"> from "{entry.from}"</span>
                              )}
                            </>
                          )}
                          {entry.type === 'description' && 'Description updated'}
                          {entry.type === 'moved' && (
                            <>
                              Moved to <span className="text-text">{entry.projectName}</span>
                            </>
                          )}
                          {entry.type === 'attachment_added' && (
                            <>
                              Attachment added: <span className="text-text">{entry.to}</span>
                            </>
                          )}
                          {entry.type === 'attachment_removed' && (
                            <>
                              Attachment removed: <span className="text-text-muted">{entry.from}</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {formatRelativeTime(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-muted italic text-center py-4">
                No activity yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
