'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Save } from 'lucide-react';
import { Notes } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

export function NotesPanel() {
  const [notes, setNotes, isHydrated] = useLocalStorage<Notes>('pm-notes', {
    content: '',
    updatedAt: Date.now(),
  });
  const [localContent, setLocalContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHydrated) {
      setLocalContent(notes.content);
    }
  }, [isHydrated, notes.content]);

  const handleChange = (value: string) => {
    setLocalContent(value);
    setIsSaving(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setNotes({ content: value, updatedAt: Date.now() });
      setIsSaving(false);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-amber" />
          <h2 className="font-[family-name:var(--font-display)] text-text text-base font-medium">
            Notes
          </h2>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs transition-opacity duration-200',
            isSaving ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Save size={12} className="text-text-muted animate-pulse" />
          <span className="text-text-muted">Saving...</span>
        </div>
      </div>

      {/* Textarea */}
      {!isHydrated ? (
        <div className="flex-1 bg-elevated/50 rounded-xl animate-pulse-soft" />
      ) : (
        <div className="flex-1 relative">
          <textarea
            value={localContent}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Capture your thoughts..."
            className={cn(
              'absolute inset-0 w-full h-full p-4 rounded-xl text-sm resize-none',
              'bg-elevated/50 border border-line-subtle',
              'text-text placeholder:text-text-muted',
              'leading-relaxed',
              'transition-all duration-200'
            )}
          />
          {/* Gradient fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-elevated/50 to-transparent rounded-b-xl pointer-events-none" />
        </div>
      )}
    </div>
  );
}
