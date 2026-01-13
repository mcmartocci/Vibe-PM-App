'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Todo {
  id: string;
  user_id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setTodos(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const createTodo = async (text: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from('todos')
      .insert({ user_id: user.id, text })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setTodos(prev => [...prev, data]);
    return data;
  };

  const toggleTodo = async (id: string) => {
    const supabase = createClient();
    const todo = todos.find(t => t.id === id);

    if (!todo) return null;

    const { data, error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setTodos(prev => prev.map(t => t.id === id ? data : t));
    return data;
  };

  const deleteTodo = async (id: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    setTodos(prev => prev.filter(t => t.id !== id));
    return true;
  };

  return {
    todos,
    loading,
    error,
    createTodo,
    toggleTodo,
    deleteTodo,
    refetch: fetchTodos,
  };
}
