'use client'
export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2, Mail, Lock, ArrowRight, MailCheck, User } from 'lucide-react'

import { authSchema, type AuthFormValues } from '@/lib/schemas/auth'
import { createClient } from '@/lib/supabase/client'

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

/**
 * Mapeamento de erros do Supabase Auth para mensagens amigáveis em Português.
 */
const authErrorMap: Record<string, string> = {
  'User already registered': 'Este e-mail já está cadastrado no Waylo.',
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Por favor, confirme seu e-mail antes de entrar.',
  'Too many requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
  'auth_callback_error': 'Houve um problema ao confirmar seu e-mail. Tente novamente.',
}

function translateError(message: string) {
  return authErrorMap[message] || 'Ocorreu um erro inesperado. Tente novamente.'
}

/**
 * Página de Autenticação (Login & Cadastro) Refatorada.
 * 
 * Agora com suporte a Logo SVG, fluxo de verificação de e-mail integrado 
 * e tratamento de erros localizado.
 */
export default function LoginPage() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: AuthFormValues) {
    setIsPending(true)
    setError(null)

    try {
      if (isRegistering) {
        // Fluxo de Cadastro
        const { error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: values.fullName,
            },
          },
        })
        if (signUpError) throw signUpError

        // Em vez de alert, usamos o estado de sucesso
        setIsVerificationSent(true)
      } else {
        // Fluxo de Login
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

  // --- INTERFACE DE SUCESSO (VERIFICAÇÃO) ---
  if (isVerificationSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <div className="mb-8">
          <Image
            src="/logo.svg"
            alt="Waylo"
            width={137}
            height={45}
            priority
            style={{ height: '45px', width: 'auto' }}
          />
        </div>

        <Card className="w-full max-w-md border-border bg-card shadow-lg animate-in fade-in zoom-in duration-300">
          <CardHeader className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-heading font-bold text-foreground">
              Verifique seu e-mail
            </CardTitle>
            <CardDescription className="text-muted-foreground font-sans text-base">
              Enviamos um link de confirmação para o endereço informado.
              Por favor, clique no link para ativar sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-8">
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setIsVerificationSent(false)
                setIsRegistering(false)
                form.reset()
              }}
            >
              Voltar para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- INTERFACE DE LOGIN / CADASTRO ---
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      {/* Branding / Logo Substituída */}
      <div className="mb-8 flex flex-col items-center space-y-2">
        <Image
          src="/logo.svg"
          alt="Waylo"
          width={137}
          height={45}
          priority
          style={{ height: '45px', width: 'auto' }}
        />
        <p className="text-muted-foreground font-sans text-sm tracking-wide">
          Sua jornada começa aqui.
        </p>
      </div>

      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-heading font-bold text-foreground">
            {isRegistering ? 'Criar uma conta' : 'Acessar sua conta'}
          </CardTitle>
          <CardDescription className="text-muted-foreground font-sans">
            {isRegistering
              ? 'Preencha os dados abaixo para se juntar ao Waylo.'
              : 'Entre com suas credenciais para continuar.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md border border-destructive/20 animate-in fade-in zoom-in duration-200">
                  {error}
                </div>
              )}

              {isRegistering && (
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Seu nome"
                            className="pl-9 h-11"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="exemplo@waylo.app"
                          className="pl-9 h-11"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          className="pl-9 h-11"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full font-bold h-11 text-base"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isRegistering ? 'Cadastrar' : 'Entrar'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            {isRegistering ? (
              <>
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="font-semibold text-primary hover:underline underline-offset-4"
                >
                  Faça login
                </button>
              </>
            ) : (
              <>
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="font-semibold text-primary hover:underline underline-offset-4"
                >
                  Cadastre-se grátis
                </button>
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Footer Legal */}
      <footer className="mt-8 text-xs text-muted-foreground opacity-50">
        © {new Date().getFullYear()} Waylo Travel AI. Todos os direitos reservados.
      </footer>
    </div>
  )
}
