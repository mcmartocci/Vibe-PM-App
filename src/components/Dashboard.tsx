'use client';

import { useState, useEffect, useRef } from 'react';
import { Folder, Pencil } from 'lucide-react';
import { Project, Task } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { generateId } from '@/lib/utils';
import { ProjectSidebar } from './projects/ProjectSidebar';
import { KanbanBoard } from './kanban/KanbanBoard';
import { MoveTaskModal } from './kanban/MoveTaskModal';
import { TaskDetailModal } from './kanban/TaskDetailModal';
import { TodoList } from './todo/TodoList';
import { NotesPanel } from './notes/NotesPanel';

const DEFAULT_PROJECT: Project = {
  id: 'default',
  name: 'My First Project',
  color: '#e9a23b',
  tasks: [],
  createdAt: Date.now(),
};

export function Dashboard() {
  const [projects, setProjects, isHydrated] = useLocalStorage<Project[]>('pm-projects', [DEFAULT_PROJECT]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerEditName, setHeaderEditName] = useState('');
  const headerInputRef = useRef<HTMLInputElement>(null);
  const [taskToMove, setTaskToMove] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Migrate old tasks to default project on first load
  useEffect(() => {
    if (isHydrated && projects.length > 0 && !activeProjectId) {
      // Check for old tasks in localStorage
      const oldTasks = localStorage.getItem('pm-tasks');
      if (oldTasks) {
        try {
          const tasks = JSON.parse(oldTasks) as Task[];
          if (tasks.length > 0) {
            // Add old tasks to first project
            setProjects(prev => prev.map((p, i) =>
              i === 0 ? { ...p, tasks: [...p.tasks, ...tasks] } : p
            ));
            // Remove old tasks key
            localStorage.removeItem('pm-tasks');
          }
        } catch (e) {
          console.error('Failed to migrate old tasks:', e);
        }
      }
      setActiveProjectId(projects[0].id);
    }
  }, [isHydrated, projects, activeProjectId, setProjects]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleCreateProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
    setActiveProjectId(project.id);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      const remaining = projects.filter(p => p.id !== id);
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleTasksChange = (tasks: Task[]) => {
    setProjects(prev =>
      prev.map(p => (p.id === activeProjectId ? { ...p, tasks } : p))
    );
  };

  const handleRenameProject = (id: string, name: string) => {
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, name } : p))
    );
  };

  const startHeaderEdit = () => {
    if (activeProject) {
      setHeaderEditName(activeProject.name);
      setIsEditingHeader(true);
      setTimeout(() => headerInputRef.current?.focus(), 0);
    }
  };

  const submitHeaderEdit = () => {
    if (activeProject && headerEditName.trim()) {
      handleRenameProject(activeProject.id, headerEditName.trim());
    }
    setIsEditingHeader(false);
    setHeaderEditName('');
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitHeaderEdit();
    } else if (e.key === 'Escape') {
      setIsEditingHeader(false);
      setHeaderEditName('');
    }
  };

  const handleMoveTask = (taskId: string, targetProjectId: string, targetStatus: import('@/types').TaskStatus) => {
    const sourceProject = projects.find(p => p.tasks.some(t => t.id === taskId));
    if (!sourceProject) return;

    const task = sourceProject.tasks.find(t => t.id === taskId);
    if (!task) return;

    const targetProject = projects.find(p => p.id === targetProjectId);

    // If moving to same project, just update status
    if (targetProjectId === sourceProject.id) {
      const statusChanged = task.status !== targetStatus;
      setProjects(prev =>
        prev.map(p =>
          p.id === sourceProject.id
            ? {
                ...p,
                tasks: p.tasks.map(t =>
                  t.id === taskId
                    ? {
                        ...t,
                        status: targetStatus,
                        changelog: statusChanged
                          ? [
                              ...(t.changelog || []),
                              {
                                id: generateId(),
                                type: 'status' as const,
                                timestamp: Date.now(),
                                from: task.status,
                                to: targetStatus,
                              },
                            ]
                          : t.changelog,
                      }
                    : t
                ),
              }
            : p
        )
      );
    } else {
      // Move to different project
      const movedTask: Task = {
        ...task,
        status: targetStatus,
        changelog: [
          ...(task.changelog || []),
          {
            id: generateId(),
            type: 'moved' as const,
            timestamp: Date.now(),
            projectName: targetProject?.name,
          },
          ...(task.status !== targetStatus
            ? [
                {
                  id: generateId(),
                  type: 'status' as const,
                  timestamp: Date.now(),
                  from: task.status,
                  to: targetStatus,
                },
              ]
            : []),
        ],
      };
      setProjects(prev =>
        prev.map(p => {
          if (p.id === sourceProject.id) {
            return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
          }
          if (p.id === targetProjectId) {
            return { ...p, tasks: [...p.tasks, movedTask] };
          }
          return p;
        })
      );
    }

    // Update selectedTask if it was the one being moved
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  const handleUpdateTaskTitle = (taskId: string, title: string) => {
    const newChangelogEntry = {
      id: generateId(),
      type: 'title' as const,
      timestamp: Date.now(),
      from: selectedTask?.title,
      to: title,
    };

    setProjects(prev =>
      prev.map(p => ({
        ...p,
        tasks: p.tasks.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              title,
              changelog: [...(t.changelog || []), newChangelogEntry],
            };
          }
          return t;
        }),
      }))
    );

    // Update selectedTask state to reflect the change including changelog
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev =>
        prev
          ? {
              ...prev,
              title,
              changelog: [...(prev.changelog || []), newChangelogEntry],
            }
          : null
      );
    }
  };

  const handleUpdateTaskDescription = (taskId: string, description: string) => {
    const newChangelogEntry = {
      id: generateId(),
      type: 'description' as const,
      timestamp: Date.now(),
    };

    setProjects(prev =>
      prev.map(p => ({
        ...p,
        tasks: p.tasks.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              description,
              changelog: [...(t.changelog || []), newChangelogEntry],
            };
          }
          return t;
        }),
      }))
    );

    // Update selectedTask state to reflect the change including changelog
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev =>
        prev
          ? {
              ...prev,
              description,
              changelog: [...(prev.changelog || []), newChangelogEntry],
            }
          : null
      );
    }
  };

  if (!isHydrated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse-soft text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Project Sidebar */}
      <ProjectSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-void via-midnight to-void">
        {/* Ambient glow */}
        <div className="fixed top-0 left-1/3 w-96 h-96 bg-amber/5 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-sage/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex-1 flex flex-col p-8 lg:p-10">
          {/* Header */}
          <header className="mb-8 animate-in" style={{ animationDelay: '0ms' }}>
            {activeProject ? (
              <>
                <div className="flex items-center gap-3 group">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: activeProject.color,
                      boxShadow: `0 0 12px ${activeProject.color}50`
                    }}
                  />
                  {isEditingHeader ? (
                    <input
                      ref={headerInputRef}
                      type="text"
                      value={headerEditName}
                      onChange={(e) => setHeaderEditName(e.target.value)}
                      onKeyDown={handleHeaderKeyDown}
                      onBlur={submitHeaderEdit}
                      className="font-[family-name:var(--font-display)] text-2xl lg:text-3xl font-medium tracking-tight text-text bg-transparent border-b-2 border-amber outline-none"
                    />
                  ) : (
                    <>
                      <h1
                        className="font-[family-name:var(--font-display)] text-2xl lg:text-3xl font-medium tracking-tight text-text cursor-pointer hover:text-amber transition-colors duration-150"
                        onDoubleClick={startHeaderEdit}
                        title="Double-click to rename"
                      >
                        {activeProject.name}
                      </h1>
                      <button
                        onClick={startHeaderEdit}
                        className="p-1.5 rounded-lg text-text-muted hover:text-amber hover:bg-elevated opacity-0 group-hover:opacity-100 transition-all duration-150"
                        title="Rename project"
                      >
                        <Pencil size={16} />
                      </button>
                    </>
                  )}
                </div>
                <div className="mt-2 h-px w-24 bg-gradient-to-r from-amber/60 to-transparent" />
              </>
            ) : (
              <div className="flex items-center gap-3 text-text-muted">
                <Folder size={24} />
                <span className="text-lg">Select or create a project</span>
              </div>
            )}
          </header>

          {/* Main Content */}
          {activeProject ? (
            <div className="flex-1 flex gap-8 min-h-0">
              {/* Kanban Board */}
              <main className="flex-1 min-w-0 animate-in" style={{ animationDelay: '100ms' }}>
                <KanbanBoard
                  tasks={activeProject.tasks}
                  onTasksChange={handleTasksChange}
                  onMoveClick={setTaskToMove}
                  onTaskClick={setSelectedTask}
                />
              </main>

              {/* Sidebar */}
              <aside className="w-80 flex-shrink-0 flex flex-col gap-6">
                <div
                  className="flex-1 min-h-0 glass rounded-2xl p-5 animate-in"
                  style={{ animationDelay: '200ms' }}
                >
                  <TodoList />
                </div>
                <div
                  className="flex-1 min-h-0 glass rounded-2xl p-5 animate-in"
                  style={{ animationDelay: '300ms' }}
                >
                  <NotesPanel />
                </div>
              </aside>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Folder size={64} className="mx-auto text-text-muted mb-4" />
                <h2 className="text-text-secondary text-xl mb-2">No project selected</h2>
                <p className="text-text-muted">Create a new project from the sidebar to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Move Task Modal */}
      {taskToMove && activeProjectId && (
        <MoveTaskModal
          task={taskToMove}
          currentProjectId={activeProjectId}
          projects={projects}
          onMove={handleMoveTask}
          onClose={() => setTaskToMove(null)}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTitle={handleUpdateTaskTitle}
          onUpdateDescription={handleUpdateTaskDescription}
        />
      )}
    </div>
  );
}
