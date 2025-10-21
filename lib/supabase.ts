/**
 * Supabase Client Factory
 *
 * Provides SSR-compatible client creation for browser and server environments.
 *
 * IMPORTANT:
 * - NEVER expose SERVICE_ROLE_KEY in browser code
 * - Always use ANON_KEY for client-side operations
 * - SERVICE_ROLE_KEY bypasses RLS - use only server-side when needed
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Browser Supabase Client
 *
 * Uses anonymous key - safe for client-side use
 * Respects RLS policies
 */
let browserClient: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserSupabase() can only be called in browser environment');
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserClient;
}

/**
 * Server Supabase Client (Future Implementation)
 *
 * For server-side rendering and API routes
 * Can use SERVICE_ROLE_KEY when needed (bypasses RLS)
 *
 * @param cookies - Next.js cookies for session management
 * @param useServiceRole - Whether to use service role (bypasses RLS)
 */
export function getServerSupabase(
  cookies?: any,
  useServiceRole: boolean = false
): SupabaseClient {
  // For now, return client with anon key
  // TODO: Implement proper SSR with @supabase/ssr when needed

  if (useServiceRole) {
    console.warn('⚠️ SERVICE_ROLE not implemented yet - using anon key');
  }

  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Legacy export for backward compatibility
 *
 * @deprecated Use getBrowserSupabase() instead
 */
export const supabase = typeof window !== 'undefined'
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createClient(supabaseUrl!, supabaseAnonKey!);

/**
 * Health Check: Verify Supabase connection and table access
 */
export async function checkSupabaseHealth(): Promise<{
  success: boolean;
  companies: { success: boolean; error?: string; count?: number };
  forms: { success: boolean; error?: string; count?: number };
  errors: string[];
}> {
  const errors: string[] = [];
  const client = typeof window !== 'undefined' ? getBrowserSupabase() : supabase;

  console.log('🔍 Running Supabase health check...');
  console.log('   URL:', supabaseUrl);

  // Check companies table
  let companiesResult = { success: false, error: undefined as string | undefined, count: undefined as number | undefined };
  try {
    const { data, error, count } = await client
      .from('companies')
      .select('id, name', { count: 'exact', head: false })
      .limit(1);

    if (error) {
      companiesResult.error = error.message;
      errors.push(`Companies: ${error.message}`);
      console.error('❌ Companies table error:', error.message);
    } else {
      companiesResult.success = true;
      companiesResult.count = count ?? 0;
      console.log('✅ Companies table accessible:', count ?? 0, 'records');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    companiesResult.error = message;
    errors.push(`Companies: ${message}`);
    console.error('❌ Companies table exception:', message);
  }

  // Check forms table
  let formsResult = { success: false, error: undefined as string | undefined, count: undefined as number | undefined };
  try {
    const { data, error, count } = await client
      .from('forms')
      .select('id', { count: 'exact', head: false })
      .limit(1);

    if (error) {
      formsResult.error = error.message;
      errors.push(`Forms: ${error.message}`);
      console.error('❌ Forms table error:', error.message);
    } else {
      formsResult.success = true;
      formsResult.count = count ?? 0;
      console.log('✅ Forms table accessible:', count ?? 0, 'records');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    formsResult.error = message;
    errors.push(`Forms: ${message}`);
    console.error('❌ Forms table exception:', message);
  }

  const overallSuccess = companiesResult.success && formsResult.success;

  console.log(
    overallSuccess
      ? '✅ Health check PASSED'
      : '⚠️ Health check FAILED with errors'
  );

  return {
    success: overallSuccess,
    companies: companiesResult,
    forms: formsResult,
    errors,
  };
}

/**
 * Legacy health check function
 * @deprecated Use checkSupabaseHealth() instead
 */
export async function checkSupabaseConnection() {
  const result = await checkSupabaseHealth();
  return {
    success: result.success,
    error: result.errors.length > 0 ? result.errors.join('; ') : null
  };
}

// Auth stub functions (for backward compatibility)
export const auth = {
  signUp: async () => null,
  signIn: async () => null,
  signOut: async () => null,
  getUser: async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: null }, error: null })
};
