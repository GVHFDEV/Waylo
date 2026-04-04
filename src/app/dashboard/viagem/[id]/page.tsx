import React from 'react'
import {
  MapPin, Calendar as CalendarIcon, ChevronLeft, Clock, Sunrise, Sun, Moon,
  Sparkles, Star, Quote, DollarSign, Navigation, RotateCcw, CheckCircle2, BedDouble, Plane,
  Users, Map, Settings
} from 'lucide-react'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { RegenerateButton } from '@/components/itinerary/RegenerateButton'
import { RealtimeTripListener } from '@/components/itinerary/RealtimeTripListener'
import { GenerationTrigger } from '@/components/itinerary/GenerationTrigger'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ActivityCard } from '@/components/itinerary/ActivityCard'

/* ═══════════════════════════════════════════════════════════════════════ */
/* REUTILIZAÇÃO DE CÓDIGO DA VITRINE ANTIGA (TIMELINE E FSQ)             */
/* ═══════════════════════════════════════════════════════════════════════ */

function PeriodIcon({ period }: { period: string }) {
  const p = period?.toLowerCase() ?? ''
  if (p.includes('manhã') || p.includes('manha')) return <Sunrise className="h-3.5 w-3.5" />
  if (p.includes('tarde')) return <Sun className="h-3.5 w-3.5" />
  if (p.includes('noite')) return <Moon className="h-3.5 w-3.5" />
  return <Clock className="h-3.5 w-3.5" />
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null
  const stars5 = (rating / 10) * 5
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-xs font-bold text-primary ml-1">{stars5.toFixed(1)} ★</span>
    </div>
  )
}

function TipCard({ content, isLast }: { content: string; isLast: boolean }) {
  return (
    <div className="relative flex gap-5 md:gap-7">
      <div className="flex flex-col items-center shrink-0 pt-2">
        <div className="h-3 w-3 rounded-full bg-[#E8833A] border-[2px] border-background ring-2 ring-[#E8833A]/20 z-10 shrink-0" />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      <div className="flex-1 pb-8">
        <div className="bg-transparent rounded-2xl border-2 border-[#E8833A] p-5 md:p-6 flex items-start gap-4 transition-all hover:bg-amber-50/10">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100"><Sparkles className="h-5 w-5 text-[#E8833A]" /></div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8833A]">Dica do Curador</span>
            <p className="text-sm italic text-foreground leading-relaxed">{content}</p>
          </div>
        </div>
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════════════ */
/* PÁGINA HUB                                                            */
/* ═══════════════════════════════════════════════════════════════════════ */

export default async function ViagemHubPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: itineraryData, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !itineraryData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Viagem não encontrada</h1>
        <Link href="/dashboard"><Button className="font-bold rounded-full px-6">Voltar para o Início</Button></Link>
      </div>
    )
  }

  const { content } = itineraryData
  const status = content?.status || 'analyzing'
  const isGenerating = status !== 'ready'
  const route = content
  const destination = itineraryData.destination || route?.destination || 'Destino'

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF8]">
      
      {/* 🔴 OBRIGATÓRIOS PARA HIDRATAÇÃO E GERAÇÃO */}
      <RealtimeTripListener tripId={id} currentStatus={status} />
      <GenerationTrigger tripId={id} status={status} />

      {/* ─── HERO COMPACTO (MISSÃO 3) ─── */}
      <header className="w-full pt-10 pb-6 border-b border-border bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
            Meus Roteiros
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight text-[#1C1917]">
                {destination}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {itineraryData.start_date} {itineraryData.end_date && `— ${itineraryData.end_date}`}</span>
                <span className="flex items-center gap-1.5 capitalize"><UsersIcon className="h-4 w-4" /> {itineraryData.companion}</span>
              </div>
            </div>
            
            {/* Badge de Status */}
            <div>
              {isGenerating ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8833A]/10 border border-[#E8833A]/20 text-[#E8833A] rounded-full text-sm font-bold animate-pulse">
                  <Sparkles className="h-4 w-4" />
                  {status === 'analyzing' && "Analisando perfil..."}
                  {status === 'mapping' && "Mapeando logística..."}
                  {status === 'generating' && "IA construindo..."}
                  {status === 'finishing' && "Finalizando..."}
                  {!['analyzing', 'mapping', 'generating', 'finishing'].includes(status) && "Mapeando dados..."}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-full text-sm font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  Roteiro Pronto
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── ESTRUTURA DE ABAS (MISSÃO 2A) ─── */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="itinerario" className="w-full">
          <div className="w-full overflow-x-auto pb-2 scrollbar-none">
            <TabsList className="inline-flex min-w-max h-12 items-center justify-center bg-slate-100/50 p-1 rounded-xl mb-6">
              <TabsTrigger value="itinerario" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E8833A] data-[state=active]:shadow-sm text-xs sm:text-sm font-bold px-4 md:px-6">
                <Map className="h-4 w-4" /> Itinerário
              </TabsTrigger>
              <TabsTrigger value="logistica" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E8833A] data-[state=active]:shadow-sm text-xs sm:text-sm font-bold px-4 md:px-6">
                <Plane className="h-4 w-4" /> Logística
              </TabsTrigger>
              <TabsTrigger value="custos" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E8833A] data-[state=active]:shadow-sm text-xs sm:text-sm font-bold px-4 md:px-6">
                <DollarSign className="h-4 w-4" /> Custos
              </TabsTrigger>
              <TabsTrigger value="social" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E8833A] data-[state=active]:shadow-sm text-xs sm:text-sm font-bold px-4 md:px-6">
                <Users className="h-4 w-4" /> Social
              </TabsTrigger>
              <TabsTrigger value="ajustes" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E8833A] data-[state=active]:shadow-sm text-xs sm:text-sm font-bold px-4 md:px-6">
                <Settings className="h-4 w-4" /> Ajustes
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="itinerario" className="space-y-12">
            
            {/* MISSÃO 2B - ESTADO GENERATING E READY */}
            {isGenerating ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-white rounded-2xl border-2 border-dashed border-[#E8833A]/30 p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 bg-[#E8833A]/10 border border-[#E8833A]/20 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="h-8 w-8 text-[#E8833A]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-heading font-bold text-foreground">
                      {status === 'analyzing' && "Analisando seu Perfil de Viajante"}
                      {status === 'mapping' && "Mapeando Logística Geográfica"}
                      {status === 'generating' && "IA Waylo Construindo sua Jornada"}
                      {status === 'finishing' && "Lapidando os Últimos Detalhes"}
                      {!['analyzing', 'mapping', 'generating', 'finishing'].includes(status) && "Construindo seu Roteiro Inteligente"}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground w-full max-w-sm mx-auto">
                      {status === 'analyzing' && "Estamos processando seus desejos e restrições para garantir perfeição."}
                      {status === 'mapping' && "Calculando rotas, tempos de deslocamento e proximidade de locais."}
                      {status === 'generating' && "Nossa IA de elite está escolhendo cada experiência a dedo para você."}
                      {status === 'finishing' && "Validando o roteiro final contra as regras de segurança e W.A.Y.L.O."}
                      {!['analyzing', 'mapping', 'generating', 'finishing'].includes(status) && "Isso leva em média 25 segundos. Fique nesta tela."}
                    </p>
                  </div>
                </div>

                <div className="space-y-10 opacity-60">
                   <div className="flex gap-4">
                     <Skeleton className="h-4 w-4 rounded-full mt-2" />
                     <Skeleton className="h-48 w-full rounded-2xl" />
                   </div>
                   <div className="flex gap-4">
                     <Skeleton className="h-4 w-4 rounded-full mt-2" />
                     <Skeleton className="h-32 w-full rounded-2xl" />
                   </div>
                </div>
              </div>
            ) : (
              <div className="space-y-14 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* ─── TRIP SUMMARY ─── */}
                {route?.trip_summary && (
                  <section className="w-full bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8833A]">Essência da Viagem</span>
                      <p className="text-xl font-heading font-black text-charcoal leading-tight">
                        {route.trip_summary.dominant_vibe}
                      </p>
                    </div>
                    {(route.trip_summary.important_notes || route.trip_summary.safety_notes) && (
                      <div className="flex-1 bg-amber-50/50 border border-[#E8833A]/20 rounded-xl p-4 flex gap-3 items-start">
                        <Sparkles className="h-5 w-5 text-[#E8833A] shrink-0" />
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8833A]">Atenção</span>
                          <p className="text-sm text-charcoal/80 leading-relaxed italic">
                            {route.trip_summary.important_notes || route.trip_summary.safety_notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* ─── TIMELINE REAL ─── */}
                {route?.itinerary?.map((day: any, dayIdx: number) => (
                  <section key={dayIdx} className="space-y-8">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h2 className="text-3xl font-heading font-black text-foreground">Dia {day.day}</h2>
                        {day.day_title && <p className="text-xl font-heading font-bold text-[#E8833A] leading-tight">{day.day_title}</p>}
                      </div>
                      {day.fatigue_level && (
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-dashed",
                          day.fatigue_level === 'low' ? "bg-green-50 text-green-700 border-green-200" :
                          day.fatigue_level === 'medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        )}>
                          <Clock className="h-3 w-3" />
                          {day.fatigue_level}
                        </span>
                      )}
                    </div>
                    <div className="ml-2 md:ml-6">
                      {day.items ? day.items.map((item: any, idx: number) => {
                        const isLastItem = idx === day.items.length - 1
                        if (item.type === 'tip') return <TipCard key={idx} content={item.content} isLast={isLastItem} />
                        return <ActivityCard key={idx} activity={item} destination={destination} isLast={isLastItem} itineraryId={id} dayIdx={dayIdx} itemIdx={idx} userPreferences={{ budget: itineraryData.budget, dietary: content?.dietary_restrictions, dealbreakers: content?.dealbreakers }} />
                      }) : day.activities?.map((item: any, idx: number) => (
                        <ActivityCard key={idx} activity={item} destination={destination} isLast={idx === (day.activities?.length || 0)-1} itineraryId={id} dayIdx={dayIdx} itemIdx={idx} userPreferences={{ budget: itineraryData.budget, dietary: content?.dietary_restrictions, dealbreakers: content?.dealbreakers }} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="logistica" className="pt-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl border-2 border-dashed border-border p-12 text-center text-muted-foreground">
              <Plane className="h-8 w-8 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Módulo de Logística em construção.</p>
              <p className="text-sm">Em breve: Voos e Hospedagem estruturados.</p>
            </div>
          </TabsContent>
          <TabsContent value="custos" className="pt-6 animate-in fade-in duration-500">
             <div className="bg-white rounded-2xl border-2 border-dashed border-border p-12 text-center text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Módulo Financeiro em construção.</p>
            </div>
          </TabsContent>
          <TabsContent value="social" className="pt-6 animate-in fade-in duration-500">
             <div className="bg-white rounded-2xl border-2 border-dashed border-border p-12 text-center text-muted-foreground">
              <p className="font-medium">Módulo Social em construção.</p>
            </div>
          </TabsContent>
          <TabsContent value="ajustes" className="pt-6 animate-in fade-in duration-500">
             <div className="bg-white rounded-2xl border-2 border-dashed border-border p-12 text-center text-muted-foreground">
              <p className="font-medium">Módulo de Ajustes em construção.</p>
            </div>
          </TabsContent>

        </Tabs>
      </main>

    </div>
  )
}

function UsersIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )
}
