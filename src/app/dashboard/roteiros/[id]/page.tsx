import React from 'react'
import {
  MapPin,
  Calendar as CalendarIcon,
  ChevronLeft,
  Clock,
  Sunrise,
  Sun,
  Moon,
  Sparkles,
  Star,
  Quote,
  DollarSign,
  Navigation,
  RotateCcw,
  CheckCircle2,
  ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════════════════════ */
/*  FOURSQUARE API V3                                                     */
/* ═══════════════════════════════════════════════════════════════════════ */

interface FoursquareData {
  photoUrl: string | null
  address: string | null
  rating: number | null
  category: string | null
  tip: string | null
  mapsUrl: string
}

async function fetchPlaceData(
  placeName: string,
  destination: string
): Promise<FoursquareData> {
  const fallback: FoursquareData = {
    photoUrl: null,
    address: null,
    rating: null,
    category: null,
    tip: null,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName + ', ' + destination)}`,
  }

  const fsqKey = process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY
  console.log(`[FSQ] Chave presente: ${!!fsqKey}, place: "${placeName}"`)

  if (!fsqKey || !placeName) return fallback

  try {
    // 1. Buscar o local
    const searchRes = await fetch(
      `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(placeName)}&near=${encodeURIComponent(destination)}&limit=1&fields=fsq_id,name,location,rating,categories,tips`,
      {
        headers: { Authorization: fsqKey, Accept: 'application/json' },
        next: { revalidate: 86400 },
      }
    )

    console.log(`[FSQ] Search status: ${searchRes.status}`)
    if (!searchRes.ok) {
      console.error(`[FSQ] Search falhou:`, await searchRes.text())
      return fallback
    }

    const searchData = await searchRes.json()
    const place = searchData?.results?.[0]
    if (!place) {
      console.log(`[FSQ] Nenhum resultado para "${placeName}"`)
      return fallback
    }

    console.log(`[FSQ] Encontrado: ${place.name} (${place.fsq_id})`)

    const fsqId = place.fsq_id
    const formattedAddress = place.location?.formatted_address || place.location?.address || null
    const rating = place.rating ?? null
    const category = place.categories?.[0]?.name || null
    const tip = place.tips?.[0]?.text || null

    // 2. Buscar foto — prefix + "original" + suffix
    let photoUrl: string | null = null
    try {
      const photoRes = await fetch(
        `https://api.foursquare.com/v3/places/${fsqId}/photos?limit=1&sort=POPULAR`,
        {
          headers: { Authorization: fsqKey, Accept: 'application/json' },
          next: { revalidate: 86400 },
        }
      )
      console.log(`[FSQ] Photo status: ${photoRes.status}`)
      if (photoRes.ok) {
        const photos = await photoRes.json()
        if (photos?.[0]) {
          photoUrl = `${photos[0].prefix}original${photos[0].suffix}`
          console.log(`[FSQ] Foto: ${photoUrl}`)
        } else {
          console.log(`[FSQ] Sem fotos para ${placeName}`)
        }
      }
    } catch (e) {
      console.error(`[FSQ] Erro foto:`, e)
    }

    return { photoUrl, address: formattedAddress, rating, category, tip, mapsUrl: fallback.mapsUrl }
  } catch (err) {
    console.error('[FSQ] Erro geral:', err)
    return fallback
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  HELPERS VISUAIS                                                       */
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
  const full = Math.floor(stars5)
  const hasHalf = stars5 % 1 >= 0.5

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <Star key={i} className="h-3.5 w-3.5 text-primary fill-primary" />
        if (i === full && hasHalf) return (
          <div key={i} className="relative">
            <Star className="h-3.5 w-3.5 text-muted" />
            <div className="absolute inset-0 overflow-hidden w-[50%]">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
            </div>
          </div>
        )
        return <Star key={i} className="h-3.5 w-3.5 text-muted" />
      })}
      <span className="text-xs font-bold text-primary ml-1.5">{stars5.toFixed(1)}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  ACTIVITY CARD                                                         */
/* ═══════════════════════════════════════════════════════════════════════ */

async function ActivityCard({
  activity,
  destination,
  isLast,
}: {
  activity: any
  destination: string
  isLast: boolean
}) {
  const placeName = activity.place_name || activity.location || ''
  const fsq = await fetchPlaceData(placeName, destination)

  return (
    <div className="relative flex gap-5 md:gap-7">
      {/* Timeline lateral */}
      <div className="flex flex-col items-center shrink-0 pt-2">
        <div className="h-3 w-3 rounded-full bg-foreground border-[2px] border-background ring-2 ring-border z-10 shrink-0" />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>

      {/* Card */}
      <div className="flex-1 pb-8 group">
        <div className="bg-card rounded-2xl border-2 border-primary shadow-sm hover:shadow-lg hover:border-primary-hover transition-all duration-300 overflow-hidden">

          {/* FOTO DO LOCAL (Foursquare) ou placeholder discreto */}
          {fsq.photoUrl ? (
            <div className="relative w-full h-48 md:h-56 overflow-hidden">
              <Image
                src={fsq.photoUrl}
                alt={placeName}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, 800px"
              />
              {fsq.category && (
                <div className="absolute top-3 left-3">
                  <span className="bg-card/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-foreground px-3 py-1.5 rounded-full border border-border">
                    {fsq.category}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-20 bg-muted flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          <div className="p-5 md:p-6 space-y-4">
            {/* Período + Custo */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground">
                <PeriodIcon period={activity.period} />
                {activity.period}
              </span>
              {activity.estimated_cost && (
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {activity.estimated_cost}
                </span>
              )}
            </div>

            {/* Título: a ação */}
            <h4 className="text-lg md:text-xl font-heading font-bold text-foreground leading-snug">
              {activity.description}
            </h4>

            {/* Local (link Google Maps) */}
            {placeName && (
              <a
                href={fsq.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group/link"
              >
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="underline decoration-border underline-offset-4 group-hover/link:decoration-primary">
                  {placeName}
                </span>
                {fsq.address && (
                  <span className="text-[11px] text-muted-foreground ml-1 hidden md:inline">— {fsq.address}</span>
                )}
              </a>
            )}

            {/* Rating */}
            {fsq.rating && <RatingStars rating={fsq.rating} />}

            {/* Dica de usuário */}
            {fsq.tip && (
              <div className="flex items-start gap-2.5 pt-3 border-t border-border">
                <Quote className="h-4 w-4 text-primary/40 shrink-0 mt-0.5" />
                <p className="text-sm italic text-muted-foreground leading-relaxed line-clamp-2">
                  &ldquo;{fsq.tip}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  PÁGINA PRINCIPAL                                                      */
/* ═══════════════════════════════════════════════════════════════════════ */

export default async function ItineraryPage({ params }: { params: { id: string } }) {
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
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Roteiro não encontrado</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">Este roteiro pode ter sido removido ou o link está incorreto.</p>
        <Link href="/dashboard">
          <Button className="font-bold rounded-full px-6">Voltar para o Início</Button>
        </Link>
      </div>
    )
  }

  const route = itineraryData.content
  const destination = itineraryData.destination || route?.destination || 'Destino'

  return (
    <div className="flex flex-col min-h-screen">

      {/* ─── HERO ─── */}
      <header className="w-full pt-10 pb-8 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 space-y-5">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
            Meus Roteiros
          </Link>

          <div className="space-y-3">
            <h1 className="text-5xl md:text-7xl font-heading font-black tracking-tight leading-[0.9] text-foreground">
              {destination}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5">
              {(itineraryData.start_date || itineraryData.end_date) && (
                <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-full">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {itineraryData.start_date} — {itineraryData.end_date}
                </span>
              )}
              {itineraryData.companion && (
                <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-full capitalize">
                  {itineraryData.companion}
                </span>
              )}
              {itineraryData.rhythm && (
                <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-full capitalize">
                  {itineraryData.rhythm}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── TIMELINE ─── */}
      <main className="flex-1 max-w-3xl mx-auto px-4 w-full py-12">
        <div className="space-y-14">
          {route?.itinerary?.map((day: any, dayIdx: number) => (
            <section key={dayIdx} className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-foreground text-background flex items-center justify-center font-heading font-black text-xl shrink-0">
                  {day.day}
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Dia {day.day}</h2>
                  {day.date && <p className="text-xs font-bold uppercase tracking-widest text-primary">{day.date}</p>}
                </div>
              </div>

              <div className="ml-6">
                {day.activities?.map((activity: any, idx: number) => (
                  <ActivityCard
                    key={idx}
                    activity={activity}
                    destination={destination}
                    isLast={idx === (day.activities?.length ?? 0) - 1}
                  />
                ))}
              </div>

              {dayIdx < (route?.itinerary?.length ?? 0) - 1 && (
                <div className="ml-6 pl-[3px] flex flex-col gap-1.5 opacity-30">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                </div>
              )}
            </section>
          ))}
        </div>
      </main>

      {/* ─── FECHAMENTO ─── */}
      <footer className="border-t border-border">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="text-center space-y-3 mb-6">
            <Sparkles className="h-7 w-7 text-primary mx-auto" />
            <h3 className="text-2xl font-heading font-bold text-foreground">Seu roteiro está pronto!</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Revise as atividades e confirme quando estiver satisfeito.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" className="font-bold rounded-full px-6 gap-2">
                <RotateCcw className="h-4 w-4" /> Refazer Roteiro
              </Button>
            </Link>
            <Button className="font-bold rounded-full px-6 gap-2">
              <CheckCircle2 className="h-4 w-4" /> Confirmar e Salvar Viagem
            </Button>
          </div>
        </div>
      </footer>

    </div>
  )
}
