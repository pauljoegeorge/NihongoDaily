// src/ai/flows/generate-example-sentences.ts
'use server';

/**
 * @fileOverview Generates example sentences for a given Japanese vocabulary word.
 *
 * - generateExampleSentences - A function that generates example sentences for a given word.
 * - GenerateExampleSentencesInput - The input type for the generateExampleSentences function.
 * - GenerateExampleSentencesOutput - The return type for the generateExampleSentences function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExampleSentencesInputSchema = z.object({
  word: z.string().describe('The Japanese vocabulary word to generate example sentences for.'),
});

export type GenerateExampleSentencesInput = z.infer<typeof GenerateExampleSentencesInputSchema>;

const GenerateExampleSentencesOutputSchema = z.object({
  sentences: z.array(z.string()).describe('An array of example sentences for the given word.'),
});

export type GenerateExampleSentencesOutput = z.infer<typeof GenerateExampleSentencesOutputSchema>;

export async function generateExampleSentences(input: GenerateExampleSentencesInput): Promise<GenerateExampleSentencesOutput> {
  return generateExampleSentencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExampleSentencesPrompt',
  input: {schema: GenerateExampleSentencesInputSchema},
  output: {schema: GenerateExampleSentencesOutputSchema},
  prompt: `You are an expert in the Japanese language.

  Generate 3 example sentences for the following Japanese word:

  {{word}}

  Each sentence should be in Japanese, and include the word in a natural and understandable way. The sentences should vary in complexity and context.

  Return the sentences as a JSON array of strings.`,
});

const generateExampleSentencesFlow = ai.defineFlow(
  {
    name: 'generateExampleSentencesFlow',
    inputSchema: GenerateExampleSentencesInputSchema,
    outputSchema: GenerateExampleSentencesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
