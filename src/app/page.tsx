
"use client";

import { useState } from 'react';
import AddVocabularyDialog from '@/components/vocabulary/AddVocabularyDialog';
import VocabularyList from '@/components/vocabulary/VocabularyList';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Button } from '@/components/ui/button';
import type { DifficultyFilter, VocabularyWord } from '@/types';
import { ListFilter, Check, Shuffle, LogIn, Loader2, Info, Search } from 'lucide-react'; // Added Search icon
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input'; // Added Input import

type LearnedStatusFilter = 'all' | 'learned' | 'unlearned';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const {
    words,
    loading: vocabLoading,
    addWord,
    updateWord,
    toggleLearnedStatus,
    deleteWord,
    updateWordDifficulty
  } = useVocabulary();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<DifficultyFilter>('all');
  const [selectedLearnedFilter, setSelectedLearnedFilter] = useState<LearnedStatusFilter>('all');
  const [isTodayRandomized, setIsTodayRandomized] = useState(false);

  const difficultyFilters: { label: string; value: DifficultyFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
  ];

  const learnedStatusFilters: { label: string; value: LearnedStatusFilter }[] = [
    { label: 'All Status', value: 'all' },
    { label: 'Learned', value: 'learned' },
    { label: 'Not Learned', value: 'unlearned' },
  ];

  if (authLoading) {
    return (
      <div className="space-y-8">
        <div className="mb-6 p-4 bg-card shadow rounded-lg space-y-4">
          <Skeleton className="h-9 w-full mb-2" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-28" />
          </div>
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

  // Apply filters
  let processedWords = [...words];

  // 1. Filter by search term
  if (searchTerm.trim()) {
    processedWords = processedWords.filter(word =>
      word.japanese.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.romaji.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // 2. Filter by difficulty
  if (selectedDifficultyFilter !== 'all') {
    processedWords = processedWords.filter(word => word.difficulty === selectedDifficultyFilter);
  }

  // 3. Filter by learned status
  if (selectedLearnedFilter === 'learned') {
    processedWords = processedWords.filter(word => word.learned);
  } else if (selectedLearnedFilter === 'unlearned') {
    processedWords = processedWords.filter(word => !word.learned);
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6 p-4 bg-card shadow rounded-lg space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
           <div className="flex items-center gap-2 text-sm font-medium text-foreground shrink-0">
            <Search className="h-5 w-5 text-primary" />
            Search:
          </div>
          <Input
            type="text"
            placeholder="Search Japanese, Romaji, or Definition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-md bg-background"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mr-2">
            <ListFilter className="h-5 w-5 text-primary" />
            Difficulty:
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mr-2">
            <ListFilter className="h-5 w-5 text-primary" />
            Status:
          </div>
          {learnedStatusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={selectedLearnedFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLearnedFilter(filter.value)}
              className="transition-all duration-150 ease-in-out"
            >
              {selectedLearnedFilter === filter.value && <Check className="h-4 w-4 mr-1" />}
              {filter.label}
            </Button>
          ))}
        </div>

        <Button
          variant={isTodayRandomized ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsTodayRandomized(!isTodayRandomized)}
          className="transition-all duration-150 ease-in-out"
        >
          <Shuffle className="h-4 w-4 mr-1" />
          {isTodayRandomized ? "Unshuffle Today" : "Shuffle Today's Words"}
        </Button>
      </div>

      {vocabLoading ? (
        <div className="space-y-8">
          {[...Array(2)].map((_, groupIndex) => (
            <div key={groupIndex}>
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
          ))}
        </div>
      ) : processedWords.length === 0 ? (
        <Alert className="max-w-md mx-auto bg-accent/10 border-accent/30">
          <Info className="h-5 w-5 text-accent-foreground" />
          <AlertTitle className="font-headline text-xl text-accent-foreground">
            {words.length === 0 ? "Your Vocabulary List is Empty" : "No Words Match Criteria"}
          </AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {words.length === 0 
              ? "Start your Japanese learning journey by adding your first vocabulary word. Click the 'Add Word' button to begin!"
              : "No words match your current search and/or filter criteria. Try adjusting them or add more words to your list."
            }
          </AlertDescription>
        </Alert>
      ) : (
        <VocabularyList
          words={processedWords}
          loading={vocabLoading} 
          toggleLearnedStatus={toggleLearnedStatus}
          deleteWord={deleteWord}
          updateWordDifficulty={updateWordDifficulty}
          updateWord={updateWord}
          isTodayRandomized={isTodayRandomized}
        />
      )}
      <AddVocabularyDialog onAddWord={addWord} />
    </div>
  );
}
