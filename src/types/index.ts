// TaskStatus is now dynamic based on project columns
// These are the default statuses for backward compatibility
export type DefaultTaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskStatus = string; // Dynamic, based on column slugs
export type TaskPriority = 'low' | 'medium' | 'high';
export type ChangeType = 'created' | 'status' | 'priority' | 'title' | 'moved' | 'description';

export interface ChangelogEntry {
  id: string;
  type: ChangeType;
  timestamp: number;
  from?: string;
  to?: string;
  projectName?: string; // for 'moved' type
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: number;
  order: number;
  changelog?: ChangelogEntry[];
  archivedAt?: number; // Timestamp when task was archived (moved to done column)
  timeInStage?: number; // Milliseconds in current stage (calculated)
  isStale?: boolean; // True if timeInStage exceeds project threshold
}

export interface Project {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
  columns?: ProjectColumn[];
  staleThresholdHours?: number; // Default: 48
  createdAt: number;
}

export interface ProjectColumn {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  color?: string;
  order: number;
  isDoneColumn: boolean;
  createdAt: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface Notes {
  content: string;
  updatedAt: number;
}

export interface ColumnConfig {
  id: TaskStatus;
  title: string;
  color?: string;
  isDoneColumn?: boolean;
}
