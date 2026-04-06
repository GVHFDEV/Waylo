import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  Sparkles,
  CheckCircle2,
  Map,
  Plane,
  DollarSign,
  Users,
  Settings,
  Trash2
} from 'lucide-react'
import { RealtimeTripListener } from '@/components/itinerary/RealtimeTripListener'
import { GenerationTrigger } from '@/components/itinerary/GenerationTrigger'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ActivityCard } from '@/components/itinerary/ActivityCard'
import { ConciergeModal } from '@/components/itinerary/ConciergeModal'
import { Button } from '@/components/ui/button'
import { DeleteTripClient } from './delete-trip-client'
import { getLanguageByCountry, getI18n, type LangCode } from '@/lib/i18n'

export default async function ViagemHubPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await params

  // --- BUSCA DE DADOS EM PARALELO (OTIMIZAÇÃO) ---
  const [itineraryRes, userRes] = await Promise.all([
    supabase.from('itineraries').select('*').eq('id', id).single(),
    supabase.auth.getUser()
  ])

  const { data: itineraryData, error } = itineraryRes
  const user = userRes.data.user

  // i18n Detection
  let lang: LangCode = 'pt'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('country').eq('id', user.id).single()
    lang = getLanguageByCountry(profile?.country || 'BR')
  }
  const t = getI18n(lang)

  if (error || !itineraryData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">{t.hub.not_found}</h1>
        <Link href="/dashboard"><Button className="font-bold rounded-full px-6">{t.hub.back}</Button></Link>
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
      <ConciergeModal tripId={id} status={status} />
      <RealtimeTripListener tripId={id} currentStatus={status} />
      <GenerationTrigger tripId={id} status={status} />

      <header className="w-full pt-10 pb-6 border-b border-border bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
            {t.hub.back}
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
            
            <div>
              {status === 'error' ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-full text-sm font-bold">
                  ⚠️ Erro na Geração
                </div>
              ) : isGenerating ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8833A]/10 border border-[#E8833A]/20 text-[#E8833A] rounded-full text-sm font-bold animate-pulse">
                  <Sparkles className="h-4 w-4" />
                  {status === 'analyzing' && t.hub.status.analyzing}
                  {status === 'mapping' && t.hub.status.mapping}
                  {status === 'generating' && t.hub.status.generating}
                  {status === 'finishing' && t.hub.status.finishing}
                  {!['analyzing', 'mapping', 'generating', 'finishing'].includes(status) && "W.A.Y.L.O."}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-full text-sm font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  {t.hub.ready}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="itinerario" className="w-full">
          <div className="w-full overflow-x-auto pb-2 scrollbar-none">
            <TabsList className="inline-flex min-w-max h-12 items-center justify-center bg-slate-100/50 p-1 rounded-xl mb-6">
              <TabsTrigger value="itinerario" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E8833A] text-xs sm:text-sm font-bold px-4 md:px-6">
                <Map className="h-4 w-4" /> {t.hub.tabs.itinerary}
              </TabsTrigger>
              <TabsTrigger value="logistica" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E8833A] text-xs sm:text-sm font-bold px-4 md:px-6">
                <Plane className="h-4 w-4" /> {t.hub.tabs.logistics}
              </TabsTrigger>
              <TabsTrigger value="custos" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E8833A] text-xs sm:text-sm font-bold px-4 md:px-6">
                <DollarSign className="h-4 w-4" /> {t.hub.tabs.costs}
              </TabsTrigger>
              <TabsTrigger value="social" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E8833A] text-xs sm:text-sm font-bold px-4 md:px-6">
                <Users className="h-4 w-4" /> {t.hub.tabs.social}
              </TabsTrigger>
              <TabsTrigger value="ajustes" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:text-[#E8833A] text-xs sm:text-sm font-bold px-4 md:px-6">
                <Settings className="h-4 w-4" /> {t.hub.tabs.settings}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="itinerario" className="space-y-12">
            {status === 'error' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-red-50/50 rounded-2xl border-2 border-dashed border-red-200 p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 bg-red-100 border border-red-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-heading font-bold text-red-800">
                      Ocorreu um erro na construção do roteiro
                    </h3>
                    <p className="text-red-700 text-sm max-w-md mx-auto">
                      Nossa inteligência artificial encontrou uma inconsistência nos dados ou o servidor excedeu o tempo limite.
                    </p>
                  </div>
                  <form action={async () => {
                    "use server"
                    const sup = await createClient()
                    const { data: current } = await sup.from('itineraries').select('content').eq('id', id).single()
                    await sup.from('itineraries').update({ content: { ...current?.content, status: 'analyzing' } }).eq('id', id)
                  }}>
                    <Button type="submit" variant="destructive" className="font-bold flex items-center gap-2 rounded-xl mt-4">
                      Tentar Novamente
                    </Button>
                  </form>
                </div>
              </div>
            ) : isGenerating ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-white rounded-2xl border-2 border-dashed border-[#E8833A]/30 p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 bg-[#E8833A]/10 border border-[#E8833A]/20 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="h-8 w-8 text-[#E8833A]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-heading font-bold text-foreground">
                      {status === 'analyzing' && t.hub.status.analyzing}
                      {status === 'mapping' && t.hub.status.mapping}
                      {status === 'generating' && t.hub.status.generating}
                      {status === 'finishing' && t.hub.status.finishing}
                    </h3>
                  </div>
                </div>
                <div className="space-y-10 opacity-60">
                   <div className="flex gap-4">
                     <Skeleton className="h-4 w-4 rounded-full mt-2" />
                     <Skeleton className="h-48 w-full rounded-2xl" />
                   </div>
                </div>
              </div>
            ) : (
              <div className="space-y-16 animate-in slide-in-from-bottom-4 duration-700">
                {route?.itinerary?.map((day: any, idx: number) => (
                  <section key={idx} className="space-y-8 relative">
                    {idx < route.itinerary.length - 1 && (
                      <div className="absolute left-2 top-8 bottom-[-40px] w-0.5 bg-dashed border-l-2 border-dashed border-slate-200" />
                    )}
                    <div className="flex items-center gap-4">
                      <div className="h-5 w-5 rounded-full border-4 border-[#E8833A] bg-white z-10" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-[#E8833A] uppercase tracking-[0.2em]">Dia {day.day}</span>
                        <h2 className="text-2xl font-heading font-black text-[#1C1917]">{day.day_title}</h2>
                      </div>
                    </div>
                    <div className="space-y-6 pl-8">
                      {day.items.map((item: any, itemIdx: number) => (
                        <ActivityCard key={itemIdx} item={item} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── AJUSTES TAB ─── */}
          <TabsContent value="ajustes" className="space-y-8">
            <div className="max-w-lg space-y-6">
              {/* Header */}
              <div className="space-y-1">
                <h3 className="text-xl font-heading font-bold text-foreground">
                  {lang === 'pt' ? 'Gerenciar Roteiro' : lang === 'es' ? 'Administrar Itinerario' : lang === 'fr' ? 'Gérer l\'Itinéraire' : lang === 'de' ? 'Reiseplan verwalten' : lang === 'it' ? 'Gestisci Itinerario' : lang === 'ja' ? '旅程の管理' : 'Manage Itinerary'}
                </h3>
                <p className="text-sm text-muted-foreground font-sans">
                  {lang === 'pt' ? 'Esta viagem será removida permanentemente e não poderá ser recuperada.' : lang === 'es' ? 'Este viaje será eliminado permanentemente y no podrá recuperarse.' : lang === 'fr' ? 'Ce voyage sera supprimé définitivement.' : lang === 'de' ? 'Diese Reise wird dauerhaft gelöscht.' : lang === 'it' ? 'Questo viaggio sarà eliminato definitivamente.' : lang === 'ja' ? 'この旅行は完全削除されます。' : 'This trip will be permanently deleted.'}
                </p>
              </div>

              {/* Delete Card */}
              <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/[0.03] p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold font-heading text-base text-foreground">
                      {lang === 'pt' ? 'Deletar Roteiro' : lang === 'es' ? 'Eliminar Itinerario' : lang === 'fr' ? 'Supprimer' : lang === 'de' ? 'Löschen' : lang === 'it' ? 'Elimina' : lang === 'ja' ? '削除する' : 'Delete Itinerary'}
                    </h4>
                    <p className="text-xs text-muted-foreground font-sans">
                      {lang === 'pt' ? 'Remover permanentemente do seu perfil' : lang === 'es' ? 'Eliminar permanentemente de tu perfil' : lang === 'fr' ? 'Supprimer définitivement' : lang === 'de' ? 'Dauerhaft entfernen' : lang === 'it' ? 'Elimina definitivamente' : lang === 'ja' ? '完全に削除' : 'Remove permanently from your profile'}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <DeleteTripClient tripId={id} destination={destination} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
