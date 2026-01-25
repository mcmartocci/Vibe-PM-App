'use client';

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  closestCenter,
  rectIntersection,
  pointerWithin,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, GripVertical } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, ColumnConfig } from '@/types';
import { generateId } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { PriorityFilter } from './PriorityFilter';

// Default columns for backward compatibility
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'complete', title: 'Done', isDoneColumn: true },
];

interface KanbanBoardProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onMoveClick?: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
  columns?: ColumnConfig[];
  onTaskArchive?: (taskId: string) => void;
  onColumnRename?: (columnId: string, newTitle: string) => void;
  onColumnReorder?: (columnIds: string[]) => void;
  onColumnAdd?: (title: string) => void;
  onColumnDelete?: (columnId: string) => void;
  getAttachmentCount?: (taskId: string) => number;
}

// Sortable column header component
function SortableColumnHeader({
  column,
  taskCount,
  onRename,
  onDeleteClick,
  canDelete,
}: {
  column: ColumnConfig;
  taskCount: number;
  onRename?: (id: string, title: string) => void;
  onDeleteClick?: (column: ColumnConfig) => void;
  canDelete: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `column-${column.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    if (editValue.trim() && editValue !== column.title && onRename) {
      onRename(column.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(column.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 mb-4 px-1 group/header',
        isDragging && 'opacity-50'
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 rounded cursor-grab hover:bg-elevated text-text-muted hover:text-text transition-colors opacity-0 group-hover/header:opacity-100"
      >
        <GripVertical size={14} />
      </button>

      {/* Color dot */}
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: column.color || '#64748b' }}
      />

      {/* Title */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="flex-1 font-[family-name:var(--font-display)] text-text text-lg font-medium tracking-tight bg-transparent border-b-2 border-amber outline-none"
        />
      ) : (
        <h2
          className="font-[family-name:var(--font-display)] text-text text-lg font-medium tracking-tight cursor-pointer hover:text-amber transition-colors"
          onDoubleClick={() => onRename && setIsEditing(true)}
          title="Double-click to rename"
        >
          {column.title}
        </h2>
      )}

      <div className="flex-1 h-px bg-gradient-to-r from-line to-transparent" />

      {/* Task count */}
      <span className="text-text-muted text-xs font-medium tabular-nums">
        {taskCount}
      </span>

      {/* Delete button */}
      {canDelete && onDeleteClick && (
        <button
          onClick={() => onDeleteClick(column)}
          className="p-1 rounded text-text-muted hover:text-coral hover:bg-coral/10 transition-colors opacity-0 group-hover/header:opacity-100"
          title="Delete column"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function KanbanBoard({
  tasks = [],
  onTasksChange,
  onMoveClick,
  onTaskClick,
  columns: propColumns,
  onTaskArchive,
  onColumnRename,
  onColumnReorder,
  onColumnAdd,
  onColumnDelete,
  getAttachmentCount,
}: KanbanBoardProps) {
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const newColumnInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirmColumn, setDeleteConfirmColumn] = useState<ColumnConfig | null>(null);
  // Local optimistic state for instant visual updates
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks || []);

  // Use provided columns or default to backward-compatible columns
  const columns = useMemo(() => {
    if (propColumns && propColumns.length > 0) {
      return propColumns;
    }
    return DEFAULT_COLUMNS;
  }, [propColumns]);

  // Calculate grid columns class based on column count
  const gridColsClass = useMemo(() => {
    const count = columns.length;
    if (count <= 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-4';
    if (count === 5) return 'grid-cols-5';
    if (count === 6) return 'grid-cols-6';
    if (count === 7) return 'grid-cols-7';
    // For more than 7, use auto-fill with min width
    return 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]';
  }, [columns.length]);

  useEffect(() => {
    if (isAddingColumn && newColumnInputRef.current) {
      newColumnInputRef.current.focus();
    }
  }, [isAddingColumn]);

  // Sync local state when parent tasks change
  useEffect(() => {
    setLocalTasks(tasks || []);
  }, [tasks]);

  const filteredTasks = priorityFilter.length === 0
    ? localTasks
    : localTasks.filter(t => priorityFilter.includes(t.priority || 'medium'));

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
    // Strip column- prefix if present (from sortable column headers)
    const cleanId = id.startsWith('column-') ? id.replace('column-', '') : id;

    const column = columns.find(c => c.id === cleanId);
    if (column) return column.id;

    const task = localTasks.find(t => t.id === id);
    if (task) return task.status;

    return null;
  };

  // Check if a column is the done column
  const isDoneColumn = (columnId: string): boolean => {
    const column = columns.find(c => c.id === columnId);
    return column?.isDoneColumn ?? false;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;

    // Check if dragging a column
    if (activeId.startsWith('column-')) {
      setActiveColumnId(activeId.replace('column-', ''));
      return;
    }

    // Otherwise it's a task
    const task = localTasks.find(t => t.id === activeId);
    setActiveTask(task || null);

    // Capture the original card width
    if (event.active.rect.current.initial) {
      setDragWidth(event.active.rect.current.initial.width);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Handle column reordering
    if (activeColumnId) {
      setActiveColumnId(null);
      if (!over) return;

      const overId = (over.id as string).replace('column-', '');
      if (activeColumnId !== overId && onColumnReorder) {
        const oldIndex = columns.findIndex(c => c.id === activeColumnId);
        const newIndex = columns.findIndex(c => c.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newColumns = [...columns];
          const [moved] = newColumns.splice(oldIndex, 1);
          newColumns.splice(newIndex, 0, moved);
          onColumnReorder(newColumns.map(c => c.id));
        }
      }
      return;
    }

    // Handle task movement
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = localTasks.find(t => t.id === activeId);
    if (!task) return;

    const overColumnId = findColumnId(overId);
    if (overColumnId && task.status !== overColumnId) {
      const oldStatus = task.status;
      const updatedTasks = localTasks.map(t =>
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
      );

      // Update local state immediately for instant visual feedback
      setLocalTasks(updatedTasks);
      // Then sync with parent/database
      onTasksChange(updatedTasks);

      // Auto-archive if moved to a done column
      if (isDoneColumn(overColumnId) && onTaskArchive) {
        onTaskArchive(activeId);
      }
    }
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim() && onColumnAdd) {
      onColumnAdd(newColumnTitle.trim());
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  const handleAddColumnKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddColumn();
    } else if (e.key === 'Escape') {
      setNewColumnTitle('');
      setIsAddingColumn(false);
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
      order: localTasks.filter(t => t.status === status).length,
      changelog: [{
        id: generateId(),
        type: 'created',
        timestamp: now,
      }],
    };
    onTasksChange([...localTasks, newTask]);
  };

  const handleDeleteTask = (id: string) => {
    onTasksChange(localTasks.filter(t => t.id !== id));
  };

  const handleUpdatePriority = (id: string, priority: TaskPriority) => {
    onTasksChange(
      localTasks.map(t => {
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
      <div className="flex items-center justify-between">
        <PriorityFilter selected={priorityFilter} onChange={setPriorityFilter} />

        {/* Add Column Button */}
        {onColumnAdd && (
          <div className="flex items-center gap-2">
            {isAddingColumn ? (
              <div className="flex items-center gap-2">
                <input
                  ref={newColumnInputRef}
                  type="text"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onBlur={() => {
                    if (!newColumnTitle.trim()) {
                      setIsAddingColumn(false);
                    }
                  }}
                  onKeyDown={handleAddColumnKeyDown}
                  placeholder="Column name..."
                  className="w-32 px-2 py-1 text-sm bg-elevated border border-line rounded-lg focus:outline-none focus:border-amber text-text placeholder:text-text-muted"
                />
                <button
                  onClick={handleAddColumn}
                  disabled={!newColumnTitle.trim()}
                  className={cn(
                    'p-1 rounded-lg',
                    newColumnTitle.trim()
                      ? 'text-sage hover:bg-sage/10'
                      : 'text-text-muted cursor-not-allowed'
                  )}
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => {
                    setNewColumnTitle('');
                    setIsAddingColumn(false);
                  }}
                  className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-elevated"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-muted hover:text-amber hover:bg-elevated transition-colors border border-dashed border-line-subtle hover:border-amber/50"
              >
                <Plus size={14} />
                <span className="text-xs font-medium">Add Column</span>
              </button>
            )}
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={columns.map(c => `column-${c.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className={`grid ${gridColsClass} gap-6 flex-1 min-h-0`}>
            {columns.map((column) => {
              const columnTasks = sortedTasks.filter(t => t.status === column.id);
              return (
              <div key={column.id} className="flex flex-col h-full min-w-0">
                {/* Sortable Column Header */}
                <SortableColumnHeader
                  column={column}
                  taskCount={columnTasks.length}
                  onRename={onColumnRename}
                  onDeleteClick={(col) => setDeleteConfirmColumn(col)}
                  canDelete={columns.length > 1}
                />

                {/* Column Content */}
                <KanbanColumn
                  column={column}
                  tasks={columnTasks}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdatePriority={handleUpdatePriority}
                  onMoveClick={onMoveClick}
                  onTaskClick={onTaskClick}
                  hideHeader
                  getAttachmentCount={getAttachmentCount}
                />
              </div>
              );
            })}

          </div>
        </SortableContext>

        {typeof document !== 'undefined' && createPortal(
          <DragOverlay>
            {activeTask ? (
              <div style={{ width: dragWidth ?? 'auto' }}>
                <TaskCard
                  task={activeTask}
                  onDelete={() => {}}
                  onUpdatePriority={() => {}}
                  isDragOverlay
                />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {/* Delete Column Confirmation Dialog */}
      {deleteConfirmColumn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-line rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-[family-name:var(--font-display)] font-semibold text-text mb-2">
              Delete "{deleteConfirmColumn.title}"?
            </h3>
            <p className="text-text-muted text-sm mb-4">
              {(() => {
                const taskCount = localTasks.filter(t => t.status === deleteConfirmColumn.id).length;
                if (taskCount === 0) {
                  return 'This column is empty and will be permanently deleted.';
                }
                return `This column contains ${taskCount} task${taskCount === 1 ? '' : 's'}. All tasks will be moved to the first column ("${columns[0]?.title || 'To Do'}").`;
              })()}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmColumn(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg text-text-muted hover:text-text hover:bg-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onColumnDelete) {
                    onColumnDelete(deleteConfirmColumn.id);
                  }
                  setDeleteConfirmColumn(null);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-coral text-white hover:bg-coral/90 transition-colors"
              >
                Delete Column
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
