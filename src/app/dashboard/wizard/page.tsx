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
  const [hasMobility, setHasMobility] = useState(false)
  const [dietaryText, setDietaryText] = useState('')

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
      // 1. Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser()

      // 2. Preparar as datas (com fallback seguro)
      const dateParts = selections.dates.includes(' a ') 
        ? selections.dates.split(' a ') 
        : [selections.dates, selections.dates]

      // 3. Criar registro inicial na tabela itineraries com status 'generating'
      const { data: savedData, error } = await supabase
        .from('itineraries')
        .insert([{
          user_id: user?.id,
          destination: selections.destination,
          start_date: dateParts[0] || 'A definir',
          end_date: dateParts[1] || 'A definir',
          companion: selections.companion,
          rhythm: selections.pace,
          budget: selections.budget,
          content: { 
            status: 'generating',
            dietary_restrictions: selections.dietary_restrictions,
            dealbreakers: selections.dealbreakers,
            vibes: selections.vibes,
            additional_notes: selections.additional_notes 
          }
        }])
        .select()
        .single()

      if (error) throw error

      // 4. Redirecionar IMEDIATAMENTE
      router.push(`/dashboard/viagem/${savedData.id}`)

      // 5. Disparar a geração da IA em background (fire-and-forget real)
      generateItinerary(savedData.id).catch(err => {
        console.error('Erro silencioso na geração:', err)
      })
      
    } catch (err: any) {
      const errorMessage = err?.message || err?.error_description || JSON.stringify(err, null, 2);
      console.error('ERRO AO SALVAR ROTEIRO:', errorMessage);
      alert(`Falha ao salvar: ${errorMessage}`);
      setIsLoading(false);
    }
  }

  // --- RENDER HELPERS ---
  const isSelected = (key: string, value: string) => selections[key as keyof typeof selections] === value

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
                        (ov === 'Sim' && hasMobility) || (ov === 'Não' && !hasMobility)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border"
                      )}
                      onClick={() => {
                        const newVal = ov === 'Sim'
                        setHasMobility(newVal)
                        const diet = dietaryText ? ` | ${dietaryText}` : ''
                        handleSelect('dietary_restrictions', `Mobilidade: ${newVal ? 'Sim' : 'Não'}${diet}`)
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
                  value={dietaryText}
                  onChange={(e) => {
                    setDietaryText(e.target.value)
                    const mob = hasMobility ? 'Mobilidade: Sim' : 'Mobilidade: Não'
                    handleSelect('dietary_restrictions', e.target.value ? `${mob} | ${e.target.value}` : mob)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Preferências de Exclusão</h1>
              <p className="text-muted-foreground font-sans">Existem tipos de lugares ou atividades que você prefere evitar nesta viagem?</p>
            </div>

            <div className="space-y-4">
              <textarea
                className="w-full min-h-[180px] p-6 rounded-2xl border-2 border-border bg-background font-sans text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-muted-foreground/50"
                placeholder="Ex: Prefiro evitar museus, não gosto de frutos do mar, evitar atividades com altura..."
                value={selections.dealbreakers}
                onChange={(e) => handleSelect('dealbreakers', e.target.value)}
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Sua inteligência de viagem personalizada levará isso em conta.</span>
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
                <span>Sua inteligência de viagem personalizada.</span>
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
            isLoading ||
            (step === 1 && !selections.companion) ||
            (step === 2 && !selections.pace) ||
            (step === 3 && !selections.budget) ||
            (step === 4 && !selections.vibes)
          }
          className="font-bold min-w-[140px] h-12 rounded-xl shadow-lg shadow-primary/20"
        >
          {step === 7 ? (
            <>
              {isLoading ? 'Iniciando...' : 'Gerar Roteiro'}
              {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Sparkles className="ml-2 h-4 w-4" />}
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
