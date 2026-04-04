import { createBrowserClient } from '@supabase/ssr'

/**
 * WAYLO SUPABASE BROWSER CLIENT (V3.0)
 * 
 * Factory function to create a singleton-like instance of the Supabase Client
 * for Client Components ('use client').
 * 
 * SECURITY: Environment variables starting with NEXT_PUBLIC_ are intentionally
 * safe to expose to the client bundle.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
