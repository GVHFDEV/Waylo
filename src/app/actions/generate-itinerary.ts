'use server'

import { Mistral } from "@mistralai/mistralai";
import { createClient } from "@/lib/supabase/server";
import { ItineraryResponseSchema } from "@/lib/schemas/itinerary";

/**
 * Helper para atualizar o status granular no banco de dados.
 */
async function updateStatus(supabase: any, id: string, status: string) {
  const { data: current } = await supabase.from('itineraries').select('content').eq('id', id).single();
  const content = current?.content || {};
  await supabase
    .from('itineraries')
    .update({ content: { ...content, status } })
    .eq('id', id);
}

export async function generateItinerary(itineraryId?: string, formData?: any) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("Chave de API da Mistral não configurada.");

  const mistral = new Mistral({ apiKey });
  const supabase = itineraryId ? await createClient() : null;

  // [V3.1] Trava de Concorrência: Só gera se o status for 'analyzing'
  if (itineraryId && supabase) {
    const { data: trip } = await supabase.from('itineraries').select('content').eq('id', itineraryId).single();
    const currentStatus = trip?.content?.status;
    
    // Se já estiver além do 'analyzing', ignoramos o novo gatilho
    if (currentStatus && currentStatus !== 'analyzing') {
      console.log(`[WAYLO] Geração já em andamento ou finalizada para ${itineraryId} (Status: ${currentStatus}). Abortando duplicata.`);
      return trip?.content;
    }
    
    await updateStatus(supabase, itineraryId, 'analyzing');
  }

  let payload = formData;
  if (!formData && itineraryId && supabase) {
    const { data: trip } = await supabase.from('itineraries').select('*').eq('id', itineraryId).single();
    if (trip) {
      payload = {
        destination: trip.destination,
        dates: `${trip.start_date} a ${trip.end_date}`,
        pace: trip.rhythm,
        budget: trip.budget,
        companion: trip.companion,
        additional_notes: trip.content?.additional_notes,
        dealbreakers: trip.content?.dealbreakers,
        vibes: trip.content?.vibes,
        dietary_restrictions: trip.content?.dietary_restrictions
      };
    }
  }

  if (!payload) throw new Error("Dados não encontrados para geração.");
  
  if (itineraryId && supabase) await updateStatus(supabase, itineraryId, 'mapping');

  // PROMPT OTIMIZADO (COMPRESSÃO ~30%)
  const prompt = `[W.A.Y.L.O. ENGINE V3.1 - HIGH PRECISION]
You are a silent travel architect. Output ONLY raw JSON. No markdown. No preamble.

[INPUT PROFILE]
Destino: ${payload.destination} | Datas: ${payload.dates}
Ritmo: ${payload.pace} | Orçamento: ${payload.budget}
Grupo: ${payload.companion} | Desejos: ${payload.additional_notes}
Dealbreakers: ${payload.dealbreakers} | Vibe: ${payload.vibes}
Dieta: ${payload.dietary_restrictions}

[CRITICAL RULES]
1. SUPREME DIRECTIVE: "Desejos" are laws. "Dealbreakers" are absolute bans. 
2. ACCESSIBILITY: If mobility is a concern, use ONLY accessible venues.
3. LANGUAGE: Keys in English. Values in pt-BR. Tone: Elite/Immersive.
4. LOGISTICS: Every day MUST have "Manhã", "Tarde", "Noite". No city-cross commutes in 4h blocks.
5. CULINARY: Real, verifiable places matching budget/diet. No generic names.
6. ANCHORS: One "anchor" activity per day. If anchor > 5h, use overflow in next period.
7. TIPS: 2+ specific, non-obvious, actionable "tip" items per day. No generic advice.
8. BANNED: "Ir ao aeroporto", "Fazer malas", "Check-in", "Acordar cedo".

[SCHEMA]
{
  "trip_summary": { "destination": "str", "total_days": 0, "dominant_vibe": "str", "important_notes": "str/null" },
  "hotels": [{ "name": "EXACT", "neighborhood": "str", "reason": "str", "price_per_night": "str" }],
  "itinerary": [{
    "day": 1, "day_title": "str", "anchor": "str", "fatigue_level": "low/medium/high",
    "items": [
      { "type": "activity", "period": "Manhã/Tarde/Noite", "description": "2-5 immersive sentences", "place_name": "EXACT", "estimated_cost": "str" },
      { "type": "tip", "content": "Dica do GUIA: [Actionable Insight]" }
    ]
  }]
}

[VERIFY BEFORE EXIT]
- All place_names are Google Maps-ready.
- All values in pt-BR.
- No trailing commas. Valid JSON object.`;

  if (itineraryId && supabase) await updateStatus(supabase, itineraryId, 'generating');

  const response = await mistral.chat.complete({
    model: "mistral-large-latest",
    temperature: 0.3,
    responseFormat: { type: "json_object" },
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "Generate the itinerary JSON now." }
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error("Motor Mistral falhou.");

  if (itineraryId && supabase) await updateStatus(supabase, itineraryId, 'finishing');

  try {
    const rawContent = typeof content === 'string' ? content : JSON.stringify(content);
    const parsedJSON = JSON.parse(rawContent);
    const validation = ItineraryResponseSchema.safeParse(parsedJSON);
    
    if (!validation.success) throw new Error("Erro na estrutura da IA.");

    if (itineraryId && supabase) {
      const { data: trip } = await supabase.from('itineraries').select('content').eq('id', itineraryId).single();
      await supabase
        .from('itineraries')
        .update({ content: { ...(trip?.content || {}), ...validation.data, status: 'ready' } })
        .eq('id', itineraryId);
    }

    return validation.data;
  } catch (e) {
    console.error("Erro Final:", e);
    throw e;
  }
}