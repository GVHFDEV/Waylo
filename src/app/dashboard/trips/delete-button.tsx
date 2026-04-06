'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function DeleteTripButton({ tripId, destination }: { tripId: string; destination: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [pending, setPending] = useState(false)

  const handleDelete = async () => {
    setPending(true)
    const supabase = createClient()
    await supabase.from('itineraries').delete().eq('id', tripId)
    setPending(false)
    router.refresh()
  }

  // If confirmation modal is open, show it inline
  if (showConfirm) {
    return (
      <div className="inline-flex flex-col items-center gap-1">
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 space-y-3 animate-in fade-in scale-in-95 duration-200">
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            Apagar "{destination}"?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={pending}
              className="flex-1 h-8 rounded-lg bg-destructive text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {pending ? '...' : 'Sim'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 h-8 rounded-lg bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-colors"
            >
              Não
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="h-8 w-8 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center hover:bg-destructive/20 transition-colors"
      title="Apagar viagem"
    >
      {!pending && <Trash2 className="h-3.5 w-3.5 text-destructive" />}
    </button>
  )
}
