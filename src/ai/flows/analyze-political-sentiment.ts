/**
 * @fileOverview This file defines a Genkit flow for analyzing the sentiment of political news articles and social media posts.
 *
 * - analyzePoliticalSentiment - A function that analyzes the sentiment of a given text.
 * - AnalyzePoliticalSentimentInput - The input type for the analyzePoliticalSentiment function.
 * - AnalyzePoliticalSentimentOutput - The output type for the analyzePoliticalSentiment function.
 */
'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePoliticalSentimentInputSchema = z.object({
  text: z
    .string()
    .describe(
      'The text to analyze for sentiment, such as a news article or social media post.'
    ),
});
export type AnalyzePoliticalSentimentInput = z.infer<
  typeof AnalyzePoliticalSentimentInputSchema
>;

const AnalyzePoliticalSentimentOutputSchema = z.object({
  polarity: z
    .number()
    .min(-1)
    .max(1)
    .describe(
      'The polarity score of the text, ranging from -1 (negative) to 1 (positive).'
    ),
  emotions: z
    .object({
      joy: z
        .number()
        .describe('The level of joy expressed in the text (0 to 1).'),
      sadness: z
        .number()
        .describe('The level of sadness expressed in the text (0 to 1).'),
      anger: z
        .number()
        .describe('The level of anger expressed in the text (0 to 1).'),
      fear: z
        .number()
        .describe('The level of fear expressed in the text (0 to 1).'),
      trust: z
        .number()
        .describe('The level of trust expressed in the text (0 to 1).'),
      disgust: z
        .number()
        .describe('The level of disgust expressed in the text (0 to 1).'),
      surprise: z
        .number()
        .describe('The level of surprise expressed in the text (0 to 1).'),
      anticipation: z
        .number()
        .describe('The level of anticipation expressed in the text (0 to 1).'),
    })
    .describe(
      "The emotions expressed in the text, based on Plutchik's wheel of emotions, normalized to a 0-1 scale."
    ),
});
export type AnalyzePoliticalSentimentOutput = z.infer<
  typeof AnalyzePoliticalSentimentOutputSchema
>;

export async function analyzePoliticalSentiment(
  input: AnalyzePoliticalSentimentInput
): Promise<AnalyzePoliticalSentimentOutput> {
  return analyzePoliticalSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePoliticalSentimentPrompt',
  input: {schema: AnalyzePoliticalSentimentInputSchema},
  output: {schema: AnalyzePoliticalSentimentOutputSchema},
  model: 'openai/gpt-4o',
  prompt: `You are a sentiment analysis expert, skilled in determining the emotional tone of political text in Brazilian Portuguese.

  Analyze the following text and provide:
  1. A 'polarity' score between -1.0 (very negative) and 1.0 (very positive).
  2. A score for each of Plutchik's 8 basic emotions ('joy', 'sadness', 'anger', 'fear', 'trust', 'disgust', 'surprise', 'anticipation'). Each emotion score should be a number between 0 and 1, representing its intensity in the text.

  Text:
  "{{{text}}}"

  Format your response as a single, valid JSON object with 'polarity' (number) and 'emotions' (object) keys. The emotions object must contain all 8 specified emotion keys, each with a numeric value.
  `,
});

const analyzePoliticalSentimentFlow = ai.defineFlow(
  {
    name: 'analyzePoliticalSentimentFlow',
    inputSchema: AnalyzePoliticalSentimentInputSchema,
    outputSchema: AnalyzePoliticalSentimentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
