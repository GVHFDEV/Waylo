import { NextResponse } from 'next/server'
// O createClient de servidor é necessário para realizar a troca do código pela sessão
import { createClient } from '@/lib/supabase/server'

/**
 * Route Handler para processar a confirmação de e-mail (PKCE flow).
 * 
 * Quando o usuário clica no link de confirmação no e-mail, o Supabase envia um 
 * 'code' para esta rota. Trocamos esse código por uma sessão e redirecionamos.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // 'next' define para onde o usuário deve ir após o login (padrão: dashboard)
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirecionamento seguro para a URL de destino
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Em caso de erro (código inválido ou expirado), redireciona para login com erro
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
