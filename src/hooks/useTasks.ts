'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type TaskStatus = string; // Dynamic based on project columns
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  archived_at: string | null;
  created_at: string;
  // Computed fields
  time_in_stage?: number; // Milliseconds in current stage
  last_status_change?: string; // Timestamp of last status change
}

export interface TaskChangelog {
  id: string;
  task_id: string;
  type: string;
  from_value: string | null;
  to_value: string | null;
  project_name: string | null;
  created_at: string;
}

export function useTasks(projectId: string | null, staleThresholdHours: number = 48) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate time in stage for a task based on its changelog
  const calculateTimeInStage = useCallback(async (task: Task): Promise<{ timeInStage: number; lastStatusChange: string }> => {
    const supabase = createClient();

    // Get the most recent status change
    const { data: changelog } = await supabase
      .from('task_changelog')
      .select('created_at')
      .eq('task_id', task.id)
      .eq('type', 'status')
      .order('created_at', { ascending: false })
      .limit(1);

    const lastStatusChange = changelog?.[0]?.created_at || task.created_at;
    const timeInStage = Date.now() - new Date(lastStatusChange).getTime();

    return { timeInStage, lastStatusChange };
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Fetch active (non-archived) tasks
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .is('archived_at', null)
      .order('order', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      // Calculate time in stage for each task
      const tasksWithTime = await Promise.all(
        (data || []).map(async (task) => {
          const { timeInStage, lastStatusChange } = await calculateTimeInStage(task);
          return {
            ...task,
            time_in_stage: timeInStage,
            last_status_change: lastStatusChange,
          };
        })
      );
      setTasks(tasksWithTime);
    }
    setLoading(false);
  }, [projectId, calculateTimeInStage]);

  const fetchArchivedTasks = useCallback(async (forProjectId?: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false });

    if (forProjectId) {
      query = query.eq('project_id', forProjectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching archived tasks:', error);
      return [];
    }

    setArchivedTasks(data || []);
    return data || [];
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (
    title: string,
    status: TaskStatus,
    priority: TaskPriority
  ) => {
    if (!projectId) return null;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const order = tasks.filter(t => t.status === status).length;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        user_id: user.id,
        title,
        status,
        priority,
        order,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    // Add changelog entry
    await supabase.from('task_changelog').insert({
      task_id: data.id,
      type: 'created',
    });

    const newTask = {
      ...data,
      time_in_stage: 0,
      last_status_change: data.created_at,
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = async (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'order' | 'archived_at'>>
  ) => {
    const supabase = createClient();
    const currentTask = tasks.find(t => t.id === id);

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    // Add changelog entries for changes
    if (currentTask) {
      if (updates.status && updates.status !== currentTask.status) {
        await supabase.from('task_changelog').insert({
          task_id: id,
          type: 'status',
          from_value: currentTask.status,
          to_value: updates.status,
        });
      }
      if (updates.priority && updates.priority !== currentTask.priority) {
        await supabase.from('task_changelog').insert({
          task_id: id,
          type: 'priority',
          from_value: currentTask.priority,
          to_value: updates.priority,
        });
      }
      if (updates.title && updates.title !== currentTask.title) {
        await supabase.from('task_changelog').insert({
          task_id: id,
          type: 'title',
          from_value: currentTask.title,
          to_value: updates.title,
        });
      }
      if (updates.description !== undefined && updates.description !== currentTask.description) {
        await supabase.from('task_changelog').insert({
          task_id: id,
          type: 'description',
        });
      }
    }

    // Calculate new time in stage if status changed
    let timeInStage = currentTask?.time_in_stage || 0;
    let lastStatusChange = currentTask?.last_status_change || data.created_at;

    if (updates.status && updates.status !== currentTask?.status) {
      timeInStage = 0;
      lastStatusChange = new Date().toISOString();
    }

    const updatedTask = {
      ...data,
      time_in_stage: timeInStage,
      last_status_change: lastStatusChange,
    };

    setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    return updatedTask;
  };

  const archiveTask = async (id: string) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('tasks')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    // Remove from active tasks, add to archived
    setTasks(prev => prev.filter(t => t.id !== id));
    setArchivedTasks(prev => [data, ...prev]);

    return data;
  };

  const unarchiveTask = async (id: string, targetStatus?: TaskStatus) => {
    const supabase = createClient();

    const updates: { archived_at: null; status?: string } = { archived_at: null };
    if (targetStatus) {
      updates.status = targetStatus;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    // Remove from archived, will be added to active on next fetch
    setArchivedTasks(prev => prev.filter(t => t.id !== id));

    // Refetch to get the task in the active list with proper time calculations
    await fetchTasks();

    return data;
  };

  const deleteTask = async (id: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    setArchivedTasks(prev => prev.filter(t => t.id !== id));
    return true;
  };

  const moveTask = async (
    taskId: string,
    targetProjectId: string,
    targetStatus: TaskStatus,
    targetProjectName?: string,
    isDoneColumn?: boolean
  ) => {
    const supabase = createClient();
    const currentTask = tasks.find(t => t.id === taskId);

    if (!currentTask) return null;

    const updates: { project_id: string; status: string; archived_at?: string } = {
      project_id: targetProjectId,
      status: targetStatus,
    };

    // Auto-archive if moving to done column
    if (isDoneColumn) {
      updates.archived_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    // Add changelog entries
    if (targetProjectId !== projectId) {
      await supabase.from('task_changelog').insert({
        task_id: taskId,
        type: 'moved',
        project_name: targetProjectName,
      });
    }

    if (targetStatus !== currentTask.status) {
      await supabase.from('task_changelog').insert({
        task_id: taskId,
        type: 'status',
        from_value: currentTask.status,
        to_value: targetStatus,
      });
    }

    // If archived or moved to different project, remove from current list
    if (isDoneColumn || targetProjectId !== projectId) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (isDoneColumn) {
        setArchivedTasks(prev => [data, ...prev]);
      }
    } else {
      const updatedTask = {
        ...data,
        time_in_stage: 0,
        last_status_change: new Date().toISOString(),
      };
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    }

    return data;
  };

  const getTaskChangelog = async (taskId: string): Promise<TaskChangelog[]> => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('task_changelog')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching changelog:', error);
      return [];
    }

    return data || [];
  };

  // Check if a task is stale based on threshold
  const isTaskStale = useCallback((task: Task): boolean => {
    if (!task.time_in_stage) return false;
    const thresholdMs = staleThresholdHours * 60 * 60 * 1000;
    return task.time_in_stage > thresholdMs;
  }, [staleThresholdHours]);

  return {
    tasks,
    archivedTasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    archiveTask,
    unarchiveTask,
    getTaskChangelog,
    fetchArchivedTasks,
    isTaskStale,
    refetch: fetchTasks,
  };
}
