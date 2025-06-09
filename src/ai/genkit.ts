import {genkit} from 'genkit';
// Removed: import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [], // Removed googleAI() plugin
  // Removed: model: 'googleai/gemini-2.0-flash'
});
