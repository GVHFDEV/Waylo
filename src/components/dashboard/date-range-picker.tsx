'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerWithRangeProps {
  className?: string
}

/**
 * Componente DatePickerWithRange Ajustado (Missão 07).
 * 
 * Correções de UX:
 * - Largura do PopoverContent garantida com w-auto.
 * - Padding p-3 no calendário para evitar "encavalamento" de texto.
 * - Espaçamento extra nos dias da semana para legibilidade máxima.
 */
export function DatePickerWithRange({ className }: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  })

  const formatDateDisplay = (dateRange: DateRange | undefined) => {
    if (!dateRange?.from) return 'Quando?'

    const fromStr = format(dateRange.from, "dd 'de' MMM", { locale: ptBR })
    
    if (dateRange.to) {
      const toStr = format(dateRange.to, "dd 'de' MMM", { locale: ptBR })
      return `${fromStr} - ${toStr}`
    }

    return fromStr
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal h-12 rounded-xl border-border bg-background px-4 hover:bg-muted/50 transition-colors group relative',
              !date?.from && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-sans truncate">
              {formatDateDisplay(date)}
            </span>
            
            {date?.from && (
              <div 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                onClick={(e) => {
                  e.stopPropagation()
                  setDate(undefined)
                }}
              >
                <X className="h-3 w-3" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 rounded-2xl shadow-2xl border-border bg-card animate-in fade-in zoom-in duration-200" 
          align="start"
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from || new Date()}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
            locale={ptBR}
            className="p-3" // Missão 07: Padding explicitamente adicionado
            classNames={{
              // Espaçamento forçado para os dias da semana para evitar encavalamento
              weekday: "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
              table: "w-full border-collapse space-y-1",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
