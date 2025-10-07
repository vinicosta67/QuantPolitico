/**
 * @file Fetches real political news from the open GDELT Doc API (no API key required).
 * Designed to be used as a Genkit tool inside prompts.
 */
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const fetchOnlinePoliticalNews = ai.defineTool(
  {
    name: 'fetchOnlinePoliticalNews',
    description:
      'Busca notícias recentes (últimos dias) relacionadas a política usando GDELT. Passe nomes de políticos/partidos em português. Retorna manchetes com fonte, URL e data.',
    inputSchema: z.object({
      query: z
        .string()
        .describe('Termos de busca. Ex.: "Lula OR Bolsonaro OR PT OR PL"'),
      days: z
        .number()
        .int()
        .min(1)
        .max(14)
        .default(7)
        .describe('Janela de tempo em dias (1..14). Padrão: 7'),
    }),
    outputSchema: z.array(
      z.object({
        title: z.string(),
        source: z.string(),
        url: z.string(),
        summary: z.string(),
        publishedAt: z.string(),
      })
    ),
  },
  async (input) => {
    const days = input.days ?? 7;
    const timespan = `${days}d`;
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(
      input.query
    )}&timespan=${timespan}&mode=ArtList&maxrecords=50&format=json&sort=datedesc`;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`GDELT status ${res.status}`);
      const data = await res.json();
      const articles: any[] = data?.articles ?? data?.docs ?? [];
      const items = articles
        .map((a) => ({
          title: a.title || a.source || 'Sem título',
          source: a.sourceCommonName || a.domain || a.source || 'GDELT',
          url: a.url || '',
          summary:
            a.excerpt || a.translingual || a.kw || a.title || 'Sem resumo disponível.',
          publishedAt: String(a.seendate || a.date || a.publishedAt || ''),
        }))
        .filter((x) => x.url);
      return items;
    } catch (err) {
      console.error('fetchOnlinePoliticalNews error', err);
      // Fallback seguro: não falhar o fluxo, apenas retornar vazio
      return [];
    }
  }
);

