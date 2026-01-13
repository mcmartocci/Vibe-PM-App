'use client';

import { useState } from 'react';
import { Mail, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setIsLoading(true);
    setMessage(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email for the magic link!'
      });
      setEmail('');
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo/Brand */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber/10 mb-6">
          <Sparkles className="w-8 h-8 text-amber" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium text-text mb-2">
          Vibe Board
        </h1>
        <p className="text-text-muted">
          Project management for vibe coders
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              className={cn(
                'w-full pl-12 pr-4 py-3.5 rounded-xl text-text',
                'bg-elevated border border-line',
                'placeholder:text-text-muted',
                'focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl',
            'bg-amber text-void font-medium',
            'hover:bg-amber/90',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending magic link...
            </>
          ) : (
            <>
              Continue with Email
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Message */}
      {message && (
        <div
          className={cn(
            'mt-6 p-4 rounded-xl text-sm text-center',
            message.type === 'success'
              ? 'bg-sage/10 text-sage border border-sage/20'
              : 'bg-coral/10 text-coral border border-coral/20'
          )}
        >
          {message.text}
        </div>
      )}

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-text-muted">
        We&apos;ll send you a magic link to sign in.
        <br />
        No password required.
      </p>
    </div>
  );
}
