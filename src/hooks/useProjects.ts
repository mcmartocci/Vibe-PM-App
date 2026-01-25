'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ProjectColumn {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  color: string | null;
  order: number;
  is_done_column: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  stale_threshold_hours: number;
  slack_webhook_url?: string;
  slack_notifications_enabled?: boolean;
  created_at: string;
  task_count?: number;
  columns?: ProjectColumn[];
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch projects with task counts and columns
    const { data, error } = await supabase
      .from('projects')
      .select('*, tasks(count), project_columns(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      // Transform the data to include task_count and sort columns
      const projectsWithData = (data || []).map(project => ({
        ...project,
        task_count: project.tasks?.[0]?.count || 0,
        tasks: undefined, // Remove the nested tasks object
        columns: (project.project_columns || []).sort((a: ProjectColumn, b: ProjectColumn) => a.order - b.order),
        project_columns: undefined, // Remove the nested columns object
      }));
      setProjects(projectsWithData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string, color: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('Not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name, color })
      .select('*, project_columns(*)')
      .single();

    if (error) {
      setError(error.message || 'Database error');
      return null;
    }

    // Transform and add to state
    const newProject = {
      ...data,
      task_count: 0,
      columns: (data.project_columns || []).sort((a: ProjectColumn, b: ProjectColumn) => a.order - b.order),
      project_columns: undefined,
    };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Pick<Project, 'name' | 'color' | 'stale_threshold_hours' | 'slack_webhook_url' | 'slack_notifications_enabled'>>) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    return data;
  };

  const deleteProject = async (id: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    setProjects(prev => prev.filter(p => p.id !== id));
    return true;
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}
