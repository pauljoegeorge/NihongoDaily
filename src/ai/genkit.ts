
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai'; // Re-add this import

export const ai = genkit({
  plugins: [googleAI()], // Re-add googleAI() to plugins
  // Default model is still not set, which is fine if no flows are called directly without specifying a model.
});
