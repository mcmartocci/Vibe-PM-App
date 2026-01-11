'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus, ColumnConfig } from '@/types';
import { TaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: ColumnConfig;
  tasks: Task[];
  onAddTask: (title: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  index: number;
}

const statusConfig: Record<TaskStatus, { color: string; glow: string }> = {
  'todo': {
    color: 'bg-mist',
    glow: 'group-hover:shadow-[0_0_20px_rgba(100,116,139,0.15)]',
  },
  'in-progress': {
    color: 'bg-amber',
    glow: 'group-hover:shadow-[0_0_20px_rgba(233,162,59,0.15)]',
  },
  'complete': {
    color: 'bg-sage',
    glow: 'group-hover:shadow-[0_0_20px_rgba(124,181,135,0.15)]',
  },
};

export function KanbanColumn({ column, tasks, onAddTask, onDeleteTask, index }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const config = statusConfig[column.id];

  return (
    <div className="flex flex-col h-full min-w-0 group">
      {/* Column Header */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className={cn('w-2.5 h-2.5 rounded-full', config.color)} />
        <h2 className="font-[family-name:var(--font-display)] text-text text-lg font-medium tracking-tight">
          {column.title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-line to-transparent" />
        <span className="text-text-muted text-xs font-medium tabular-nums">
          {tasks.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl p-3 space-y-3 min-h-[200px]',
          'transition-all duration-300 ease-out',
          config.glow,
          isOver
            ? 'bg-elevated/80 ring-1 ring-amber/30'
            : 'bg-surface/30'
        )}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task, i) => (
            <div
              key={task.id}
              className="animate-in"
              style={{ animationDelay: `${(index * 100) + (i * 50)}ms` }}
            >
              <TaskCard task={task} onDelete={onDeleteTask} />
            </div>
          ))}
        </SortableContext>

        <AddTaskForm onAdd={(title) => onAddTask(title, column.id)} />
      </div>
    </div>
  );
}
