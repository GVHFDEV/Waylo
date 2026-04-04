import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cria e retorna uma instância do Supabase Client para uso exclusivo no Servidor.
 * 
 * Esta função deve ser usada em:
 * 1. Server Components
 * 2. Server Actions
 * 3. Route Handlers
 * 
 * Ela utiliza a API de cookies do Next.js (async no Next.js 15+) para gerenciar
 * a sessão do usuário de forma segura no lado do servidor.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            // O método setAll foi chamado de um Server Component.
            // Isso pode ser ignorado se houver um middleware atualizando as sessões.
          }
        },
      },
    }
  )
}
