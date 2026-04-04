'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Heart,
  Users,
  Baby,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2,
  Clock,
  Compass,
  Zap,
  Wallet,
  Gem,
  Coins,
  Palette,
  ShieldAlert,
  Ban,
  Utensils,
  Accessibility,
  Music,
  ShoppingBag,
  Palmtree,
  Mountain
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { generateItinerary } from '@/app/actions/generate-itinerary'
import { createClient } from '@/lib/supabase/client'
import { DatePickerWithRange } from '@/components/dashboard/date-range-picker'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

/**
 * Wizard de Onboarding da IA (O "Quebra-cabeça").
 * 
 * Fluxo de 3 passos para personalização do roteiro mágico.
 * Design premium com tipografia Cabinet Grotesk e cores Âmbar.
 */
export default function WizardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [selections, setSelections] = useState({
    origin: searchParams.get('origin') || 'São Paulo',
    destination: searchParams.get('dest') || 'Paris',
    dates: searchParams.get('dates') || '15 a 20 de Junho',
    companion: '',
    pace: '',
    budget: '',
    additional_notes: '',
    vibes: '',
    dealbreakers: '',
    dietary_restrictions: ''
  })

  const totalSteps = 7
  const progressValue = (step / totalSteps) * 100

  // --- HANDLERS ---
  const handleSelect = (key: string, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value }))
  }

  const handleNext = () => {
    if (step < 7) setStep(step + 1)
    else handleFinish()
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    else router.back()
  }

  const handleFinish = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // 1. Chamar a Server Action do Gemini (Missão 10)
      const itineraryData = await generateItinerary(selections)

      // 2. Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser()

      // 3. Persistir no Supabase (Tabela itineraries)
      const { data: savedData, error } = await supabase
        .from('itineraries')
        .insert([{
          user_id: user?.id,
          destination: selections.destination,
          start_date: selections.dates.split(' a ')[0],
          end_date: selections.dates.split(' a ')[1],
          companion: selections.companion,
          rhythm: selections.pace,
          budget: selections.budget,
          content: itineraryData // JSON completo da IA
        }])
        .select()
        .single()

      if (error) throw error

      // 4. Redirecionar para a Vitrine de Curadoria
      router.push(`/dashboard/roteiros/${savedData.id}`)
    } catch (err: any) {
      // Alternativa melhor: extrair a mensagem real ou forçar a leitura do objeto de erro do Supabase
      const errorMessage = err?.message || err?.error_description || JSON.stringify(err, null, 2);

      console.error('ERRO DETALHADO AO SALVAR ROTEIRO:', errorMessage);
      console.error('Objeto original:', err);

      alert(`Falha no sistema: ${errorMessage}\n\nVerifique o console para mais detalhes.`);

      setIsLoading(false);
    }
  }

  // --- RENDER HELPERS ---
  const isSelected = (key: string, value: string) => selections[key as keyof typeof selections] === value

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <Loader2 className="h-20 w-20 text-primary animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary shadow-2xl" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-heading font-bold text-foreground">Gerando seu roteiro mágico...</h2>
          <p className="text-muted-foreground font-sans text-lg italic max-w-md mx-auto">
            "Nossa IA está cruzando dados de voos e hotéis para criar a jornada perfeita para você."
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-10">
      {/* 1. BARRA DE PROGRESSO */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Passo {step} de {totalSteps}</span>
          <span className="text-sm font-bold text-primary">{Math.round(progressValue)}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>

      {/* 2. CONTEÚDO DO PASSO */}
      <div className="min-h-[400px] animate-in slide-in-from-right-4 fade-in duration-300">
        {step === 1 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Com quem você vai viajar?</h1>
              <p className="text-muted-foreground font-sans">Isso nos ajuda a escolher os melhores lugares e atividades.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'solo', label: 'Sozinho', icon: User },
                { id: 'casal', label: 'Em Casal', icon: Heart },
                { id: 'amigos', label: 'Com Amigos', icon: Users },
                { id: 'familia', label: 'Com Família', icon: Baby },
              ].map((opt) => (
                <Card
                  key={opt.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50 group h-40 border-2",
                    isSelected('companion', opt.id) ? "border-primary bg-primary/5" : "border-border"
                  )}
                  onClick={() => handleSelect('companion', opt.id)}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
                    <opt.icon className={cn(
                      "h-10 w-10 transition-transform group-hover:scale-110",
                      isSelected('companion', opt.id) ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="font-bold font-heading text-lg">{opt.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Qual o ritmo da viagem?</h1>
              <p className="text-muted-foreground font-sans">Quantas atividades você aguenta em um dia?</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'relax', label: 'Relaxado', desc: 'Acorde tarde, aproveite longos cafés e veja tudo sem pressa.', icon: Clock },
                { id: 'balanced', label: 'Equilibrado', desc: 'O melhor de dois mundos. Algumas atividades e tempo livre.', icon: Compass },
                { id: 'intense', label: 'Intenso', desc: 'Muitos lugares no mesmo dia. Foco em ver o máximo possível.', icon: Zap },
              ].map((opt) => (
                <div
                  key={opt.id}
                  className={cn(
                    "cursor-pointer flex items-center p-6 rounded-2xl border-2 transition-all group",
                    isSelected('pace', opt.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  )}
                  onClick={() => handleSelect('pace', opt.id)}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center mr-6",
                    isSelected('pace', opt.id) ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <opt.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold font-heading text-xl">{opt.label}</h3>
                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Qual o seu orçamento?</h1>
              <p className="text-muted-foreground font-sans">Isso definirá as sugestões de hotéis e experiências.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {[
                { id: 'budget', label: 'Econômico', price: '$', desc: 'Foco em custo-benefício, hostels premium e comida local.', icon: Wallet },
                { id: 'comfort', label: 'Intermediário', price: '$$', desc: 'Hotéis 4 estrelas, experiências guiadas e jantares de qualidade.', icon: Coins },
                { id: 'luxury', label: 'Luxo', price: '$$$', desc: 'O melhor que o destino oferece. Hotéis 5 estrelas e exclusividade.', icon: Gem },
              ].map((opt) => (
                <div
                  key={opt.id}
                  className={cn(
                    "cursor-pointer flex items-center p-6 rounded-2xl border-2 transition-all hover:scale-[1.01]",
                    isSelected('budget', opt.id) ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" : "border-border"
                  )}
                  onClick={() => handleSelect('budget', opt.id)}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center mr-6",
                    isSelected('budget', opt.id) ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <opt.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold font-heading text-xl">{opt.label}</h3>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{opt.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">A Vibe da Viagem</h1>
              <p className="text-muted-foreground font-sans">Selecione os estilos que mais combinam com este roteiro.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: 'cultura', label: 'Cultura & História', icon: Palette },
                { id: 'aventura', label: 'Aventura & Natureza', icon: Mountain },
                { id: 'gastronomia', label: 'Gastronomia', icon: Utensils },
                { id: 'noite', label: 'Vida Noturna', icon: Music },
                { id: 'compras', label: 'Compras', icon: ShoppingBag },
                { id: 'relax', label: 'Relaxamento', icon: Palmtree },
              ].map((opt) => {
                const selectedList = selections.vibes.split(',').filter(Boolean)
                const isItemSelect = selectedList.includes(opt.id)
                
                return (
                  <Card
                    key={opt.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50 group border-2 h-32",
                      isItemSelect ? "border-primary bg-primary/5" : "border-border"
                    )}
                    onClick={() => {
                      const newList = isItemSelect 
                        ? selectedList.filter(i => i !== opt.id)
                        : [...selectedList, opt.id]
                      handleSelect('vibes', newList.join(','))
                    }}
                  >
                    <CardContent className="flex flex-col items-center justify-center h-full space-y-2 p-4 text-center">
                      <opt.icon className={cn(
                        "h-6 w-6",
                        isItemSelect ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="font-bold font-heading text-sm">{opt.label}</span>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Acessibilidade & Dieta</h1>
              <p className="text-muted-foreground font-sans">Garantimos que cada parada seja segura e confortável para todos.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Accessibility className="h-4 w-4" /> Restrições de Mobilidade?
                </label>
                <div className="flex gap-4">
                  {['Não', 'Sim'].map(ov => (
                    <Button
                      key={ov}
                      variant="outline"
                      className={cn(
                        "flex-1 h-12 rounded-xl font-bold",
                        (ov === 'Sim' && selections.dietary_restrictions.includes('Mobilidade:')) || (ov === 'Não' && !selections.dietary_restrictions.includes('Mobilidade:'))
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border"
                      )}
                      onClick={() => {
                        const base = selections.dietary_restrictions.split('|')[1] || ''
                        handleSelect('dietary_restrictions', ov === 'Sim' ? `Mobilidade: Sim | ${base}` : `Mobilidade: Não | ${base}`)
                      }}
                    >
                      {ov}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Utensils className="h-4 w-4" /> Restrições Alimentares?
                </label>
                <Input
                  placeholder="Ex: Vegan, Alergia a amendoim, Sem glúten..."
                  className="h-14 rounded-xl border-2 focus-visible:ring-primary font-sans"
                  value={selections.dietary_restrictions.split('|')[1]?.trim() || ''}
                  onChange={(e) => {
                    const mob = selections.dietary_restrictions.split('|')[0] || 'Mobilidade: Não '
                    handleSelect('dietary_restrictions', `${mob} | ${e.target.value}`)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">O que você ODEIA?</h1>
                <Ban className="h-8 w-8 text-red-500/50" />
              </div>
              <p className="text-muted-foreground font-sans text-lg">Chamamos de Dealbreakers. O que NUNCA deve aparecer no roteiro?</p>
            </div>

            <div className="space-y-4">
              <textarea
                className="w-full min-h-[180px] p-6 rounded-2xl border-2 border-border bg-background font-sans text-foreground focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition-all resize-none placeholder:text-muted-foreground/50"
                placeholder="Ex: Não gosto de museus, odeio frutos do mar, evite qualquer coisa com altura, nada de baladas..."
                value={selections.dealbreakers}
                onChange={(e) => handleSelect('dealbreakers', e.target.value)}
              />
              <div className="flex items-center gap-2 text-xs text-red-500/70 px-2 font-bold uppercase tracking-tighter">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>O W.A.Y.L.O. irá banir esses termos da sua experiência.</span>
              </div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Sua Visão</h1>
              <p className="text-muted-foreground font-sans">Conte-nos sobre desejos específicos (ex: "Almoçar de frente para a Torre").</p>
            </div>

            <div className="space-y-4">
              <textarea
                className="w-full min-h-[200px] p-6 rounded-2xl border-2 border-border bg-background font-sans text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-muted-foreground/50"
                placeholder="Ex: Quero focar em cafés históricos, evitar ladeiras e obrigatoriamente visitar a Torre Eiffel à noite..."
                value={selections.additional_notes}
                onChange={(e) => handleSelect('additional_notes', e.target.value)}
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>O motor V2.0 usará essas notas como Prioridade Suprema.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. NAVEGAÇÃO */}
      <div className="flex pt-6 border-t border-border justify-between items-center">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="font-bold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Button
          onClick={handleNext}
          disabled={
            (step === 1 && !selections.companion) ||
            (step === 2 && !selections.pace) ||
            (step === 3 && !selections.budget) ||
            (step === 4 && !selections.vibes)
          }
          className="font-bold min-w-[140px] h-12 rounded-xl shadow-lg shadow-primary/20"
        >
          {step === 7 ? (
            <>
              Gerar Roteiro
              <Sparkles className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Próximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
