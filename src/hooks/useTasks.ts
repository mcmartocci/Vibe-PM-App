'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type TaskStatus = 'todo' | 'in-progress' | 'complete';
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
  created_at: string;
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

export function useTasks(projectId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }, [projectId]);

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

    setTasks(prev => [...prev, data]);
    return data;
  };

  const updateTask = async (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'order'>>
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

    setTasks(prev => prev.map(t => t.id === id ? data : t));
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
    return true;
  };

  const moveTask = async (
    taskId: string,
    targetProjectId: string,
    targetStatus: TaskStatus,
    targetProjectName?: string
  ) => {
    const supabase = createClient();
    const currentTask = tasks.find(t => t.id === taskId);

    if (!currentTask) return null;

    const { data, error } = await supabase
      .from('tasks')
      .update({
        project_id: targetProjectId,
        status: targetStatus,
      })
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

    // If moved to different project, remove from current list
    if (targetProjectId !== projectId) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? data : t));
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

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    getTaskChangelog,
    refetch: fetchTasks,
  };
}
