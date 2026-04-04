import { createClient } from "@/lib/supabase/server"
import { generateItinerary } from "@/app/actions/generate-itinerary"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // 1. Verificar Sessão
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // 2. Obter Itinerary ID
    const { itineraryId } = await req.json()
    if (!itineraryId) {
      return NextResponse.json({ error: "ID do roteiro obrigatório" }, { status: 400 })
    }

    // 3. Disparar Geração (Background)
    // Nota: Como não estamos dando 'await' na geração completa aqui, 
    // respondemos 202 Accepted. O listener Realtime cuidará do resto.
    generateItinerary(itineraryId).catch(err => {
      console.error(`[API API/GENERATE] Erro na geração para ${itineraryId}:`, err)
    })

    return NextResponse.json({ message: "Geração iniciada em background" }, { status: 202 })
    
  } catch (error: any) {
    console.error("[API API/GENERATE] Erro crítico:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
