'use client'

import { useState } from 'react'
import { RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { regenerateActivity } from '@/app/actions/regenerate-item'
import { cn } from '@/lib/utils'

interface RegenerateButtonProps {
  itineraryId: string
  dayIdx: number
  itemIdx: number
  context: {
    destination: string
    budget: string
    dietary: string
    dealbreakers: string
    rejectedActivity: string
    period: string
  }
  className?: string
}

export function RegenerateButton({
  itineraryId,
  dayIdx,
  itemIdx,
  context,
  className
}: RegenerateButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSwap = async () => {
    if (loading) return
    setLoading(true)
    
    try {
      const result = await regenerateActivity(
        itineraryId,
        dayIdx,
        itemIdx,
        context
      )
      
      if (result.success) {
        // router.refresh() força o Next.js a revalidar os dados do servidor
        router.refresh()
      }
    } catch (error) {
      console.error("Erro ao trocar atividade:", error)
      alert("Houve um erro ao trocar a atividade. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "h-9 w-9 rounded-full bg-white border-2 border-primary shadow-md text-primary hover:bg-primary hover:text-white transition-all duration-300",
        loading && "cursor-not-allowed opacity-70",
        className
      )}
      onClick={handleSwap}
      disabled={loading}
      title="Trocar Atividade"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <RotateCcw className="h-5 w-5" />
      )}
    </Button>
  )
}
