'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Folder, Pencil, Settings, LogOut } from 'lucide-react';
import { Task as LegacyTask, TaskStatus, TaskPriority, Project as LegacyProject } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useProjects, Project } from '@/hooks/useProjects';
import { useTasks, Task, TaskChangelog } from '@/hooks/useTasks';
import { ProjectSidebar } from './projects/ProjectSidebar';
import { KanbanBoard } from './kanban/KanbanBoard';
import { MoveTaskModal } from './kanban/MoveTaskModal';
import { TaskDetailModal } from './kanban/TaskDetailModal';
import { TodoList } from './todo/TodoList';
import { NotesPanel } from './notes/NotesPanel';
import { SettingsPanel } from './settings/SettingsPanel';

// Transform Supabase task to legacy format for child components
function transformTask(task: Task, changelog: TaskChangelog[] = []): LegacyTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description || undefined,
    status: task.status as TaskStatus,
    priority: (task.priority || 'medium') as TaskPriority,
    createdAt: new Date(task.created_at).getTime(),
    order: task.order,
    changelog: changelog.map(c => ({
      id: c.id,
      type: c.type as 'created' | 'status' | 'priority' | 'title' | 'moved' | 'description',
      timestamp: new Date(c.created_at).getTime(),
      from: c.from_value || undefined,
      to: c.to_value || undefined,
      projectName: c.project_name || undefined,
    })),
  };
}

// Transform Supabase project to legacy format
function transformProject(project: Project, taskCount: number): LegacyProject {
  return {
    id: project.id,
    name: project.name,
    color: project.color,
    tasks: [], // Tasks are loaded separately
    createdAt: new Date(project.created_at).getTime(),
  };
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { projects, loading: projectsLoading, createProject, updateProject, deleteProject } = useProjects();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, moveTask, getTaskChangelog } = useTasks(activeProjectId);

  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerEditName, setHeaderEditName] = useState('');
  const headerInputRef = useRef<HTMLInputElement>(null);
  const [taskToMove, setTaskToMove] = useState<LegacyTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<LegacyTask | null>(null);
  const [selectedTaskChangelog, setSelectedTaskChangelog] = useState<TaskChangelog[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Set active project when projects load
  useEffect(() => {
    if (!projectsLoading && projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projectsLoading, projects, activeProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  // Transform tasks for child components
  const legacyTasks: LegacyTask[] = tasks.map(t => transformTask(t));

  // Create legacy projects with task counts for sidebar
  const legacyProjects: LegacyProject[] = projects.map(p => ({
    ...transformProject(p, 0),
    tasks: p.id === activeProjectId ? legacyTasks : [],
  }));

  const handleCreateProject = async (project: LegacyProject) => {
    const newProject = await createProject(project.name, project.color);
    if (!newProject) {
      throw new Error('Failed to create project. Please try again.');
    }
    setActiveProjectId(newProject.id);
  };

  const handleDeleteProject = async (id: string) => {
    const success = await deleteProject(id);
    if (success && activeProjectId === id) {
      const remaining = projects.filter(p => p.id !== id);
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleRenameProject = async (id: string, name: string) => {
    await updateProject(id, { name });
  };

  const handleTasksChange = async (updatedTasks: LegacyTask[]) => {
    // Find what changed by comparing with current tasks
    for (const updatedTask of updatedTasks) {
      const currentTask = tasks.find(t => t.id === updatedTask.id);

      if (!currentTask) {
        // New task
        await createTask(updatedTask.title, updatedTask.status, updatedTask.priority);
      } else {
        // Check for changes
        const changes: Partial<Task> = {};
        if (currentTask.status !== updatedTask.status) {
          changes.status = updatedTask.status;
        }
        if (currentTask.priority !== updatedTask.priority) {
          changes.priority = updatedTask.priority;
        }
        if (currentTask.title !== updatedTask.title) {
          changes.title = updatedTask.title;
        }
        if (currentTask.description !== updatedTask.description) {
          changes.description = updatedTask.description || null;
        }

        if (Object.keys(changes).length > 0) {
          await updateTask(updatedTask.id, changes);
        }
      }
    }

    // Check for deleted tasks
    for (const currentTask of tasks) {
      if (!updatedTasks.find(t => t.id === currentTask.id)) {
        await deleteTask(currentTask.id);
      }
    }
  };

  const startHeaderEdit = () => {
    if (activeProject) {
      setHeaderEditName(activeProject.name);
      setIsEditingHeader(true);
      setTimeout(() => headerInputRef.current?.focus(), 0);
    }
  };

  const submitHeaderEdit = async () => {
    if (activeProject && headerEditName.trim()) {
      await handleRenameProject(activeProject.id, headerEditName.trim());
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

  const handleMoveTask = async (taskId: string, targetProjectId: string, targetStatus: TaskStatus) => {
    const targetProject = projects.find(p => p.id === targetProjectId);
    await moveTask(taskId, targetProjectId, targetStatus, targetProject?.name);
    setTaskToMove(null);
  };

  const handleTaskClick = useCallback(async (task: LegacyTask) => {
    // Fetch changelog for the task
    const changelog = await getTaskChangelog(task.id);
    setSelectedTaskChangelog(changelog);
    setSelectedTask(transformTask(tasks.find(t => t.id === task.id)!, changelog));
  }, [tasks, getTaskChangelog]);

  const handleUpdateTaskTitle = async (taskId: string, title: string) => {
    await updateTask(taskId, { title });
    // Refresh selected task
    if (selectedTask?.id === taskId) {
      const changelog = await getTaskChangelog(taskId);
      const updatedTask = tasks.find(t => t.id === taskId);
      if (updatedTask) {
        setSelectedTask(transformTask({ ...updatedTask, title }, changelog));
        setSelectedTaskChangelog(changelog);
      }
    }
  };

  const handleUpdateTaskDescription = async (taskId: string, description: string) => {
    await updateTask(taskId, { description: description || null });
    // Refresh selected task
    if (selectedTask?.id === taskId) {
      const changelog = await getTaskChangelog(taskId);
      const updatedTask = tasks.find(t => t.id === taskId);
      if (updatedTask) {
        setSelectedTask(transformTask({ ...updatedTask, description }, changelog));
        setSelectedTaskChangelog(changelog);
      }
    }
  };

  if (projectsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-void via-midnight to-void">
        <div className="animate-pulse-soft text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Project Sidebar */}
      <ProjectSidebar
        projects={legacyProjects}
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
          <header className="mb-8 animate-in flex items-start justify-between" style={{ animationDelay: '0ms' }}>
            {activeProject ? (
              <div>
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
              </div>
            ) : (
              <div className="flex items-center gap-3 text-text-muted">
                <Folder size={24} />
                <span className="text-lg">Select or create a project</span>
              </div>
            )}

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 rounded-xl text-text-muted hover:text-text hover:bg-elevated border border-transparent hover:border-line transition-all duration-150"
                title="Settings"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={signOut}
                className="p-2.5 rounded-xl text-text-muted hover:text-coral hover:bg-coral/10 border border-transparent hover:border-coral/20 transition-all duration-150"
                title="Sign out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </header>

          {/* Main Content */}
          {activeProject ? (
            <div className="flex-1 flex gap-8 min-h-0">
              {/* Kanban Board */}
              <main className="flex-1 min-w-0 animate-in" style={{ animationDelay: '100ms' }}>
                {tasksLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse-soft text-text-muted">Loading tasks...</div>
                  </div>
                ) : (
                  <KanbanBoard
                    tasks={legacyTasks}
                    onTasksChange={handleTasksChange}
                    onMoveClick={setTaskToMove}
                    onTaskClick={handleTaskClick}
                  />
                )}
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
          projects={legacyProjects}
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

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
