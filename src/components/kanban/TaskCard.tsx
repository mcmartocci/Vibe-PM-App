'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Flag } from 'lucide-react';
import { Task, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onUpdatePriority: (id: string, priority: TaskPriority) => void;
  isDragOverlay?: boolean;
}

const priorityConfig: Record<TaskPriority, { color: string; bg: string; label: string }> = {
  low: { color: 'text-[#64748b]', bg: 'bg-[#64748b]/15', label: 'Low' },
  medium: { color: 'text-[#e9a23b]', bg: 'bg-[#e9a23b]/15', label: 'Med' },
  high: { color: 'text-[#e07a5f]', bg: 'bg-[#e07a5f]/15', label: 'High' },
};

const priorityOrder: TaskPriority[] = ['low', 'medium', 'high'];

export function TaskCard({ task, onDelete, onUpdatePriority, isDragOverlay }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentPriority = task.priority || 'medium';
    const currentIndex = priorityOrder.indexOf(currentPriority);
    const nextIndex = (currentIndex + 1) % priorityOrder.length;
    onUpdatePriority(task.id, priorityOrder[nextIndex]);
  };

  const config = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative',
        'bg-elevated border border-line-subtle rounded-xl p-4',
        'cursor-grab active:cursor-grabbing',
        'transition-all duration-200',
        'hover:border-line hover:bg-hover',
        'hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
        isDragging && 'opacity-40',
        isDragOverlay && 'shadow-2xl border-amber/30 bg-elevated'
      )}
      {...attributes}
      {...listeners}
    >
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className={cn(
            'p-1.5 rounded-lg -mr-1 -mt-1',
            'opacity-0 group-hover:opacity-100',
            'text-text-muted hover:text-coral hover:bg-coral/10',
            'transition-all duration-150'
          )}
        >
          <X size={14} />
        </button>
      </div>

      {/* Priority Badge - Clickable */}
      <div className="mt-3 pl-3">
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
      </div>

      {/* Subtle accent line */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-line-subtle to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
