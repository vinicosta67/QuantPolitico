/**
 * @fileOverview A Genkit flow for simulating the impact of a hypothetical event on electoral KPIs.
 * 
 * - simulateScenario - A function that simulates a scenario.
 * - SimulateScenarioInput - The input type for the simulateScenario function.
 * - SimulateScenarioOutput - The output type for the simulateScenario function.
 */
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchPoliticalNews } from '../tools/fetch-news';
import { fetchOnlinePoliticalNews } from '../tools/fetch-online-news';

const SimulateScenarioInputSchema = z.object({
  hypothesis: z.string().describe('The hypothetical event or scenario to be simulated. E.g., "Lançamento de uma nova propaganda focada em segurança"'),
});
export type SimulateScenarioInput = z.infer<typeof SimulateScenarioInputSchema>;

const SimulateScenarioOutputSchema = z.object({
  impactAnalysis: z.string().describe("A detailed, rich textual analysis of the probable impact of the scenario, considering political context, public perception, and potential reactions from opponents. Explain the 'why' behind the predicted changes."),
  kpiChanges: z.array(z.object({
    label: z.string().describe("The name of the Key Performance Indicator."),
    change: z.string().describe("The simulated change value, formatted as a string (e.g., '+1.5%', '-0.8 pts')."),
    changeType: z.enum(['increase', 'decrease']).describe("The direction of the change."),
    description: z.string().describe("A brief description of the KPI."),
  })).describe("An array of simulated changes to key performance indicators.")
});
export type SimulateScenarioOutput = z.infer<typeof SimulateScenarioOutputSchema>;

export async function simulateScenario(input: SimulateScenarioInput): Promise<SimulateScenarioOutput> {
  return simulateScenarioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulateScenarioPrompt',
  input: { schema: SimulateScenarioInputSchema },
  output: { schema: SimulateScenarioOutputSchema },
  // Use a cost-efficient model for simulations
  model: 'openai/gpt-4o-mini',
  tools: [fetchOnlinePoliticalNews],
  prompt: `Você é um estrateista político sênior e um analista de dados especialista. Sua tarefa é simular o impacto de um evento hipotético nos principais indicadores de uma campanha eleitoral.

O cenário eleitoral atual é uma disputa acirrada entre Lula e Tarcísio para a presidência.

Analise a seguinte hipótese com profundidade:
"{{{hypothesis}}}"

Para isso, siga os seguintes passos:
1.  **Busque Contexto:** Use a ferramenta \`fetchOnlinePoliticalNews\` para encontrar notícias recentes que possam dar contexto à sua análise. Pesquise por termos relacionados à hipótese.
2.  **Analise o Impacto:** Elabore uma análise textual rica e detalhada. Não se limite a dizer "o impacto é positivo". Explique as razões, o público-alvo que seria mais ou menos impactado, as possíveis reações da campanha adversária e da mídia. Seja um verdadeiro especialista.
3.  **Simule os KPIs:** Preveja o impacto quantitativo nos seguintes KPIs. Seja realista e utilize unidades claras (ex: %, pts).
    *   'Δ Intenção de Voto (Lula)': Variação na intenção de voto estimulada para Lula.
    *   'Δ Rejeição (Lula)': Variação no índice de rejeição de Lula.
    *   'Δ Intenção de Voto (Tarcísio)': Variação na intenção de voto estimulada para Tarcísio.
    *   'Δ Rejeição (Tarcísio)': Variação no índice de rejeição de Tarcísio.
    *   'Δ Engajamento Digital': Variação no volume de menções e interações nas redes sociais sobre o tema central da hipótese.

Formate sua saída EXATAMENTE como o JSON de outputSchema, com uma análise detalhada e as mudanças nos KPIs.
`,
});

const simulateScenarioFlow = ai.defineFlow(
  {
    name: 'simulateScenarioFlow',
    inputSchema: SimulateScenarioInputSchema,
    outputSchema: SimulateScenarioOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
