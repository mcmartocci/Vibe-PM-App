export type TaskStatus = 'todo' | 'in-progress' | 'complete';
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
}

export interface Project {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
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
}
