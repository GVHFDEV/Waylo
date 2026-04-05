'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Globe, ArrowRight, Loader2, Check, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

const COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Deutschland', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'JP', name: '日本', flag: '🇯🇵' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selectedCountry, setSelectedCountry] = useState('')
  const [isPending, setIsPending] = useState(false)
  const supabase = createClient()

  const handleFinish = async () => {
    if (!selectedCountry) return
    setIsPending(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Explorer',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        country: selectedCountry
      })

    if (error) {
      console.error('ERRO AO SALVAR PERFIL:', error)
      setIsPending(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FAFAF8]">
      {/* Branding — idêntico ao login */}
      <div className="mb-8 flex flex-col items-center space-y-2">
        <Image src="/logo.svg" alt="Waylo" width={137} height={45} priority style={{ height: '45px', width: 'auto' }} />
        <p className="text-muted-foreground font-sans text-sm tracking-wide">Sua jornada começa aqui.</p>
      </div>

      {/* Card — mesma estrutura do login */}
      <Card className="w-full max-w-md border-border bg-card shadow-lg rounded-2xl">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-heading font-bold">
            Onde você mora?
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Isso define o idioma e as sugestões personalizadas.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Grid de Países */}
          <div className="grid grid-cols-2 gap-2.5">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all text-left group",
                  selectedCountry === c.code
                    ? "border-[#E8833A] bg-[#E8833A]/5"
                    : "border-input hover:border-[#E8833A]/30 bg-transparent"
                )}
              >
                <span className="text-xl shrink-0">{c.flag}</span>
                <span className={cn(
                  "text-sm font-medium truncate",
                  selectedCountry === c.code ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}>{c.name}</span>
                {selectedCountry === c.code && (
                  <Check className="h-3.5 w-3.5 text-[#E8833A] ml-auto shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Botão — idêntico ao login */}
          <Button
            className="w-full font-bold h-12 text-base rounded-xl bg-[#E8833A] hover:bg-[#D16D29] text-white shadow-lg shadow-[#E8833A]/20 transition-all hover:scale-[1.01]"
            disabled={!selectedCountry || isPending}
            onClick={handleFinish}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <footer className="mt-8 text-xs text-muted-foreground opacity-50">© {new Date().getFullYear()} Waylo Travel AI.</footer>
    </div>
  )
}
