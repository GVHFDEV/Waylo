'use client'

import React, { useState, useEffect } from 'react'
import { MapPin, Clock, Sunrise, Sun, Moon, Sparkles, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RegenerateButton } from '@/components/itinerary/RegenerateButton'
import { Skeleton } from '@/components/ui/skeleton'

/* ═══════════════════════════════════════════════════════════════════════ */
/* HELPERS                                                               */
/* ═══════════════════════════════════════════════════════════════════════ */

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function PeriodIcon({ period }: { period: string }) {
  const p = period?.toLowerCase() ?? ''
  if (p.includes('manhã') || p.includes('manha') || p.includes('morning') || p.includes('mañana') || p.includes('matin') || p.includes('morgen') || p.includes('mattina')) return <Sunrise className="h-3.5 w-3.5" />
  if (p.includes('tarde') || p.includes('afternoon') || p.includes('après-midi') || p.includes('nachmittag') || p.includes('pomeriggio')) return <Sun className="h-3.5 w-3.5" />
  if (p.includes('noite') || p.includes('night') || p.includes('evening') || p.includes('noche') || p.includes('soir') || p.includes('abend') || p.includes('sera')) return <Moon className="h-3.5 w-3.5" />
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

/* ═══════════════════════════════════════════════════════════════════════ */
/* COMPONENTE PRINCIPAL (CLIENT)                                         */
/* ═══════════════════════════════════════════════════════════════════════ */

export function ActivityCard({ item, destination, isLast, itineraryId, dayIdx, itemIdx, userPreferences }: any) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fsq, setFsq] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const activity = item || {}
  const isTip = activity.type === 'tip'
  const placeName = activity.place_name || activity.location || ''
  const description = activity.description || activity.content || ''

  useEffect(() => {
    async function loadData() {
      if (!placeName) {
        setLoading(false)
        return
      }

      try {
        // Chamada para API de Rota do Next.js ou Server Actions específicas (Otimizado)
        // Aqui simulamos a lógica interna para manter a simplicidade na migração rápida
        
        const [imgRes, fsqRes] = await Promise.all([
          fetch(`/api/itinerary/image?place=${encodeURIComponent(placeName)}&dest=${encodeURIComponent(destination)}&desc=${encodeURIComponent(description)}`),
          fetch(`/api/itinerary/place?place=${encodeURIComponent(placeName)}&dest=${encodeURIComponent(destination)}`)
        ])

        if (imgRes.ok) setImageUrl((await imgRes.json()).url)
        if (fsqRes.ok) setFsq(await fsqRes.json())
      } catch (err) {
        console.error('Erro ao carregar dados do card:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [placeName, destination, description])

  const displayImage = imageUrl || `https://picsum.photos/seed/${simpleHash(placeName)}/800/400`
  const mapsUrl = fsq?.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName + ' ' + (destination || ''))}`

  if (isTip) {
    return (
      <div className="relative flex gap-5 md:gap-7">
        <div className="flex flex-col items-center shrink-0 pt-2">
          <div className="h-3 w-3 rounded-full bg-accent border-[2px] border-background ring-2 ring-border z-10 shrink-0" />
          {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
        </div>
        <div className="flex-1 pb-8">
          <div className="bg-[#E8833A]/5 rounded-2xl border-2 border-[#E8833A]/20 p-5 md:p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-border shrink-0">
                <Sparkles className="h-5 w-5 text-[#E8833A]" />
              </div>
              <div className="flex-1">
                <h4 className="text-[#E8833A] text-sm font-bold font-heading mb-1 uppercase tracking-widest">Waylo Tip</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex gap-5 md:gap-7">
      <div className="flex flex-col items-center shrink-0 pt-2">
        <div className="h-3 w-3 rounded-full bg-foreground border-[2px] border-background ring-2 ring-border z-10 shrink-0" />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      <div className="flex-1 pb-8 group">
        <div className="bg-card rounded-2xl border-2 border-primary shadow-sm hover:shadow-lg hover:border-primary-hover transition-all duration-300 overflow-hidden">
          <div className="relative w-full h-48 md:h-56 overflow-hidden bg-muted">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={displayImage} 
                alt={placeName} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
            )}
            
            {fsq?.category && (
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-card/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-foreground px-3 py-1.5 rounded-full border border-border">
                  {fsq.category}
                </span>
              </div>
            )}
            
            <div className="absolute top-3 right-3 z-10 group-hover:opacity-100 opacity-60 transition-opacity">
              <RegenerateButton 
                itineraryId={itineraryId} 
                dayIdx={dayIdx} 
                itemIdx={itemIdx} 
                context={{ 
                  destination: destination || '', 
                  budget: userPreferences?.budget || '', 
                  dietary: userPreferences?.dietary || '', 
                  dealbreakers: userPreferences?.dealbreakers || '', 
                  rejectedActivity: placeName, 
                  period: activity?.period || '' 
                }} 
              />
            </div>
          </div>

          <div className="p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground">
                <PeriodIcon period={activity.period} />{activity.period}
              </span>
              {activity.estimated_cost && (
                <span className="text-[11px] font-semibold text-muted-foreground">{activity.estimated_cost}</span>
              )}
            </div>
            
            <h4 className="text-lg md:text-xl font-heading font-bold text-foreground leading-snug">{description}</h4>
            
            {placeName && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group/link">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="underline decoration-border underline-offset-4 group-hover/link:decoration-primary">{placeName}</span>
              </a>
            )}

            {fsq?.rating && <RatingStars rating={fsq.rating} />}
            
            {fsq?.tip && (
              <div className="flex items-start gap-2.5 pt-3 border-t border-border">
                <Quote className="h-4 w-4 text-primary/40 shrink-0 mt-0.5" />
                <p className="text-sm italic text-muted-foreground leading-relaxed line-clamp-2">“{fsq.tip}”</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
