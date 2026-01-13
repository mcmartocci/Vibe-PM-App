'use client';

import { useEffect, useState } from 'react';
import { Users, LayoutGrid, ListTodo, Clock, Mail, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface UserStats {
  id: string;
  email: string;
  is_admin: boolean;
  last_login_at: string | null;
  created_at: string;
  boards_count: number;
  cards_count: number;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}

export function UserTable() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      const supabase = createClient();

      // Fetch all profiles (admin only via RLS)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        setError(profilesError.message);
        setLoading(false);
        return;
      }

      // Fetch project counts per user
      const { data: projectCounts } = await supabase
        .from('projects')
        .select('user_id');

      // Fetch task counts per user
      const { data: taskCounts } = await supabase
        .from('tasks')
        .select('user_id');

      // Aggregate counts
      const projectCountMap = new Map<string, number>();
      const taskCountMap = new Map<string, number>();

      projectCounts?.forEach(p => {
        projectCountMap.set(p.user_id, (projectCountMap.get(p.user_id) || 0) + 1);
      });

      taskCounts?.forEach(t => {
        taskCountMap.set(t.user_id, (taskCountMap.get(t.user_id) || 0) + 1);
      });

      // Combine data
      const usersWithStats: UserStats[] = (profiles || []).map(profile => ({
        ...profile,
        boards_count: projectCountMap.get(profile.id) || 0,
        cards_count: taskCountMap.get(profile.id) || 0,
      }));

      setUsers(usersWithStats);
      setLoading(false);
    }

    fetchUsers();
  }, []);

  const totalUsers = users.length;
  const totalBoards = users.reduce((acc, u) => acc + u.boards_count, 0);
  const totalCards = users.reduce((acc, u) => acc + u.cards_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-text-muted">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-coral">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber/10">
              <Users size={18} className="text-amber" />
            </div>
            <span className="text-text-secondary text-sm">Total Users</span>
          </div>
          <p className="text-3xl font-medium text-text">{totalUsers}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-sage/10">
              <LayoutGrid size={18} className="text-sage" />
            </div>
            <span className="text-text-secondary text-sm">Total Boards</span>
          </div>
          <p className="text-3xl font-medium text-text">{totalBoards}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-mist/10">
              <ListTodo size={18} className="text-mist" />
            </div>
            <span className="text-text-secondary text-sm">Total Cards</span>
          </div>
          <p className="text-3xl font-medium text-text">{totalCards}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-line-subtle">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-text">
            All Users
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line-subtle">
                <th className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  User
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Role
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Boards
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Cards
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-elevated/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber/10 flex items-center justify-center">
                        <Mail size={14} className="text-amber" />
                      </div>
                      <span className="text-sm text-text">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {user.is_admin ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber/10 text-amber">
                        <Shield size={12} />
                        Admin
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">User</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-text tabular-nums">{user.boards_count}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-text tabular-nums">{user.cards_count}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-text-muted" />
                      <span className="text-sm text-text-secondary">
                        {formatRelativeTime(user.last_login_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-text-muted">
                      {formatDate(user.created_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
