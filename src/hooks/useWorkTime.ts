'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProjectColumn } from '@/hooks/useColumns';
import { WorkTimeEntry, TaskWorkTime, ProjectTimeReport } from '@/types';

interface ChangelogEntry {
  id: string;
  task_id: string;
  type: string;
  from_value: string | null;
  to_value: string | null;
  created_at: string;
}

interface TaskWithTitle {
  id: string;
  title: string;
  project_id: string;
}

/**
 * Determines if a column is a "work column" - columns where time counts as work time.
 * Work columns are NOT the first column (order=0, typically "To Do")
 * AND NOT marked as is_done_column.
 */
function isWorkColumn(columnSlug: string, columns: ProjectColumn[]): boolean {
  const column = columns.find(c => c.slug === columnSlug);
  if (!column) return false;

  // First column (order 0) is typically "To Do" - not work
  // Done columns are also not considered active work
  return column.order > 0 && !column.is_done_column;
}

/**
 * Gets column name from slug
 */
function getColumnName(columnSlug: string, columns: ProjectColumn[]): string {
  const column = columns.find(c => c.slug === columnSlug);
  return column?.name || columnSlug;
}

/**
 * Formats milliseconds into a human-readable duration string
 * Examples: "2h 30m", "45m", "< 1m"
 */
export function formatWorkTime(ms: number): string {
  if (ms < 60000) {
    return '< 1m';
  }

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Formats milliseconds into a detailed duration string for reports
 * Examples: "2 hours 30 minutes", "45 minutes", "Less than 1 minute"
 */
export function formatWorkTimeLong(ms: number): string {
  if (ms < 60000) {
    return 'Less than 1 minute';
  }

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const hourStr = hours === 1 ? '1 hour' : `${hours} hours`;
  const minStr = minutes === 1 ? '1 minute' : `${minutes} minutes`;

  if (hours === 0) {
    return minStr;
  }

  if (minutes === 0) {
    return hourStr;
  }

  return `${hourStr} ${minStr}`;
}

export function useWorkTime() {
  /**
   * Calculates work time for a single task based on its changelog entries.
   * Work time = time spent in "work columns" (not first column, not done column)
   */
  const calculateTaskWorkTime = useCallback(async (
    taskId: string,
    columns: ProjectColumn[]
  ): Promise<TaskWorkTime> => {
    const supabase = createClient();

    // Fetch all changelog entries for this task, ordered by time
    const { data: changelog, error } = await supabase
      .from('task_changelog')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching task changelog:', error);
      return {
        taskId,
        totalWorkTimeMs: 0,
        entries: [],
      };
    }

    const entries: WorkTimeEntry[] = [];
    let totalWorkTimeMs = 0;

    // Find all status change entries and created entry
    const statusChanges = (changelog || []).filter(
      (entry: ChangelogEntry) => entry.type === 'status' || entry.type === 'created'
    );

    // Process each status change to calculate time in work columns
    for (let i = 0; i < statusChanges.length; i++) {
      const entry = statusChanges[i];
      const nextEntry = statusChanges[i + 1];

      // Determine the column we're entering
      let enteredColumn: string | null = null;

      if (entry.type === 'created') {
        // On creation, task enters its initial status (first column usually)
        // We need to look at the next status change to see what column it was created in
        // If there's a subsequent status change, the from_value tells us the initial status
        if (nextEntry && nextEntry.type === 'status' && nextEntry.from_value) {
          enteredColumn = nextEntry.from_value;
        }
        continue; // Skip the created entry itself, we handle the initial column via status changes
      }

      if (entry.type === 'status' && entry.to_value) {
        enteredColumn = entry.to_value;
      }

      if (!enteredColumn) continue;

      // Check if this is a work column
      if (isWorkColumn(enteredColumn, columns)) {
        const startTime = new Date(entry.created_at).getTime();
        let endTime: number | null = null;

        if (nextEntry) {
          endTime = new Date(nextEntry.created_at).getTime();
        } else {
          // If no next entry, the task is still in this column - use current time
          endTime = Date.now();
        }

        const durationMs = endTime - startTime;

        entries.push({
          columnSlug: enteredColumn,
          columnName: getColumnName(enteredColumn, columns),
          startTime,
          endTime: nextEntry ? endTime : null,
          durationMs,
        });

        totalWorkTimeMs += durationMs;
      }
    }

    return {
      taskId,
      totalWorkTimeMs,
      entries,
    };
  }, []);

  /**
   * Calculates work time for all tasks in a project
   */
  const calculateProjectWorkTime = useCallback(async (
    projectId: string,
    projectName: string,
    columns: ProjectColumn[]
  ): Promise<ProjectTimeReport> => {
    const supabase = createClient();

    // Fetch all tasks for this project (both active and archived)
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, project_id')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching tasks:', error);
      return {
        projectId,
        projectName,
        totalWorkTimeMs: 0,
        taskBreakdown: [],
        columnBreakdown: [],
      };
    }

    // Calculate work time for each task
    const taskBreakdown: TaskWorkTime[] = [];
    const columnTotals: Record<string, { columnName: string; totalTimeMs: number }> = {};

    for (const task of (tasks || []) as TaskWithTitle[]) {
      const taskWorkTime = await calculateTaskWorkTime(task.id, columns);

      if (taskWorkTime.totalWorkTimeMs > 0) {
        taskBreakdown.push({
          ...taskWorkTime,
          taskTitle: task.title,
        });

        // Aggregate time by column
        for (const entry of taskWorkTime.entries) {
          if (!columnTotals[entry.columnSlug]) {
            columnTotals[entry.columnSlug] = {
              columnName: entry.columnName,
              totalTimeMs: 0,
            };
          }
          columnTotals[entry.columnSlug].totalTimeMs += entry.durationMs;
        }
      }
    }

    // Sort task breakdown by total work time (descending)
    taskBreakdown.sort((a, b) => b.totalWorkTimeMs - a.totalWorkTimeMs);

    // Convert column totals to array and sort by time
    const columnBreakdown = Object.entries(columnTotals)
      .map(([slug, data]) => ({
        columnSlug: slug,
        columnName: data.columnName,
        totalTimeMs: data.totalTimeMs,
      }))
      .sort((a, b) => b.totalTimeMs - a.totalTimeMs);

    // Calculate total project work time
    const totalWorkTimeMs = taskBreakdown.reduce(
      (sum, task) => sum + task.totalWorkTimeMs,
      0
    );

    return {
      projectId,
      projectName,
      totalWorkTimeMs,
      taskBreakdown,
      columnBreakdown,
    };
  }, [calculateTaskWorkTime]);

  return {
    calculateTaskWorkTime,
    calculateProjectWorkTime,
    formatWorkTime,
    formatWorkTimeLong,
  };
}
