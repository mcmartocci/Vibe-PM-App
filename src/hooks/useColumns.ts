'use client';

import { useState, useCallback } from 'react';
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

export function useColumns(projectId: string | null) {
  const [columns, setColumns] = useState<ProjectColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchColumns = useCallback(async () => {
    if (!projectId) {
      setColumns([]);
      return [];
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('project_columns')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });

    if (error) {
      setError(error.message);
      setLoading(false);
      return [];
    }

    setColumns(data || []);
    setLoading(false);
    return data || [];
  }, [projectId]);

  const createColumn = async (name: string, slug: string, color?: string) => {
    if (!projectId) return null;

    const supabase = createClient();

    // Get the next order value
    const nextOrder = columns.length;

    const { data, error } = await supabase
      .from('project_columns')
      .insert({
        project_id: projectId,
        name,
        slug,
        color: color || null,
        order: nextOrder,
        is_done_column: false,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setColumns(prev => [...prev, data]);
    return data;
  };

  const updateColumn = async (
    id: string,
    updates: Partial<Pick<ProjectColumn, 'name' | 'slug' | 'color' | 'order' | 'is_done_column'>>
  ) => {
    const supabase = createClient();

    // If setting this as done column, unset any other done columns first
    if (updates.is_done_column === true) {
      const currentDoneColumn = columns.find(c => c.is_done_column && c.id !== id);
      if (currentDoneColumn) {
        await supabase
          .from('project_columns')
          .update({ is_done_column: false })
          .eq('id', currentDoneColumn.id);
      }
    }

    const { data, error } = await supabase
      .from('project_columns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setColumns(prev => {
      const updated = prev.map(c => {
        if (c.id === id) return data;
        // If we just set a new done column, unset the old one
        if (updates.is_done_column === true && c.is_done_column) {
          return { ...c, is_done_column: false };
        }
        return c;
      });
      return updated.sort((a, b) => a.order - b.order);
    });

    return data;
  };

  const deleteColumn = async (id: string, moveTasksToColumnId?: string) => {
    const supabase = createClient();
    const columnToDelete = columns.find(c => c.id === id);

    if (!columnToDelete) {
      setError('Column not found');
      return false;
    }

    // If moveTasksToColumnId is provided, move all tasks first
    if (moveTasksToColumnId) {
      const targetColumn = columns.find(c => c.id === moveTasksToColumnId);
      if (targetColumn) {
        await supabase
          .from('tasks')
          .update({ status: targetColumn.slug })
          .eq('project_id', projectId)
          .eq('status', columnToDelete.slug);
      }
    } else {
      // Move to the first column by default
      const firstColumn = columns.find(c => c.id !== id);
      if (firstColumn) {
        await supabase
          .from('tasks')
          .update({ status: firstColumn.slug })
          .eq('project_id', projectId)
          .eq('status', columnToDelete.slug);
      }
    }

    // Delete the column
    const { error } = await supabase
      .from('project_columns')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    // Update order of remaining columns
    const remainingColumns = columns.filter(c => c.id !== id);
    const reorderedColumns = remainingColumns.map((col, index) => ({
      ...col,
      order: index,
    }));

    // Update orders in database
    for (const col of reorderedColumns) {
      if (col.order !== columns.find(c => c.id === col.id)?.order) {
        await supabase
          .from('project_columns')
          .update({ order: col.order })
          .eq('id', col.id);
      }
    }

    setColumns(reorderedColumns);
    return true;
  };

  const reorderColumns = async (orderedColumnIds: string[]) => {
    const supabase = createClient();

    // Update each column's order
    const updates = orderedColumnIds.map((id, index) => ({
      id,
      order: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('project_columns')
        .update({ order: update.order })
        .eq('id', update.id);

      if (error) {
        setError(error.message);
        return false;
      }
    }

    // Update local state
    setColumns(prev => {
      const reordered = [...prev];
      reordered.sort((a, b) => {
        const aIndex = orderedColumnIds.indexOf(a.id);
        const bIndex = orderedColumnIds.indexOf(b.id);
        return aIndex - bIndex;
      });
      return reordered.map((col, index) => ({ ...col, order: index }));
    });

    return true;
  };

  // Generate a slug from a column name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Check if a slug is unique within the project
  const isSlugUnique = (slug: string, excludeId?: string): boolean => {
    return !columns.some(c => c.slug === slug && c.id !== excludeId);
  };

  return {
    columns,
    loading,
    error,
    fetchColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    generateSlug,
    isSlugUnique,
    setColumns, // For direct state updates from parent
  };
}
