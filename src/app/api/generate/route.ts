import { createClient } from "@/lib/supabase/server"
import { after } from "next/server"
import { NextResponse } from "next/server"
import { Mistral } from "@mistralai/mistralai"
import { buildItineraryPrompt, parseAndValidateItinerary, type ItineraryPayload } from "@/lib/itinerary-prompt"

async function runItineraryGeneration(itineraryId: string) {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) throw new Error("Chave de API da Mistral não configurada.")

  const mistral = new Mistral({ apiKey })
  const supabase = await createClient()

  // Fetch trip data
  const { data: trip } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", itineraryId)
    .single()

  if (!trip) {
    return
  }

  const payload: ItineraryPayload = {
    destination: trip.destination,
    dates: `${trip.start_date} a ${trip.end_date}`,
    pace: trip.rhythm,
    budget: trip.budget,
    companion: trip.companion,
    additional_notes: trip.content?.additional_notes,
    dealbreakers: trip.content?.dealbreakers,
    vibes: trip.content?.vibes,
    dietary_restrictions: trip.content?.dietary_restrictions,
    selected_hotel: trip.content?.selected_hotel || null,
  }

  const prompt = buildItineraryPrompt(payload)

  try {
    const response = await mistral.chat.complete({
      model: "mistral-large-latest",
      temperature: 0.4,
      maxTokens: 16000,
      responseFormat: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: "Generate the itinerary now based on the provided logs and rules.",
        },
      ],
    })

    const content = response.choices?.[0]?.message?.content
    if (!content) throw new Error("Motor Mistral falhou ao gerar conteúdo.")

    const rawContent =
      typeof content === "string" ? content : JSON.stringify(content)
    const validation = parseAndValidateItinerary(rawContent)

    const currentContent = trip?.content || {}

    await supabase
      .from("itineraries")
      .update({
        content: { ...currentContent, ...validation, status: "ready" },
      })
      .eq("id", itineraryId)
  } catch (e: any) {
    console.error("[GENERATE] Erro na geração:", e)

    // Retry once with lower temperature if it was a validation error
    if (e.message === "Estrutura inválida.") {
      try {
        const response2 = await mistral.chat.complete({
          model: "mistral-large-latest",
          temperature: 0.3,
          maxTokens: 16000,
          responseFormat: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Return ONLY a valid JSON matching the previous itinerary schema. Fix any validation errors. No markdown, no preamble. Just JSON.",
            },
            {
              role: "user",
              content: "Fix the validation and return valid JSON.",
            },
          ],
        })

        const content2 = response2.choices?.[0]?.message?.content
        if (content2) {
          const raw2 =
            typeof content2 === "string" ? content2 : JSON.stringify(content2)
          try {
            const retry = parseAndValidateItinerary(raw2)
            await supabase
              .from("itineraries")
              .update({
                content: { ...trip.content, ...retry, status: "ready" },
              })
              .eq("id", itineraryId)
            return
          } catch {}
        }
      } catch {}
    }

    await supabase
      .from("itineraries")
      .update({
        content: { ...trip.content, status: "error" },
      })
      .eq("id", itineraryId)
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { itineraryId } = await req.json()
    if (!itineraryId) {
      return NextResponse.json(
        { error: "ID do roteiro obrigatório" },
        { status: 400 }
      )
    }

    // 1. Set status to "generating" IMMEDIATELY
    await supabase
      .from("itineraries")
      .update({ content: { status: "generating" } })
      .eq("id", itineraryId)

    // 2. Fire AI generation in background — response returns in <100ms
    after(async () => {
      await runItineraryGeneration(itineraryId)
    })

    return NextResponse.json(
      { message: "Geração iniciada", itineraryId },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[API/GENERATE] Erro crítico:", error)
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    )
  }
}
