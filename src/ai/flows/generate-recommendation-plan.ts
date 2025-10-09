'use server';
/**
 * Generate an actionable recommendation plan using Genkit + OpenAI.
 * Includes a strict fallback to prevent JSON parse errors from breaking the UI.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { RecType, Timeframe, Recommendation } from '@/lib/recommendations-mock';
import { fetchPoliticalNews } from '../tools/fetch-news';
import { fetchOnlinePoliticalNews } from '../tools/fetch-online-news';
import { fetchOnlinePoliticalNewsStatus } from '../tools/fetch-online-news-status';

const PlanActionSchema = z.object({
  title: z.string(),
  steps: z.array(z.string()).min(1),
  owners: z.array(z.string()).default([]),
  kpis: z.array(z.string()).default([]),
});

const PlanTimelineItemSchema = z.object({
  label: z.string(),
  deliverables: z.array(z.string()).min(1),
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
});
export type GeneratePlanInput = z.infer<typeof GeneratePlanInputSchema>;

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
});
export type GeneratePlanOutput = z.infer<typeof GeneratePlanOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateRecommendationPlanPrompt',
  input: { schema: GeneratePlanInputSchema },
  output: { schema: GeneratePlanOutputSchema },
  model: 'openai/gpt-4o-mini',
  tools: [fetchPoliticalNews, fetchOnlinePoliticalNews, fetchOnlinePoliticalNewsStatus],
  prompt: `Você é um(a) estrategista político(a) sênior e engenheiro(a) de prompts.

Gere um PLANO DE AÇÃO objetivo, acionável e orientado a resultados para a aba "{{{type}}}" considerando:
- Político: {{{politician}}}
- Janela de tempo: {{{timeframe}}}
- Itens (grounding):
{{#each items}}
- [{{priority}} | impacto {{impact_score}} | {{category}}] {{title}} - {{description}}
{{/each}}

Instruções:
1) Contextualize ao cenário brasileiro atual e às características de {{{politician}}}.
2) Foque no escopo da aba {{type}}: canais, mensagens, alvos, ritmos.
3) Traga objetivos mensuráveis (KPIs/metas) e cronograma por fases.
4) Antes de redigir, BUSQUE NOTÍCIAS RECENTES com as ferramentas disponíveis. NÃO inclua as notícias no JSON final.
5) Respeite EXATAMENTE o schema e RETORNE SOMENTE JSON válido (sem markdown/comentários/trailing commas).
`,
});

// Stricter fallback prompt when JSON parsing fails
const fallbackPrompt = ai.definePrompt({
  name: 'generateRecommendationPlanPrompt_fallback',
  input: { schema: GeneratePlanInputSchema },
  output: { schema: GeneratePlanOutputSchema },
  model: 'openai/gpt-4o-mini',
  tools: [fetchPoliticalNews, fetchOnlinePoliticalNews, fetchOnlinePoliticalNewsStatus],
  prompt: `RETORNE APENAS JSON válido no schema indicado, sem texto extra.
Político: {{{politician}}} | Aba: {{{type}}} | Janela: {{{timeframe}}}
Itens:
{{#each items}}
- [{{priority}} | impacto {{impact_score}} | {{category}}] {{title}} - {{description}}
{{/each}}
Inclua objetivos, ações (com passos), timeline, riscos, monitoring e competitiveStrategies quando fizer sentido.
`,
});

export async function generateRecommendationPlan(input: GeneratePlanInput): Promise<GeneratePlanOutput> {
  let plan: GeneratePlanOutput | null = null;
  try {
    const { output } = await prompt(input);
    plan = output!;
  } catch (_e) {
    try {
      const { output } = await fallbackPrompt(input);
      plan = output!;
    } catch (__e) {
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

  // Safety: ensure timeline has at least two phases for downstream consumers
  if (!plan.timeline || plan.timeline.length < 2) {
    const base = plan.timeline?.[0];
    const filler: { label: string; deliverables: string[] } = base
      ? { label: base.label.includes('1') ? base.label.replace('1', '2') : `${base.label} (fase 2)`, deliverables: base.deliverables }
      : { label: 'Fase 2', deliverables: ['Consolidar aprendizados e otimizar ações.'] };
    plan.timeline = base ? [base, filler] : [{ label: 'Fase 1', deliverables: ['Kickoff e setup operacional.'] }, filler];
  }
  return plan as GeneratePlanOutput;
}

export type { RecType, Timeframe, Recommendation };

