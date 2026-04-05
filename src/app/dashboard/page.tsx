import React from 'react'
import Image from 'next/image'
import { MapPin, Plane, Navigation, Compass } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SearchCard } from '@/components/dashboard/search-card'
import { getLanguageByCountry, getI18n, type LangCode } from '@/lib/i18n'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Explorer'

  // i18n: detecta língua do perfil
  let lang: LangCode = 'pt'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('country').eq('id', user.id).single()
    if (profile?.country) lang = getLanguageByCountry(profile.country)
  }
  const t = getI18n(lang)

  const inspirationDestinations = [
    { city: 'Paris', country: 'França', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800' },
    { city: 'Tóquio', country: 'Japão', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800' },
    { city: 'Rio de Janeiro', country: 'Brasil', image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=800' },
    { city: 'Roma', country: 'Itália', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800' },
  ]

  return (
    <div className="space-y-12">
      <section className="space-y-1">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground">
          {t.dashboard.greeting} <span className="text-primary">{userName}</span>
        </h1>
        <p className="text-lg text-muted-foreground font-sans max-w-xl">
          {t.dashboard.subtitle}
        </p>
      </section>

      <section className="relative w-full">
        <SearchCard />
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-foreground">{t.dashboard.inspiration}</h2>
          <Button variant="ghost" className="text-primary hover:text-primary-hover font-bold text-sm">{t.dashboard.see_all}</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {inspirationDestinations.map((dest, idx) => (
            <div key={idx} className="group relative flex flex-col space-y-3 cursor-pointer">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-md transition-all hover:shadow-xl">
                <Image 
                  src={dest.image} 
                  alt={dest.city}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-base md:text-lg text-foreground">{dest.city}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{dest.country}</p>
              </div>
              <Button size="icon" className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Compass className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>
      
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
        {[
          { icon: Plane, label: t.dashboard.my_flights, color: 'bg-blue-500/10 text-blue-600' },
          { icon: Navigation, label: t.dashboard.interactive_map, color: 'bg-green-500/10 text-green-600' },
          { icon: Compass, label: t.dashboard.explore_ai, color: 'bg-amber-500/10 text-amber-600' },
        ].map((item, idx) => (
          <Card key={idx} className="border-none bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", item.color)}>
                <item.icon className="h-6 w-6" />
              </div>
              <span className="font-bold text-lg text-foreground">{item.label}</span>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
