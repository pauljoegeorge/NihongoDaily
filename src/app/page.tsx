
"use client";

import { useState } from 'react';
import AddVocabularyDialog from '@/components/vocabulary/AddVocabularyDialog';
import VocabularyList from '@/components/vocabulary/VocabularyList';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Button } from '@/components/ui/button';
import type { DifficultyFilter } from '@/types';
import { ListFilter, Check, Shuffle } from 'lucide-react';

export default function Home() {
  const { words, loading, addWord, toggleLearnedStatus, deleteWord, updateWordDifficulty } = useVocabulary();
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<DifficultyFilter>('all');
  const [isTodayRandomized, setIsTodayRandomized] = useState(false);

  const difficultyFilters: { label: string; value: DifficultyFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
  ];

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
          {isTodayRandomized ? "Sort Today Chronologically" : "Randomize Today's Words"}
        </Button>
      </div>

      <VocabularyList
        words={words}
        loading={loading}
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
