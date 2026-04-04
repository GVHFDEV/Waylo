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

  // [W.A.Y.L.O. ENGINE V3.2 - ULTRA-COMPRESSED DIRECT]
  const prompt = `[SYSTEM: TRAVEL ARCHITECT | TONE: DIRECT ELITE CONCIERGE]
Output ONLY raw JSON. No markdown. No preamble.

[PROFILE]
Destino: ${payload.destination} | Datas: ${payload.dates}
Ritmo: ${payload.pace} | Orçamento: ${payload.budget}
Grupo: ${payload.companion} | Desejos: ${payload.additional_notes}
Dealbreakers: ${payload.dealbreakers} | Vibe: ${payload.vibes}
Dieta: ${payload.dietary_restrictions}

[CRITICAL INSTRUCTIONS]
1. ONE PLACE RULE: PROIBIDO sugerir múltiplos destinos geográficos numa única 'activity'. Cada item deve focar num único 'place_name' verificável. 
2. BREVITY: Descrições: MÁXIMO 3 frases curtas e impactantes. Seja direto, elimine adjetivos excessivos.
3. LOGISTICS: 3 períodos (Manhã, Tarde, Noite) por dia. Geograficamente agrupados (<15min trânsito).
4. SUPREME: "Desejos" são leis. "Dealbreakers" são banimentos absolutos.
5. LANGUAGE: Keys: English. Values: pt-BR.
6. ANCHOR: Exactly 1 per day.
7. TIPS: 2+ hacks locais acionáveis por dia.

[SCHEMA]
{
  "trip_summary": { "destination": "str", "total_days": 0, "dominant_vibe": "str", "important_notes": "str/null" },
  "hotels": [{ "name": "EXACT", "neighborhood": "str", "reason": "3 phrases max", "price_per_night": "str" }],
  "itinerary": [{
    "day": 1, "day_title": "str", "anchor": "str", "fatigue_level": "low/medium/high",
    "items": [
      { "type": "activity", "period": "Manhã/Tarde/Noite", "description": "Max 3 direct sentences", "place_name": "EXACT GOOGLE-READY", "estimated_cost": "str" },
      { "type": "tip", "content": "Dica do GUIA: [Actionable Insight]" }
    ]
  }]
}
`;

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