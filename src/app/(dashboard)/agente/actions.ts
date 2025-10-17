'use server';

import { interactWithPoliticalAnalyst } from '@/ai/flows/interact-with-political-analyst';

export async function getAiResponse(history: {role: 'user' | 'assistant', content: string}[]) {
  // Simple history-to-string conversion. A real app might need more complex context management.
  const query = history.map(h => `${h.role}: ${h.content}`).join('\n\n');
  try {
    const result = await interactWithPoliticalAnalyst({ query });
    return result.response;
  } catch (error) {
    console.error("Error interacting with political analyst AI:", error);
    // console.log("Error interacting with political analyst AI:", error)
    return "Desculpe, não consegui processar sua solicitação no momento. Tente novamente mais tarde.";
  }
}
