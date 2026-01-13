import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Dashboard } from '@/components/Dashboard';

export default async function DashboardPage() {
  const supabase = await createClient();

  // If Supabase isn't configured, render dashboard in local-only mode
  if (!supabase) {
    return <Dashboard />;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <Dashboard />;
}
