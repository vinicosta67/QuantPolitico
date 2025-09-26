/**
 * @fileOverview A GPT-powered political analyst flow.
 *
 * - interactWithPoliticalAnalyst - A function that handles the interaction with the political analyst.
 * - InteractWithPoliticalAnalystInput - The input type for the interactWithPoliticalAnalyst function.
 * - InteractWithPoliticalAnalystOutput - The return type for the interactWithPoliticalAnalyst function.
 */
'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fetchPoliticalNews } from '@/ai/tools/fetch-news';
import { fetchDeputies, fetchDeputyExpenses, fetchParties } from '@/ai/tools/fetch-deputy-data';

const InteractWithPoliticalAnalystInputSchema = z.object({
  query: z.string().describe('The user query for the political analyst.'),
});
export type InteractWithPoliticalAnalystInput = z.infer<typeof InteractWithPoliticalAnalystInputSchema>;

const InteractWithPoliticalAnalystOutputSchema = z.object({
  response: z.string().describe('The response from the political analyst.'),
});
export type InteractWithPoliticalAnalystOutput = z.infer<typeof InteractWithPoliticalAnalystOutputSchema>;

export async function interactWithPoliticalAnalyst(input: InteractWithPoliticalAnalystInput): Promise<InteractWithPoliticalAnalystOutput> {
  return interactWithPoliticalAnalystFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interactWithPoliticalAnalystPrompt',
  input: {schema: InteractWithPoliticalAnalystInputSchema},
  output: {schema: InteractWithPoliticalAnalystOutputSchema},
  model: 'openai/gpt-4o',
  tools: [fetchPoliticalNews, fetchDeputies, fetchDeputyExpenses, fetchParties],
  prompt: `Você é um analista político especialista e um cientista de dados. Sua função é fornecer respostas detalhadas, precisas e baseadas em dados.

Use as ferramentas disponíveis para buscar informações em tempo real e enriquecer sua análise. Não responda apenas com a informação direta; interprete os dados, aponte tendências, e forneça um contexto valioso. Seja proativo.

Ferramentas disponíveis:
- fetchPoliticalNews: Busca notícias políticas recentes do Brasil. Use para contextualizar eventos.
- fetchDeputies: Busca informações sobre deputados federais brasileiros. Pode filtrar por nome, partido e UF.
- fetchDeputyExpenses: Busca despesas de um deputado específico. Use para analisar gastos.
- fetchParties: Busca informações sobre partidos políticos brasileiros.

Ao responder, seja estruturado. Use markdown (negrito, listas) para facilitar a leitura. Vá além do óbvio. Se um usuário pergunta sobre um deputado, traga notícias recentes sobre ele, seu partido, ou suas despesas mais relevantes.

Consulta do usuário:

"{{{query}}}"`,
});

const interactWithPoliticalAnalystFlow = ai.defineFlow(
  {
    name: 'interactWithPoliticalAnalystFlow',
    inputSchema: InteractWithPoliticalAnalystInputSchema,
    outputSchema: InteractWithPoliticalAnalystOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return { response: output?.response ?? "Não foi possível gerar uma resposta." };
  }
);
