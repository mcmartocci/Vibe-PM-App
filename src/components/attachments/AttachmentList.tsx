'use client';

import { TaskAttachment } from '@/types';
import { cn } from '@/lib/utils';
import { AttachmentPreview } from './AttachmentPreview';
import { FileText, File, Download, Trash2, Loader2 } from 'lucide-react';

interface AttachmentListProps {
  attachments: TaskAttachment[];
  loading?: boolean;
  onDelete: (attachmentId: string, storagePath: string) => Promise<boolean>;
  formatFileSize: (bytes: number) => string;
  isImage: (fileType: string) => boolean;
}

function getFileIcon(fileType: string) {
  if (fileType === 'application/pdf') return FileText;
  if (fileType.includes('word') || fileType === 'application/msword') return FileText;
  if (fileType === 'text/plain' || fileType === 'text/csv') return FileText;
  return File;
}

export function AttachmentList({
  attachments,
  loading,
  onDelete,
  formatFileSize,
  isImage,
}: AttachmentListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={20} className="animate-spin text-text-muted" />
        <span className="ml-2 text-sm text-text-muted">Loading attachments...</span>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <p className="text-sm text-text-muted italic text-center py-4">
        No attachments
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        const isImageFile = isImage(attachment.fileType);
        const FileIcon = getFileIcon(attachment.fileType);

        return (
          <div
            key={attachment.id}
            className={cn(
              'group flex items-center gap-3 p-2.5 rounded-lg',
              'bg-elevated/50 border border-line-subtle',
              'hover:bg-elevated transition-colors'
            )}
          >
            {/* Preview or Icon */}
            <div className="flex-shrink-0">
              {isImageFile && attachment.publicUrl ? (
                <AttachmentPreview
                  url={attachment.publicUrl}
                  fileName={attachment.fileName}
                  isImage={true}
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                  <FileIcon size={18} className="text-text-muted" />
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text truncate" title={attachment.fileName}>
                {attachment.fileName}
              </p>
              <p className="text-xs text-text-muted">
                {formatFileSize(attachment.fileSize)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {attachment.publicUrl && (
                <a
                  href={attachment.publicUrl}
                  download={attachment.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'p-1.5 rounded-lg',
                    'text-text-muted hover:text-sage hover:bg-sage/10',
                    'transition-all'
                  )}
                  title="Download"
                >
                  <Download size={14} />
                </a>
              )}
              <button
                onClick={() => onDelete(attachment.id, attachment.storagePath)}
                className={cn(
                  'p-1.5 rounded-lg',
                  'text-text-muted hover:text-coral hover:bg-coral/10',
                  'transition-all'
                )}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
