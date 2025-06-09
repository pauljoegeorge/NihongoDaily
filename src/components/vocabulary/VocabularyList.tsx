
"use client";

import type { VocabularyWord } from '@/types';
import VocabularyCard from './VocabularyCard';
// import { useVocabulary } from '@/hooks/useVocabulary'; // Removed hook call from here
import { FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface VocabularyListProps {
  words: VocabularyWord[];
  loading: boolean;
  toggleLearnedStatus: (id: string) => void;
  deleteWord: (id: string) => void;
}

export default function VocabularyList({ words, loading, toggleLearnedStatus, deleteWord }: VocabularyListProps) {
  // const { words, loading, toggleLearnedStatus, deleteWord } = useVocabulary(); // Instance of hook removed

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card p-6 rounded-lg shadow-md animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-10 bg-muted rounded w-1/4 mt-4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (words.length === 0) {
    return (
       <Alert className="max-w-md mx-auto bg-primary/5 border-primary/20">
          <FileText className="h-5 w-5 text-primary" />
          <AlertTitle className="font-headline text-xl text-primary">Your Vocabulary List is Empty</AlertTitle>
          <AlertDescription className="text-primary-foreground/80">
            Start your Japanese learning journey by adding your first vocabulary word. Click the "Add Word" button to begin!
          </AlertDescription>
        </Alert>
    );
  }
  
  const sortedWords = [...words].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedWords.map(word => (
          <VocabularyCard 
            key={word.id} 
            word={word} 
            onToggleLearned={toggleLearnedStatus}
            onDelete={deleteWord}
          />
        ))}
      </div>
    </div>
  );
}

