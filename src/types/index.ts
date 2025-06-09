export interface VocabularyWord {
  id: string;
  japanese: string;
  definition: string;
  romaji: string; // Hiragana
  exampleSentences: string[];
  learned: boolean;
  createdAt: number; // Timestamp for sorting and potential daily grouping
  difficulty: 'easy' | 'medium' | 'hard';
}

