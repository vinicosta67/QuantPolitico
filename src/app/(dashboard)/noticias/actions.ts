'use server';
import {fetchPoliticalNews} from '@/ai/tools/fetch-news';
import { fetchOnlinePoliticalNews } from '@/ai/tools/fetch-online-news';
import {fetchParties as fetchPartiesTool} from '@/ai/tools/fetch-deputy-data'; // Renomeado para evitar conflito
import type {NewsArticle, Party} from '@/lib/types';
import { generateNewsReport, type GenerateNewsReportInput, type GenerateNewsReportOutput } from '@/ai/flows/generate-news-report';

// Fetch real online news (with sentiment when available), falling back to mock
export async function searchNews(query?: string): Promise<(NewsArticle & { publishedAtLabel: string; sentimentValue?: number })[]> {
  try {
    // Prefer real online news (Broadcast dataset)
    const defaultQuery = query && query.trim() ? query : 'Lula OR Bolsonaro OR Governo OR Congresso';
    let newsItems: any[] = [];
    try {
      newsItems = await fetchOnlinePoliticalNews({ query: defaultQuery, days: 7 });
    } catch {
      newsItems = [];
    }
    // Fallback to mock tool when needed
    if (!Array.isArray(newsItems) || newsItems.length === 0) {
      newsItems = await fetchPoliticalNews({ query: defaultQuery });
    }

    // Normaliza datas para ISO e adiciona label
    const formattedNews = (newsItems || []).map((item: any, index: number) => {
      const raw = item.publishedAt as string | number | Date;
      let d: Date | null = null;
      if (typeof raw === 'string') {
        // tenta formatos comuns: 'YYYY-MM-DD HH:mm' -> 'YYYY-MM-DDTHH:mm:00Z'
        const s1 = raw.includes('T') ? raw : raw.replace(' ', 'T');
        const d1 = new Date(s1);
        if (!isNaN(d1.getTime())) d = d1; else {
          const d2 = new Date(Number(raw));
          d = isNaN(d2.getTime()) ? null : d2;
        }
      } else if (typeof raw === 'number') {
        const d3 = new Date(raw);
        d = isNaN(d3.getTime()) ? null : d3;
      } else if (raw instanceof Date) {
        d = raw;
      }
      const safe = d && !isNaN(d.getTime()) ? d : new Date();
      const isoNorm = safe.toISOString();
      const label = isoNorm.replace('T',' ').slice(0,16); // YYYY-MM-DD HH:mm
      return {
        ...item,
        id: `${item.url}-${index}`,
        publishedAt: isoNorm,
        publishedAtLabel: label,
        // expose raw sentiment (1..3) when present in dataset
        sentimentValue: typeof item?.sentiment === 'number' ? item.sentiment : (typeof item?.setiment === 'number' ? item.setiment : undefined),
      };
    });

    return formattedNews;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [] as any;
  }
}

export async function getParties(): Promise<Party[]> {
  try {
    // Usamos a ferramenta renomeada para evitar conflito de nome
    const parties = await fetchPartiesTool({});
    return Array.isArray(parties) ? parties : [];
  } catch (error) {
    console.error('Error fetching parties:', error);
    return [];
  }
}

export async function generateNewsReportAction(input: GenerateNewsReportInput): Promise<GenerateNewsReportOutput> {
  return generateNewsReport(input);
}
