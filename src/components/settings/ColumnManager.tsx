'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  X,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Check,
  AlertTriangle,
  Columns3,
} from 'lucide-react';
import { useColumns, ProjectColumn } from '@/hooks/useColumns';
import { cn } from '@/lib/utils';

interface ColumnManagerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onColumnsChange?: (columns: ProjectColumn[]) => void;
}

// Color presets for columns
const COLOR_PRESETS = [
  '#64748b', // slate
  '#e9a23b', // amber
  '#7cb587', // sage
  '#60a5fa', // blue
  '#f472b6', // pink
  '#a78bfa', // purple
  '#fb923c', // orange
  '#34d399', // emerald
  '#f87171', // coral/red
  '#38bdf8', // sky
];

interface SortableColumnItemProps {
  column: ProjectColumn;
  isEditing: boolean;
  editName: string;
  onEditStart: () => void;
  onEditChange: (name: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onColorChange: (color: string) => void;
  onDoneToggle: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}

function SortableColumnItem({
  column,
  isEditing,
  editName,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onColorChange,
  onDoneToggle,
  onDelete,
}: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all duration-150',
        'bg-elevated border-line-subtle',
        isDragging && 'ring-2 ring-amber/30'
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 rounded cursor-grab hover:bg-surface text-text-muted hover:text-text transition-colors"
      >
        <GripVertical size={16} />
      </button>

      {/* Color Indicator */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-4 h-4 rounded-full ring-2 ring-offset-2 ring-offset-elevated ring-line-subtle hover:ring-amber transition-all"
          style={{ backgroundColor: column.color || '#64748b' }}
          title="Change color"
        />
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-2 p-2 rounded-lg bg-surface border border-line shadow-lg z-10 grid grid-cols-5 gap-1.5">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onColorChange(color);
                  setShowColorPicker(false);
                }}
                className={cn(
                  'w-6 h-6 rounded-full transition-all hover:scale-110',
                  column.color === color && 'ring-2 ring-offset-2 ring-offset-surface ring-amber'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Name */}
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSave();
              if (e.key === 'Escape') onEditCancel();
            }}
            autoFocus
            className="flex-1 px-2 py-1 text-sm bg-surface border border-line rounded focus:outline-none focus:border-amber text-text"
          />
          <button
            onClick={onEditSave}
            className="p-1 rounded text-sage hover:bg-sage/10 transition-colors"
          >
            <Check size={16} />
          </button>
          <button
            onClick={onEditCancel}
            className="p-1 rounded text-text-muted hover:bg-elevated transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <span className="flex-1 text-sm text-text font-medium">{column.name}</span>
      )}

      {/* Done Column Checkbox */}
      <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer hover:text-text transition-colors">
        <input
          type="checkbox"
          checked={column.is_done_column}
          onChange={onDoneToggle}
          className="w-3.5 h-3.5 rounded border-line bg-surface accent-sage"
        />
        Done
      </label>

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-1">
          <button
            onClick={onEditStart}
            className="p-1.5 rounded text-text-muted hover:text-amber hover:bg-amber/10 transition-colors"
            title="Edit name"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded text-text-muted hover:text-coral hover:bg-coral/10 transition-colors"
            title="Delete column"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// Overlay component for dragging
function ColumnDragOverlay({ column }: { column: ProjectColumn }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-elevated border-amber/50 shadow-lg">
      <div className="p-1 text-text-muted">
        <GripVertical size={16} />
      </div>
      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: column.color || '#64748b' }}
      />
      <span className="flex-1 text-sm text-text font-medium">{column.name}</span>
    </div>
  );
}

export function ColumnManager({ projectId, isOpen, onClose, onColumnsChange }: ColumnManagerProps) {
  const {
    columns,
    fetchColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    generateSlug,
    isSlugUnique,
  } = useColumns(projectId);

  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState(COLOR_PRESETS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [activeColumn, setActiveColumn] = useState<ProjectColumn | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isOpen && projectId) {
      fetchColumns();
    }
  }, [isOpen, projectId, fetchColumns]);

  // Notify parent of column changes
  useEffect(() => {
    if (onColumnsChange) {
      onColumnsChange(columns);
    }
  }, [columns, onColumnsChange]);

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) return;

    setIsCreating(true);
    const slug = generateSlug(newColumnName);

    // Check if slug is unique
    if (!isSlugUnique(slug)) {
      // Add a number suffix to make it unique
      let counter = 2;
      let uniqueSlug = `${slug}-${counter}`;
      while (!isSlugUnique(uniqueSlug)) {
        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }
      await createColumn(newColumnName.trim(), uniqueSlug, newColumnColor);
    } else {
      await createColumn(newColumnName.trim(), slug, newColumnColor);
    }

    setNewColumnName('');
    setNewColumnColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
    setIsCreating(false);
  };

  const handleEditSave = async () => {
    if (!editingId || !editName.trim()) return;

    const column = columns.find(c => c.id === editingId);
    if (!column) return;

    const newSlug = generateSlug(editName);
    const updates: Partial<ProjectColumn> = { name: editName.trim() };

    // Update slug if name changed and new slug is unique
    if (newSlug !== column.slug && isSlugUnique(newSlug, editingId)) {
      updates.slug = newSlug;
    }

    await updateColumn(editingId, updates);
    setEditingId(null);
    setEditName('');
  };

  const handleColorChange = async (columnId: string, color: string) => {
    await updateColumn(columnId, { color });
  };

  const handleDoneToggle = async (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return;

    await updateColumn(columnId, { is_done_column: !column.is_done_column });
  };

  const handleDeleteConfirm = async (columnId: string) => {
    // Move tasks to first available column (or second if deleting first)
    const remainingColumns = columns.filter(c => c.id !== columnId);
    const moveToColumnId = remainingColumns.length > 0 ? remainingColumns[0].id : undefined;

    await deleteColumn(columnId, moveToColumnId);
    setDeleteConfirm(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const column = columns.find(c => c.id === event.active.id);
    setActiveColumn(column || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveColumn(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = columns.findIndex(c => c.id === active.id);
    const newIndex = columns.findIndex(c => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Create new order
    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(oldIndex, 1);
    newColumns.splice(newIndex, 0, movedColumn);

    // Save new order
    await reorderColumns(newColumns.map(c => c.id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 bg-surface border border-line rounded-2xl shadow-2xl animate-in max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber/10">
              <Columns3 size={20} className="text-amber" />
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-text">
              Manage Columns
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-elevated transition-all duration-150"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Add New Column */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-secondary">Add Column</h3>
            <div className="flex gap-3">
              {/* Color Picker */}
              <div className="relative">
                <button
                  className="w-10 h-10 rounded-lg ring-2 ring-offset-2 ring-offset-surface ring-line-subtle hover:ring-amber transition-all flex items-center justify-center"
                  style={{ backgroundColor: newColumnColor }}
                  onClick={(e) => {
                    const picker = e.currentTarget.nextElementSibling;
                    if (picker) {
                      picker.classList.toggle('hidden');
                    }
                  }}
                />
                <div className="hidden absolute top-full left-0 mt-2 p-2 rounded-lg bg-surface border border-line shadow-lg z-10 grid grid-cols-5 gap-1.5">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={(e) => {
                        setNewColumnColor(color);
                        e.currentTarget.parentElement?.classList.add('hidden');
                      }}
                      className={cn(
                        'w-6 h-6 rounded-full transition-all hover:scale-110',
                        newColumnColor === color && 'ring-2 ring-offset-2 ring-offset-surface ring-amber'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newColumnName.trim()) {
                    handleCreateColumn();
                  }
                }}
                placeholder="Column name..."
                className="flex-1 px-3 py-2 text-sm bg-elevated border border-line-subtle rounded-lg focus:outline-none focus:border-amber text-text placeholder:text-text-muted"
              />

              {/* Add Button */}
              <button
                onClick={handleCreateColumn}
                disabled={!newColumnName.trim() || isCreating}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-150',
                  newColumnName.trim() && !isCreating
                    ? 'bg-amber text-void hover:bg-amber/90'
                    : 'bg-elevated text-text-muted cursor-not-allowed'
                )}
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-line-subtle" />

          {/* Column List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-secondary">
              Columns ({columns.length})
            </h3>

            {columns.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <Columns3 size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No columns yet. Add your first column above.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={columns.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {columns.map((column) => (
                      <div key={column.id}>
                        {deleteConfirm === column.id ? (
                          /* Delete Confirmation */
                          <div className="p-3 rounded-lg border border-coral/50 bg-coral/10 space-y-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle size={18} className="text-coral mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-text font-medium">
                                  Delete &ldquo;{column.name}&rdquo;?
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                  Tasks will be moved to the first column. Move them manually first, or continue to auto-move.
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1.5 rounded text-sm text-text-secondary hover:text-text hover:bg-elevated transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteConfirm(column.id)}
                                className="px-3 py-1.5 rounded text-sm bg-coral text-white hover:bg-coral/90 transition-colors"
                              >
                                Delete Column
                              </button>
                            </div>
                          </div>
                        ) : (
                          <SortableColumnItem
                            column={column}
                            isEditing={editingId === column.id}
                            editName={editName}
                            onEditStart={() => {
                              setEditingId(column.id);
                              setEditName(column.name);
                            }}
                            onEditChange={setEditName}
                            onEditSave={handleEditSave}
                            onEditCancel={() => {
                              setEditingId(null);
                              setEditName('');
                            }}
                            onColorChange={(color) => handleColorChange(column.id, color)}
                            onDoneToggle={() => handleDoneToggle(column.id)}
                            onDelete={() => setDeleteConfirm(column.id)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeColumn ? <ColumnDragOverlay column={activeColumn} /> : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>

          {/* Help Text */}
          <div className="text-xs text-text-muted p-3 rounded-lg bg-elevated/50 border border-line-subtle">
            <p>Drag columns to reorder. Mark one column as &ldquo;Done&rdquo; to auto-archive completed tasks.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
