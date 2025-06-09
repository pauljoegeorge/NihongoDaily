export interface VocabularyWord {
  id: string;
  japanese: string;
  definition: string;
  romaji: string;
  exampleSentences: string[];
  learned: boolean;
  createdAt: number; // Timestamp for sorting and potential daily grouping
}
