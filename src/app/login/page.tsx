'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2, Mail, Lock, ArrowRight, MailCheck, User, Globe, ChevronDown, Check } from 'lucide-react'

import { authSchema, type AuthFormValues } from '@/lib/schemas/auth'
import { createClient } from '@/lib/supabase/client'
import { getLanguageByCountry, getI18n } from '@/lib/i18n'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════════════════ */
/*  CONSTANTES                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════════ */
/*  COMPONENTE: CountrySelector                                       */
/* ═══════════════════════════════════════════════════════════════════ */

function CountrySelector({ 
  value, 
  onChange 
}: { 
  value: string
  onChange: (code: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selected = COUNTRIES.find(c => c.code === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-11 px-3 flex items-center justify-between rounded-md border bg-transparent text-sm font-medium transition-all",
          "border-input hover:border-[#E8833A]/40 focus:outline-none focus:ring-2 focus:ring-[#E8833A]/20 focus:border-[#E8833A]",
          !value && "text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="text-base">{selected.flag}</span>
              <span className="text-foreground">{selected.name}</span>
            </span>
          ) : (
            <span>Selecione seu país</span>
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => { onChange(c.code); setIsOpen(false) }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted/60 transition-colors",
                value === c.code && "bg-[#E8833A]/5 text-[#E8833A]"
              )}
            >
              <span className="text-lg">{c.flag}</span>
              <span className="flex-1 text-left">{c.name}</span>
              {value === c.code && <Check className="h-4 w-4 text-[#E8833A]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  PÁGINA PRINCIPAL                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

export default function LoginPage() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [isGooglePending, setIsGooglePending] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState('BR')

  const supabase = createClient()
  const t = useMemo(() => getI18n(getLanguageByCountry(selectedCountry)), [selectedCountry])

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  })

  /* ─── TRADUTOR DE ERROS DINÂMICO ─── */
  const translateError = (message: string) => {
    const lower = message.toLowerCase()
    
    // Rate limit
    if (lower.includes('rate') || lower.includes('limit') || lower.includes('too many') || lower.includes('seconds')) {
      return t.login.errors.rate_limit
    }
    
    // Já registrado
    if (lower.includes('already registered') || lower.includes('already been registered')) {
      return t.login.errors.already_registered
    }
    
    // Credenciais inválidas
    if (lower.includes('invalid') && lower.includes('credentials')) {
      return t.login.errors.invalid_credentials
    }
    
    // E-mail não confirmado
    if (lower.includes('not confirmed') || lower.includes('verify')) {
      return t.login.errors.email_not_confirmed
    }

    // Fallback
    return t.login.errors.generic
  }

  /* ─── Google OAuth ─── */
  const handleGoogleLogin = async () => {
    setIsGooglePending(true)
    setError(null)

    localStorage.setItem('waylo_selected_country', selectedCountry)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) {
      setError(translateError(error.message))
      setIsGooglePending(false)
    }
  }

  /* ─── E-mail / Senha ─── */
  async function onSubmit(values: AuthFormValues) {
    setIsPending(true)
    setError(null)
    try {
      if (isRegistering) {
        localStorage.setItem('waylo_selected_country', selectedCountry)

        const { error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { 
              full_name: values.fullName,
              country: selectedCountry,
            },
          },
        })
        if (signUpError) throw signUpError
        setIsVerificationSent(true)
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })
        if (signInError) throw signInError
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(translateError(err.message))
    } finally {
      setIsPending(false)
    }
  }

  /* ─── TELA: Verificação de E-mail ─── */
  if (isVerificationSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FAFAF8]">
        <Image src="/logo.svg" alt="Waylo" width={137} height={45} priority className="mb-8" style={{ height: '45px', width: 'auto' }} />
        <Card className="w-full max-w-md border-border bg-card shadow-lg animate-in fade-in zoom-in duration-300 rounded-2xl">
          <CardHeader className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-[#E8833A]/10 flex items-center justify-center">
              <MailCheck className="h-8 w-8 text-[#E8833A]" />
            </div>
            <CardTitle className="text-2xl font-heading font-bold">{t.login.verify_title}</CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              {t.login.verify_desc}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-8">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => { setIsVerificationSent(false); setIsRegistering(false); form.reset() }}>
              {t.login.verify_back}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ─── TELA: Login / Cadastro ─── */
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FAFAF8]">
      {/* Branding */}
      <div className="mb-8 flex flex-col items-center space-y-2">
        <Image src="/logo.svg" alt="Waylo" width={137} height={45} priority style={{ height: '45px', width: 'auto' }} />
        <p className="text-muted-foreground font-sans text-sm tracking-wide">{t.footer.tagline}</p>
      </div>

      <Card className="w-full max-w-md border-border bg-card shadow-lg rounded-2xl">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-heading font-bold">
            {isRegistering ? t.login.title_register : t.login.title_login}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isRegistering ? t.login.desc_register : t.login.desc_login}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ─── SELETOR DE PAÍS ─── */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">{t.login.country_label}</label>
            <CountrySelector value={selectedCountry} onChange={setSelectedCountry} />
          </div>

          {/* ─── GOOGLE OAUTH ─── */}
          <Button 
            variant="outline" 
            className="w-full h-12 font-bold flex items-center justify-center gap-3 border-2 rounded-xl hover:bg-slate-50/80 transition-all hover:border-[#E8833A]/30"
            onClick={handleGoogleLogin}
            disabled={isGooglePending || isPending}
          >
            {isGooglePending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5  shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t.login.google}
              </>
            )}
          </Button>

          {/* ─── DIVISOR ─── */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><Separator /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground uppercase tracking-widest font-bold text-[10px]">{t.login.or_email}</span>
            </div>
          </div>

          {/* ─── FORMULÁRIO ─── */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-xl border border-destructive/20 animate-in fade-in">
                  {error}
                </div>
              )}

              {isRegistering && (
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.login.name}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t.login.name_placeholder} className="pl-9 h-11 rounded-xl" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.login.email}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder={t.login.email_placeholder} className="pl-9 h-11 rounded-xl" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.login.password}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••" className="pl-9 h-11 rounded-xl" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button 
                type="submit" 
                className="w-full font-bold h-12 text-base rounded-xl bg-[#E8833A] hover:bg-[#D16D29] text-white shadow-lg shadow-[#E8833A]/20 transition-all hover:scale-[1.01]" 
                disabled={isPending || isGooglePending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isRegistering ? t.login.submit_register : t.login.submit_login}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-0">
          <div className="text-sm text-center text-muted-foreground">
            {isRegistering ? (
              <>{t.login.toggle_to_login} <button type="button" onClick={() => setIsRegistering(false)} className="font-semibold text-[#E8833A] hover:underline underline-offset-4">{t.login.toggle_login_link}</button></>
            ) : (
              <>{t.login.toggle_to_register} <button type="button" onClick={() => setIsRegistering(true)} className="font-semibold text-[#E8833A] hover:underline underline-offset-4">{t.login.toggle_register_link}</button></>
            )}
          </div>
        </CardFooter>
      </Card>

      <footer className="mt-8 text-xs text-muted-foreground opacity-50">© {new Date().getFullYear()} Waylo Travel AI.</footer>
    </div>
  )
}
