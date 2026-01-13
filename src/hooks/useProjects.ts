'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
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

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setProjects(data || []);
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
      .select()
      .single();

    if (error) {
      setError(error.message || 'Database error');
      return null;
    }

    setProjects(prev => [...prev, data]);
    return data;
  };

  const updateProject = async (id: string, updates: Partial<Pick<Project, 'name' | 'color'>>) => {
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

    setProjects(prev => prev.map(p => p.id === id ? data : p));
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
