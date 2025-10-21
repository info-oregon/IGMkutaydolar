import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://zkkbandockklkohihplp.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpra2JhbmRvY2trbGtvaGlocGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDYwMTYsImV4cCI6MjA3NDI4MjAxNn0.bFCFKAOw7YKq7PPouLKBs_fe6bZyGARthYFp4xaQzWA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth fonksiyonlarını şimdilik boş stub yapabilirsin
export const auth = {
  signUp: async () => null,
  signIn: async () => null,
  signOut: async () => null,
  getUser: async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: null }, error: null })
};
