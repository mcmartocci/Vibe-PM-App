'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Flag, FolderInput, Check, Sparkles } from 'lucide-react';
import { Task, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onUpdatePriority: (id: string, priority: TaskPriority) => void;
  onMoveClick?: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
  isDragOverlay?: boolean;
}

const priorityConfig: Record<TaskPriority, { color: string; bg: string; label: string }> = {
  low: { color: 'text-[#64748b]', bg: 'bg-[#64748b]/15', label: 'Low' },
  medium: { color: 'text-[#e9a23b]', bg: 'bg-[#e9a23b]/15', label: 'Med' },
  high: { color: 'text-[#e07a5f]', bg: 'bg-[#e07a5f]/15', label: 'High' },
};

const priorityOrder: TaskPriority[] = ['low', 'medium', 'high'];

export function TaskCard({ task, onDelete, onUpdatePriority, onMoveClick, onTaskClick, isDragOverlay }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    willChange: isDragging ? 'transform' : undefined,
  };

  const cyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentPriority = task.priority || 'medium';
    const currentIndex = priorityOrder.indexOf(currentPriority);
    const nextIndex = (currentIndex + 1) % priorityOrder.length;
    onUpdatePriority(task.id, priorityOrder[nextIndex]);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger if not dragging and click target isn't a button
    if (!isDragging && onTaskClick && !(e.target as HTMLElement).closest('button')) {
      onTaskClick(task);
    }
  };

  const config = priorityConfig[task.priority] || priorityConfig.medium;
  const isComplete = task.status === 'complete' && !isDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative mb-3 last:mb-0',
        'bg-elevated border border-line-subtle rounded-xl p-4',
        'cursor-grab active:cursor-grabbing',
        !isDragging && 'transition-colors duration-200',
        'hover:border-line hover:bg-hover',
        !isDragging && 'hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
        isDragging && 'shadow-2xl border-amber/40 z-50 rotate-2 scale-105',
        isComplete && !isDragging && 'border-sage/30 completion-card',
        isComplete && isDragging && 'border-sage/30'
      )}
      onClick={handleCardClick}
      {...attributes}
      {...listeners}
    >
      {/* Completion shine overlay */}
      {isComplete && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 completion-shine" />
        </div>
      )}
      {/* Grip indicator */}
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
        <GripVertical size={12} className="text-text-muted" />
      </div>

      <div className="flex items-start justify-between gap-3 pl-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-text text-sm font-medium leading-relaxed">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-text-secondary text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 -mr-1 -mt-1">
          {onMoveClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveClick(task);
              }}
              className={cn(
                'p-1.5 rounded-lg',
                'opacity-0 group-hover:opacity-100',
                'text-text-muted hover:text-amber hover:bg-amber/10',
                'transition-all duration-150'
              )}
              title="Move to another project"
            >
              <FolderInput size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className={cn(
              'p-1.5 rounded-lg',
              'opacity-0 group-hover:opacity-100',
              'text-text-muted hover:text-coral hover:bg-coral/10',
              'transition-all duration-150'
            )}
            title="Delete task"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Priority Badge & Completion Badge */}
      <div className="mt-3 pl-3 flex items-center gap-2">
        <button
          onClick={cyclePriority}
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded-md',
            'text-xs font-medium',
            'transition-all duration-150',
            config.bg,
            config.color,
            'hover:opacity-80'
          )}
        >
          <Flag size={10} />
          {config.label}
        </button>

        {/* Completion Badge */}
        {isComplete && (
          <div
            className={cn(
              'completion-badge inline-flex items-center gap-1.5 px-2 py-1 rounded-md',
              'text-xs font-medium',
              'bg-sage/20 text-sage'
            )}
          >
            <Check size={12} className="check-icon" strokeWidth={3} />
            <span>Done</span>
          </div>
        )}
      </div>

      {/* Subtle accent line - sage for complete, default otherwise */}
      <div
        className={cn(
          'absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent to-transparent transition-opacity',
          isComplete
            ? 'via-sage/40 opacity-100'
            : 'via-line-subtle opacity-0 group-hover:opacity-100'
        )}
      />
    </div>
  );
}
