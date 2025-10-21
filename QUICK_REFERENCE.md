# Quick Reference Guide

**Last Updated:** 2025-10-21

---

## 🚀 Quick Start

### Run the Application
```bash
npm run dev      # Development mode
npm run build    # Production build
npm run start    # Production server
```

### Access Monitoring Tools
Open browser console and type:
```javascript
monitoring.printEgressReport()  // View query statistics
monitoring.getRecentLogs()      // See recent queries
```

---

## 📁 Key Files

### Storage & Uploads
- **`lib/storage.ts`** - All file upload functions
  - `uploadPhoto()` - WebP compression
  - `uploadSignature()` - Signature images
  - `uploadFinalPdf()` - Final PDF storage
  - `getSignedUrl()` - Temporary file access

### Database Operations
- **`lib/enhancedFormStorage.ts`** - Form CRUD operations
- **`lib/supabase.ts`** - Supabase client & health check

### Monitoring
- **`lib/monitoring.ts`** - Query logging & performance tracking

### Migration
- **`lib/migrateBase64ToStorage.ts`** - Convert base64 to storage files

---

## 🔧 Common Operations

### Upload a Photo
```typescript
import { uploadPhoto } from './lib/storage';

const path = await uploadPhoto(formId, imageFile);
// Returns: "forms/abc-123/photos/uuid.webp"
```

### Get Signed URL for Viewing
```typescript
import { getSignedUrl } from './lib/storage';

const url = await getSignedUrl(path, 300); // 5 minutes
window.open(url, '_blank');
```

### Query with Monitoring
```typescript
import { monitorQuery } from './lib/monitoring';

const result = await monitorQuery(
  'getForms',
  'forms',
  ['id', 'status', 'created_at'],
  async () => {
    return await supabase
      .from('forms')
      .select('id, status, created_at');
  }
);
```

### Migrate Base64 Data
```typescript
import { runMigrationFromConsole } from './lib/migrateBase64ToStorage';

// Dry run (safe, no changes)
await runMigrationFromConsole(true, 10);

// Live run (makes changes)
await runMigrationFromConsole(false, 100);
```

---

## 🔒 Form Status & Locking

### Status Values
- **`draft`** - Editable by anyone
- **`submitted`** - Locked, read-only

### Custom Status (Optional)
- `completed` - Fully completed
- `sahada` - In field
- `sahadan_cikis` - Leaving field

### RLS Enforcement
```sql
-- Only draft forms can be edited
UPDATE forms SET ... WHERE id = ? AND status = 'draft'

-- Only draft forms can be deleted
DELETE FROM forms WHERE id = ? AND status = 'draft'
```

---

## 📊 Database Schema

### Forms Table
```sql
CREATE TABLE forms (
  id uuid PRIMARY KEY,
  status text NOT NULL,           -- 'draft' or 'submitted'
  custom_status text,              -- Extended statuses
  form_data jsonb NOT NULL,        -- All form fields
  pdf_url text,                    -- Storage path (not full URL)
  company_id uuid,
  inspector_id uuid,
  created_at timestamptz,
  updated_at timestamptz
);
```

### Storage Paths
```
inspection-pdfs/
  forms/
    {form-id}/
      photos/
        {uuid}.webp
      signature.png
      final.pdf
```

---

## 🎯 Optimization Tips

### Query Best Practices
✅ **DO:**
```typescript
.select('id, status, created_at')  // Explicit columns
.limit(50)                          // Pagination
.eq('status', 'draft')              // Filtering
```

❌ **DON'T:**
```typescript
.select('*')                        // All columns
// No limit on large tables
// No filtering
```

### Image Upload Best Practices
✅ **DO:**
```typescript
// Use storage helper (auto-compression)
await uploadPhoto(formId, file);
```

❌ **DON'T:**
```typescript
// Store base64 in database
form_data.photos = [base64String];
```

---

## 🔍 Debugging

### Check Supabase Connection
```typescript
import { checkSupabaseConnection } from './lib/supabase';

const result = await checkSupabaseConnection();
console.log(result);
// { success: true/false, error: ..., status: ... }
```

### View Query Logs
```javascript
// In browser console
monitoring.getRecentLogs(20)
```

### Check Egress Usage
```javascript
// In browser console
monitoring.printEgressReport()
```

### User-Friendly Error Messages
```typescript
import { getUserFriendlyError } from './lib/monitoring';

try {
  // ... operation
} catch (error) {
  const message = getUserFriendlyError(error);
  alert(message); // Turkish error message
}
```

---

## 🛡️ Security Checklist

### RLS Policies
- ✅ Forms table has RLS enabled
- ✅ Draft forms are editable
- ✅ Submitted forms are locked
- ✅ Storage bucket has policies

### File Access
- ✅ Use signed URLs (expire in 5 minutes)
- ✅ Never expose storage bucket directly
- ✅ Files organized by form ID

### Environment Variables
- ✅ Never commit `.env` to git
- ✅ Use `NEXT_PUBLIC_` prefix for client-side vars
- ✅ Keep service role key server-side only

---

## 📝 Migrations

### Apply a Migration
```bash
# Migrations are auto-applied via Supabase CLI
# Or use the Supabase dashboard
```

### Safe Migration Pattern
```sql
-- Always use IF EXISTS / IF NOT EXISTS
CREATE TABLE IF NOT EXISTS new_table (...);

-- Use DO blocks for conditional logic
DO $$
BEGIN
  IF NOT EXISTS (...) THEN
    ALTER TABLE ... ADD COLUMN ...;
  END IF;
END $$;
```

### Recent Migrations
1. `fix_insecure_rls_policies.sql` - Separated policies
2. `lock_completed_forms.sql` - Lock submitted forms

---

## 🐛 Common Issues

### "Form not found"
- Check if form ID is correct
- Verify RLS policies allow access
- Check if form was deleted

### "Permission denied"
- Trying to edit submitted form? → Status is locked
- Check RLS policies
- Verify user authentication

### "File upload failed"
- Check storage bucket exists
- Verify storage policies
- Check file size limits
- Ensure proper permissions

### "PDF won't open"
- Signed URL may have expired (5 min TTL)
- Generate new signed URL
- Check if file exists in storage

---

## 📚 Documentation

### Full Documentation
1. **SUPABASE_DIAGNOSIS.md** - Database diagnosis & fixes
2. **DESTRUCTIVE_SQL_AUDIT.md** - SQL safety audit
3. **IMPLEMENTATION_SUMMARY.md** - Complete implementation details
4. **QUICK_REFERENCE.md** - This file

### Code Comments
- All functions have JSDoc comments
- Migration files have detailed headers
- Critical sections have inline comments

---

## 🔗 Useful Links

### Supabase
- Dashboard: `https://supabase.com/dashboard`
- Storage: Dashboard → Storage → inspection-pdfs
- Database: Dashboard → Table Editor → forms

### Monitoring
- Open browser console
- Type `window.monitoring` for tools

---

## 💡 Tips & Tricks

### Performance
1. Use explicit column selection
2. Add pagination with `.limit()`
3. Use filters to reduce data transfer
4. Compress images before upload

### Development
1. Use dry-run mode for migrations
2. Check query logs in console
3. Monitor egress regularly
4. Test with small datasets first

### Production
1. Enable daily backups
2. Set up monitoring alerts
3. Review query performance weekly
4. Keep migrations documented

---

**Need Help?**
- Check the browser console for detailed logs
- Review error messages (converted to Turkish)
- Use monitoring tools to debug queries
- Refer to full documentation files

**Status:** ✅ All systems operational
