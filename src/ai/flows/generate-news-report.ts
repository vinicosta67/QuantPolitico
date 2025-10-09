// Helper flow used by server actions. Do not mark as 'use server' because
// the module also exports schemas (objects), which Next.js forbids in
// 'use server' files.
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchPoliticalNews } from '@/ai/tools/fetch-news';
import { fetchOnlinePoliticalNews } from '@/ai/tools/fetch-online-news';
import { fetchOnlinePoliticalNewsStatus } from '@/ai/tools/fetch-online-news-status';

export const GenerateNewsReportInput = z.object({
  type: z.enum(['daily','weekly','custom']),
  query: z.string().default(''),
  days: z.number().min(1).max(30).default(7),
});
export type GenerateNewsReportInput = z.infer<typeof GenerateNewsReportInput>;

export const GenerateNewsReportOutput = z.object({
  title: z.string(),
  timeframeLabel: z.string(),
  summary: z.string(),
  keyMetrics: z.object({
    total: z.number(),
    avgSentiment: z.number(),
    positivePct: z.number(),
    topThemes: z.array(z.string()).default([]),
  }),
  highlights: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});
export type GenerateNewsReportOutput = z.infer<typeof GenerateNewsReportOutput>;

const newsReportPrompt = ai.definePrompt({
  name: 'generateNewsReport',
  input: { schema: GenerateNewsReportInput },
  output: { schema: GenerateNewsReportOutput },
  model: 'openai/gpt-4o-mini',
  tools: [fetchOnlinePoliticalNewsStatus, fetchOnlinePoliticalNews, fetchPoliticalNews],
  prompt: `Gere um RELATÓRIO sucinto e acionável (PT-BR) sobre notícias e narrativas do período solicitado.
Tipo: {{{type}}}
Consulta/lente: "{{{query}}}"
Janela (dias): {{{days}}}

Use as ferramentas de busca de notícias. Se não houver retorno online, use o mock fetchPoliticalNews como fallback.
Resumo e diretrizes:
- Informe quantidade total e polaridade média (escala 0..1 aproximada), % positivas.
- Liste 4–6 temas/narrativas mais recorrentes.
- Destaques: 4–6 bullets (mudanças, picos, pronunciamentos, decisões de Congresso).
- Riscos: 3–5 bullets (tendências negativas, ataques coordenados, ruídos potenciais).
- Recomendações: 4–6 ações objetivas (mensagens, canais, timing, alvos, monitoramento).
Regras de saída: retorne estritamente no schema JSON indicado, sem texto extra.`,
});

export async function generateNewsReport(input: GenerateNewsReportInput): Promise<GenerateNewsReportOutput> {
  const days = input.type === 'daily' ? 1 : input.type === 'weekly' ? 7 : (input.days ?? 7);
  const query = (input.query || '').trim();
  const { output } = await newsReportPrompt({ ...input, days, query });
  return output!;
}
