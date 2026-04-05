import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Route Handler para processar OAuth callback e e-mail confirmation (PKCE flow).
 * 
 * [MISSION 2.1] Fluxo:
 *   1. Troca o code por sessão.
 *   2. Verifica se o perfil já existe em `profiles`.
 *   3. Se for novo, cria o perfil com dados do Google (avatar, nome, locale→country).
 *   4. Se o perfil não tem country, redireciona para /onboarding.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Verificar se profile já existe
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, country')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Novo usuário — extrair dados do Google metadata
          const meta = user.user_metadata || {}
          
          // Auto-detect: Tentar mapear locale do Google para código de país
          // Google retorna locale como "pt-BR", "en-US", "es", "fr", etc.
          let autoCountry = ''
          const locale = meta.locale || meta.language || ''
          if (locale) {
            const parts = locale.split('-')
            if (parts.length > 1) {
              autoCountry = parts[1].toUpperCase() // "pt-BR" → "BR"
            }
          }

          await supabase.from('profiles').upsert({
            id: user.id,
            full_name: meta.full_name || meta.name || '',
            avatar_url: meta.avatar_url || meta.picture || '',
            country: autoCountry || null, // null se não conseguiu detectar
          })

          // Se não temos país, mandar para onboarding para ele confirmar
          if (!autoCountry) {
            return NextResponse.redirect(`${origin}/onboarding`)
          }
        } else if (!profile.country) {
          // Profile existe mas sem país → onboarding
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
