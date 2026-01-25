'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AttachmentCounts {
  [taskId: string]: number;
}

export function useAttachmentCounts(taskIds: string[]) {
  const [counts, setCounts] = useState<AttachmentCounts>({});
  const [loading, setLoading] = useState(false);

  const fetchCounts = useCallback(async () => {
    if (taskIds.length === 0) {
      setCounts({});
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Fetch all attachments for the given task IDs and count them
    const { data, error } = await supabase
      .from('task_attachments')
      .select('task_id')
      .in('task_id', taskIds);

    if (error) {
      console.error('Error fetching attachment counts:', error);
      setLoading(false);
      return;
    }

    // Count attachments per task
    const countMap: AttachmentCounts = {};
    for (const row of data || []) {
      countMap[row.task_id] = (countMap[row.task_id] || 0) + 1;
    }

    setCounts(countMap);
    setLoading(false);
  }, [taskIds.join(',')]); // Join to create stable dependency

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return {
    counts,
    loading,
    refetch: fetchCounts,
    getCount: (taskId: string) => counts[taskId] || 0,
  };
}
