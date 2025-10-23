import { supabase } from './supabase';

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

export async function uploadPhoto(formId: string, file: File): Promise<string> {
  try {
    const webpBlob = await resizeImageToWebP(file);
    const uuid = crypto.randomUUID();
    const path = `forms/${formId}/photos/${uuid}.webp`;

    const { error } = await supabase.storage.from('forms').upload(path, webpBlob, {
      contentType: 'image/webp',
      upsert: false
    });

    if (error) throw error;
    return path;
  } catch (error) {
    console.error('Failed to upload photo:', error);
    throw error;
  }
}

export async function uploadSignature(formId: string, blob: Blob): Promise<string> {
  try {
    const path = `forms/${formId}/signature.png`;

    const { error } = await supabase.storage.from('forms').upload(path, blob, {
      contentType: 'image/png',
      upsert: true
    });

    if (error) throw error;
    return path;
  } catch (error) {
    console.error('Failed to upload signature:', error);
    throw error;
  }
}

export async function uploadFinalPdf(formId: string, pdfBytes: Uint8Array): Promise<string> {
  try {
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const path = `forms/${formId}/final.pdf`;

    const { error } = await supabase.storage.from('forms').upload(path, blob, {
      contentType: 'application/pdf',
      upsert: true
    });

    if (error) throw error;
    return path;
  } catch (error) {
    console.error('Failed to upload final PDF:', error);
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
