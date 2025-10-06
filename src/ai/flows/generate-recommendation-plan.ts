/**
 * @file Generates a detailed, actionable plan for a given recommendations tab
 * using the same Genkit + OpenAI pattern as other flows in this repo.
 */
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { RecType, Timeframe, Recommendation } from '@/lib/recommendations-mock';

const PlanActionSchema = z.object({
  title: z.string(),
  steps: z.array(z.string()).min(1),
  owners: z.array(z.string()).default([]),
  kpis: z.array(z.string()).default([]),
});

const PlanTimelineItemSchema = z.object({
  label: z.string().describe('Phase or time window label (e.g., Semana 1-2)'),
  deliverables: z.array(z.string()).min(1),
});

const GeneratePlanInputSchema = z.object({
  politician: z.string(),
  type: z.custom<RecType>(),
  timeframe: z.custom<Timeframe>(),
  // Grounding items from the current tab to contextualize the plan
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
  title: z.string().describe('Concise plan title for the PDF heading'),
  summary: z
    .string()
    .describe(
      'One-paragraph executive summary contextualized to the politician, timeframe, and tab focus.'
    ),
  objectives: z.array(z.string()).min(1).describe('Top 3–5 measurable objectives.'),
  actions: z.array(PlanActionSchema).min(2).describe('Concrete actions with steps, owners, and KPIs.'),
  // Allow at least one item from the model; we will pad to >=2 after receipt
  timeline: z.array(PlanTimelineItemSchema).min(1).describe('Phased timeline with deliverables.'),
  risks: z.array(z.string()).min(1).describe('Key risks and mitigations (brief).'),
  monitoring: z
    .array(z.string())
    .min(1)
    .describe('What to monitor weekly and how to decide next steps.'),
});
export type GeneratePlanOutput = z.infer<typeof GeneratePlanOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateRecommendationPlanPrompt',
  input: { schema: GeneratePlanInputSchema },
  output: { schema: GeneratePlanOutputSchema },
  model: 'openai/gpt-4o-mini',
  prompt: `Você é um(a) estrategista político(a) sênior e engenheiro(a) de prompts especialista em integrar IA com TypeScript.

Gere um PLANO DE AÇÃO objetivo, acionável e orientado a resultados para a aba "{{{type}}}" do módulo de Recomendações, considerando:
- Político: {{{politician}}}
- Janela de tempo: {{{timeframe}}}
- Recomendações ativas neste contexto (itens de grounding):
{{#each items}}
- [{{priority}} | impacto {{impact_score}} | {{category}}] {{title}} — {{description}}
  {{#if evidence}}Evidência: {{evidence}}{{/if}}
  {{#if actions}}Ações sugeridas: {{actions}}{{/if}}
{{/each}}

Instruções:
1) Contextualize o plano ao cenário brasileiro atual e às características do(a) {{{politician}}}.
2) Foque no escopo da aba {{type}}: seja específico sobre canais, mensagens, alvos e ritmos.
3) Traga objetivos mensuráveis (KPIs e metas) e um cronograma por fases.
4) Use linguagem clara, tópicos curtos e ação explícita (“o que fazer”, “por quem”, “quando”, “como medir”).
5) Respeite EXATAMENTE o schema de saída (JSON) indicado.
`,
});

export async function generateRecommendationPlan(input: GeneratePlanInput): Promise<GeneratePlanOutput> {
  const { output } = await prompt(input);
  const plan = output!;
  // Safety: ensure timeline has at least two phases for downstream consumers (PDF layout expectations)
  if (!plan.timeline || plan.timeline.length < 2) {
    const base = plan.timeline?.[0];
    const filler: { label: string; deliverables: string[] } = base
      ? { label: base.label.includes('1') ? base.label.replace('1', '2') : `${base.label} (fase 2)`, deliverables: base.deliverables }
      : { label: 'Fase 2', deliverables: ['Consolidar aprendizados e otimizar ações.'] };
    plan.timeline = base ? [base, filler] : [{ label: 'Fase 1', deliverables: ['Kickoff e setup operacional.'] }, filler];
  }
  return plan;
}

export type { RecType, Timeframe, Recommendation };
