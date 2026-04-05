'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Car,
  Bus,
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
import { getLanguageByCountry, getI18n, type LangCode } from '@/lib/i18n'

interface ConciergeModalProps {
  tripId: string
  status: string
}

export function ConciergeModal({ tripId, status }: ConciergeModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [lang, setLang] = useState<LangCode>('pt')
  const [selections, setSelections] = useState({
    emails: '',
    transport: '',
    total_budget: ''
  })

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('country').eq('id', user.id).single()
        if (profile?.country) setLang(getLanguageByCountry(profile.country))
      }
    }
    init()

    if (status !== 'ready' && status !== 'error') {
      const isDismissed = sessionStorage.getItem(`concierge-dismissed-${tripId}`)
      if (!isDismissed) setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [status, tripId])

  const t = getI18n(lang)

  const handleSaveToSupabase = async (newLogistics: Record<string, string>) => {
    setIsSaving(true)
    const { data: current } = await supabase.from('itineraries').select('content').eq('id', tripId).single()
    const updatedContent = { ...current?.content, logistics: { ...(current?.content?.logistics || {}), ...newLogistics } }
    await supabase.from('itineraries').update({ content: updatedContent }).eq('id', tripId)
    setIsSaving(false)
  }

  const handleNext = async () => {
    if (step === 2) await handleSaveToSupabase({ transport: selections.transport })
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

  const stepConfig = {
    1: { title: t.concierge.step1.title, subtitle: t.concierge.step1.desc },
    2: { title: t.concierge.step2.title, subtitle: t.concierge.step2.desc },
    3: { title: t.concierge.step3.title, subtitle: t.concierge.step3.desc },
  } as const

  const current = stepConfig[step as keyof typeof stepConfig]

  const transportOptions = [
    { id: 'public', label: t.concierge.transport.public, icon: Bus },
    { id: 'uber', label: t.concierge.transport.uber, icon: Navigation },
    { id: 'rental', label: t.concierge.transport.rental, icon: Car },
    { id: 'walking', label: t.concierge.transport.walking, icon: Footprints },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        
        {/* Progress Bar (Thin & Elegant) */}
        <div className="bg-muted h-[3px] w-full">
          <div 
            className="h-full bg-[#E8833A] transition-all duration-700 ease-out" 
            style={{ width: `${(step / 3) * 100}%` }} 
          />
        </div>

        <button 
          onClick={handleClose} 
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8 space-y-8">
          <header className="space-y-3 pr-8">
            <h2 className="text-2xl font-heading font-bold text-foreground leading-tight">
              {current.title}
            </h2>
            <p className="text-muted-foreground font-sans text-sm leading-relaxed">
              {current.subtitle}
            </p>
          </header>

          <div className="min-h-[140px] flex flex-col justify-center">
            <div key={step} className="animate-in fade-in slide-in-from-right-4 duration-400">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="relative group">
                    <Users2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#E8833A] transition-colors" />
                    <Input 
                      placeholder={t.concierge.email_placeholder} 
                      className="h-12 pl-12 rounded-xl border border-border bg-transparent focus-visible:ring-[#E8833A]/20 focus-visible:border-[#E8833A] font-sans text-sm transition-all" 
                      value={selections.emails} 
                      onChange={(e) => setSelections(prev => ({ ...prev, emails: e.target.value }))} 
                    />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase text-center tracking-widest">
                    {t.concierge.email_hint}
                  </p>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-2 gap-3">
                  {transportOptions.map((opt) => (
                    <button 
                      key={opt.id} 
                      onClick={() => setSelections(prev => ({ ...prev, transport: opt.id }))} 
                      className={cn(
                        "flex flex-col items-center justify-center p-5 rounded-xl border transition-all gap-2.5 group",
                        selections.transport === opt.id 
                          ? "border-[#E8833A] bg-[#E8833A]/5 shadow-sm" 
                          : "border-border hover:border-[#E8833A]/30 bg-card hover:bg-muted/30"
                      )}
                    >
                      <opt.icon className={cn(
                        "h-5 w-5 transition-all group-hover:scale-110", 
                        selections.transport === opt.id ? "text-[#E8833A]" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider", 
                        selections.transport === opt.id ? "text-[#E8833A]" : "text-muted-foreground"
                      )}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div className="relative group">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#E8833A] transition-colors" />
                    <Input 
                      type="number" 
                      placeholder={t.concierge.budget_placeholder} 
                      className="h-12 pl-12 rounded-xl border border-border bg-transparent focus-visible:ring-[#E8833A]/20 focus-visible:border-[#E8833A] font-sans text-lg font-bold transition-all" 
                      value={selections.total_budget} 
                      onChange={(e) => setSelections(prev => ({ ...prev, total_budget: e.target.value }))} 
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                    <CheckCircle2 className="h-4 w-4 text-[#E8833A] shrink-0" />
                    <span className="text-[11px] text-muted-foreground font-medium leading-tight">
                      {t.concierge.budget_hint}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <footer className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="ghost" 
              className="font-bold text-muted-foreground flex-1 order-2 sm:order-1 h-12 rounded-xl hover:bg-muted transition-colors" 
              onClick={handleClose}
            >
              {t.concierge.skip}
            </Button>
            <Button 
              className="bg-[#E8833A] hover:bg-[#D16D29] text-white font-bold flex-1 h-12 rounded-xl shadow-lg shadow-[#E8833A]/20 order-1 sm:order-2 text-sm transition-all hover:scale-[1.01]" 
              onClick={handleNext} 
              disabled={isSaving || (step === 2 && !selections.transport) || (step === 3 && !selections.total_budget)}
            >
              {isSaving ? t.common.loading : (step === 3 ? t.concierge.done : t.common.next)}
              {!isSaving && <ChevronRight className="ml-1.5 h-4 w-4" />}
            </Button>
          </footer>
        </div>
      </div>
    </div>
  )
}
