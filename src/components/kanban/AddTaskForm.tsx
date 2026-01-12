'use client';

import { useState } from 'react';
import { Plus, X, ArrowRight, Flag } from 'lucide-react';
import { TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

interface AddTaskFormProps {
  onAdd: (title: string, priority: TaskPriority) => void;
}

const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-[#64748b]' },
  { value: 'medium', label: 'Med', color: 'text-[#e9a23b]' },
  { value: 'high', label: 'High', color: 'text-[#e07a5f]' },
];

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), priority);
      setTitle('');
      setPriority('medium');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'w-full p-3 rounded-xl',
          'border border-dashed border-line-subtle',
          'text-text-muted hover:text-text-secondary',
          'hover:border-line hover:bg-elevated/50',
          'transition-all duration-200',
          'flex items-center justify-center gap-2 text-sm'
        )}
      >
        <Plus size={16} />
        <span className="font-medium">New task</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        autoFocus
        className={cn(
          'w-full px-4 py-3 rounded-xl',
          'bg-elevated border border-line',
          'text-text placeholder:text-text-muted',
          'text-sm font-medium',
          'transition-all duration-200'
        )}
      />

      {/* Priority Selector */}
      <div className="flex items-center gap-1 px-1">
        <Flag size={14} className="text-text-muted mr-1" />
        {priorities.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPriority(p.value)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium',
              'transition-all duration-150',
              priority === p.value
                ? cn('bg-elevated', p.color)
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!title.trim()}
          className={cn(
            'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium',
            'bg-amber text-void',
            'hover:bg-amber/90',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'transition-all duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          Add task
          <ArrowRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setTitle('');
            setPriority('medium');
          }}
          className={cn(
            'p-2.5 rounded-xl',
            'text-text-muted hover:text-text-secondary',
            'hover:bg-elevated',
            'transition-all duration-150'
          )}
        >
          <X size={18} />
        </button>
      </div>
    </form>
  );
}
