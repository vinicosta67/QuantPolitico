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
        sentiment: z.number().int().min(1).max(3).optional(),
      })
    ),
  },
  async (input):Promise<any> => {
    const days = input.days ?? 7;
    const timespan = `${days}d`;
    // const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(
    //   input.query
    // )}&timespan=${timespan}&mode=ArtList&maxrecords=50&format=json&sort=datedesc`;
    // console.log('resultadoooo: ', result)
    const url = `https://trademachine.blob.core.windows.net/base-dados/noticias_politica_broadcast.json`;
    try {
      const res = await fetch(url, { method:'GET',  redirect:'follow',headers: {Accept: 'application/json' } });
      if (!res.ok) throw new Error(`GDELT status ${res.status}`);
      const data: any = await res.json();

      const pubDate = Object.values(data?.pubDate)
      const id = Object.values(data?.id)
      const sentiment = Object.values(data?.sentiment)
      const title = Object.values(data?.title)
      const content = Object.values(data?.content)
      const description = Object.values(data?.description)

      // const articles: any[] = data?.title ?? data?.docs ?? [];
      const items = id
        .map((a:any, pos:any) => ({
          id: a,
          title: title[pos] || a.source || 'Sem título',
          source: a.sourceCommonName || a.domain || a.source || 'Broadcast',
          url: a.url || '',
          // content: content[pos],
          sentiment: Number(sentiment[pos]) || undefined,
          summary: description[pos] || a.translingual || a.kw || a.title || 'Sem resumo disponível.',
          publishedAt: String(pubDate[pos] || a.date || a.publishedAt || ''),
        }))

      console.log('items: ', items)
      // return {items: items, summaries: description};
      return items;
    } catch (err) {
      console.error('fetchOnlinePoliticalNews error', err);
      return [];
    }
  }
);
