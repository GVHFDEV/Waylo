import Link from 'next/link'
import { MapPin, CalendarDays, Users, Wallet, ArrowRight, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getLanguageByCountry, getI18n, type LangCode } from '@/lib/i18n'
import { DeleteTripButton } from './delete-button'

// Companion labels
const companionMap: Record<string, string> = {
  solo: 'Solo',
  couple: 'Casal',
  friends: 'Amigos',
  family: 'Família',
}

// Budget display labels
const budgetMap: Record<string, string> = {
  budget: 'Econômico',
  comfort: 'Intermediário',
  luxury: 'Luxo',
}

// Rhythm display labels
const rhythmMap: Record<string, string> = {
  relax: 'Relaxado',
  balanced: 'Equilibrado',
  intense: 'Intenso',
}

export default async function MyTripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let lang: LangCode = 'pt'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('country').eq('id', user.id).single()
    if (profile?.country) lang = getLanguageByCountry(profile.country)
  }
  const t = getI18n(lang)

  // Fetch trips for this user
  const { data: trips } = await supabase
    .from('itineraries')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="space-y-2">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground">
          {lang === 'pt' ? 'Minhas Viagens' : lang === 'es' ? 'Mis Viajes' : lang === 'fr' ? 'Mes Voyages' : lang === 'de' ? 'Meine Reisen' : lang === 'it' ? 'I Miei Viaggi' : lang === 'ja' ? 'マイトラベル' : 'My Trips'}
        </h1>
        <p className="text-lg text-muted-foreground font-sans max-w-xl">
          {lang === 'pt' ? 'Todos os seus roteiros em um só lugar.' : lang === 'es' ? 'Todos tus itinerarios en un solo lugar.' : lang === 'fr' ? 'Tous vos itinéraires en un seul endroit.' : lang === 'de' ? 'Alle Ihre Reisepläne an einem Ort.' : lang === 'it' ? 'Tutti i tuoi itinerari in un posto.' : lang === 'ja' ? 'すべての旅程をひとまとめに。' : 'All your itineraries in one place.'}
        </p>
      </section>

      {/* Trips Grid */}
      {trips && trips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {trips.map((trip) => (
            <div key={trip.id} className="group relative block">
              <Link
                href={`/dashboard/viagem/${trip.id}`}
                className="block"
              >
                <article className="relative flex flex-col rounded-2xl border-2 border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.01] h-full">
                  {/* Top accent bar */}
                  <div className="h-1.5 bg-gradient-to-r from-primary via-[#D4722E] to-[#F5A66A] w-full" />

                  {/* Delete Button - top-right, below accent bar */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <DeleteTripButton tripId={trip.id} destination={trip.destination} />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-5 space-y-4">
                    {/* Destination */}
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-1" />
                        <h3 className="font-bold font-heading text-xl text-foreground group-hover:text-primary transition-colors truncate">
                          {trip.destination}
                        </h3>
                      </div>

                      {/* Date range */}
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs font-sans">
                          {trip.start_date} — {trip.end_date}
                        </span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {trip.start_date && trip.end_date && (
                        <Badge>
                          {calculateDays(trip.start_date, trip.end_date)} {lang === 'pt' ? 'Dias' : lang === 'es' ? 'Días' : lang === 'fr' ? 'Jours' : lang === 'de' ? 'Tage' : lang === 'it' ? 'Giorni' : lang === 'ja' ? '日間' : 'Days'}
                        </Badge>
                      )}
                      {trip.budget && (
                        <Badge>
                          <Wallet className="h-3 w-3 mr-1" /> {budgetMap[trip.budget] || trip.budget}
                        </Badge>
                      )}
                      {trip.companion && (
                        <Badge>
                          <Users className="h-3 w-3 mr-1" /> {companionMap[trip.companion] || trip.companion}
                        </Badge>
                      )}
                      {trip.rhythm && (
                        <Badge variant="muted">
                          {rhythmMap[trip.rhythm] || trip.rhythm}
                        </Badge>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
                      <StatusBadge status={trip.content?.status || 'analyzing'} t={t} />
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </article>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-xl font-heading font-bold text-foreground">
              {lang === 'pt' ? 'Nenhuma viagem ainda' : lang === 'es' ? 'Aún no hay viajes' : lang === 'fr' ? 'Pas encore de voyages' : lang === 'de' ? 'Noch keine Reisen' : lang === 'it' ? 'Nessun viaggio ancora' : lang === 'ja' ? 'まだ旅行がありません' : 'No trips yet'}
            </h3>
            <p className="text-sm text-muted-foreground font-sans">
              {lang === 'pt' ? 'Crie sua primeira viagem e deixe a IA construir o roteiro perfeito para você.' : lang === 'es' ? 'Crea tu primer viaje y deja que la IA construya el itinerario perfecto para ti.' : lang === 'fr' ? 'Créez votre premier voyage et laissez l\'IA construire l\'itinéraire parfait pour vous.' : lang === 'de' ? 'Erstellen Sie Ihre erste Reise und lassen Sie die KI den perfekten Reiseplan erstellen.' : lang === 'it' ? 'Crea il tuo primo viaggio e lascia che l\'IA costruisca l\'itinerario perfetto per te.' : lang === 'ja' ? '最初の旅行を作成して、AIがあなただけの完璧な旅程を考えます。' : 'Create your first trip and let AI build the perfect itinerary for you.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/* INLINE SUBCOMPONENTS                                          */
/* ═══════════════════════════════════════════════════════════════ */

function Badge({ children, className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'muted' }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide',
        variant === 'default'
          ? 'bg-accent text-accent-foreground'
          : 'bg-muted text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function StatusBadge({ status, t }: { status: string; t: any }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    ready: { label: t.hub.ready, color: 'bg-green-500/10 text-green-700' },
    analyzing: { label: t.hub.status.analyzing, color: 'bg-amber-500/10 text-amber-700' },
    mapping: { label: t.hub.status.mapping, color: 'bg-blue-500/10 text-blue-700' },
    generating: { label: t.hub.status.generating, color: 'bg-purple-500/10 text-purple-700' },
    finishing: { label: t.hub.status.finishing, color: 'bg-teal-500/10 text-teal-700' },
    error: { label: 'Erro', color: 'bg-red-500/10 text-red-700' },
  }

  const config = statusConfig[status] || statusConfig.analyzing

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold', config.color)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {config.label}
    </span>
  )
}

function calculateDays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return diff > 0 ? diff : 0
}
