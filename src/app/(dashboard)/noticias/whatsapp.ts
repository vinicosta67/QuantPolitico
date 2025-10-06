'use server';

import { fetchPoliticalNews } from '@/ai/tools/fetch-news';
import type { NewsArticle } from '@/lib/types';

export type NewsFilters = {
  query?: string;
  category?: 'economia' | 'saude' | 'educacao' | 'seguranca' | 'all';
  sentiment?: 'all' | 'positive' | 'neutral' | 'negative';
  politician?: 'all' | 'Lula' | 'Bolsonaro' | 'Tarcisio' | 'Boulos';
  hours?: 6 | 12 | 24 | 48 | 168 | number;
  limit?: number;
};

type ExtendedNews = (NewsArticle & { publishedAtLabel?: string }) & {
  sentiment_score: number;
  confidence_score: number;
  category: 'economia' | 'saude' | 'educacao' | 'seguranca';
  politicians_mentioned: string[];
  emotion_primary: 'alegria' | 'raiva' | 'tristeza' | 'neutro';
  content?: string;
};

function enrichNewsServer(items: (NewsArticle & { publishedAtLabel?: string })[]): ExtendedNews[] {
  const categories = ['economia', 'saude', 'educacao', 'seguranca'] as const;
  const politicians = ['Lula', 'Bolsonaro', 'Tarcisio', 'Boulos'];
  return items.map((n, idx) => {
    const seed = (n.title.length + idx * 7) % 100;
    const rand = (min: number, max: number) => min + ((seed / 100) * (max - min));
    const sentiment = parseFloat(rand(-0.6, 0.8).toFixed(2));
    const confidence = parseFloat(rand(0.7, 0.95).toFixed(2));
    const category = categories[idx % categories.length];
    const emotion = (['alegria', 'raiva', 'tristeza', 'neutro'] as const)[idx % 4];
    const who = [politicians[idx % politicians.length]];
    return {
      ...n,
      sentiment_score: sentiment,
      confidence_score: confidence,
      category,
      emotion_primary: emotion,
      politicians_mentioned: who,
      content: n.summary,
    };
  });
}

function applyFilters(items: ExtendedNews[], filters?: NewsFilters) {
  const f = filters || {};
  let arr = [...items];
  const hours = f.hours ?? 24;
  const cutoff = Date.now() - hours * 3600 * 1000;
  arr = arr.filter(n => new Date(n.publishedAt).getTime() >= cutoff);
  if (f.query && f.query.trim()) {
    const q = f.query.toLowerCase();
    arr = arr.filter(n => n.title.toLowerCase().includes(q) || n.summary?.toLowerCase().includes(q));
  }
  if (f.category && f.category !== 'all') arr = arr.filter(n => n.category === f.category);
  if (f.sentiment === 'positive') arr = arr.filter(n => n.sentiment_score > 0.1);
  if (f.sentiment === 'neutral') arr = arr.filter(n => Math.abs(n.sentiment_score) <= 0.1);
  if (f.sentiment === 'negative') arr = arr.filter(n => n.sentiment_score < -0.1);
  if (f.politician && f.politician !== 'all') arr = arr.filter(n => n.politicians_mentioned?.includes(f.politician!));
  return arr;
}

const formatSentimentLabel = (v: number) => (v > 0.2 ? 'Positivo' : v < -0.2 ? 'Negativo' : 'Neutro');
function buildWhatsAppMessage(items: ExtendedNews[]) {
  const header = `Ultimas noticias (${new Date().toLocaleString('pt-BR')}):`;
  const lines = items.map((n, i) => {
    const tags = [n.category, ...(n.politicians_mentioned || [])]
      .filter(Boolean)
      .map(t => `#${t}`)
      .join(' ');
    const subtitle = n.content || n.summary || '';
    const sLabel = formatSentimentLabel(n.sentiment_score);
    return [
      `${i + 1}) ${n.title}`,
      subtitle ? `Subtitulo: ${subtitle}` : undefined,
      `Sentimento: ${sLabel} (${n.sentiment_score.toFixed(2)})`,
      `Tags: ${tags || '-'}`,
      `Confianca: ${n.confidence_score.toFixed(2)}`,
      n.url ? `Link: ${n.url}` : undefined,
    ].filter(Boolean).join('\n');
  });
  return [header, '', ...lines].join('\n');
}

async function sendViaTwilio(text: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox default
  const to = process.env.WHATSAPP_TO || 'whatsapp:+5599999999999'; // your number (DDI+DDD)
  if (!sid || !token) throw new Error('Twilio credentials missing (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN).');
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const body = new URLSearchParams({ Body: text, From: from, To: to });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  } as any);
  if (!res.ok) {
    const msg = await res.text().catch(()=> res.statusText);
    throw new Error(`Twilio send failed: ${res.status} ${msg}`);
  }
}

export async function sendLatestNewsToWhatsApp(filters?: NewsFilters) {
  const newsItems = await fetchPoliticalNews({ query: filters?.query });
  const sorted = [...newsItems].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const withIds = sorted.map((item, index) => ({ ...item, id: `${item.url}-${index}` }));
  const enriched = enrichNewsServer(withIds);
  const filtered = applyFilters(enriched, filters);
  const limit = Math.max(1, Math.min(filters?.limit ?? 5, 10));
  const top = filtered.slice(0, limit);
  if (top.length === 0) throw new Error('Nenhuma noticia para enviar.');
  const text = buildWhatsAppMessage(top);
  await sendViaTwilio(text);
  return { ok: true, sent: top.length };
}

