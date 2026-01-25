'use client';

import { useState } from 'react';
import { Image as ImageIcon, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachmentPreviewProps {
  url: string;
  fileName: string;
  isImage: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
};

export function AttachmentPreview({
  url,
  fileName,
  isImage,
  size = 'sm',
}: AttachmentPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleClick = () => {
    // Open full size in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Fallback for non-images or failed image loads
  if (!isImage || imageError) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          'rounded-lg bg-surface flex items-center justify-center',
          'cursor-pointer hover:bg-elevated transition-colors'
        )}
        onClick={handleClick}
        title={`Open ${fileName}`}
      >
        {isImage ? (
          <ImageIcon size={size === 'sm' ? 16 : size === 'md' ? 24 : 32} className="text-text-muted" />
        ) : (
          <File size={size === 'sm' ? 16 : size === 'md' ? 24 : 32} className="text-text-muted" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        'rounded-lg overflow-hidden bg-surface',
        'cursor-pointer hover:opacity-80 transition-opacity',
        'relative'
      )}
      onClick={handleClick}
      title={`Click to view ${fileName}`}
    >
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface">
          <ImageIcon size={size === 'sm' ? 16 : size === 'md' ? 24 : 32} className="text-text-muted animate-pulse" />
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={fileName}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={cn(
          'w-full h-full object-cover',
          !imageLoaded && 'opacity-0'
        )}
      />
    </div>
  );
}
