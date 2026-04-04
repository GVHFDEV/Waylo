'use server'

import Groq from "groq-sdk";

export async function generateItinerary(formData: any) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Chave de API do Groq não configurada.");

  const groq = new Groq({ apiKey });

  const prompt = `Você é o Curador de Viagens de Elite da Waylo.
  Crie um roteiro PERFEITO e IMERSIVO de ${formData.origin} para ${formData.destination}.
  
  PARÂMETROS OBRIGATÓRIOS DO CLIENTE (LEVE ISSO A SÉRIO):
  - Datas da Viagem: ${formData.dates}
  - Ritmo: ${formData.pace} (MUITO IMPORTANTE: Se for relaxante, inclua pausas, cafés e tempo livre. Se for intenso, otimize o tempo com muitas descobertas).
  - Acompanhantes: ${formData.companion} (ADAPTE TUDO A ISSO: Se for família, locais child-friendly. Se for casal, romantismo. Se for solo, exploração e socialização).

  REGRAS DE OURO DA WAYLO (INQUEBRÁVEIS):
  1. DESCRIÇÕES RICAS E ENVOLVENTES (CRÍTICO): A chave "description" NUNCA pode ser apenas o nome da ação. Escreva de 2 a 3 frases persuasivas e completas. Diga O QUE fazer lá e POR QUE é especial. (Exemplo perfeito: "Caminhe pelas ruas de pedra históricas e admire a arquitetura colonial. Aproveite para provar o famoso doce de leite artesanal na confeitaria da esquina.")
  2. CUSTOS MATEMÁTICOS REAIS: A IA DEVE fazer a conta. O campo "estimated_cost" deve refletir o valor TOTAL para o grupo informado (${formData.companion}). (Exemplo: Se for um casal e o ingresso custa 50, escreva "R$ 100 no total para o casal").
  3. COMPLETUDE DO DIA: Manhã, Tarde e Noite devem ter ações. Preencha de 1 a 3 atividades por período, dependendo do ritmo (${formData.pace}).
  4. VARIEDADE DE EXPERIÊNCIAS: Misture cultura, gastronomia, compras e descanso. Não faça o usuário apenas pular de museu em museu.
  5. NOMES REAIS (GPS): Na chave "place_name", use APENAS o NOME REAL do local para nossa API de mapas encontrar (Ex: "Museu do Louvre", "Restaurante Xapuri"). Não invente.

  ESTRUTURA JSON OBRIGATÓRIA (Retorne APENAS o JSON):
  {
    "flights": [...],
    "hotels": [...],
    "itinerary": [
      {
        "day": 1, 
        "activities": [
          {
            "period": "Manhã", 
            "description": "Acorde cedo e comece o dia com um café da manhã tradicional da região. Peça os pães de queijo recheados e curta a vista para as montanhas antes de iniciar a caminhada.", 
            "place_name": "Padaria Real e Famosa", 
            "estimated_cost": "R$ 80 total para o casal"
          }
        ]
      }
    ]
  }
  Gere o roteiro preenchendo TODOS os dias da viagem solicitada, sem NENHUMA lacuna de tempo.`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
  });

  return JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");
}