'use server';
import {fetchPoliticalNews} from '@/ai/tools/fetch-news';
import {fetchParties as fetchPartiesTool} from '@/ai/tools/fetch-deputy-data'; // Renomeado para evitar conflito
import type {NewsArticle, Party} from '@/lib/types';

export async function searchNews(query?: string): Promise<(NewsArticle & { publishedAtLabel: string })[]> {
  try {
    // Busca as notícias mockadas
    const newsItems = await fetchPoliticalNews({ query });

    // Mantém ISO em publishedAt para cálculos; adiciona um label formatado
    const formattedNews = newsItems.map((item, index) => {
      const iso = item.publishedAt;
      // Use ISO-based label to avoid SSR/CSR locale or timezone mismatches
      const d = new Date(iso);
      const label = d.toISOString().replace('T',' ').slice(0,16); // YYYY-MM-DD HH:mm
      return {
        ...item,
        id: `${item.url}-${index}`,
        publishedAt: iso,
        publishedAtLabel: label,
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
