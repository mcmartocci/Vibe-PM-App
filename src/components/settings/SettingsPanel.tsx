'use client';

import { X, Sun, Moon, Settings } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md mx-4 bg-surface border border-line rounded-2xl shadow-2xl animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber/10">
              <Settings size={20} className="text-amber" />
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-text">
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-elevated transition-all duration-150"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Appearance Section */}
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-4">Appearance</h3>

            {/* Theme Toggle */}
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200',
                  theme === 'light'
                    ? 'border-amber bg-amber/10'
                    : 'border-line hover:border-text-muted hover:bg-elevated/50'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  'bg-[#f8fafc] border border-[#e2e8f0]'
                )}>
                  <Sun size={24} className="text-[#d97706]" />
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  theme === 'light' ? 'text-text' : 'text-text-secondary'
                )}>
                  Light
                </span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200',
                  theme === 'dark'
                    ? 'border-amber bg-amber/10'
                    : 'border-line hover:border-text-muted hover:bg-elevated/50'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  'bg-[#111114] border border-[#27272a]'
                )}>
                  <Moon size={24} className="text-[#60a5fa]" />
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  theme === 'dark' ? 'text-text' : 'text-text-secondary'
                )}>
                  Dark
                </span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-line-subtle" />

          {/* More settings placeholder */}
          <div className="text-center py-4">
            <p className="text-sm text-text-muted">More settings coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
