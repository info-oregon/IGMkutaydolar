import { getBrowserSupabase } from './supabase';

async function resizeImageToWebP(
  file: File,
  maxWidth: number = 1280,
  quality: number = 0.7
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

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
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadPhoto(formId: string, file: File): Promise<string> {
  const supabase = getBrowserSupabase();
  const webpBlob = await resizeImageToWebP(file);
  const uuid = crypto.randomUUID();
  const path = `forms/${formId}/photos/${uuid}.webp`;

  const { error } = await supabase.storage
    .from('forms')
    .upload(path, webpBlob, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload photo: ${error.message}`);
  }

  return path;
}

export async function uploadSignature(formId: string, blob: Blob): Promise<string> {
  const supabase = getBrowserSupabase();
  const path = `forms/${formId}/signature.png`;

  const { error } = await supabase.storage
    .from('forms')
    .upload(path, blob, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload signature: ${error.message}`);
  }

  return path;
}

export async function uploadFinalPdf(formId: string, pdfBytes: Uint8Array): Promise<string> {
  const supabase = getBrowserSupabase();
  const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const path = `forms/${formId}/final.pdf`;

  const { error } = await supabase.storage
    .from('forms')
    .upload(path, blob, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }

  return path;
}

export async function getSignedUrl(path: string, ttlSeconds: number = 60): Promise<string> {
  const supabase = getBrowserSupabase();

  const { data, error } = await supabase.storage
    .from('forms')
    .createSignedUrl(path, ttlSeconds);

  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}
