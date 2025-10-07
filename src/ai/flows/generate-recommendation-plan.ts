/**
 * @file Generates a detailed, actionable plan for a given recommendations tab
 * using the same Genkit + OpenAI pattern as other flows in this repo.
 */
'use server';
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
  objectives: z.array(z.string()).min(1).describe('Top 3â€“5 measurable objectives.'),
  actions: z.array(PlanActionSchema).min(2).describe('Concrete actions with steps, owners, and KPIs.'),
  // Allow at least one item from the model; we will pad to >=2 after receipt
  timeline: z.array(PlanTimelineItemSchema).min(1).describe('Phased timeline with deliverables.'),
  risks: z.array(z.string()).min(1).describe('Key risks and mitigations (brief).'),
  monitoring: z
    .array(z.string())
    .min(1)
    .describe('What to monitor weekly and how to decide next steps.'),
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
  prompt: `VocÃª Ã© um(a) estrategista polÃ­tico(a) sÃªnior e engenheiro(a) de prompts especialista em integrar IA com TypeScript.

Gere um PLANO DE AÃ‡ÃƒO objetivo, acionÃ¡vel e orientado a resultados para a aba "{{{type}}}" do mÃ³dulo de RecomendaÃ§Ãµes, considerando:
- PolÃ­tico: {{{politician}}}
- Janela de tempo: {{{timeframe}}}
- RecomendaÃ§Ãµes ativas neste contexto (itens de grounding):
{{#each items}}
- [{{priority}} | impacto {{impact_score}} | {{category}}] {{title}} â€” {{description}}
  {{#if evidence}}EvidÃªncia: {{evidence}}{{/if}}
  {{#if actions}}AÃ§Ãµes sugeridas: {{actions}}{{/if}}
{{/each}}

InstruÃ§Ãµes:
1) Contextualize o plano ao cenÃ¡rio brasileiro atual e Ã s caracterÃ­sticas do(a) {{{politician}}}.
2) Foque no escopo da aba {{type}}: seja especÃ­fico sobre canais, mensagens, alvos e ritmos.
3) Traga objetivos mensurÃ¡veis (KPIs e metas) e um cronograma por fases.
4) Use linguagem clara, tÃ³picos curtos e aÃ§Ã£o explÃ­cita (â€œo que fazerâ€, â€œpor quemâ€, â€œquandoâ€, â€œcomo medirâ€).
5) Antes de redigir, BUSQUE NOTÃCIAS RECENTES usando as ferramentas:
   - fetchOnlinePoliticalNews (preferencial; varrer Ãºltimos 7 dias) e/ou fetchPoliticalNews (mock) como fallback.
   - FaÃ§a pelo menos 3 consultas separadas: (a) "{{{politician}}} OR partido do(a) {{{politician}}}", (b) um(a) adversÃ¡rio(a) direto(a) e seu partido, (c) outro(a) adversÃ¡rio(a) relevante e seu partido.
   - Compare tendÃªncias entre {{{politician}}} e concorrentes: temas em alta, riscos emergentes, oportunidades de agenda.
   - NÃƒO inclua as notÃ­cias no JSON final; use-as para calibrar objetivos, aÃ§Ãµes, timeline e riscos.
6) Respeite EXATAMENTE o schema de saÃ­da (JSON) indicado.
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
      : { label: 'Fase 2', deliverables: ['Consolidar aprendizados e otimizar aÃ§Ãµes.'] };
    plan.timeline = base ? [base, filler] : [{ label: 'Fase 1', deliverables: ['Kickoff e setup operacional.'] }, filler];
  }
  return plan;
}

export type { RecType, Timeframe, Recommendation };



