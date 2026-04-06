'use server'

import { Mistral } from "@mistralai/mistralai";
import { createClient } from "@/lib/supabase/server";
import { buildItineraryPrompt, parseAndValidateItinerary, type ItineraryPayload } from "@/lib/itinerary-prompt";

export async function generateItinerary(itineraryId?: string, formData?: any) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("Chave de API da Mistral não configurada.");

  const mistral = new Mistral({ apiKey });
  const supabase = itineraryId ? await createClient() : null;

  let payload: ItineraryPayload;
  if (formData) {
    payload = formData;
  } else if (itineraryId && supabase) {
    const { data: trip } = await supabase.from('itineraries').select('*').eq('id', itineraryId).single();
    if (!trip) throw new Error("Roteiro não encontrado.");
    payload = {
      destination: trip.destination,
      dates: `${trip.start_date} a ${trip.end_date}`,
      pace: trip.rhythm,
      budget: trip.budget,
      companion: trip.companion,
      additional_notes: trip.content?.additional_notes,
      dealbreakers: trip.content?.dealbreakers,
      vibes: trip.content?.vibes,
      dietary_restrictions: trip.content?.dietary_restrictions,
      selected_hotel: trip.content?.selected_hotel || null
    };
  } else {
    throw new Error("Dados de formulário ou ID de viagem não fornecidos.");
  }

  const prompt = buildItineraryPrompt(payload);

  const response = await mistral.chat.complete({
    model: "mistral-large-latest",
    temperature: 0.4,
    maxTokens: 16000,
    responseFormat: { type: "json_object" },
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "Generate the itinerary now based on the provided logs and rules." }
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error("Motor Mistral falhou ao gerar conteúdo.");

  try {
    const rawContent = typeof content === 'string' ? content : JSON.stringify(content);
    const validation = parseAndValidateItinerary(rawContent);

    if (itineraryId && supabase) {
      const { data: trip } = await supabase.from('itineraries').select('content').eq('id', itineraryId).single();
      const currentContent = trip?.content || {};

      await supabase
        .from('itineraries')
        .update({
          content: { ...currentContent, ...validation, status: 'ready' }
        })
        .eq('id', itineraryId);
    }

    return validation;
  } catch (e: any) {
    console.error("Erro na validação/parse do JSON gerado:", e);
    if (itineraryId && supabase) {
      const { data: trip } = await supabase.from('itineraries').select('content').eq('id', itineraryId).single();
      const content = trip?.content || {};
      await supabase.from('itineraries').update({ content: { ...content, status: 'error' } }).eq('id', itineraryId);
    }
    throw e;
  }
}
