'use client';

import { Filter } from 'lucide-react';
import { TaskPriority } from '@/types';
import { cn } from '@/lib/utils';

interface PriorityFilterProps {
  selected: TaskPriority[];
  onChange: (priorities: TaskPriority[]) => void;
}

const priorities: { value: TaskPriority; label: string; color: string; bg: string }[] = [
  { value: 'high', label: 'High', color: '#e07a5f', bg: 'bg-[#e07a5f]' },
  { value: 'medium', label: 'Med', color: '#e9a23b', bg: 'bg-[#e9a23b]' },
  { value: 'low', label: 'Low', color: '#64748b', bg: 'bg-[#64748b]' },
];

export function PriorityFilter({ selected, onChange }: PriorityFilterProps) {
  const togglePriority = (priority: TaskPriority) => {
    if (selected.includes(priority)) {
      onChange(selected.filter(p => p !== priority));
    } else {
      onChange([...selected, priority]);
    }
  };

  const allSelected = selected.length === 0 || selected.length === priorities.length;

  const selectAll = () => {
    onChange([]);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-text-muted">
        <Filter size={14} />
        <span className="text-xs font-medium">Filter</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={selectAll}
          className={cn(
            'px-2.5 py-1.5 rounded-lg text-xs font-medium',
            'transition-all duration-150',
            allSelected
              ? 'bg-elevated text-text'
              : 'text-text-muted hover:text-text-secondary hover:bg-elevated/50'
          )}
        >
          All
        </button>

        {priorities.map((p) => {
          const isSelected = selected.length === 0 || selected.includes(p.value);
          return (
            <button
              key={p.value}
              onClick={() => togglePriority(p.value)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                'transition-all duration-150',
                isSelected && selected.length > 0
                  ? 'bg-elevated'
                  : selected.length === 0
                  ? 'text-text-muted hover:bg-elevated/50'
                  : 'text-text-muted/50 hover:text-text-muted hover:bg-elevated/30'
              )}
              style={{
                color: isSelected && selected.length > 0 ? p.color : undefined
              }}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  p.bg,
                  !isSelected && selected.length > 0 && 'opacity-30'
                )}
              />
              {p.label}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && selected.length < priorities.length && (
        <span className="text-text-muted text-xs">
          {selected.length} selected
        </span>
      )}
    </div>
  );
}
