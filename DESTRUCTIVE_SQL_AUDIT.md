# Destructive SQL Operations Audit

**Date:** 2025-10-21
**Purpose:** Identify and document all destructive SQL operations to prevent data loss

---

## Critical Finding: DROP TABLE in Migration

### Location
**File:** `/supabase/migrations/20250925110433_crystal_spark.sql`
**Line:** 54

```sql
-- Drop existing forms table if exists and recreate with new structure
DROP TABLE IF EXISTS forms;
```

### Risk Level: 🔴 CRITICAL

### Impact
- **Complete data loss** of all forms if this migration runs again
- No backup or data preservation
- Irreversible operation

### Why This Exists
This was an early migration file (from 2025-09-25) that was meant to initialize the schema during development. It was safe at that time because no production data existed.

### Status
⚠️ **DANGEROUS** - This migration should NEVER run again in production

---

## Mitigation Strategies

### 1. Migration Safety (Implemented)
All subsequent migrations use safe patterns:
- `CREATE TABLE IF NOT EXISTS` instead of `DROP TABLE`
- `DROP POLICY IF EXISTS` before recreating policies
- `DO $$ BEGIN ... IF NOT EXISTS ... END $$;` blocks
- No `TRUNCATE TABLE` commands

### 2. Database Permissions
Current state:
- ✅ RLS is enabled on all tables
- ✅ Anon key has limited permissions
- ⚠️ Service role key can still run destructive operations

**Recommendation:**
- Service role key should only be used server-side
- Never expose service role key in client code
- Add additional safety checks in server endpoints

### 3. Safe Migration Patterns

**NEVER use:**
```sql
DROP TABLE forms;
TRUNCATE TABLE forms;
DELETE FROM forms; -- without WHERE clause
```

**ALWAYS use:**
```sql
-- Creating tables
CREATE TABLE IF NOT EXISTS forms (...);

-- Modifying columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forms' AND column_name = 'new_column'
  ) THEN
    ALTER TABLE forms ADD COLUMN new_column text;
  END IF;
END $$;

-- Dropping columns (with data preservation)
-- 1. Create new column
-- 2. Copy data
-- 3. Drop old column (only after verification)

-- Policies
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name ...;
```

---

## Safe Delete Operations in Code

### Current Implementation
All form deletions in the app go through:
- `EnhancedFormStorageManager.deleteForm()`
- Has permission checks
- RLS policies restrict deletes to draft forms only

### Code Patterns Found

✅ **SAFE - Single record deletion with permission checks:**
```typescript
await supabase
  .from('forms')
  .delete()
  .eq('id', formId);
```

❌ **UNSAFE - Would delete all records (NONE FOUND):**
```typescript
await supabase
  .from('forms')
  .delete(); // No .eq() filter
```

---

## Migration History Review

### Safe Migrations
1. ✅ `20250924130827_winter_fountain.sql` - Creates tables safely
2. ⚠️ `20250925110433_crystal_spark.sql` - **HAS DROP TABLE** (line 54)
3. ✅ `20250925113728_restless_glade.sql` - Safe operations
4. ✅ `20250925122307_dawn_cottage.sql` - Safe operations
5. ✅ `20251020101103_setup_inspection_tables_with_custom_status.sql` - Safe operations
6. ✅ `20251021082053_fix_insecure_rls_policies.sql` - Safe operations
7. ✅ `fix_insecure_rls_policies.sql` - Safe operations
8. ✅ `lock_completed_forms.sql` - Safe operations

### Action Items
- [ ] **Never re-run** `20250925110433_crystal_spark.sql` in production
- [ ] Add migration execution logs to track what has been applied
- [ ] Implement backup strategy before any schema changes
- [ ] Add pre-migration validation checks

---

## CI/CD Recommendations

### Pre-Production Checklist
1. Review all migrations for destructive operations
2. Backup database before applying migrations
3. Test migrations in staging environment
4. Use transactions where possible
5. Have rollback plan ready

### Production Safety Rules
1. ✅ Never use `DROP TABLE` in production migrations
2. ✅ Never use `TRUNCATE` in production migrations
3. ✅ Always use `IF EXISTS` / `IF NOT EXISTS`
4. ✅ Always add data preservation steps when modifying columns
5. ✅ Test all migrations in staging first
6. ✅ Keep backups for at least 30 days

---

## Monitoring

### Recommended Alerts
1. Alert on any migration containing `DROP TABLE`
2. Alert on any migration containing `TRUNCATE`
3. Alert on any migration containing `DELETE FROM` without WHERE
4. Alert on service role key usage in client code

### Logging
- Log all migration executions with timestamp
- Log all schema changes
- Log all data deletion operations
- Keep audit trail for compliance

---

## Conclusion

✅ **Current Status:** Safe
- Only one historical migration has destructive SQL (already applied)
- All new migrations follow safe patterns
- RLS policies restrict destructive operations
- Application code has proper permission checks

⚠️ **Recommendations:**
1. Archive the problematic migration with clear warning
2. Implement pre-migration safety checks
3. Add database backup automation
4. Create migration review checklist
5. Add monitoring for destructive operations

---

**Last Updated:** 2025-10-21
**Audited By:** System Audit
**Next Review:** Before next production deployment
