'use client';

import { Plus, ArrowRight, Flag, Archive, Trash2, Pencil } from 'lucide-react';
import { Notification, NotificationType } from '@/types';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

const typeConfig: Record<NotificationType, { icon: typeof Plus; color: string; bg: string }> = {
  task_created: { icon: Plus, color: 'text-sage', bg: 'bg-sage/10' },
  task_updated: { icon: Pencil, color: 'text-mist', bg: 'bg-mist/10' },
  status_changed: { icon: ArrowRight, color: 'text-amber', bg: 'bg-amber/10' },
  priority_changed: { icon: Flag, color: 'text-coral', bg: 'bg-coral/10' },
  task_archived: { icon: Archive, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  task_deleted: { icon: Trash2, color: 'text-red-400', bg: 'bg-red-400/10' },
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const config = typeConfig[notification.type] || typeConfig.task_updated;
  const Icon = config.icon;

  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
        'hover:bg-elevated/70',
        !notification.isRead && 'bg-elevated/40'
      )}
    >
      {/* Icon */}
      <div className={cn('p-2 rounded-lg flex-shrink-0', config.bg)}>
        <Icon size={14} className={config.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm leading-snug',
            notification.isRead ? 'text-text-secondary' : 'text-text font-medium'
          )}>
            {notification.title}
          </p>
          {/* Unread indicator */}
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-amber flex-shrink-0 mt-1.5" />
          )}
        </div>
        {notification.body && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-text-muted mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
