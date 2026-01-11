'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical } from 'lucide-react';
import { Task } from '@/types';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  isDragOverlay?: boolean;
}

export function TaskCard({ task, onDelete, isDragOverlay }: TaskCardProps) {
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
        <h3 className="text-text text-sm font-medium leading-relaxed flex-1">
          {task.title}
        </h3>
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

      {task.description && (
        <p className="text-text-secondary text-xs mt-2 pl-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Subtle accent line */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-line-subtle to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
