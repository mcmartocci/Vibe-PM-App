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
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState } from 'react';
import { Task, TaskStatus, TaskPriority, ColumnConfig } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { generateId } from '@/lib/utils';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { PriorityFilter } from './PriorityFilter';

const COLUMNS: ColumnConfig[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'complete', title: 'Done' },
];

export function KanbanBoard() {
  const [tasks, setTasks, isHydrated] = useLocalStorage<Task[]>('pm-tasks', []);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([]);

  const filteredTasks = priorityFilter.length === 0
    ? tasks
    : tasks.filter(t => priorityFilter.includes(t.priority || 'medium'));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const findColumnId = (id: string): TaskStatus | null => {
    // Check if it's a column id
    const column = COLUMNS.find(c => c.id === id);
    if (column) return column.id;

    // Check if it's a task id - find which column the task belongs to
    const task = tasks.find(t => t.id === id);
    if (task) return task.status;

    return null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    const overColumnId = findColumnId(overId);
    if (overColumnId && activeTask.status !== overColumnId) {
      setTasks(prev =>
        prev.map(t =>
          t.id === activeId ? { ...t, status: overColumnId } : t
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const overColumnId = findColumnId(overId);
    if (overColumnId) {
      setTasks(prev =>
        prev.map(t =>
          t.id === activeId ? { ...t, status: overColumnId } : t
        )
      );
    }
  };

  const handleAddTask = (title: string, status: TaskStatus, priority: TaskPriority) => {
    const newTask: Task = {
      id: generateId(),
      title,
      status,
      priority,
      createdAt: Date.now(),
      order: tasks.filter(t => t.status === status).length,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdatePriority = (id: string, priority: TaskPriority) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, priority } : t))
    );
  };

  if (!isHydrated) {
    return (
      <div className="grid grid-cols-3 gap-6 h-full">
        {COLUMNS.map((column, i) => (
          <div key={column.id} className="flex flex-col h-full">
            <div
              className="h-8 w-28 bg-elevated rounded-lg mb-4 animate-pulse-soft"
              style={{ animationDelay: `${i * 100}ms` }}
            />
            <div className="flex-1 rounded-xl bg-surface/50 p-3 space-y-3">
              <div className="h-20 bg-elevated rounded-xl animate-pulse-soft" />
              <div className="h-20 bg-elevated rounded-xl animate-pulse-soft" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <PriorityFilter selected={priorityFilter} onChange={setPriorityFilter} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
          {COLUMNS.map((column, index) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={filteredTasks.filter(t => t.status === column.id)}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onUpdatePriority={handleUpdatePriority}
              index={index}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 scale-105">
              <TaskCard task={activeTask} onDelete={() => {}} onUpdatePriority={() => {}} isDragOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
