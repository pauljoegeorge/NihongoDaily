
export type Difficulty = 'easy' | 'medium' | 'hard';
export type DifficultyFilter = Difficulty | 'all';

export interface VocabularyWord {
  id: string; // Will be Firestore document ID
  japanese: string;
  definition: string;
  romaji: string; // Hiragana
  exampleSentences: string[];
  learned: boolean;
  createdAt: number; // Timestamp (milliseconds since epoch), converted from Firestore Timestamp
  difficulty: Difficulty;
  // userId is stored in Firestore document but not typically part of this client-side type directly
}

// This interface represents the structure in Firestore, including userId and server timestamp
export interface FirestoreVocabularyWord {
  japanese: string;
  definition: string;
  romaji: string;
  exampleSentences: string[];
  learned: boolean;
  createdAt: any; // Firestore ServerTimestamp or Timestamp
  difficulty: Difficulty;
  userId: string;
}

export interface FillQuizQuestion {
  id: string; // Corresponds to VocabularyWord id
  originalSentence: string;
  blankedSentence: string;
  options: string[]; // Japanese words
  correctAnswer: string; // The correct Japanese word for the blank
  vocabWord: VocabularyWord; // The full vocabulary word for context
}
