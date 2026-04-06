import { createClient } from "@/lib/supabase/server"
import { generateItinerary } from "@/app/actions/generate-itinerary"
import { NextResponse } from "next/server"

export const maxDuration = 60 // seconds — allow full generation time on Vercel

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 1. Verificar Sessão
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // 2. Atualizar status para analyzing
    const { itineraryId } = await req.json()
    if (!itineraryId) {
      return NextResponse.json({ error: "ID do roteiro obrigatório" }, { status: 400 })
    }

    // 3. Executar geração com await — manter serverless function viva
    // Sem await, a Vercel encerra o processo ao enviar a resposta.
    await generateItinerary(itineraryId)

    return NextResponse.json({ message: "Roteiro gerado com sucesso" }, { status: 200 })

  } catch (error: any) {
    console.error("[API/GENERATE] Erro crítico:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
