'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  TaskAttachment,
  MAX_ATTACHMENTS_PER_TASK,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_FILE_TYPES,
} from '@/types';

const STORAGE_BUCKET = 'task-attachments';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function useAttachments(taskId: string) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to check if a file type is an image
  const isImage = useCallback((fileType: string): boolean => {
    return fileType.startsWith('image/');
  }, []);

  // Validate file before upload
  const validateFile = useCallback((file: File): ValidationResult => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed. Allowed types: images (jpg, png, gif, webp) and documents (pdf, doc, txt, csv).`,
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const maxSizeMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit.`,
      };
    }

    return { valid: true };
  }, []);

  // Fetch all attachments for a task
  const fetchAttachments = useCallback(async () => {
    if (!taskId) return [];

    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data, error: fetchError } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return [];
    }

    // Transform snake_case to camelCase and add public URLs
    const transformedAttachments: TaskAttachment[] = await Promise.all(
      (data || []).map(async (attachment) => {
        const publicUrl = await getPublicUrl(attachment.storage_path);
        return {
          id: attachment.id,
          taskId: attachment.task_id,
          userId: attachment.user_id,
          fileName: attachment.file_name,
          fileType: attachment.file_type,
          fileSize: attachment.file_size,
          storagePath: attachment.storage_path,
          createdAt: new Date(attachment.created_at).getTime(),
          publicUrl,
        };
      })
    );

    setAttachments(transformedAttachments);
    setLoading(false);
    return transformedAttachments;
  }, [taskId]);

  // Get a signed URL for viewing/downloading a file
  const getPublicUrl = useCallback(async (storagePath: string): Promise<string | undefined> => {
    const supabase = createClient();

    const { data, error: urlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (urlError) {
      console.error('Error getting signed URL:', urlError);
      return undefined;
    }

    return data?.signedUrl;
  }, []);

  // Upload a file to storage and create database record
  const uploadFile = useCallback(async (file: File): Promise<TaskAttachment | null> => {
    if (!taskId) return null;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return null;
    }

    // Check attachment limit
    if (attachments.length >= MAX_ATTACHMENTS_PER_TASK) {
      setError(`Maximum ${MAX_ATTACHMENTS_PER_TASK} attachments per task allowed.`);
      return null;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to upload files.');
      setUploading(false);
      return null;
    }

    // Create storage path: {user_id}/{task_id}/{timestamp}_{filename}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${user.id}/${taskId}/${timestamp}_${sanitizedFileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return null;
    }

    // Create database record
    const { data: attachmentData, error: dbError } = await supabase
      .from('task_attachments')
      .insert({
        task_id: taskId,
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (dbError) {
      // Try to clean up the uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      setError(`Failed to save attachment record: ${dbError.message}`);
      setUploading(false);
      return null;
    }

    // Get public URL for the new attachment
    const publicUrl = await getPublicUrl(storagePath);

    const newAttachment: TaskAttachment = {
      id: attachmentData.id,
      taskId: attachmentData.task_id,
      userId: attachmentData.user_id,
      fileName: attachmentData.file_name,
      fileType: attachmentData.file_type,
      fileSize: attachmentData.file_size,
      storagePath: attachmentData.storage_path,
      createdAt: new Date(attachmentData.created_at).getTime(),
      publicUrl,
    };

    // Create changelog entry for attachment added
    await supabase.from('task_changelog').insert({
      task_id: taskId,
      type: 'attachment_added',
      to_value: file.name,
    });

    setAttachments(prev => [newAttachment, ...prev]);
    setUploading(false);
    return newAttachment;
  }, [taskId, attachments.length, validateFile, getPublicUrl]);

  // Delete a file from storage and database
  const deleteFile = useCallback(async (attachmentId: string, storagePath: string): Promise<boolean> => {
    setError(null);

    const supabase = createClient();

    // Get the attachment info before deleting for changelog
    const attachmentToDelete = attachments.find(a => a.id === attachmentId);

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue to delete database record anyway
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('task_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      setError(`Failed to delete attachment: ${dbError.message}`);
      return false;
    }

    // Create changelog entry for attachment removed
    if (attachmentToDelete) {
      await supabase.from('task_changelog').insert({
        task_id: taskId,
        type: 'attachment_removed',
        from_value: attachmentToDelete.fileName,
      });
    }

    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    return true;
  }, [attachments, taskId]);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  // Fetch attachments on mount
  useEffect(() => {
    if (taskId) {
      fetchAttachments();
    }
  }, [taskId, fetchAttachments]);

  return {
    attachments,
    loading,
    uploading,
    error,
    fetchAttachments,
    uploadFile,
    deleteFile,
    getPublicUrl,
    validateFile,
    isImage,
    formatFileSize,
    canUpload: attachments.length < MAX_ATTACHMENTS_PER_TASK,
    remainingSlots: MAX_ATTACHMENTS_PER_TASK - attachments.length,
  };
}
