'use server'

import Groq from "groq-sdk";

export async function generateItinerary(formData: any) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Chave de API do Groq não configurada no .env.local.");
  }

  const groq = new Groq({ apiKey });

  const prompt = `Atue como um guia de turismo de luxo local. 
Gere um roteiro de viagem de ${formData.origin} para ${formData.destination} para as datas: ${formData.dates}.
Ritmo: ${formData.pace}.

REGRA DE OURO: Use apenas nomes REAIS e famosos de locais. Na chave "place_name", coloque apenas o nome do estabelecimento e a cidade (Ex: "Museu Inhotim, Brumadinho" ou "Restaurante Aprazível, Rio de Janeiro"). NÃO invente endereços.

ESTRUTURA JSON OBRIGATÓRIA:
{
  "flights": [...],
  "hotels": [...],
  "itinerary": [
    {
      "day": 1, 
      "activities": [
        {
          "period": "Manhã", 
          "description": "Uma frase convidativa sobre a atividade", 
          "place_name": "NOME REAL DO LOCAL", 
          "estimated_cost": "R$ ..."
        }
      ]
    }
  ]
}
Gere o roteiro para TODOS os dias da viagem solicitada.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Você é um assistente de viagens de elite. Você responde única e exclusivamente em formato JSON estruturado."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "{}";
    return JSON.parse(responseText);

  } catch (error: any) {
    console.error("ERRO REAL NO SERVIDOR GROQ:", error);
    if (error.message?.includes('429')) {
      throw new Error("Limite de requisições do Groq atingido. Aguarde alguns instantes.");
    }
    throw new Error(`Falha na infraestrutura de IA: ${error.message}`);
  }
}