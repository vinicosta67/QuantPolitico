import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const SummarizeNewsItemsInput = z.object({
  items: z.array(z.object({
    id: z.string(),
    title: z.string().default(''),
    source: z.string().optional(),
    url: z.string().optional(),
    summary: z.string().optional(),
    content: z.string().optional(),
  }))
});
export type SummarizeNewsItemsInput = z.infer<typeof SummarizeNewsItemsInput>;

export const SummarizedItem = z.object({ id: z.string(), summary: z.string() });
export const SummarizeNewsItemsOutput = z.array(SummarizedItem);
export type SummarizeNewsItemsOutput = z.infer<typeof SummarizeNewsItemsOutput>;

const summarizePrompt = ai.definePrompt({
  name: 'summarizeNewsItems',
  input: { schema: SummarizeNewsItemsInput },
  output: { schema: SummarizeNewsItemsOutput },
  model: 'openai/gpt-4o-mini',
  prompt: `Você é um jornalista profissional. Para CADA item, escreva um resumo jornalístico, objetivo, em PT-BR, com até 4 linhas (2–4 frases). 
Inclua fatos, números, atores e decisões relevantes. Não faça opinião. Não invente links. Se faltar conteúdo, use apenas o título.

ENTRADA (JSON): lista de objetos {id, title, source, url, summary, content}.
SAÍDA: estritamente um array JSON de objetos {id, summary} na MESMA ORDEM, um por item.
Sem texto extra além do JSON.`,
});

export async function summarizeNewsItems(input: SummarizeNewsItemsInput): Promise<SummarizeNewsItemsOutput> {
  const { output } = await summarizePrompt(input);
  return output || [];
}

