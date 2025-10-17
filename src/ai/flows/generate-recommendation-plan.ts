'use server';
/**
 * Generate an actionable recommendation plan using Genkit + OpenAI.
 * Implements Option A: deterministically prefetch news and inject them
 * into the prompt as context for a journalistic narrative + action plan.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { RecType, Timeframe, Recommendation } from '@/lib/recommendations-mock';
import { fetchOnlinePoliticalNews } from '../tools/fetch-online-news';
import { fetchOnlinePoliticalNewsStatus } from '../tools/fetch-online-news-status';

const PlanActionSchema = z.object({
  title: z.string(),
  steps: z.array(z.string()).min(1),
  owners: z.array(z.string()).default([]),
  kpis: z.array(z.string()).default([]),
  // Richer details per action
  rationale: z.string().optional(), // why this action, 1 paragraph
  supportingData: z.array(z.string()).optional(), // bullets with numbers/facts
});

const PlanTimelineItemSchema = z.object({
  label: z.string(),
  deliverables: z.array(z.string()).min(1),
});

// Normalized news item (compatible with both providers we use)
const NewsItemSchema = z.object({
  title: z.string(),
  source: z.string(),
  url: z.string().optional(),
  summary: z.string(),
  publishedAt: z.string(),
});

const GeneratePlanInputSchema = z.object({
  politician: z.string(),
  type: z.custom<RecType>(),
  timeframe: z.custom<Timeframe>(),
  items: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
        impact_score: z.number(),
        urgency: z.enum(['high', 'medium', 'low']),
        category: z.enum(['messaging', 'digital', 'crisis', 'media', 'timing', 'content', 'monitoring']),
        timeframe: z.string(),
        evidence: z.string().optional(),
        actions: z.array(z.string()).optional(),
        created_date: z.string(),
      })
    )
    .default([]),
  // When provided, the model must rely exclusively on these facts.
  news: z.array(NewsItemSchema).optional(),
});
export type GeneratePlanInput = z.infer<typeof GeneratePlanInputSchema>;

// Optional narrative block for a journalistic layout
const NarrativeSchema = z.object({
  headline: z.string(),
  subheadline: z.string().default(''),
  date: z.string().default(''),
  lede: z.string().default(''),
  sections: z
    .array(
      z.object({
        heading: z.string(),
        paragraphs: z.array(z.string()).default([]),
        keyStats: z.array(z.string()).optional(),
        quote: z
          .object({ text: z.string(), attribution: z.string().optional() })
          .optional(),
      })
    )
    .default([]),
  callout: z.string().optional(),
  sources: z
    .array(z.object({ title: z.string(), url: z.string().optional(), publishedAt: z.string().optional() }))
    .optional(),
});

const GeneratePlanOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  objectives: z.array(z.string()).min(1),
  actions: z.array(PlanActionSchema).min(2),
  timeline: z.array(PlanTimelineItemSchema).min(1),
  risks: z.array(z.string()).min(1),
  monitoring: z.array(z.string()).min(1),
  competitiveStrategies: z
    .array(
      z.object({ competitor: z.string(), insights: z.array(z.string()).default([]), recommended: z.array(z.string()).min(1) })
    )
    .optional(),
  narrative: NarrativeSchema.optional(),
});
export type GeneratePlanOutput = z.infer<typeof GeneratePlanOutputSchema>;

// Prompt when news are provided (preferred deterministic path)
const promptWithNews = ai.definePrompt({
  name: 'generateRecommendationPlan_withNews',
  input: { schema: GeneratePlanInputSchema },
  output: { schema: GeneratePlanOutputSchema },
  model: 'openai/gpt-4o-mini',
  prompt: `Você é um(a) estrategista político(a) sênior e engenheiro(a) de prompts.

Gere um relatório em JSON com duas partes: (1) narrativa jornalística; (2) plano de ação para a aba "{{{type}}}" considerando:
- Político: {{{politician}}}
- Janela de tempo: {{{timeframe}}}
- Itens (grounding):
{{#each items}}
- [{{priority}} | impacto {{impact_score}} | {{category}}] {{title}} - {{description}}
{{/each}}

FATOS RECENTES (use exclusivamente estes; não invente):
{{#each news}}
- [{{publishedAt}}] {{title}} ({{source}}). {{summary}}
{{/each}}

Instruções:
1) NARRATIVA: Produza o bloco 'narrative' com os campos: headline, subheadline, date (ISO ou pt-BR), lede (1–2 parágrafos), sections (2–4 seções, cada uma com heading e paragraphs; inclua keyStats quando houver números e um quote opcional), callout opcional e sources (liste 4–6 das notícias acima com título/url/data).
2) PLANO: Em seguida, preencha objetivos, ações (com passos), timeline, riscos, monitoring e competitiveStrategies quando fizer sentido. Para cada ação, inclua também 'rationale' (1 parágrafo explicando o porquê) e 'supportingData' (2–4 bullets com números/estatísticas/fatos derivados dos FATOS, com percentuais/variações quando existirem).
3) Estilo: institucional, impessoal, sem 1ª pessoa. Cite números apenas se estiverem nos FATOS.
4) Respeite EXATAMENTE o schema e RETORNE SOMENTE JSON válido (sem markdown nem comentários).
`,
});

// Secondary path when prefetch fails: allow tools inside the prompt
const promptNoNews = ai.definePrompt({
  name: 'generateRecommendationPlan_noNews',
  input: { schema: GeneratePlanInputSchema },
  output: { schema: GeneratePlanOutputSchema },
  model: 'openai/gpt-4o-mini',
  tools: [fetchOnlinePoliticalNews, fetchOnlinePoliticalNewsStatus],
  prompt: `Você é um(a) estrategista político(a) sênior.

Gere um relatório com narrativa jornalística e plano de ação para a aba "{{{type}}}", considerando:
- Político: {{{politician}}}
- Janela de tempo: {{{timeframe}}}
- Itens (grounding):
{{#each items}}
- [{{priority}} | impacto {{impact_score}} | {{category}}] {{title}} - {{description}}
{{/each}}

Antes de redigir, BUSQUE NOTÍCIAS RECENTES com as ferramentas disponíveis. NÃO inclua as notícias no JSON final. Respeite o schema e retorne somente JSON válido. Para cada ação, inclua 'rationale' e 'supportingData' conforme descrito.
`,
});

// Stricter fallback prompt when JSON parsing fails
const fallbackPrompt = ai.definePrompt({
  name: 'generateRecommendationPlan_fallback',
  input: { schema: GeneratePlanInputSchema },
  output: { schema: GeneratePlanOutputSchema },
  model: 'openai/gpt-4o-mini',
  prompt: `RETORNE APENAS JSON válido no schema indicado, sem texto extra.
Político: {{{politician}}} | Aba: {{{type}}} | Janela: {{{timeframe}}}
Itens:
{{#each items}}
- [{{priority}} | impacto {{impact_score}} | {{category}}] {{title}} - {{description}}
{{/each}}
Inclua 'narrative' (com headline/subheadline/lede/sections/sources) mais objetivos, ações (com passos, rationale e supportingData), timeline, riscos, monitoring e competitiveStrategies quando fizer sentido.
`,
});

// Helper: timeframe -> days (cap 14)
function timeframeToDays(tf: Timeframe): number {
  if (tf === 'day') return 1;
  if (tf === 'week') return 7;
  return 14;
}

export async function generateRecommendationPlan(input: GeneratePlanInput): Promise<GeneratePlanOutput> {
  let plan: GeneratePlanOutput | null = null;

  // 1) Prefetch news deterministically if not provided
  let providedNews = input.news?.slice?.() || [];
  try {
    if (!providedNews.length) {
      const days = timeframeToDays(input.timeframe as Timeframe);
      // Prefer the status variant (GDELT)
      const res = await fetchOnlinePoliticalNewsStatus({ query: input.politician, days });
      if (res?.ok && Array.isArray(res.items) && res.items.length) {
        providedNews = res.items
          .map((n: any) => ({
            title: n.title,
            source: n.source,
            url: n.url,
            summary: n.summary,
            publishedAt: String(n.publishedAt || ''),
          }))
          .slice(0, 12);
      } else {
        const alt = await fetchOnlinePoliticalNews({ query: input.politician, days });
        if (Array.isArray(alt) && alt.length) {
          providedNews = alt
            .map((n: any) => ({
              title: n.title,
              source: n.source,
              url: n.url,
              summary: n.summary,
              publishedAt: String(n.publishedAt || ''),
            }))
            .slice(0, 12);
        }
      }
    }
  } catch (e) {
    // Continue without news; we'll use the noNews prompt.
    console.error('generateRecommendationPlan: news prefetch failed', e);
  }

  // 2) Choose prompt path
  try {
    if (providedNews.length) {
      const { output } = await promptWithNews({ ...input, news: providedNews });
      plan = output!;
    } else {
      const { output } = await promptNoNews(input);
      plan = output!;
    }
  } catch (_e) {
    console.error('generateRecommendationPlan: main prompt failed', _e);
    try {
      const { output } = await fallbackPrompt({ ...input, news: providedNews });
      plan = output!;
    } catch (__e) {
      console.error('generateRecommendationPlan: fallback prompt failed', __e);
      // Deterministic minimal fallback to avoid UI break
      const first = input.items?.[0];
      plan = {
        title: `Plano inicial - ${input.type}`,
        summary: `Rascunho automático para ${input.politician} (${input.type}, ${input.timeframe}). Ajuste após revisar notícias.`,
        objectives: [
          'Aumentar share of voice positivo',
          'Reduzir riscos de narrativa negativa',
          'Implementar rotina de monitoramento e resposta',
        ],
        actions: [
          { title: 'Mensagens-chave', steps: ['Definir 3 mensagens por tema', 'Aprovar com comunicação'], owners: [], kpis: ['Alcance', 'Engajamento'] },
          { title: 'Distribuição', steps: ['Publicar em redes', 'Press release regional'], owners: [], kpis: ['CTR', 'Tempo de resposta'] },
        ],
        timeline: [ { label: 'Semana 1', deliverables: ['Mensagens aprovadas', 'Publicações iniciais'] } ],
        risks: ['Saturação de pauta', 'Ataques coordenados'],
        monitoring: ['Volume e polaridade por tema', 'Tempo de resposta por canal'],
        competitiveStrategies: first ? [{ competitor: 'Concorrente A', insights: [], recommended: ['Contraponto técnico', 'Conteúdo comparativo'] }] : [],
      } as any;
    }
  }

  // 3) Safety: ensure timeline has at least two phases for downstream consumers
  if (!plan?.timeline || plan.timeline.length < 2) {
    const base = plan?.timeline?.[0];
    const filler: { label: string; deliverables: string[] } = base
      ? { label: base.label.includes('1') ? base.label.replace('1', '2') : `${base.label} (fase 2)`, deliverables: base.deliverables }
      : { label: 'Fase 2', deliverables: ['Consolidar aprendizados e otimizar ações.'] };
    plan.timeline = base ? [base, filler] : [{ label: 'Fase 1', deliverables: ['Kickoff e setup operacional.'] }, filler];
  }
  return plan as GeneratePlanOutput;
}

export type { RecType, Timeframe, Recommendation };
