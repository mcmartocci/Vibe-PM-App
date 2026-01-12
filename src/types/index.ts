export type TaskStatus = 'todo' | 'in-progress' | 'complete';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: number;
  order: number;
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
