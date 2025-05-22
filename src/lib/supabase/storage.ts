// src/clients/supabase/storage.ts
import { type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from './admin';
import { createLogger } from '@/lib/logger';
import type { Database } from '@/lib/database.types';

// Re-export storage error type for convenience
export type { StorageError } from '@supabase/storage-js';

const logger = createLogger({ prefix: 'storage' });

/**
 * Options for file uploads
 */
export interface UploadOptions {
  /**
   * MIME type of the file (e.g., 'image/png')
   */
  contentType?: string;
  
  /**
   * Cache control header (e.g., '3600')
   */
  cacheControl?: string;
  
  /**
   * Whether to replace an existing file with the same path
   */
  upsert?: boolean;
  
  /**
   * Bucket folder to prepend to the file path
   */
  folder?: string;
  
  /**
   * Add a timestamp prefix to the filename to ensure uniqueness
   */
  addTimestampPrefix?: boolean;
  
  /**
   * Custom function to transform the file path before upload
   */
  transformPath?: (path: string) => string;
  
  /**
   * Optional metadata to associate with the file
   */
  metadata?: Record<string, string>;
  
  /**
   * Enable debug mode for extra logging
   */
  debug?: boolean;
}

/**
 * Result of a storage operation
 */
export interface StorageResult<T> {
  /**
   * The result data if successful
   */
  data: T | null;
  
  /**
   * Error object if the operation failed
   */
  error: Error | null;
}

/**
 * Uploads a file to a Supabase storage bucket using the Admin client.
 * Assumes the admin client has permissions to write to the bucket.
 *
 * @param bucketName The name of the bucket
 * @param filePath The path (including filename) where the file will be stored
 * @param fileBody The file content (Browser File, Buffer, Blob, etc.)
 * @param options Upload options (contentType, cacheControl, etc.)
 * @returns A result object with the stored path or an error
 */
export async function uploadAdmin(
  bucketName: string,
  filePath: string,
  fileBody: File | Buffer | ArrayBuffer | Blob | ReadableStream<Uint8Array>,
  options?: UploadOptions
): Promise<StorageResult<{ path: string; url: string }>> {
  const adminClient = createSupabaseAdminClient();
  const debug = options?.debug;
  
  try {
    // Process the filepath
    let processedPath = filePath;
    
    // Apply folder prefix if specified
    if (options?.folder) {
      const folder = options.folder.endsWith('/') 
        ? options.folder 
        : `${options.folder}/`;
        
      processedPath = `${folder}${processedPath}`;
    }
    
    // Add timestamp prefix if requested
    if (options?.addTimestampPrefix) {
      const timestamp = Date.now();
      const filename = processedPath.split('/').pop() || '';
      const directory = processedPath.substring(0, processedPath.length - filename.length);
      processedPath = `${directory}${timestamp}-${filename}`;
    }
    
    // Apply custom transform if provided
    if (options?.transformPath) {
      processedPath = options.transformPath(processedPath);
    }
    
    if (debug) {
      logger.debug('Uploading file', {
        bucket: bucketName,
        originalPath: filePath,
        processedPath,
        contentType: options?.contentType,
      });
    }
    
    // Perform the upload
    const { data, error } = await adminClient.storage
      .from(bucketName)
      .upload(processedPath, fileBody, {
        contentType: options?.contentType,
        cacheControl: options?.cacheControl ?? '3600',
        upsert: options?.upsert ?? false,
        ...(options?.metadata ? { duplex: 'half', metadata: options.metadata } : {}),
      });

    if (error) throw error;
    
    // Get the public URL for the uploaded file
    const { data: urlData } = adminClient.storage
      .from(bucketName)
      .getPublicUrl(data?.path || processedPath);
      
    if (debug) {
      logger.debug('File uploaded successfully', {
        path: data?.path,
        publicUrl: urlData?.publicUrl,
      });
    }
    
    return { 
      data: { 
        path: data?.path || processedPath,
        url: urlData?.publicUrl || '',
      }, 
      error: null 
    };
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown storage upload error';
      
    logger.error(`Error uploading to ${bucketName}/${filePath}:`, { errorMessage });
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Gets the public URL for a file in a Supabase storage bucket.
 * Does not require authentication if the bucket/file is public.
 *
 * @param client A Supabase client instance (browser or server)
 * @param bucketName The name of the bucket
 * @param filePath The path to the file within the bucket
 * @param options Transform options (width, height, etc.)
 * @returns The public URL or an error
 */
export function getPublicUrl(
  client: SupabaseClient<Database>,
  bucketName: string,
  filePath: string,
  options?: {
    /**
     * Set to true or a filename to trigger download behavior
     */
    download?: string | boolean;
    
    /**
     * Image transformation options
     */
    transform?: {
      /**
       * Desired width of the image
       */
      width?: number;
      
      /**
       * Desired height of the image
       */
      height?: number;
      
      /**
       * Resize mode
       */
      resize?: 'cover' | 'contain' | 'fill';
      
      /**
       * Output format
       */
      format?: 'origin' | 'webp' | 'jpeg' | 'jpg' | 'png';
      
      /**
       * Image quality (1-100)
       */
      quality?: number;
    };
  }
): StorageResult<string> {
  try {
    const { data } = client.storage
      .from(bucketName)
      .getPublicUrl(filePath, {
        download: options?.download,
        transform: options?.transform ? {
          width: options.transform.width,
          height: options.transform.height,
          resize: options.transform.resize,
          format: 'origin' as const,
          quality: options.transform.quality,
        } : undefined,
      });

    if (!data?.publicUrl) {
      throw new Error('Failed to construct public URL.');
    }
    
    return { data: data.publicUrl, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error getting public URL';
      
    logger.error(`Error getting public URL for ${bucketName}/${filePath}:`, { errorMessage });
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Creates a signed URL for downloading a private file.
 * Requires a client instance that has permissions to read the file.
 *
 * @param client An authenticated Supabase client instance
 * @param bucketName The name of the bucket
 * @param filePath The path to the file within the bucket
 * @param expiresInSeconds The duration for which the URL is valid
 * @param options Download and transform options
 * @returns The signed URL or an error
 */
export async function createSignedUrl(
  client: SupabaseClient<Database>,
  bucketName: string,
  filePath: string,
  expiresInSeconds: number = 60 * 60, // 1 hour default
  options?: {
    /**
     * Set to true or a filename to trigger download behavior
     */
    download?: string | boolean;
    
    /**
     * Image transformation options
     */
    transform?: {
      /**
       * Desired width of the image
       */
      width?: number;
      
      /**
       * Desired height of the image
       */
      height?: number;
      
      /**
       * Resize mode
       */
      resize?: 'cover' | 'contain' | 'fill';
      
      /**
       * Output format
       */
      format?: 'origin' | 'webp' | 'jpeg' | 'jpg' | 'png';
      
      /**
       * Image quality (1-100)
       */
      quality?: number;
    };
  }
): Promise<StorageResult<string>> {
  try {
    const { data, error } = await client.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresInSeconds, {
        download: options?.download,
        transform: options?.transform ? {
          width: options.transform.width,
          height: options.transform.height,
          resize: options.transform.resize,
          format: 'origin' as const,
          quality: options.transform.quality,
        } : undefined,
      });

    if (error) throw error;
    
    return { data: data?.signedUrl || null, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error creating signed URL';
      
    logger.error(`Error creating signed URL for ${bucketName}/${filePath}:`, { errorMessage });
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Deletes a file from a storage bucket.
 * 
 * @param client Supabase client with appropriate permissions
 * @param bucketName The name of the bucket
 * @param filePath The path of the file to delete
 * @returns Result indicating success or failure
 */
export async function deleteFile(
  client: SupabaseClient<Database>,
  bucketName: string,
  filePath: string
): Promise<StorageResult<boolean>> {
  try {
    const { error } = await client.storage
      .from(bucketName)
      .remove([filePath]);
      
    if (error) throw error;
    
    return { data: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error deleting file';
      
    logger.error(`Error deleting file ${bucketName}/${filePath}:`, { errorMessage });
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Lists files in a storage bucket, optionally filtered by path prefix.
 * 
 * @param client Supabase client with appropriate permissions
 * @param bucketName The name of the bucket
 * @param options Listing options
 * @returns List of files or an error
 */
export async function listFiles(
  client: SupabaseClient<Database>,
  bucketName: string,
  options?: {
    /**
     * Path prefix to filter files (e.g., 'folder/')
     */
    prefix?: string;
    
    /**
     * The number of files to return
     */
    limit?: number;
    
    /**
     * The starting position
     */
    offset?: number;
    
    /**
     * Column to sort by
     */
    sortBy?: {
      /**
       * Column name
       */
      column: 'name' | 'updated_at' | 'created_at' | 'last_accessed_at';
      
      /**
       * Sort order
       */
      order?: 'asc' | 'desc';
    };
  }
): Promise<StorageResult<Array<{
  name: string;
  id: string;
  updatedAt: string;
  createdAt: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}>>> {
  try {
    const { data, error } = await client.storage
      .from(bucketName)
      .list(options?.prefix, {
        limit: options?.limit,
        offset: options?.offset,
        sortBy: options?.sortBy,
      });
      
    if (error) throw error;
    
    return { 
      data: data?.map(file => ({
        name: file.name,
        id: file.id,
        updatedAt: file.updated_at,
        createdAt: file.created_at,
        last_accessed_at: file.last_accessed_at,
        metadata: file.metadata,
      })) || [], 
      error: null 
    };
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error listing files';
      
    logger.error(`Error listing files in ${bucketName}:`, { errorMessage });
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

/**
 * Copies a file within the same bucket or to another bucket.
 * 
 * @param client Supabase client with appropriate permissions
 * @param sourceBucket Source bucket name
 * @param sourcePath Source file path
 * @param destinationBucket Destination bucket name (defaults to source bucket)
 * @param destinationPath Destination file path
 * @returns Result indicating success or failure
 */
export async function copyFile(
  client: SupabaseClient<Database>,
  sourceBucket: string,
  sourcePath: string,
  destinationPath: string,
  destinationBucket: string = sourceBucket
): Promise<StorageResult<boolean>> {
  try {
    const { error } = await client.storage
      .from(sourceBucket)
      .copy(sourcePath, destinationPath, {
        destinationBucket: destinationBucket !== sourceBucket ? destinationBucket : undefined,
      });
      
    if (error) throw error;
    
    return { data: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error copying file';
      
    logger.error(`Error copying file from ${sourceBucket}/${sourcePath} to ${destinationBucket}/${destinationPath}:`, { 
      errorMessage 
    });
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error(errorMessage) 
    };
  }
}

