import { supabase } from './supabase';

export interface UploadResult {
  path: string;
  sizeBytes: number;
}

async function resizeImageToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const maxWidth = 1280;
      const aspectRatio = img.height / img.width;
      const width = Math.min(img.width, maxWidth);
      const height = width * aspectRatio;

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to WebP'));
          }
        },
        'image/webp',
        0.7
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadPhoto(formId: string, file: File): Promise<UploadResult> {
  try {
    const webpBlob = await resizeImageToWebP(file);
    const uuid = crypto.randomUUID();
    const path = `forms/${formId}/photos/${uuid}.webp`;

    const { error } = await supabase.storage.from('forms').upload(path, webpBlob, {
      contentType: 'image/webp',
      upsert: false
    });

    if (error) throw error;

    return {
      path,
      sizeBytes: webpBlob.size
    };
  } catch (error) {
    console.error('Failed to upload photo:', error);
    throw error;
  }
}

export async function uploadSignature(formId: string, blob: Blob): Promise<UploadResult> {
  try {
    const path = `forms/${formId}/signature.png`;

    const { error } = await supabase.storage.from('forms').upload(path, blob, {
      contentType: 'image/png',
      upsert: true
    });

    if (error) throw error;

    return {
      path,
      sizeBytes: blob.size
    };
  } catch (error) {
    console.error('Failed to upload signature:', error);
    throw error;
  }
}

export async function uploadFinalPdf(formId: string, pdfBytes: Uint8Array): Promise<UploadResult> {
  try {
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const path = `forms/${formId}/final.pdf`;

    const { error } = await supabase.storage.from('forms').upload(path, blob, {
      contentType: 'application/pdf',
      upsert: true
    });

    if (error) throw error;

    return {
      path,
      sizeBytes: blob.size
    };
  } catch (error) {
    console.error('Failed to upload final PDF:', error);
    throw error;
  }
}

export async function uploadThumbnail(formId: string, imageBlob: Blob): Promise<UploadResult> {
  try {
    const path = `forms/${formId}/thumb.jpg`;

    const { error } = await supabase.storage.from('forms').upload(path, imageBlob, {
      contentType: 'image/jpeg',
      upsert: true
    });

    if (error) throw error;

    return {
      path,
      sizeBytes: imageBlob.size
    };
  } catch (error) {
    console.error('Failed to upload thumbnail:', error);
    throw error;
  }
}

export async function getSignedUrl(path: string, ttlSeconds: number = 60): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('forms')
      .createSignedUrl(path, ttlSeconds);

    if (error) throw error;
    if (!data?.signedUrl) throw new Error('No signed URL returned');

    return data.signedUrl;
  } catch (error) {
    console.error('Failed to get signed URL:', error);
    throw error;
  }
}

export async function cleanupTempFiles(formId: string): Promise<void> {
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('forms')
      .list(`forms/${formId}/tmp`);

    if (listError) throw listError;
    if (!files || files.length === 0) return;

    const filePaths = files.map(file => `forms/${formId}/tmp/${file.name}`);

    const { error: deleteError } = await supabase.storage
      .from('forms')
      .remove(filePaths);

    if (deleteError) throw deleteError;

    console.log(`✅ Cleaned up ${filePaths.length} temporary files for form ${formId}`);
  } catch (error) {
    console.error('Failed to cleanup temp files:', error);
  }
}
