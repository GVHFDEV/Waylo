'use client'

import { useEffect, useRef } from 'react'

interface GenerationTriggerProps {
  tripId: string
  status: string
}

/**
 * [V3.1] Gatilho Silencioso de Geração.
 * Este componente dispara uma chamada para a API Route de geração 
 * apenas se o status for 'analyzing' (estado inicial do Wizard).
 * 
 * Isso garante que o redirecionamento do Wizard seja instantâneo (< 2s)
 * e o processamento pesado ocorra enquanto o usuário já vê o Hub.
 */
export function GenerationTrigger({ tripId, status }: GenerationTriggerProps) {
  const hasTriggered = useRef(false)

  useEffect(() => {
    // Só disparar se estiver no estado inicial de análise e ainda não disparou nesta sessão
    if (status === 'analyzing' && !hasTriggered.current) {
      hasTriggered.current = true
      
      console.log(`[WAYLO] Disparando geração para ${tripId}...`)
      
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itineraryId: tripId })
      }).catch(err => {
        console.error('[WAYLO] Falha ao disparar geração:', err)
        // Opcional: retry logic ou alertar o usuário se falhar miseravelmente
      })
    }
  }, [tripId, status])

  return null // Componente invisível
}
