import { createBrowserClient } from '@supabase/ssr'

/**
 * Cria e retorna uma instância singleton do Supabase Client para uso no browser.
 *
 * Use esta função em Client Components ('use client') para interagir com o
 * Supabase diretamente no navegador. Para Server Components, Server Actions e
 * Route Handlers, use o `createServerClient` (a ser criado em server.ts).
 *
 * As variáveis de ambiente NEXT_PUBLIC_* são expostas ao bundle do cliente
 * intencionalmente — elas são credenciais públicas e seguras para uso no browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
