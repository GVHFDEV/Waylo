'use server'

import { Mistral } from "@mistralai/mistralai";
import { createClient } from "@/lib/supabase/server";

export async function regenerateActivity(
  itineraryId: string,
  dayIdx: number,
  itemIdx: number,
  context: {
    destination: string,
    budget: string,
    dietary: string,
    dealbreakers: string,
    rejectedActivity: string,
    period: string
  }
) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("Chave de API da Mistral não configurada.");

  const mistral = new Mistral({ apiKey });
  const supabase = await createClient();

  // 1. Buscar o roteiro atual para garantir que temos os dados frescos
  const { data: itineraryData, error: fetchError } = await supabase
    .from('itineraries')
    .select('content')
    .eq('id', itineraryId)
    .single();

  if (fetchError || !itineraryData) {
    throw new Error("Não foi possível carregar o roteiro para atualização.");
  }

  const prompt = `Você é o motor de substituição da W.A.Y.L.O. (V2.0). 
O usuário não gostou da atividade: "${context.rejectedActivity}".
Gere uma NOVA sugestão de elite para o período ${context.period} em ${context.destination}.

CONTEXTO DO VIAJANTE:
- Orçamento: ${context.budget}
- Restrições Alimentares/Mobilidade: ${context.dietary}
- Dealbreakers (PROIBIDO): ${context.dealbreakers}

DIRETRIZES DE TEXTO (CRÍTICO):
1. NUNCA mencione que esta é uma alternativa ou que o usuário não gostou da anterior. 
2. Escreva como se esta fosse a escolha original e absoluta.
3. Descrição: Máximo de 2 frases curtas, impactantes e imersivas (pt-BR).
4. Tom: Sofisticado, sem pedidos de desculpa ou introduções.

REGRAS DE OURO:
1. Mantenha a mesma vizinhança/logística da atividade anterior para não quebrar o fluxo do dia.
2. Respeite estritamente o orçamento e as restrições.
3. Não sugira a mesma coisa que já foi rejeitada.

Retorne APENAS um objeto JSON puro no formato abaixo:

{
  "type": "activity",
  "period": "${context.period}",
  "description": "Ex: Explore as galerias de arte contemporânea do bairro, onde o design encontra a história local.",
  "place_name": "NOME EXATO E VERIFICÁVEL",
  "estimated_cost": "Custo total para o grupo"
}
`;

  const response = await mistral.chat.complete({
    model: "mistral-large-latest",
    temperature: 0.4,
    maxTokens: 2000,
    responseFormat: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error("Motor Mistral falhou ao gerar nova atividade.");

  const newActivity = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));

  // 2. Atualizar o objeto de conteúdo localmente
  const updatedContent = { ...itineraryData.content };
  if (updatedContent.itinerary && updatedContent.itinerary[dayIdx]) {
    updatedContent.itinerary[dayIdx].items[itemIdx] = newActivity;
  }

  // 3. Persistir no banco
  const { error: updateError } = await supabase
    .from('itineraries')
    .update({ content: updatedContent })
    .eq('id', itineraryId);

  if (updateError) {
    throw new Error("Falha ao salvar a nova atividade no banco de dados.");
  }

  return { success: true, newActivity };
}
