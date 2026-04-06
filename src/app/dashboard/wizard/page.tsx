'use client'

import React, { useState, useEffect } from 'react'
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
  Utensils,
  Accessibility,
  Music,
  ShoppingBag,
  Palmtree,
  Mountain,
  BedDouble,
  MapPin
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { getLanguageByCountry, getI18n, type LangCode } from '@/lib/i18n'

import { Suspense } from 'react'

function WizardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [lang, setLang] = useState<LangCode>('pt')
  const [selections, setSelections] = useState({
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('dest') || '',
    dates: searchParams.get('dates') || '',
    companion: '',
    pace: '',
    budget: '',
    additional_notes: '',
    vibes: '',
    dealbreakers: '',
    dietary_restrictions: '',
    selected_hotel: ''
  })
  const [hasMobility, setHasMobility] = useState(false)
  const [dietaryText, setDietaryText] = useState('')

  const supabase = createClient()

  // Detectar idioma do perfil
  useEffect(() => {
    async function detectLang() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('country').eq('id', user.id).single()
        if (profile?.country) setLang(getLanguageByCountry(profile.country))
      }
    }
    detectLang()
  }, [])

  const t = getI18n(lang)
  const totalSteps = 8
  const progressValue = (step / totalSteps) * 100

  const handleSelect = (key: string, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value }))
  }

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
    else handleFinish()
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    else router.back()
  }

  const handleFinish = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const dateParts = selections.dates.includes(' a ')
        ? selections.dates.split(' a ')
        : [selections.dates, selections.dates]

      const { data: savedData, error } = await supabase
        .from('itineraries')
        .insert([{
          user_id: user?.id,
          destination: selections.destination,
          start_date: dateParts[0] || 'TBD',
          end_date: dateParts[1] || 'TBD',
          companion: selections.companion,
          rhythm: selections.pace,
          budget: selections.budget,
          content: {
            status: 'analyzing',
            dietary_restrictions: selections.dietary_restrictions,
            dealbreakers: selections.dealbreakers,
            vibes: selections.vibes,
            additional_notes: selections.additional_notes,
            selected_hotel: selections.selected_hotel
          }
        }])
        .select()
        .single()

      if (error) throw error
      router.push(`/dashboard/viagem/${savedData.id}`)
    } catch (err: any) {
      console.error('ERROR SAVING:', err)
      setIsLoading(false)
    }
  }

  const isSelected = (key: string, value: string) => selections[key as keyof typeof selections] === value

  // Companion options com i18n
  const companionOptions = [
    { id: 'solo', label: t.wizard.companion.solo, icon: User },
    { id: 'couple', label: t.wizard.companion.couple, icon: Heart },
    { id: 'friends', label: t.wizard.companion.friends, icon: Users },
    { id: 'family', label: t.wizard.companion.family, icon: Baby },
  ]

  const paceOptions = [
    { id: 'relax', label: t.wizard.pace.relax.label, desc: t.wizard.pace.relax.desc, icon: Clock },
    { id: 'balanced', label: t.wizard.pace.balanced.label, desc: t.wizard.pace.balanced.desc, icon: Compass },
    { id: 'intense', label: t.wizard.pace.intense.label, desc: t.wizard.pace.intense.desc, icon: Zap },
  ]

  const budgetOptions = [
    { id: 'budget', label: t.wizard.budget.budget.label, price: '$', desc: t.wizard.budget.budget.desc, icon: Wallet },
    { id: 'comfort', label: t.wizard.budget.comfort.label, price: '$$', desc: t.wizard.budget.comfort.desc, icon: Coins },
    { id: 'luxury', label: t.wizard.budget.luxury.label, price: '$$$', desc: t.wizard.budget.luxury.desc, icon: Gem },
  ]

  const vibeOptions = [
    { id: 'culture', label: t.wizard.vibes.culture, icon: Palette },
    { id: 'adventure', label: t.wizard.vibes.adventure, icon: Mountain },
    { id: 'food', label: t.wizard.vibes.food, icon: Utensils },
    { id: 'nightlife', label: t.wizard.vibes.nightlife, icon: Music },
    { id: 'shopping', label: t.wizard.vibes.shopping, icon: ShoppingBag },
    { id: 'relax', label: t.wizard.vibes.relax, icon: Palmtree },
  ]

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-10">
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t.common.step_of.replace('{step}', String(step)).replace('{total}', String(totalSteps))}
          </span>
          <span className="text-sm font-bold text-primary">{Math.round(progressValue)}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressValue}%` }} />
        </div>
      </div>

      <div className="min-h-[400px] animate-in slide-in-from-right-4 fade-in duration-300" key={step}>
        {/* ─── STEP 1: COMPANION ─── */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{t.wizard.step1.title}</h1>
              <p className="text-muted-foreground font-sans">{t.wizard.step1.desc}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {companionOptions.map((opt) => (
                <Card key={opt.id} className={cn("cursor-pointer transition-all hover:border-primary/50 group h-40 border-2", isSelected('companion', opt.id) ? "border-primary bg-primary/5" : "border-border")} onClick={() => handleSelect('companion', opt.id)}>
                  <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
                    <opt.icon className={cn("h-10 w-10 transition-transform group-hover:scale-110", isSelected('companion', opt.id) ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-bold font-heading text-lg">{opt.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP 2: PACE ─── */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{t.wizard.step2.title}</h1>
              <p className="text-muted-foreground font-sans">{t.wizard.step2.desc}</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {paceOptions.map((opt) => (
                <div key={opt.id} className={cn("cursor-pointer flex items-center p-6 rounded-2xl border-2 transition-all group", isSelected('pace', opt.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")} onClick={() => handleSelect('pace', opt.id)}>
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mr-6", isSelected('pace', opt.id) ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
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

        {/* ─── STEP 3: BUDGET ─── */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{t.wizard.step3.title}</h1>
              <p className="text-muted-foreground font-sans">{t.wizard.step3.desc}</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {budgetOptions.map((opt) => (
                <div key={opt.id} className={cn("cursor-pointer flex items-center p-6 rounded-2xl border-2 transition-all hover:scale-[1.01]", isSelected('budget', opt.id) ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" : "border-border")} onClick={() => handleSelect('budget', opt.id)}>
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mr-6", isSelected('budget', opt.id) ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
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

        {/* ─── STEP 4: VIBES ─── */}
        {step === 4 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{t.wizard.step4.title}</h1>
              <p className="text-muted-foreground font-sans">{t.wizard.step4.desc}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {vibeOptions.map((opt) => {
                const selectedList = selections.vibes.split(',').filter(Boolean)
                const isItemSelect = selectedList.includes(opt.id)
                return (
                  <Card key={opt.id} className={cn("cursor-pointer transition-all hover:border-primary/50 group border-2 h-32", isItemSelect ? "border-primary bg-primary/5" : "border-border")} onClick={() => {
                    const newList = isItemSelect ? selectedList.filter(i => i !== opt.id) : [...selectedList, opt.id]
                    handleSelect('vibes', newList.join(','))
                  }}>
                    <CardContent className="flex flex-col items-center justify-center h-full space-y-2 p-4 text-center">
                      <opt.icon className={cn("h-6 w-6", isItemSelect ? "text-primary" : "text-muted-foreground")} />
                      <span className="font-bold font-heading text-sm">{opt.label}</span>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── STEP 5: ACCESSIBILITY & DIET ─── */}
        {step === 5 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{t.wizard.step5.title}</h1>
              <p className="text-muted-foreground font-sans">{t.wizard.step5.desc}</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 font-heading">
                  <Accessibility className="h-4 w-4" /> {t.wizard.mobility_label}
                </label>
                <div className="flex gap-4">
                  {[t.common.no, t.common.yes].map((ov, idx) => (
                    <Button key={ov} variant="outline" className={cn("flex-1 h-12 rounded-xl font-bold", (idx === 1 && hasMobility) || (idx === 0 && !hasMobility) ? "border-primary bg-primary/5 text-primary" : "border-border")} onClick={() => {
                      const newVal = idx === 1
                      setHasMobility(newVal)
                      const diet = dietaryText ? ` | ${dietaryText}` : ''
                      handleSelect('dietary_restrictions', `Mobility: ${newVal ? 'Yes' : 'No'}${diet}`)
                    }}>{ov}</Button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 font-heading">
                  <Utensils className="h-4 w-4" /> {t.wizard.dietary_label}
                </label>
                <Input
                  placeholder={t.wizard.dietary_placeholder}
                  className="h-14 rounded-xl border-2 focus-visible:ring-primary font-sans"
                  value={dietaryText}
                  onChange={(e) => {
                    setDietaryText(e.target.value)
                    const mob = hasMobility ? 'Mobility: Yes' : 'Mobility: No'
                    handleSelect('dietary_restrictions', e.target.value ? `${mob} | ${e.target.value}` : mob)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 6: EXCLUSIONS ─── */}
        {step === 6 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{t.wizard.step6.title}</h1>
              <p className="text-muted-foreground font-sans">{t.wizard.step6.desc}</p>
            </div>
            <textarea
              className="w-full min-h-[180px] p-6 rounded-2xl border-2 border-border bg-background font-sans text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-muted-foreground/50"
              placeholder={t.wizard.exclusion_placeholder}
              value={selections.dealbreakers}
              onChange={(e) => handleSelect('dealbreakers', e.target.value)}
            />
          </div>
        )}

        {/* ─── STEP 7: VISION ─── */}
        {step === 7 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{t.wizard.step7.title}</h1>
              <p className="text-muted-foreground font-sans">{t.wizard.step7.desc}</p>
            </div>
            <textarea
              className="w-full min-h-[200px] p-6 rounded-2xl border-2 border-border bg-background font-sans text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-muted-foreground/50"
              placeholder={t.wizard.vision_placeholder}
              value={selections.additional_notes}
              onChange={(e) => handleSelect('additional_notes', e.target.value)}
            />
          </div>
        )}

        {/* ─── STEP 8: HOTEL ─── */}
        {step === 8 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">{t.wizard.step8.title}</h1>
              <p className="text-muted-foreground font-sans">{t.wizard.step8.desc}</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-widest text-[#E8833A] flex items-center gap-2 font-heading">
                  <BedDouble className="h-4 w-4" /> {t.wizard.hotel_label}
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-[#E8833A] transition-colors" />
                  <Input
                    placeholder={t.wizard.hotel_placeholder}
                    className="h-16 pl-12 rounded-2xl border-2 border-border focus-visible:ring-[#E8833A] focus-visible:border-[#E8833A] font-sans text-lg bg-white/50 backdrop-blur-sm"
                    value={selections.selected_hotel}
                    onChange={(e) => handleSelect('selected_hotel', e.target.value)}
                  />
                </div>
              </div>
              <Card className="bg-amber-50/50 border-amber-100 rounded-2xl">
                <CardContent className="pt-4 flex gap-3 items-center">
                  <Sparkles className="h-5 w-5 text-[#E8833A] shrink-0" />
                  <p className="text-sm text-amber-800 font-medium">{t.wizard.hotel_hint}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* ─── NAVIGATION ─── */}
      <div className="flex pt-6 border-t border-border justify-between items-center">
        <Button variant="ghost" onClick={handleBack} className="font-bold text-muted-foreground hover:text-foreground h-12 rounded-xl">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t.common.back}
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
          className="font-bold min-w-[140px] h-12 rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
        >
          {step === 8 ? (
            <>
              {isLoading ? t.wizard.generating : t.wizard.submit}
              {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Sparkles className="ml-2 h-4 w-4" />}
            </>
          ) : (
            <>
              {step === 7 ? t.wizard.last_step : t.common.next}
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default function WizardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <WizardPageContent />
    </Suspense>
  )
}
