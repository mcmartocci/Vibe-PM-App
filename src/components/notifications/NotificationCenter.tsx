'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { Notification } from '@/types';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch,
  } = useNotifications();

  // Track mount state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update dropdown position and refetch when opening
  useEffect(() => {
    if (isOpen) {
      // Refetch notifications when opening
      refetch();

      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    }
  }, [isOpen, refetch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const dropdownContent = isOpen && mounted ? (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        right: dropdownPosition.right,
      }}
      className={cn(
        'w-80 sm:w-96',
        'glass rounded-xl shadow-2xl',
        'border border-line-subtle',
        'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
        'z-[9999]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-line-subtle">
        <h3 className="font-[family-name:var(--font-display)] font-medium text-text">
          Notifications
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs',
              'text-text-muted hover:text-amber hover:bg-amber/10',
              'transition-colors'
            )}
          >
            <CheckCheck size={14} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List - shows ~5 items before scrolling */}
      <div className="max-h-[320px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-amber border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="p-3 rounded-full bg-elevated mb-3">
              <Inbox size={24} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary font-medium">No notifications</p>
            <p className="text-xs text-text-muted mt-1 text-center">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-all duration-150',
          'text-text-muted hover:text-text hover:bg-elevated',
          isOpen && 'bg-elevated text-text'
        )}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1',
            'flex items-center justify-center',
            'text-[10px] font-semibold text-void bg-amber rounded-full'
          )}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel - rendered via portal */}
      {mounted && createPortal(dropdownContent, document.body)}
    </>
  );
}
