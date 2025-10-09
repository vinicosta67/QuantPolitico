'use server';

import { fetchPoliticalNews } from '@/ai/tools/fetch-news';
import { fetchOnlinePoliticalNews } from '@/ai/tools/fetch-online-news';
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
      n.source ? `Fonte: ${n.source}` : undefined,
      subtitle ? `Subtitulo: ${subtitle}` : undefined,
      `Sentimento: ${sLabel} (${n.sentiment_score.toFixed(2)})`,
      `Tags: ${tags || '-'}`,
      n.url ? `Link: ${n.url}` : undefined,
    ].filter(Boolean).join('\n');
  });
  return [header, '', ...lines].join('\n');
}

function truncate(text: string, max: number) {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

// Compact message for a single item (styled for WhatsApp, < 700 chars)
function buildWhatsAppSnippet(n: ExtendedNews) {
  const sLabel = formatSentimentLabel(n.sentiment_score);
  const tags = [n.category, ...(n.politicians_mentioned || [])]
    .filter(Boolean)
    .map(t => `#${t}`)
    .join(' ');
  const dateLabel = new Date(n.publishedAt).toLocaleString('pt-BR', { hour12: false });
  const summary = n.content || n.summary || '';
  const parts = [
    `*📰 ${truncate(n.title, 120)}*`,
    `${n.source || ''} • ${dateLabel}`.trim(),
    summary ? `Resumo: ${truncate(summary, 240)}` : undefined,
    `Sentimento: ${sLabel} (${n.sentiment_score.toFixed(2)})`,
    tags ? `Tags: ${tags}` : undefined,
    n.url ? `🔗 ${n.url}` : undefined,
  ].filter(Boolean).join('\n');
  // Guard final size (Twilio WhatsApp caps ~1600 chars)
  return truncate(parts, 700);
}

type TwilioSendResult = {
  sid: string;
  status: string;
  to?: string;
  from?: string;
  date_created?: string;
};

async function sendViaTwilio(text: string): Promise<TwilioSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox default
  const to = process.env.WHATSAPP_TO || 'whatsapp:+5599999999999'; // your number (DDI+DDD)
  const contentSid = process.env.TWILIO_CONTENT_SID; // optional: use WhatsApp Content API
  const contentVarIndex = (process.env.TWILIO_CONTENT_VAR_INDEX || '1').trim();

  if (!sid || !token) throw new Error('Twilio credentials missing (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN).');
  if (!from || !to) throw new Error('Twilio WhatsApp endpoints missing (TWILIO_WHATSAPP_FROM/WHATSAPP_TO).');

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const params = new URLSearchParams();
  params.append('From', from);
  params.append('To', to);

  if (contentSid) {
    // Use approved WhatsApp template via Content API (matches the working curl)
    params.append('ContentSid', contentSid);
    // Place the dynamic message in the chosen template variable (default: "1")
    const variables = { [contentVarIndex]: text } as Record<string, string>;
    params.append('ContentVariables', JSON.stringify(variables));
  } else {
    // Fallback to free-text message (works in sandbox or open session)
    params.append('Body', text);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  } as any);

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const txt = await res.text();
      // Twilio often returns JSON with error details
      try {
        const j = JSON.parse(txt);
        detail = j?.message || j?.error_message || txt;
      } catch {
        detail = txt;
      }
    } catch {}
    throw new Error(`Twilio send failed (${res.status}): ${detail}`);
  }

  // Success: return SID and status for UI feedback
  try {
    const j = await res.json();
    return { sid: j?.sid, status: j?.status, to: j?.to, from: j?.from, date_created: j?.date_created };
  } catch {
    return { sid: 'unknown', status: 'queued' };
  }
}

// Meta WhatsApp Cloud API
async function sendViaMeta(text: string): Promise<TwilioSendResult> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID; // numeric id
  const toEnv = process.env.WHATSAPP_TO || '';
  if (!token || !phoneId) throw new Error('Meta WhatsApp credentials missing (META_WHATSAPP_TOKEN/META_PHONE_NUMBER_ID).');

  // Normalize destination to digits only (Cloud API expects E.164 without +)
  const to = toEnv.replace(/^whatsapp:/i, '').replace(/\D/g, '');
  if (!to) throw new Error('Destination number invalid for Meta Cloud API.');

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  // Default: send text message (requires 24h session). If you want template, set META_TEMPLATE_NAME and META_TEMPLATE_LANG
  const templateName = process.env.META_TEMPLATE_NAME;
  const templateLang = process.env.META_TEMPLATE_LANG || 'pt_BR';
  let payload: any;
  if (templateName) {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLang },
        components: [
          { type: 'body', parameters: [{ type: 'text', text }] },
        ],
      },
    };
  } else {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  } as any);

  const txt = await res.text().catch(() => '');
  if (!res.ok) {
    try {
      const j = JSON.parse(txt);
      const msg = j?.error?.message || j?.message || txt || res.statusText;
      throw new Error(`Meta send failed (${res.status}): ${msg}`);
    } catch {
      throw new Error(`Meta send failed (${res.status}): ${txt || res.statusText}`);
    }
  }
  try {
    const j = JSON.parse(txt);
    const id = j?.messages?.[0]?.id || 'unknown';
    return { sid: id, status: 'accepted', to, from: String(phoneId) };
  } catch {
    return { sid: 'unknown', status: 'accepted', to, from: String(phoneId) };
  }
}

async function sendWhatsAppGeneric(text: string): Promise<TwilioSendResult> {
  const provider = (process.env.WHATSAPP_PROVIDER || 'twilio').toLowerCase();
  if (provider === 'meta' || provider === 'cloud' || provider === 'facebook') {
    return sendViaMeta(text);
  }
  if (provider === 'whapi' || provider === 'whapi.cloud' || provider === 'whapicloud') {
    return sendViaWhapi(text);
  }
  return sendViaTwilio(text);
}

// Whapi Cloud provider
async function sendViaWhapi(text: string): Promise<TwilioSendResult> {
  const apiBase = (process.env.WHAPI_API_URL || 'https://gate.whapi.cloud').replace(/\/$/, '');
  const token = process.env.WHAPI_TOKEN;
  const toEnv = process.env.WHATSAPP_TO || '';
  if (!token) throw new Error('Whapi token missing (WHAPI_TOKEN).');
  // Whapi expects E.164 without the leading 'whatsapp:' prefix
  const to = toEnv.replace(/^whatsapp:/i, '').replace(/\D/g, '');
  if (!to) throw new Error('Destination number invalid for Whapi (WHATSAPP_TO).');

  // Endpoint: POST /messages/text
  const url = `${apiBase}/messages/text`;
  const payload = { to, body: text }; // body is the message text according to Whapi docs

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  } as any);

  const txt = await res.text().catch(()=> '');
  if (!res.ok) {
    try {
      const j = JSON.parse(txt);
      const msg = j?.message || j?.error || txt || res.statusText;
      throw new Error(`Whapi send failed (${res.status}): ${msg}`);
    } catch {
      throw new Error(`Whapi send failed (${res.status}): ${txt || res.statusText}`);
    }
  }
  try {
    const j = JSON.parse(txt);
    // Whapi typically returns message id under message.id or id
    const id = j?.message?.id || j?.id || 'unknown';
    const status = j?.message?.status || j?.status || 'accepted';
    return { sid: String(id), status, to };
  } catch {
    return { sid: 'unknown', status: 'accepted', to };
  }
}

export async function sendLatestNewsToWhatsApp(filters?: NewsFilters) {
  // If demo mode enabled, skip external fetch and use local sample
  const useDemo = process.env.USE_DEMO_NEWS === '1';
  if (useDemo) {
    const list = generateDemoNews();
    const limit = Math.max(1, Math.min(filters?.limit ?? 5, 10));
    const top = list.slice(0, limit);
    let sent = 0; const errors: string[] = []; const results: TwilioSendResult[] = [];
    for (const item of top) {
      try {
        const text = buildWhatsAppSnippet(item);
        const r = await sendWhatsAppGeneric(text);
        results.push(r);
        sent++;
      } catch (e: any) {
        errors.push(e?.message || String(e));
      }
    }
    if (sent === 0 && errors.length) throw new Error(errors[0]);
    return { ok: true, sent, attempts: top.length, mode: 'demo' as const, results, errors };
  }

  // Prefer real online news (GDELT) when available, fallback to mock
  const defaultQuery = filters?.query && filters?.query.trim() ? filters?.query : 'Lula OR Bolsonaro OR Tarcisio OR Boulos OR Congresso OR Governo';
  const days = Math.max(1, Math.min(14, Math.ceil((filters?.hours ?? 24) / 24)));
  let newsItems: any[] = [];
  try {
    newsItems = await fetchOnlinePoliticalNews({ query: defaultQuery, days });
  } catch (e) {
    newsItems = [];
  }
  if (!newsItems || newsItems.length === 0) {
    newsItems = await fetchPoliticalNews({ query: filters?.query });
  }
  // Normalize links: ensure every item has a real https link; if missing, build a Google News search link for the title/source
  let normalized = (newsItems || []).map((it) => {
    const hasHttp = typeof it?.url === 'string' && /^https?:\/\//i.test(it.url);
    const url = hasHttp ? it.url : `https://www.google.com/search?hl=pt-BR&q=${encodeURIComponent(`${it.title} ${it.source || ''}`)}`;
    return { ...it, url };
  });
  // If still too few items, broaden once
  if (normalized.length < 2) {
    try {
      const alt = await fetchOnlinePoliticalNews({ query: 'Brazil politics OR Brasil OR Governo OR Congresso', days: Math.max(1, Math.min(14, days)) });
      const altNorm = (alt || []).map((it: any) => {
        const hasHttp = typeof it?.url === 'string' && /^https?:\/\//i.test(it.url);
        const url = hasHttp ? it.url : `https://www.google.com/search?hl=pt-BR&q=${encodeURIComponent(`${it.title} ${it.source || ''}`)}`;
        return { ...it, url };
      });
      normalized = [...normalized, ...altNorm];
    } catch {}
  }
  const sorted = [...normalized].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const withIds = sorted.map((item, index) => ({ ...item, id: `${item.url || 'no-url'}-${index}` }));
  const enriched = enrichNewsServer(withIds);
  const filtered = applyFilters(enriched, filters);
  const limit = Math.max(1, Math.min(filters?.limit ?? 2, 10));
  const top = filtered.slice(0, limit);
  if (top.length === 0) throw new Error('Nenhuma noticia para enviar.');
  let sent = 0; const errors: string[] = []; const results: TwilioSendResult[] = [];
  for (const item of top) {
    try {
      const text = buildWhatsAppSnippet(item);
      const r = await sendWhatsAppGeneric(text);
      results.push(r);
      sent++;
    } catch (e: any) {
      errors.push(e?.message || String(e));
    }
  }
  if (sent === 0 && errors.length) throw new Error(errors[0]);
  return { ok: true, sent, attempts: top.length, mode: 'live' as const, results, errors };
}

// Demo data (ignore Broadcast). Five curated items close to screenshot style
function generateDemoNews(): ExtendedNews[] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const when = (minsAgo: number) => {
    const d = new Date(now.getTime() - minsAgo * 60000);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const items: ExtendedNews[] = [
    {
      id: '1',
      title: 'Lula defende reforma tributaria em evento com empresarios',
      source: 'Valor Economico',
      summary: 'Presidente afirma que a reforma e essencial para o crescimento do pais e promete dialogo com o Congresso.',
      publishedAt: when(20),
      url: 'https://www.valoreconomico.com.br/politica/reforma-tributaria-lula',
      sentiment_score: 0.20,
      confidence_score: 0.84,
      category: 'economia',
      politicians_mentioned: ['Lula'],
      emotion_primary: 'neutro',
      content: undefined,
    },
    {
      id: '2',
      title: 'Tarcisio critica proposta de imposto unico e defende modelo dual',
      source: 'Folha de S. Paulo',
      summary: 'Governador de Sao Paulo aponta riscos da proposta federal e apresenta alternativas em debate sobre a reforma tributaria.',
      publishedAt: when(80),
      url: 'https://www1.folha.uol.com.br/poder/tarcisio-imposto-unico.shtml',
      sentiment_score: 0.39,
      confidence_score: 0.88,
      category: 'saude',
      politicians_mentioned: ['Bolsonaro'],
      emotion_primary: 'neutro',
      content: undefined,
    },
    {
      id: '3',
      title: 'Governo anuncia novo plano de seguranca para fronteiras',
      source: 'O Globo',
      summary: 'Medidas incluem reforco de efetivo e investimentos em inteligencia em regioes de alto risco.',
      publishedAt: when(180),
      url: 'https://oglobo.globo.com/brasil/seguranca-fronteiras',
      sentiment_score: 0.37,
      confidence_score: 0.82,
      category: 'seguranca',
      politicians_mentioned: ['Tarcisio'],
      emotion_primary: 'neutro',
      content: undefined,
    },
    {
      id: '4',
      title: 'Camara discute ajustes no texto da reforma e cronograma de votacao',
      source: 'Estadao',
      summary: 'Lideres avaliam destaques e tentam acordo para acelerar a aprovacao no plenário.',
      publishedAt: when(240),
      url: 'https://politica.estadao.com.br/noticias/camara-reforma-cronograma',
      sentiment_score: 0.12,
      confidence_score: 0.86,
      category: 'educacao',
      politicians_mentioned: ['Boulos'],
      emotion_primary: 'neutro',
      content: undefined,
    },
    {
      id: '5',
      title: 'Ministro da Fazenda reforca compromisso com simplificacao de tributos',
      source: 'G1',
      summary: 'Equipe economica afirma que proxima etapa prioriza competitividade e previsibilidade para empresas.',
      publishedAt: when(360),
      url: 'https://g1.globo.com/economia/ministro-fazenda-simplificacao',
      sentiment_score: 0.28,
      confidence_score: 0.90,
      category: 'economia',
      politicians_mentioned: ['Lula'],
      emotion_primary: 'neutro',
      content: undefined,
    },
  ];

  return items;
}

export async function getDemoNewsMessage() {
  const list = generateDemoNews();
  return buildWhatsAppMessage(list);
}

export async function sendDemoNewsToWhatsApp() {
  const list = generateDemoNews();
  let sent = 0; const errors: string[] = []; const results: TwilioSendResult[] = [];
  for (const item of list) {
    try {
      const text = buildWhatsAppSnippet(item);
      const r = await sendWhatsAppGeneric(text);
      results.push(r);
      sent++;
    } catch (e: any) {
      errors.push(e?.message || String(e));
    }
  }
  if (sent === 0 && errors.length) throw new Error(errors[0]);
  return { ok: true, sent, attempts: list.length, results, errors };
}

export async function getDemoNewsMessages() {
  const list = generateDemoNews();
  return list.map(buildWhatsAppSnippet);
}
