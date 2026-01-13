import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();

  // If Supabase isn't configured, go straight to dashboard (local-only mode)
  if (!supabase) {
    redirect('/dashboard');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
