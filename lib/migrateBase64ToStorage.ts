/**
 * Migration Script: Move Base64 Images to Storage
 *
 * This script migrates base64-encoded images from the form_data JSONB
 * to Supabase Storage, replacing them with storage paths.
 *
 * Benefits:
 * - Reduces database size dramatically
 * - Reduces egress costs
 * - Faster query performance
 * - Better scalability
 */

import { supabase } from './supabase';
import { uploadPhoto, uploadSignature } from './storage';

interface MigrationStats {
  formsProcessed: number;
  photosUploaded: number;
  signaturesUploaded: number;
  errors: string[];
  bytesFreed: number;
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Convert base64 string to File
 */
function base64ToFile(base64: string, filename: string): File {
  const blob = base64ToBlob(base64);
  return new File([blob], filename, { type: blob.type });
}

/**
 * Check if string is base64 encoded
 */
function isBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:image/') || str.startsWith('data:application/pdf');
}

/**
 * Migrate a single form's images to storage
 */
async function migrateFormImages(formId: string, formData: any): Promise<{
  photoPaths: string[];
  signaturePath: string | null;
  bytesFreed: number;
}> {
  const photoPaths: string[] = [];
  let signaturePath: string | null = null;
  let bytesFreed = 0;

  // Migrate photos (fotoListesi)
  if (formData.fotoListesi && Array.isArray(formData.fotoListesi)) {
    console.log(`  📸 Migrating ${formData.fotoListesi.length} photos...`);

    for (let i = 0; i < formData.fotoListesi.length; i++) {
      const photo = formData.fotoListesi[i];

      if (isBase64(photo)) {
        try {
          // Calculate original size
          const originalSize = photo.length * 0.75; // Approximate base64 to binary size
          bytesFreed += originalSize;

          // Convert to file and upload
          const file = base64ToFile(photo, `photo-${i}.jpg`);
          const path = await uploadPhoto(formId, file);
          photoPaths.push(path);

          console.log(`    ✅ Photo ${i + 1} uploaded: ${path}`);
        } catch (error) {
          console.error(`    ❌ Failed to upload photo ${i + 1}:`, error);
          // Keep original base64 if upload fails
          photoPaths.push(photo);
        }
      } else {
        // Already a path or URL, keep as is
        photoPaths.push(photo);
      }
    }
  }

  // Migrate signature
  const signatureFields = [
    'kontrolEdenImza',
    'signature',
    ...((formData.soforler || []).map((_: any, i: number) => `soforler.${i}.imza`))
  ];

  for (const field of signatureFields) {
    const parts = field.split('.');
    let value = formData;

    // Navigate nested structure
    for (const part of parts) {
      if (!value) break;
      value = isNaN(Number(part)) ? value[part] : value[Number(part)];
    }

    if (value && isBase64(value)) {
      try {
        // Calculate original size
        const originalSize = value.length * 0.75;
        bytesFreed += originalSize;

        // Convert to blob and upload
        const blob = base64ToBlob(value);
        const path = await uploadSignature(formId, blob);
        signaturePath = path;

        console.log(`    ✅ Signature uploaded: ${path}`);
        break; // Only upload first found signature
      } catch (error) {
        console.error(`    ❌ Failed to upload signature:`, error);
      }
    }
  }

  return { photoPaths, signaturePath, bytesFreed };
}

/**
 * Migrate forms from base64 to storage
 *
 * @param dryRun - If true, only simulate without making changes
 * @param limit - Maximum number of forms to process (default: 10)
 */
export async function migrateBase64ToStorage(
  dryRun: boolean = true,
  limit: number = 10
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    formsProcessed: 0,
    photosUploaded: 0,
    signaturesUploaded: 0,
    errors: [],
    bytesFreed: 0
  };

  try {
    console.log('🔄 Starting base64 to storage migration...');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Limit: ${limit} forms\n`);

    // Fetch forms with potential base64 data
    const { data: forms, error } = await supabase
      .from('forms')
      .select('id, form_data')
      .limit(limit);

    if (error) {
      throw error;
    }

    if (!forms || forms.length === 0) {
      console.log('ℹ️ No forms found to migrate');
      return stats;
    }

    console.log(`📋 Found ${forms.length} forms to process\n`);

    // Process each form
    for (const form of forms) {
      try {
        console.log(`\n🔍 Processing form: ${form.id}`);

        const { photoPaths, signaturePath, bytesFreed } = await migrateFormImages(
          form.id,
          form.form_data
        );

        stats.formsProcessed++;
        stats.photosUploaded += photoPaths.filter(p => !isBase64(p)).length;
        if (signaturePath) stats.signaturesUploaded++;
        stats.bytesFreed += bytesFreed;

        // Update database if not dry run
        if (!dryRun && (photoPaths.length > 0 || signaturePath)) {
          const updatedFormData = {
            ...form.form_data,
            fotoListesi: photoPaths,
            kontrolEdenImza: signaturePath || form.form_data.kontrolEdenImza
          };

          const { error: updateError } = await supabase
            .from('forms')
            .update({ form_data: updatedFormData })
            .eq('id', form.id);

          if (updateError) {
            throw updateError;
          }

          console.log('  ✅ Database updated');
        } else if (dryRun) {
          console.log('  ℹ️ Dry run - no database changes');
        }

      } catch (error) {
        const errorMsg = `Failed to process form ${form.id}: ${error}`;
        console.error(`  ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Forms processed: ${stats.formsProcessed}`);
    console.log(`Photos uploaded: ${stats.photosUploaded}`);
    console.log(`Signatures uploaded: ${stats.signaturesUploaded}`);
    console.log(`Storage freed: ${(stats.bytesFreed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    stats.errors.push(`Migration failed: ${error}`);
  }

  return stats;
}

/**
 * Run migration from browser console
 *
 * Usage:
 *   // Dry run (no changes)
 *   import { runMigrationFromConsole } from './lib/migrateBase64ToStorage';
 *   runMigrationFromConsole(true, 10);
 *
 *   // Live run (makes changes)
 *   runMigrationFromConsole(false, 100);
 */
export async function runMigrationFromConsole(dryRun = true, limit = 10) {
  console.log('🚀 Running migration from console...\n');
  const stats = await migrateBase64ToStorage(dryRun, limit);

  if (dryRun) {
    console.log('\n⚠️ This was a DRY RUN. No changes were made.');
    console.log('To apply changes, run: runMigrationFromConsole(false, limit)');
  } else {
    console.log('\n✅ Migration completed with real changes.');
  }

  return stats;
}
