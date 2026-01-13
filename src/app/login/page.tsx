import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage() {
  const supabase = await createClient();

  // If Supabase isn't configured, redirect to dashboard (local-only mode)
  if (!supabase) {
    redirect('/dashboard');
  }

  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-void via-midnight to-void">
      {/* Ambient glow effects */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-amber/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-sage/5 rounded-full blur-3xl pointer-events-none" />

      {/* Glass card */}
      <div className="relative glass rounded-2xl p-8 animate-in">
        <LoginForm />
      </div>
    </div>
  );
}
