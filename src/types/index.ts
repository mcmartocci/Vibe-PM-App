// TaskStatus is now dynamic based on project columns
// These are the default statuses for backward compatibility
export type DefaultTaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskStatus = string; // Dynamic, based on column slugs
export type TaskPriority = 'low' | 'medium' | 'high';
export type ChangeType = 'created' | 'status' | 'priority' | 'title' | 'moved' | 'description' | 'attachment_added' | 'attachment_removed';

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

// ================================================
// NOTIFICATIONS
// ================================================

export type NotificationType =
  | 'task_created'
  | 'task_updated'
  | 'status_changed'
  | 'priority_changed'
  | 'task_archived'
  | 'task_deleted';

export interface Notification {
  id: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt: number;
}

// ================================================
// TIME TRACKING
// ================================================

export interface WorkTimeEntry {
  columnSlug: string;
  columnName: string;
  startTime: number;
  endTime: number | null;
  durationMs: number;
}

export interface TaskWorkTime {
  taskId: string;
  taskTitle?: string;
  totalWorkTimeMs: number;
  entries: WorkTimeEntry[];
}

export interface ProjectTimeReport {
  projectId: string;
  projectName: string;
  totalWorkTimeMs: number;
  taskBreakdown: TaskWorkTime[];
  columnBreakdown: {
    columnSlug: string;
    columnName: string;
    totalTimeMs: number;
  }[];
}

// ================================================
// SLACK INTEGRATION
// ================================================

export interface SlackConfig {
  webhookUrl: string;
  enabled: boolean;
}

export interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

export interface SlackBlock {
  type: 'section' | 'divider' | 'context';
  text?: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
  };
  elements?: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
  }[];
}

// ================================================
// FILE ATTACHMENTS
// ================================================

export type AllowedFileType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/plain'
  | 'text/csv';

export interface TaskAttachment {
  id: string;
  taskId: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  createdAt: number;
  publicUrl?: string;
}

export const MAX_ATTACHMENTS_PER_TASK = 5;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_FILE_TYPES: string[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];
