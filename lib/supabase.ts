import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getBrowserSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function getServerSupabase(cookies: any) {
  return createServerClient(supabaseUrl, supabaseAnonKey, { cookies });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const auth = {
  signUp: async () => null,
  signIn: async () => null,
  signOut: async () => null,
  getUser: async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: null }, error: null })
};
