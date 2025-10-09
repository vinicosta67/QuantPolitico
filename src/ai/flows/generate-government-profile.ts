'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PoliticianSchema = z.object({
  name: z.string(),
  status: z.string().default('Ativo'),
  party: z.string().default('ABC'),
  popularity: z.number().min(0).max(100).default(45),
  approval: z.number().min(0).max(100).default(32),
  imageUrl: z.string().default('/cara-terno1.jpeg'),
});

const MinisterialItemSchema = z.object({
  name: z.string(),
  positive: z.number().min(0).max(100),
  neutral: z.number().min(0).max(100),
  negative: z.number().min(0).max(100),
});

const SentimentItemSchema = z.object({
  month: z.string(),
  positive: z.number().min(0).max(100),
  neutral: z.number().min(0).max(100),
  negative: z.number().min(0).max(100),
});

const CompetitionItemSchema = z.object({ name: z.string(), value: z.number().min(0).max(100) });

const GovernmentProfileInput = z.object({ query: z.string() });
export type GovernmentProfileInput = z.infer<typeof GovernmentProfileInput>;

const GovernmentProfileOutput = z.object({
  politician: PoliticianSchema,
  relevantTopics1: z.array(z.string()).min(1),
  relevantTopics2: z.array(z.string()).min(1),
  ministerialIndexData: z.array(MinisterialItemSchema).min(3),
  sentimentPolarityData: z.array(SentimentItemSchema).min(4),
  competitionData: z.object({
    party: z.array(CompetitionItemSchema).min(3),
    state: z.array(CompetitionItemSchema).min(3),
  }),
});
export type GovernmentProfileOutput = z.infer<typeof GovernmentProfileOutput>;

const profilePrompt = ai.definePrompt({
  name: 'generateGovernmentProfile',
  input: { schema: GovernmentProfileInput },
  output: { schema: GovernmentProfileOutput },
  model: 'openai/gpt-4o-mini',
  prompt:
    `Gere um perfil sintético, porém plausível, para o(a) político(a) "{{{query}}}" no contexto brasileiro.

Regras estritas para o JSON:
- Campos numéricos devem ser percentuais de 0 a 100 (inteiros preferencialmente).
- Os itens de "ministerialIndexData" devem somar ~100 por linha (positive + neutral + negative ≈ 100).
- "sentimentPolarityData" deve conter meses em PT-BR abreviados: Jan, Fev, Mar, Abr, Mai, Jun; cada linha deve somar ~100.
- Retorne 4 a 6 áreas em "ministerialIndexData" (ex.: Educação, Saúde, Economia, Segurança, Infraestrutura...).
- Em "competitionData.party" use siglas de partidos válidas; em "competitionData.state" use UFs (SP, RJ, MG, BA...).
- Se não tiver certeza do partido, faça a melhor estimativa e mantenha coerência.
- Use "/cara-terno1.jpeg" como "imageUrl" quando não houver foto conhecida.

Objetivo: produzir dados para popular cards e gráficos da página Governo. Apenas JSON válido no schema.`,
});

export async function generateGovernmentProfile(
  input: GovernmentProfileInput,
): Promise<GovernmentProfileOutput> {
  const { output } = await profilePrompt(input);
  return output!;
}

