'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function DeleteTripClient({ tripId, destination }: { tripId: string; destination: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [pending, setPending] = useState(false)

  const handleDelete = async () => {
    setPending(true)
    const supabase = createClient()
    await supabase.from('itineraries').delete().eq('id', tripId)
    setPending(false)
    router.push('/dashboard/trips')
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Apagar "{destination}"?
        </span>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="h-8 px-3 rounded-lg bg-destructive text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {pending ? '...' : 'Sim'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="h-8 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-colors"
        >
          Não
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="h-10 px-4 rounded-xl bg-destructive text-white text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
    >
      <Trash2 className="h-4 w-4" />
      {pending ? 'Apagando...' : 'Deletar'}
    </button>
  )
}
