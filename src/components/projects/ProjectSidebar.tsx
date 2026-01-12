'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Folder, Trash2, X } from 'lucide-react';
import { Project } from '@/types';
import { cn, generateId } from '@/lib/utils';

interface ProjectSidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
}

const PROJECT_COLORS = [
  '#e07a5f', // coral
  '#e9a23b', // amber
  '#7cb587', // sage
  '#64748b', // slate
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export function ProjectSidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
}: ProjectSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      const newProject: Project = {
        id: generateId(),
        name: newProjectName.trim(),
        color: selectedColor,
        tasks: [],
        createdAt: Date.now(),
      };
      onCreateProject(newProject);
      setNewProjectName('');
      setIsCreating(false);
      setSelectedColor(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]);
    }
  };

  const handleStartEditing = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const handleRenameSubmit = (id: string) => {
    if (editingName.trim() && editingName.trim() !== projects.find(p => p.id === id)?.name) {
      onRenameProject(id, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingName('');
    }
  };

  return (
    <div
      className={cn(
        'h-full flex flex-col bg-surface/50 border-r border-line-subtle',
        'transition-all duration-300 ease-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-line-subtle">
        {!isCollapsed && (
          <h2 className="font-[family-name:var(--font-display)] text-text font-medium">
            Projects
          </h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'p-2 rounded-lg',
            'text-text-muted hover:text-text-secondary hover:bg-elevated',
            'transition-all duration-150',
            isCollapsed && 'mx-auto'
          )}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {projects.map((project) => {
          const isActive = activeProjectId === project.id;
          const isEditing = editingId === project.id;

          return (
            <div
              key={project.id}
              className={cn(
                'group flex items-center gap-3 rounded-lg cursor-pointer',
                'transition-all duration-150',
                isCollapsed ? 'p-2 justify-center' : 'p-3',
                isActive
                  ? 'bg-elevated ring-1 ring-amber/30'
                  : 'hover:bg-elevated/50'
              )}
              onClick={() => !isEditing && onSelectProject(project.id)}
            >
              <div
                className={cn(
                  'w-3 h-3 rounded-full flex-shrink-0 transition-all duration-150',
                  isActive && 'ring-2 ring-offset-1 ring-offset-surface'
                )}
                style={{
                  backgroundColor: project.color,
                  boxShadow: isActive ? `0 0 8px ${project.color}60` : undefined
                }}
              />
              {!isCollapsed && (
                <>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => handleRenameKeyDown(e, project.id)}
                      onBlur={() => handleRenameSubmit(project.id)}
                      autoFocus
                      className={cn(
                        'flex-1 text-sm font-medium bg-transparent',
                        'border-b border-amber outline-none',
                        'text-text'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className={cn(
                        'flex-1 text-sm font-medium truncate',
                        isActive ? 'text-text' : 'text-text-muted'
                      )}
                      onDoubleClick={(e) => handleStartEditing(project, e)}
                    >
                      {project.name}
                    </span>
                  )}
                  <span className={cn(
                    'text-xs tabular-nums',
                    isActive ? 'text-text-secondary' : 'text-text-muted'
                  )}>
                    {project.tasks.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this project and all its tasks?')) {
                        onDeleteProject(project.id);
                      }
                    }}
                    className={cn(
                      'p-1 rounded opacity-0 group-hover:opacity-100',
                      'text-text-muted hover:text-coral hover:bg-coral/10',
                      'transition-all duration-150'
                    )}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          );
        })}

        {projects.length === 0 && !isCollapsed && (
          <div className="text-center py-8">
            <Folder size={32} className="mx-auto text-text-muted mb-2" />
            <p className="text-text-muted text-sm">No projects yet</p>
          </div>
        )}
      </div>

      {/* Create Project */}
      <div className="p-3 border-t border-line-subtle">
        {isCreating && !isCollapsed ? (
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name..."
              autoFocus
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm',
                'bg-elevated border border-line',
                'text-text placeholder:text-text-muted',
                'focus:outline-none focus:border-amber'
              )}
            />
            <div className="flex items-center gap-1">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'w-6 h-6 rounded-full transition-all duration-150',
                    selectedColor === color && 'ring-2 ring-offset-2 ring-offset-surface ring-white/30'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newProjectName.trim()}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-sm font-medium',
                  'bg-amber text-void',
                  'hover:bg-amber/90',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'transition-all duration-150'
                )}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewProjectName('');
                }}
                className={cn(
                  'p-2 rounded-lg',
                  'text-text-muted hover:text-text-secondary hover:bg-elevated',
                  'transition-all duration-150'
                )}
              >
                <X size={18} />
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg',
              'text-text-muted hover:text-text-secondary',
              'hover:bg-elevated',
              'transition-all duration-150',
              isCollapsed ? 'p-2 justify-center' : 'p-3'
            )}
          >
            <Plus size={18} />
            {!isCollapsed && <span className="text-sm font-medium">New Project</span>}
          </button>
        )}
      </div>
    </div>
  );
}
