'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Notification, NotificationType } from '@/types';

interface CreateNotificationData {
  projectId?: string;
  taskId?: string;
  type: NotificationType;
  title: string;
  body?: string;
}

interface DbNotification {
  id: string;
  user_id: string;
  project_id: string | null;
  task_id: string | null;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

function mapDbToNotification(db: DbNotification): Notification {
  return {
    id: db.id,
    userId: db.user_id,
    projectId: db.project_id || undefined,
    taskId: db.task_id || undefined,
    type: db.type as NotificationType,
    title: db.title,
    body: db.body || undefined,
    isRead: db.is_read,
    createdAt: new Date(db.created_at).getTime(),
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const allNotifications = (data || []).map(mapDbToNotification);

    // Separate unread and read notifications
    const unread = allNotifications.filter(n => !n.isRead);
    const read = allNotifications.filter(n => n.isRead);

    // Keep only 5 most recent unread, delete the rest
    if (unread.length > 5) {
      const toDelete = unread.slice(5); // Older unread notifications
      const idsToDelete = toDelete.map(n => n.id);

      // Delete excess unread notifications from database
      await supabase
        .from('notifications')
        .delete()
        .in('id', idsToDelete);

      // Keep only the 5 most recent unread + all read
      setNotifications([...unread.slice(0, 5), ...read]);
    } else {
      setNotifications(allNotifications);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 5 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const createNotification = async (data: CreateNotificationData): Promise<Notification | null> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: newNotification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        project_id: data.projectId || null,
        task_id: data.taskId || null,
        type: data.type,
        title: data.title,
        body: data.body || null,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    const notification = mapDbToNotification(newNotification);
    setNotifications(prev => [notification, ...prev]);
    return notification;
  };

  const markAsRead = async (id: string): Promise<boolean> => {
    const supabase = createClient();

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    return true;
  };

  const markAllAsRead = async (): Promise<boolean> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      setError(error.message);
      return false;
    }

    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
    return true;
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    const supabase = createClient();

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    setNotifications(prev => prev.filter(n => n.id !== id));
    return true;
  };

  return {
    notifications,
    loading,
    error,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
