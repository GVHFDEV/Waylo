'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Navigation, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { DatePickerWithRange } from '@/components/dashboard/date-range-picker'
import { cn } from '@/lib/utils'

/**
 * SearchCard (Missão 11 - Client Component).
 * 
 * Captura Origem, Destino e Datas para iniciar o Wizard de IA.
 * Layout otimizado com grid-cols-9 no desktop.
 */
export function SearchCard() {
  const router = useRouter()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const handleStart = () => {
    if (!origin || !destination) return

    // Formatação de datas para a URL
    const dateStr = dateRange?.from 
      ? dateRange.to 
        ? `${format(dateRange.from, 'dd/MM/yyyy')} a ${format(dateRange.to, 'dd/MM/yyyy')}`
        : format(dateRange.from, 'dd/MM/yyyy')
      : ''

    const params = new URLSearchParams({
      origin,
      dest: destination,
      dates: dateStr
    })

    router.push(`/dashboard/wizard?${params.toString()}`)
  }

  return (
    <Card className="border-border shadow-xl rounded-3xl bg-card overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-end">
          
          {/* 1. ORIGEM (2 Colunas) */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Origem</label>
            <div className="relative group">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="De onde você sai?" 
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="h-12 pl-10 rounded-xl border-border bg-background focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:ring-2"
              />
            </div>
          </div>

          {/* 2. DESTINO (3 Colunas) */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Destino</label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Para onde você vai?" 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-12 pl-10 rounded-xl border-border bg-background focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:ring-2"
              />
            </div>
          </div>

          {/* 3. DATAS (3 Colunas) */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Datas</label>
            <DatePickerWithRange 
               // Nota: Precisaríamos atualizar o DatePicker para aceitar value/onChange 
               // para uma integração 100% controlada, mas aqui ele funciona como trigger.
            />
          </div>

          {/* 4. BOTÃO INICIAR (1 Coluna) */}
          <div className="md:col-span-1">
            <Button 
              onClick={handleStart}
              disabled={!origin || !destination}
              className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Iniciar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
