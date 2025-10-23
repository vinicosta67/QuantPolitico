"use server";

import { newsListToPdfBytes } from '@/lib/news-list-pdf';
import { summarizeNewsItems } from '@/ai/flows/summarize-news-items';
import { sendPdfToWhatsApp } from './whatsapp';

export async function sendSixHourNewsPdfToWhatsAppStrong() {
  const backendBase = (process.env.BACKEND_URL || '').replace(/\/$/, '');
  const container = (process.env.CONTAINER_URL || '').replace(/^\//, '').replace(/\/$/, '');
  if (!backendBase || !container) throw new Error('BACKEND_URL/CONTAINER_URL não configurados.');
  const url = `${backendBase}/${container}/noticias_atuais_6horas.json`;

  const res = await fetch(url, { method: 'GET', redirect: 'follow' } as any);
  if (!res.ok) throw new Error(`Falha ao buscar notícias (HTTP ${res.status})`);
  const raw = (await res.text()) ?? '';
  const cleaned = raw.replace(/^\uFEFF/, '').trim();
  let data: any;
  try {
    data = JSON.parse(cleaned);
  } catch {
    const lines = cleaned.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every(l => l.startsWith('{') || l.startsWith('['))) {
      data = lines.map(l => JSON.parse(l)).flat();
    } else if (/}\s*{/.test(cleaned)) {
      data = JSON.parse(`[${cleaned.replace(/}\s*{/g, '},{')}]`);
    } else {
      throw new SyntaxError('Conteúdo retornado não é JSON válido nem NDJSON.');
    }
  }

  const all = Array.isArray(data) ? data : [data];
  const filtered = all.filter((n: any) => typeof n?.polaridade === 'number' && (n.polaridade > 0.3 || n.polaridade < -0.3));
  if (!filtered.length) throw new Error('Nenhuma notícia com polaridade forte (>0.3 ou <-0.3).');

  const itemsForAi = filtered.map((n: any, idx: number) => ({
    id: String(n.id || idx),
    title: String(n.title || ''),
    source: (()=>{ try { return new URL(n.sourceurl).hostname.replace(/^www\./,'') } catch { return '' } })(),
    url: String(n.sourceurl || ''),
    summary: String(n.summary || ''),
    content: String(n.summary || ''),
  }));
  let summaries: { id: string; summary: string }[] = [];
  try {
    summaries = await summarizeNewsItems({ items: itemsForAi });
  } catch {}
  const byId = new Map<string, string>(summaries.map(s => [s.id, s.summary]));
  const list = filtered.map((n: any, idx: number) => ({
    ...n,
    summary: byId.get(String(n.id || idx)) || n.summary || '',
  }));

  const pdfBytes = await newsListToPdfBytes(list, 'Notícias importantes');
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `Noticias_6h_${stamp}.pdf`;
  return sendPdfToWhatsApp({ filename, pdfBytes, caption: 'Notícias – últimas 6h' });
}

