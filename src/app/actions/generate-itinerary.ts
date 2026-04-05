'use server'

import { Mistral } from "@mistralai/mistralai";
import { createClient } from "@/lib/supabase/server";
import { ItineraryResponseSchema } from "@/lib/schemas/itinerary";
import { getLanguageByCountry } from "@/lib/i18n";

async function updateStatus(supabase: any, id: string, status: string) {
  const { data: current } = await supabase.from('itineraries').select('content').eq('id', id).single();
  const content = current?.content || {};
  await supabase.from('itineraries').update({ content: { ...content, status } }).eq('id', id);
}

export async function generateItinerary(itineraryId?: string, formData?: any) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("Chave de API não configurada.");

  const mistral = new Mistral({ apiKey });
  const supabase = itineraryId ? await createClient() : null;

  // [V2.0] Idioma Adaptativo
  let userLanguage = 'Português (Brasil)';
  if (itineraryId && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('country').eq('id', user.id).single();
      const langCode = getLanguageByCountry(profile?.country || 'BR');
      userLanguage = langCode === 'pt' ? 'Português (Brasil)' : 'English';
    }
  }

  if (itineraryId && supabase) {
    const { data: trip } = await supabase.from('itineraries').select('content').eq('id', itineraryId).single();
    if (trip?.content?.status && (trip?.content?.status === 'generating' || trip?.content?.status === 'finishing' || trip?.content?.status === 'ready')) {
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
        pace: trip.rhythm, budget: trip.budget,
        companion: trip.companion,
        additional_notes: trip.content?.additional_notes,
        dealbreakers: trip.content?.dealbreakers,
        vibes: trip.content?.vibes,
        dietary_restrictions: trip.content?.dietary_restrictions,
        selected_hotel: trip.content?.selected_hotel
      };
    }
  }

  if (!payload) throw new Error("Dados não encontrados.");
  if (itineraryId && supabase) await updateStatus(supabase, itineraryId, 'mapping');

  // [W.A.Y.L.O. ENGINE V3.4 - MULTI-LANGUAGE | ELITE CONCIERGE]
  const prompt = `[SYSTEM: TRAVEL ARCHITECT | TONE: ELITE CONCIERGE]
Output ONLY raw JSON. No markdown.

[CRITICAL INSTRUCTIONS]
1. LANGUAGE: Keys in English. Values in ${userLanguage}.
2. HOTEL ÂNCORA: ${payload.selected_hotel || 'A definir'}.
3. LEI DO LOCAL ÚNICO: Cada activity deve ter EXATAMENTE UM place_name geográfico.
4. MAX BREVITY: Descrições em no máximo 2 frases diretas.
5. NO MARKDOWN: Texto puro apenas.

[PROFILE]
Destino: ${payload.destination} | Datas: ${payload.dates}
Ritmo: ${payload.pace} | Orçamento: ${payload.budget}
Grupo: ${payload.companion} | Desejos: ${payload.additional_notes}

[SCHEMA]
{
  "trip_summary": { "destination": "str", "total_days": 0, "dominant_vibe": "str", "important_notes": "str/null" },
  "hotels": [{ "name": "EXACT", "neighborhood": "str", "reason": "2 sentences max", "price_per_night": "str" }],
  "itinerary": [{
    "day": 1, "day_title": "str", "anchor": "str", "fatigue_level": "low/medium/high",
    "items": [
      { "type": "activity", "period": "Manhã/Tarde/Noite", "description": "Max 1-2 direct sentences", "place_name": "EXACT GOOGLE-READY", "estimated_cost": "str" },
      { "type": "tip", "content": "Dica: [Actionable Insight]" }
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
      { role: "user", content: `Generate JSON in ${userLanguage}. Include hotel anchor: ` + (payload.selected_hotel || "Not defined.") }
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error("Motor falhou.");

  if (itineraryId && supabase) await updateStatus(supabase, itineraryId, 'finishing');

  try {
    const rawContent = typeof content === 'string' ? content : JSON.stringify(content);
    const parsedJSON = JSON.parse(rawContent);
    const validation = ItineraryResponseSchema.safeParse(parsedJSON);
    
    if (!validation.success) throw new Error("Estrutura inválida.");

    if (itineraryId && supabase) {
      const { data: currentTrip } = await supabase.from('itineraries').select('content').eq('id', itineraryId).single();
      const finalContent = { ...currentTrip?.content, ...validation.data, status: 'ready' };
      await supabase.from('itineraries').update({ content: finalContent }).eq('id', itineraryId);
      console.log(`🟢 [SERVER] Geração concluída (${userLanguage}).`);
    }
    return validation.data;
  } catch (e) { throw e; }
}