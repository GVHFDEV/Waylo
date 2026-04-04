import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Atualiza a sessão do Supabase no ciclo da requisição (Middleware).
 * 
 * Esta função é responsável por interceptar a requisição, verificar se o token JWT 
 * está prestes a expirar e renová-lo através dos cookies. Ela garante que a 
 * sessão permaneça ativa enquanto o usuário navega.
 * 
 * @param request Objeto NextRequest recebido pelo middleware principal.
 * @returns NextResponse com os cookies atualizados ou o fluxo normal da requisição.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: Não use supabase.auth.getSession() aqui. Use getUser() para 
  // garantir segurança extrema validando o token no servidor do Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Regra de Redirecionamento:
  // Se o usuário NÃO estiver logado e tentar acessar rotas protegidas
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/dashboard') ||
     request.nextUrl.pathname.startsWith('/roteiros'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se o usuário ESTIVER logado e tentar acessar o login, manda pro dashboard
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
