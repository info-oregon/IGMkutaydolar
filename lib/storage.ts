import { supabase } from './supabase';

/**
 * Storage Helpers for Supabase Storage
 *
 * All file uploads go through these helpers to ensure:
 * - Consistent naming conventions
 * - Proper compression and optimization
 * - Database references instead of base64 blobs
 * - Reduced egress costs
 */

const STORAGE_BUCKET = 'inspection-pdfs';
const MAX_IMAGE_WIDTH = 1280;
const WEBP_QUALITY = 0.7;

/**
 * Resize and compress image to WebP format
 */
async function resizeImageToWebP(file: File, maxWidth: number = MAX_IMAGE_WIDTH, quality: number = WEBP_QUALITY): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to WebP blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Upload photo for a form
 * Resizes to WebP (1280px, quality 0.7) to reduce storage costs
 *
 * @param formId - Form ID
 * @param file - Image file
 * @returns Storage path (e.g., "forms/{formId}/photos/{uuid}.webp")
 */
export async function uploadPhoto(formId: string, file: File): Promise<string> {
  try {
    console.log('📸 Uploading photo for form:', formId);

    // Resize and compress to WebP
    const webpBlob = await resizeImageToWebP(file);

    // Generate unique filename
    const uuid = generateUUID();
    const path = `forms/${formId}/photos/${uuid}.webp`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, webpBlob, {
        contentType: 'image/webp',
        upsert: false
      });

    if (error) {
      console.error('❌ Photo upload failed:', error);
      throw error;
    }

    console.log('✅ Photo uploaded:', path, 'Size:', Math.round(webpBlob.size / 1024), 'KB');
    return path;
  } catch (error) {
    console.error('❌ Photo upload error:', error);
    throw error;
  }
}

/**
 * Upload signature image for a form
 * Saves as small PNG/WebP
 *
 * @param formId - Form ID
 * @param blob - Signature image blob
 * @returns Storage path (e.g., "forms/{formId}/signature.png")
 */
export async function uploadSignature(formId: string, blob: Blob): Promise<string> {
  try {
    console.log('✍️ Uploading signature for form:', formId);

    const path = `forms/${formId}/signature.png`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, blob, {
        contentType: 'image/png',
        upsert: true // Allow overwriting signature
      });

    if (error) {
      console.error('❌ Signature upload failed:', error);
      throw error;
    }

    console.log('✅ Signature uploaded:', path, 'Size:', Math.round(blob.size / 1024), 'KB');
    return path;
  } catch (error) {
    console.error('❌ Signature upload error:', error);
    throw error;
  }
}

/**
 * Upload final PDF for a form
 *
 * @param formId - Form ID
 * @param pdfBytes - PDF file as Uint8Array
 * @returns Storage path (e.g., "forms/{formId}/final.pdf")
 */
export async function uploadFinalPdf(formId: string, pdfBytes: Uint8Array): Promise<string> {
  try {
    console.log('📄 Uploading final PDF for form:', formId);

    const path = `forms/${formId}/final.pdf`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true // Allow overwriting PDF
      });

    if (error) {
      console.error('❌ PDF upload failed:', error);
      throw error;
    }

    console.log('✅ PDF uploaded:', path, 'Size:', Math.round(pdfBytes.length / 1024), 'KB');
    return path;
  } catch (error) {
    console.error('❌ PDF upload error:', error);
    throw error;
  }
}

/**
 * Get signed URL for a storage path
 * Creates a short-lived authenticated URL
 *
 * @param path - Storage path
 * @param ttlSeconds - Time-to-live in seconds (default: 60)
 * @returns Signed URL
 */
export async function getSignedUrl(path: string, ttlSeconds: number = 60): Promise<string> {
  try {
    console.log('🔗 Getting signed URL for:', path);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, ttlSeconds);

    if (error) {
      console.error('❌ Failed to create signed URL:', error);
      throw error;
    }

    if (!data?.signedUrl) {
      throw new Error('No signed URL returned');
    }

    console.log('✅ Signed URL created (expires in', ttlSeconds, 'seconds)');
    return data.signedUrl;
  } catch (error) {
    console.error('❌ Signed URL error:', error);
    throw error;
  }
}

/**
 * Delete a file from storage
 *
 * @param path - Storage path
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    console.log('🗑️ Deleting file:', path);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      console.error('❌ File deletion failed:', error);
      throw error;
    }

    console.log('✅ File deleted:', path);
  } catch (error) {
    console.error('❌ File deletion error:', error);
    throw error;
  }
}

/**
 * Delete all files for a form
 *
 * @param formId - Form ID
 */
export async function deleteFormFiles(formId: string): Promise<void> {
  try {
    console.log('🗑️ Deleting all files for form:', formId);

    // List all files in the form's directory
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(`forms/${formId}`, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('❌ Failed to list files:', listError);
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('ℹ️ No files to delete for form:', formId);
      return;
    }

    // Delete all files
    const filePaths = files.map(f => `forms/${formId}/${f.name}`);
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      console.error('❌ Failed to delete files:', deleteError);
      throw deleteError;
    }

    console.log('✅ Deleted', files.length, 'files for form:', formId);
  } catch (error) {
    console.error('❌ Form files deletion error:', error);
    throw error;
  }
}

/**
 * Upload multiple photos at once
 *
 * @param formId - Form ID
 * @param files - Array of image files
 * @returns Array of storage paths
 */
export async function uploadPhotos(formId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];

  for (const file of files) {
    try {
      const path = await uploadPhoto(formId, file);
      paths.push(path);
    } catch (error) {
      console.error('❌ Failed to upload photo:', file.name, error);
      // Continue with other photos
    }
  }

  console.log('✅ Uploaded', paths.length, '/', files.length, 'photos');
  return paths;
}
