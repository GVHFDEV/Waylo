'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'

export function RealtimeTripListener({ tripId, currentStatus }: { tripId: string, currentStatus: string }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    console.log("🛠️ [DEBUG] Listener Montado para ID:", tripId)
    // Se a viagem já estiver pronta, não precisamos escutar alterações
    if (currentStatus === 'ready') return;

    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'itineraries',
          filter: `id=eq.${tripId}`
        },
        (payload) => {
          const newStatus = payload.new.content?.status || 'generating';
          // Se o status mudou em relação ao atual, damos refresh para mostrar o progresso
          if (newStatus !== currentStatus) {
            console.log("🛰️ [CLIENT] Supabase detectou mudança: " + newStatus)
            router.refresh()
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 [DEBUG] Status da Conexão:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tripId, currentStatus, supabase, router])

  // Retorna nulo pois é apenas um "listener" invisível 
  // (ou podemos renderizar o Pulse Card aqui se quisermos, mas prefiro no page)
  return null
}
