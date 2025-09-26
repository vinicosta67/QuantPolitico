'use server';

import { getDeputyDetailsAndAnalytics, analyzeDeputyWithAI } from '@/ai/tools/fetch-deputy-data';

export async function getDeputyPageData(id: number) {
  try {
     const data = await getDeputyDetailsAndAnalytics({ id });
     return data;
  } catch (error) {
    console.error("Error fetching deputy details:", error);
    return null; 
  }
}
export async function getAgentResponseForDeputy(
  { deputyId, question }: { deputyId: number, question: string }
) {
  try {
    if (!question || !question.trim()) return "Por favor, insira uma pergunta.";
    if (!process.env.OPENAI_API_KEY) {
      return "Configuração ausente: defina a variável de ambiente OPENAI_API_KEY para habilitar o Agente.";
    }

    // A action agora confia que o flow tratará seus próprios erros
    // e retornará uma string útil, seja de sucesso ou de falha.
    const response = await analyzeDeputyWithAI({ deputyId, question });
    return response;

  } catch (error) {
    // Este catch agora só será acionado se o próprio flow quebrar de forma inesperada.
    console.error("[Action] Erro inesperado ao chamar o flow analyzeDeputyWithAI:", error);

    // Repassamos a mensagem de erro real para o cliente.
    return `Ocorreu um erro inesperado no servidor. Causa: ${(error as Error).message}`;
  }
}
