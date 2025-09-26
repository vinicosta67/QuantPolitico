/**
 * @fileOverview Clusters political topics using BERTopic.
 *
 * - clusterPoliticalTopics - A function that clusters political topics.
 * - ClusterPoliticalTopicsInput - The input type for the clusterPoliticalTopics function.
 * - ClusterPoliticalTopicsOutput - The return type for the clusterPoliticalTopics function.
 */
'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClusterPoliticalTopicsInputSchema = z.object({
  newsArticles: z
    .array(z.string())
    .describe('An array of news articles to cluster.'),
});
export type ClusterPoliticalTopicsInput = z.infer<typeof ClusterPoliticalTopicsInputSchema>;

const ClusterPoliticalTopicsOutputSchema = z.object({
  topics: z
    .array(z.string())
    .describe('An array of political topics clustered using BERTopic.'),
});
export type ClusterPoliticalTopicsOutput = z.infer<typeof ClusterPoliticalTopicsOutputSchema>;

export async function clusterPoliticalTopics(input: ClusterPoliticalTopicsInput): Promise<ClusterPoliticalTopicsOutput> {
  return clusterPoliticalTopicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'clusterPoliticalTopicsPrompt',
  input: {schema: ClusterPoliticalTopicsInputSchema},
  output: {schema: ClusterPoliticalTopicsOutputSchema},
  prompt: `You are a political analyst whose job is to cluster political topics from news articles using BERTopic.

Cluster the following news articles into political topics:

{{#each newsArticles}}
- {{{this}}}
{{/each}}
`,
});

const clusterPoliticalTopicsFlow = ai.defineFlow(
  {
    name: 'clusterPoliticalTopicsFlow',
    inputSchema: ClusterPoliticalTopicsInputSchema,
    outputSchema: ClusterPoliticalTopicsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
