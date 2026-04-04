import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * WAYLO SUPABASE SERVER CLIENT (V3.0)
 * 
 * Factory function to create a Supabase Client for:
 * 1. Server Components
 * 2. Server Actions (can set cookies)
 * 3. Route Handlers (can set cookies)
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // NOTE: setAll may fail if called from a Server Component.
            // This is handled by the Middleware (middleware.ts) which
            // refreshes sessions and updates cookies in the request cycle.
          }
        },
      },
    }
  )
}
