import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UserTable } from '@/components/admin/UserTable';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default async function AdminPage() {
  const supabase = await createClient();

  // If Supabase isn't configured, redirect to dashboard
  if (!supabase) {
    redirect('/dashboard');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-void via-midnight to-void">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-amber/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-sage/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto p-8 lg:p-10">
        {/* Header */}
        <header className="mb-8 animate-in">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber/10">
              <Shield size={24} className="text-amber" />
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-2xl lg:text-3xl font-medium text-text">
                Admin Dashboard
              </h1>
              <p className="text-text-muted mt-1">Manage users and view platform statistics</p>
            </div>
          </div>
          <div className="mt-4 h-px w-32 bg-gradient-to-r from-amber/60 to-transparent" />
        </header>

        {/* Content */}
        <main className="animate-in" style={{ animationDelay: '100ms' }}>
          <UserTable />
        </main>
      </div>
    </div>
  );
}
