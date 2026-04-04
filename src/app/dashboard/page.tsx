import React from 'react'
import Image from 'next/image'
import { MapPin, Plane, Navigation, Compass } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SearchCard } from '@/components/dashboard/search-card'

/**
 * Página Inicial do Dashboard (Explorar).
 * 
 * Foca em uma experiência "Search-First":
 * - Header de boas-vindas personalizado.
 * - Search Card (Cérebro) centralizado.
 * - Grid de inspiração com destinos premium.
 */
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Viajante'

  const inspirationDestinations = [
    { city: 'Paris', country: 'França', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800' },
    { city: 'Tóquio', country: 'Japão', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800' },
    { city: 'Rio de Janeiro', country: 'Brasil', image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=800' },
    { city: 'Roma', country: 'Itália', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800' },
  ]

  return (
    <div className="space-y-12">
      {/* 
        1. HEADER DE BOAS-VINDAS 
        Personalizado com o nome do usuário.
      */}
      <section className="space-y-1">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground">
          Olá, <span className="text-primary">{userName}</span>
        </h1>
        <p className="text-lg text-muted-foreground font-sans max-w-xl">
          Para onde vamos agora? Sua próxima jornada começa aqui.
        </p>
      </section>

      {/* 
        2. SEARCH CARD (O "CÉREBRO" - Refatorado Missão 11) 
        Captura Origem, Destino e Datas via Client Component.
      */}
      <section className="relative w-full">
        <SearchCard />
      </section>

      {/* 
        3. SEÇÃO DE INSPIRAÇÃO 
        Grid de destinos premium com imagens.
      */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-foreground">Para onde vamos agora?</h2>
          <Button variant="ghost" className="text-primary hover:text-primary-hover font-bold text-sm">Ver todos</Button>
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
      
      {/* 4. ACTIONS MOCK (Footer do dashboard) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
        {[
          { icon: Plane, label: 'Meus Voos', color: 'bg-blue-500/10 text-blue-600' },
          { icon: Navigation, label: 'Mapa Interativo', color: 'bg-green-500/10 text-green-600' },
          { icon: Compass, label: 'Explorar IA', color: 'bg-amber-500/10 text-amber-600' },
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
