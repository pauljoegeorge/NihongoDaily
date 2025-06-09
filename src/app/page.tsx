
"use client";

import { useState } from 'react';
import AddVocabularyDialog from '@/components/vocabulary/AddVocabularyDialog';
import VocabularyList from '@/components/vocabulary/VocabularyList';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Button } from '@/components/ui/button';
import type { DifficultyFilter } from '@/types';
import { ListFilter, Check, Shuffle, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { words, loading: vocabLoading, addWord, toggleLearnedStatus, deleteWord, updateWordDifficulty } = useVocabulary();
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<DifficultyFilter>('all');
  const [isTodayRandomized, setIsTodayRandomized] = useState(false);

  const difficultyFilters: { label: string; value: DifficultyFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
  ];

  if (authLoading) {
    return (
      <div className="space-y-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 p-4 bg-card shadow rounded-lg h-16">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, cardIndex) => (
            <div key={cardIndex} className="bg-card p-6 rounded-lg shadow-md">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-10 w-1/4 mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert className="max-w-md text-center bg-primary/5 border-primary/20">
          <LogIn className="h-6 w-6 mx-auto mb-3 text-primary" />
          <AlertTitle className="font-headline text-2xl text-primary mb-2">Welcome to Nihongo Daily!</AlertTitle>
          <AlertDescription className="text-primary-foreground/80">
            Please sign in to manage and track your Japanese vocabulary.
            Use the button in the header to sign in with your Google account.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6 flex flex-wrap items-center gap-2 p-4 bg-card shadow rounded-lg">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground mr-2">
          <ListFilter className="h-5 w-5 text-primary" />
          Filter by Difficulty:
        </div>
        {difficultyFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={selectedDifficultyFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDifficultyFilter(filter.value)}
            className="capitalize transition-all duration-150 ease-in-out"
          >
            {selectedDifficultyFilter === filter.value && <Check className="h-4 w-4 mr-1" />}
            {filter.label}
          </Button>
        ))}
        <Button
          variant={isTodayRandomized ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsTodayRandomized(!isTodayRandomized)}
          className="transition-all duration-150 ease-in-out"
        >
          <Shuffle className="h-4 w-4 mr-1" />
          {isTodayRandomized ? "Unshuffle Today" : "Randomize Today's Words"}
        </Button>
      </div>

      <VocabularyList
        words={words}
        loading={vocabLoading}
        toggleLearnedStatus={toggleLearnedStatus}
        deleteWord={deleteWord}
        updateWordDifficulty={updateWordDifficulty}
        selectedDifficultyFilter={selectedDifficultyFilter}
        isTodayRandomized={isTodayRandomized}
      />
      <AddVocabularyDialog onAddWord={addWord} />
    </div>
  );
}
