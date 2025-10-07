/**
 * @file Fetches real political news with status using GDELT Doc API (no API key).
 */
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ArticleSchema = z.object({
  title: z.string(),
  source: z.string(),
  url: z.string(),
  summary: z.string(),
  publishedAt: z.string(),
});

export const fetchOnlinePoliticalNewsStatus = ai.defineTool(
  {
    name: 'fetchOnlinePoliticalNewsStatus',
    description:
      'Busca notícias reais (GDELT). Retorna { ok, items[], error? } para checar falhas.',
    inputSchema: z.object({
      query: z.string().describe('Ex.: "Lula OR Bolsonaro OR PT OR PL"'),
      days: z.number().int().min(1).max(14).default(7),
    }),
    outputSchema: z.object({
      ok: z.boolean(),
      provider: z.literal('gdelt'),
      items: z.array(ArticleSchema),
      error: z.string().optional(),
    }),
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
      return { ok: true, provider: 'gdelt', items } as const;
    } catch (err) {
      console.error('fetchOnlinePoliticalNewsStatus error', err);
      return { ok: false, provider: 'gdelt', items: [], error: (err as Error)?.message || 'unknown_error' } as const;
    }
  }
);

