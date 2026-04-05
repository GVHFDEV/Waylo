'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Car, 
  Bus, 
  UserCircle, 
  Wallet, 
  ChevronRight, 
  CheckCircle2, 
  Users2, 
  Navigation,
  X,
  Footprints
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface ConciergeModalProps {
  tripId: string
  status: string
}

export function ConciergeModal({ tripId, status }: ConciergeModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [selections, setSelections] = useState({
    emails: '',
    transport: '',
    total_budget: ''
  })

  useEffect(() => {
    if (status !== 'ready' && status !== 'error') {
      const isDismissed = sessionStorage.getItem(`concierge-dismissed-${tripId}`)
      if (!isDismissed) setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [status, tripId])

  const handleSaveToSupabase = async (newLogistics: Record<string, string>) => {
    setIsSaving(true)
    const supabase = createClient()
    
    const { data: current } = await supabase
      .from('itineraries')
      .select('content')
      .eq('id', tripId)
      .single()

    const updatedContent = {
      ...current?.content,
      logistics: {
        ...(current?.content?.logistics || {}),
        ...newLogistics
      }
    }

    await supabase
      .from('itineraries')
      .update({ content: updatedContent })
      .eq('id', tripId)

    setIsSaving(false)
  }

  const handleNext = async () => {
    if (step === 2) {
      await handleSaveToSupabase({ transport: selections.transport })
    }
    if (step === 3) {
      await handleSaveToSupabase({ total_budget: selections.total_budget })
      sessionStorage.setItem(`concierge-dismissed-${tripId}`, 'true')
      setIsOpen(false)
      return
    }
    setStep(step + 1)
  }

  const handleClose = () => {
    sessionStorage.setItem(`concierge-dismissed-${tripId}`, 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  const STEP_CONFIG = {
    1: {
      title: 'Quem vai explorar com você?',
      subtitle: 'Convide amigos para acompanharem o roteiro em tempo real.',
    },
    2: {
      title: 'Como você pretende se locomover?',
      subtitle: 'Isso nos ajuda a calcular tempos de deslocamento reais.',
    },
    3: {
      title: 'Qual o orçamento total planejado?',
      subtitle: 'Valor estimado para toda a viagem, por pessoa.',
    },
  } as const

  const currentStep = STEP_CONFIG[step as keyof typeof STEP_CONFIG]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#FAFAF8] border-2 border-amber-100 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        
        {/* Barra de Progresso */}
        <div className="bg-[#E8833A]/15 h-1.5 w-full">
          <div 
            className="h-full bg-[#E8833A] transition-all duration-700 ease-out rounded-r-full" 
            style={{ width: `${(step / 3) * 100}%` }} 
          />
        </div>

        {/* Botão Fechar */}
        <button 
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 transition-colors text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8 space-y-6">
          {/* Header */}
          <header className="space-y-2 pr-8">
            <div className="flex items-center gap-2 text-[#E8833A] font-bold text-[10px] uppercase tracking-[0.2em]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8833A] animate-pulse" />
              <span>Waylo Concierge · Etapa {step}/3</span>
            </div>
            <h2 className="text-2xl font-heading font-black text-[#1C1917] leading-tight">
              {currentStep.title}
            </h2>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed">
              {currentStep.subtitle}
            </p>
          </header>

          {/* Conteúdo Dinâmico */}
          <div className="min-h-[160px] flex flex-col justify-center">
            <div key={step} className="animate-in fade-in slide-in-from-right-4 duration-400">

              {/* ─── ETAPA 1: CONVIDADOS ─── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="relative group">
                    <Users2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-[#E8833A] transition-colors" />
                    <Input 
                      placeholder="ana@email.com, pedro@email.com..." 
                      className="h-14 pl-12 rounded-2xl border-2 border-border focus-visible:ring-[#E8833A] focus-visible:border-[#E8833A] font-sans text-sm"
                      value={selections.emails}
                      onChange={(e) => setSelections(prev => ({ ...prev, emails: e.target.value }))}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground/50 uppercase text-center tracking-widest">
                    Os convites serão enviados quando o roteiro estiver pronto.
                  </p>
                </div>
              )}

              {/* ─── ETAPA 2: TRANSPORTE ─── */}
              {step === 2 && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'public', label: 'Transporte público', icon: Bus },
                    { id: 'uber', label: 'Uber / Táxi', icon: Navigation },
                    { id: 'rental', label: 'Carro alugado', icon: Car },
                    { id: 'walking', label: 'A pé', icon: Footprints },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelections(prev => ({ ...prev, transport: opt.id }))}
                      className={cn(
                        "flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all gap-2.5 group",
                        selections.transport === opt.id 
                          ? "border-[#E8833A] bg-[#E8833A]/5 shadow-sm scale-[1.02]" 
                          : "border-border hover:border-[#E8833A]/30 bg-white"
                      )}
                    >
                      <opt.icon className={cn(
                        "h-6 w-6 transition-all group-hover:scale-110",
                        selections.transport === opt.id ? "text-[#E8833A]" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        selections.transport === opt.id ? "text-[#E8833A]" : "text-muted-foreground"
                      )}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ─── ETAPA 3: ORÇAMENTO TOTAL ─── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="relative group">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-[#E8833A] transition-colors" />
                    <Input 
                      type="number"
                      placeholder="Ex: 5000" 
                      className="h-16 pl-12 rounded-2xl border-2 border-border focus-visible:ring-[#E8833A] focus-visible:border-[#E8833A] font-sans text-xl font-bold"
                      value={selections.total_budget}
                      onChange={(e) => setSelections(prev => ({ ...prev, total_budget: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                    <CheckCircle2 className="h-4 w-4 text-[#E8833A] shrink-0" />
                    <span className="text-[11px] text-amber-800 font-semibold leading-tight">
                      Seus gastos serão otimizados com base nesse valor.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              variant="ghost" 
              className="font-bold text-muted-foreground flex-1 order-2 sm:order-1 h-12 rounded-2xl hover:bg-black/5"
              onClick={handleClose}
            >
              Pular por agora
            </Button>
            <Button 
              className="bg-[#E8833A] hover:bg-[#D16D29] text-white font-bold flex-1 h-12 rounded-2xl shadow-lg shadow-[#E8833A]/20 order-1 sm:order-2 text-sm transition-all hover:scale-[1.01]"
              onClick={handleNext}
              disabled={isSaving || (step === 2 && !selections.transport) || (step === 3 && !selections.total_budget)}
            >
              {isSaving ? "Salvando..." : step === 3 ? "Tudo pronto!" : "Próximo"}
              {!isSaving && <ChevronRight className="ml-1.5 h-4 w-4" />}
            </Button>
          </footer>
        </div>
      </div>
    </div>
  )
}
