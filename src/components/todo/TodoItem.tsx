'use client';

import { X, Check } from 'lucide-react';
import { TodoItem as TodoItemType } from '@/types';
import { cn } from '@/lib/utils';

interface TodoItemProps {
  todo: TodoItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-3 py-2 px-2 rounded-lg -mx-2',
        'transition-all duration-200',
        'hover:bg-elevated/50'
      )}
    >
      {/* Custom Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        className={cn(
          'w-5 h-5 rounded-md flex-shrink-0',
          'flex items-center justify-center',
          'transition-all duration-200',
          todo.completed
            ? 'bg-sage/20 border border-sage/40'
            : 'border-2 border-line hover:border-amber/50'
        )}
      >
        {todo.completed && (
          <Check size={12} className="text-sage" strokeWidth={3} />
        )}
      </button>

      {/* Text */}
      <span
        className={cn(
          'flex-1 text-sm leading-relaxed',
          'transition-all duration-200',
          todo.completed
            ? 'text-text-muted line-through'
            : 'text-text'
        )}
      >
        {todo.text}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(todo.id)}
        className={cn(
          'p-1 rounded-md',
          'opacity-0 group-hover:opacity-100',
          'text-text-muted hover:text-coral hover:bg-coral/10',
          'transition-all duration-150'
        )}
      >
        <X size={14} />
      </button>
    </div>
  );
}
