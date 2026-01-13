'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Note {
  id: string;
  user_id: string;
  content: string;
  updated_at: string;
}

export function useNotes() {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNote = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      setError(error.message);
    } else {
      setNote(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const updateNote = useCallback(async (content: string) => {
    // Update local state immediately
    setNote(prev => prev ? { ...prev, content } : null);

    // Debounce the save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      if (note) {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', note.id);

        if (error) {
          setError(error.message);
        }
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert({ user_id: user.id, content })
          .select()
          .single();

        if (error) {
          setError(error.message);
        } else {
          setNote(data);
        }
      }
    }, 500);
  }, [note]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    content: note?.content ?? '',
    loading,
    error,
    updateNote,
    refetch: fetchNote,
  };
}
