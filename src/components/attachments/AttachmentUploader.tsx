'use client';

import { useRef, useState } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALLOWED_FILE_TYPES, MAX_ATTACHMENTS_PER_TASK } from '@/types';

interface AttachmentUploaderProps {
  onUpload: (file: File) => Promise<unknown>;
  uploading: boolean;
  disabled: boolean;
  remainingSlots: number;
  error?: string | null;
}

// Convert MIME types to file extensions for accept attribute
const ACCEPT_EXTENSIONS = '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.csv';

export function AttachmentUploader({
  onUpload,
  uploading,
  disabled,
  remainingSlots,
  error,
}: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalError(null);

    // Validate file type client-side
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setLocalError('File type not allowed. Use images (jpg, png, gif, webp) or documents (pdf, doc, txt, csv).');
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    await onUpload(file);

    // Reset input to allow uploading same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isDisabled = disabled || uploading;
  const displayError = error || localError;

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_EXTENSIONS}
        onChange={handleFileChange}
        className="hidden"
        disabled={isDisabled}
      />

      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg',
          'border border-dashed border-line',
          'text-sm transition-all duration-150',
          isDisabled
            ? 'bg-surface/50 text-text-muted cursor-not-allowed'
            : 'bg-surface/30 text-text-secondary hover:bg-surface hover:border-amber hover:text-text'
        )}
      >
        {uploading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Plus size={16} />
            <span>Add file</span>
          </>
        )}
      </button>

      {/* Status message */}
      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          'text-text-muted',
          disabled && 'text-coral'
        )}>
          {disabled
            ? `Maximum ${MAX_ATTACHMENTS_PER_TASK} files reached`
            : `${remainingSlots} of ${MAX_ATTACHMENTS_PER_TASK} slots remaining`}
        </span>
      </div>

      {/* Error message */}
      {displayError && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-coral/10 border border-coral/20">
          <AlertCircle size={14} className="text-coral flex-shrink-0 mt-0.5" />
          <p className="text-xs text-coral">{displayError}</p>
        </div>
      )}
    </div>
  );
}
