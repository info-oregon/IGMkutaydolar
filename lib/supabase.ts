import { createClient } from '@supabase/supabase-js';

// Use environment variables from .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Single Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Health check function
export async function checkSupabaseConnection() {
  try {
    const { data, error, status } = await supabase
      .from('forms')
      .select('id')
      .limit(1);

    console.log('🔍 Supabase health check:', {
      status,
      error: error?.message || null,
      dataReceived: !!data,
      url: supabaseUrl
    });

    return { success: !error, error, status };
  } catch (err) {
    console.error('❌ Supabase connection check failed:', err);
    return { success: false, error: err };
  }
}

// Auth stub functions
export const auth = {
  signUp: async () => null,
  signIn: async () => null,
  signOut: async () => null,
  getUser: async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: null }, error: null })
};
