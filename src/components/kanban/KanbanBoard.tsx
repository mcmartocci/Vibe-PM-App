'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState } from 'react';
import { Task, TaskStatus, TaskPriority, ColumnConfig } from '@/types';
import { generateId } from '@/lib/utils';
import { KanbanColumn } from './KanbanColumn';
import { PriorityFilter } from './PriorityFilter';

const COLUMNS: ColumnConfig[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'complete', title: 'Done' },
];

interface KanbanBoardProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onMoveClick?: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
}

export function KanbanBoard({ tasks = [], onTasksChange, onMoveClick, onTaskClick }: KanbanBoardProps) {
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([]);

  const safeTasks = tasks || [];
  const filteredTasks = priorityFilter.length === 0
    ? safeTasks
    : safeTasks.filter(t => priorityFilter.includes(t.priority || 'medium'));

  // Sort by priority: high -> medium -> low
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aPriority = priorityOrder[a.priority || 'medium'] ?? 1;
    const bPriority = priorityOrder[b.priority || 'medium'] ?? 1;
    return aPriority - bPriority;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumnId = (id: string): TaskStatus | null => {
    const column = COLUMNS.find(c => c.id === id);
    if (column) return column.id;

    const task = safeTasks.find(t => t.id === id);
    if (task) return task.status;

    return null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = safeTasks.find(t => t.id === activeId);
    if (!task) return;

    const overColumnId = findColumnId(overId);
    if (overColumnId && task.status !== overColumnId) {
      const oldStatus = task.status;
      onTasksChange(
        safeTasks.map(t =>
          t.id === activeId
            ? {
                ...t,
                status: overColumnId,
                changelog: [
                  ...(t.changelog || []),
                  {
                    id: generateId(),
                    type: 'status' as const,
                    timestamp: Date.now(),
                    from: oldStatus,
                    to: overColumnId,
                  },
                ],
              }
            : t
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = safeTasks.find(t => t.id === activeId);
    if (!task) return;

    const overColumnId = findColumnId(overId);
    if (overColumnId && task.status !== overColumnId) {
      const oldStatus = task.status;
      onTasksChange(
        safeTasks.map(t =>
          t.id === activeId
            ? {
                ...t,
                status: overColumnId,
                changelog: [
                  ...(t.changelog || []),
                  {
                    id: generateId(),
                    type: 'status' as const,
                    timestamp: Date.now(),
                    from: oldStatus,
                    to: overColumnId,
                  },
                ],
              }
            : t
        )
      );
    }
  };

  const handleAddTask = (title: string, status: TaskStatus, priority: TaskPriority) => {
    const now = Date.now();
    const newTask: Task = {
      id: generateId(),
      title,
      status,
      priority,
      createdAt: now,
      order: safeTasks.filter(t => t.status === status).length,
      changelog: [{
        id: generateId(),
        type: 'created',
        timestamp: now,
      }],
    };
    onTasksChange([...safeTasks, newTask]);
  };

  const handleDeleteTask = (id: string) => {
    onTasksChange(safeTasks.filter(t => t.id !== id));
  };

  const handleUpdatePriority = (id: string, priority: TaskPriority) => {
    onTasksChange(
      safeTasks.map(t => {
        if (t.id === id) {
          const oldPriority = t.priority || 'medium';
          return {
            ...t,
            priority,
            changelog: [
              ...(t.changelog || []),
              {
                id: generateId(),
                type: 'priority' as const,
                timestamp: Date.now(),
                from: oldPriority,
                to: priority,
              },
            ],
          };
        }
        return t;
      })
    );
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <PriorityFilter selected={priorityFilter} onChange={setPriorityFilter} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={sortedTasks.filter(t => t.status === column.id)}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onUpdatePriority={handleUpdatePriority}
              onMoveClick={onMoveClick}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
