
"use client";

import type { VocabularyWord } from '@/types';
import VocabularyCard from './VocabularyCard';
// Removed FileText, FilterX from lucide-react as alerts are handled in page.tsx
// Removed Alert, AlertDescription, AlertTitle
import { format, isToday, isYesterday, parseISO, compareDesc } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import type { EditFormData } from './EditVocabularyDialog'; 
import { Skeleton } from '@/components/ui/skeleton'; // Keep Skeleton for loading state

interface VocabularyListProps {
  words: VocabularyWord[];
  loading: boolean; // Keep loading prop for initial skeleton display
  toggleLearnedStatus: (id: string) => void;
  deleteWord: (id: string) => void;
  updateWordDifficulty: (id: string, difficulty: 'easy' | 'medium' | 'hard') => void;
  updateWord: (id: string, data: EditFormData) => Promise<void>;
  // selectedDifficultyFilter: DifficultyFilter; // Removed, filtering done in page.tsx
  isTodayRandomized: boolean;
}

interface GroupedWords {
  [key: string]: VocabularyWord[];
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]; 
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function VocabularyList({ 
  words, 
  loading, 
  toggleLearnedStatus, 
  deleteWord, 
  updateWordDifficulty,
  updateWord,
  isTodayRandomized
}: VocabularyListProps) {

  // Loading state is now primarily handled by page.tsx for the empty/filtered states.
  // This component will show skeletons if `loading` is true (initial load of `useVocabulary`).
  if (loading && words.length === 0) { // Show skeletons only if truly loading and no words yet
    return (
      <div className="space-y-8">
        {[...Array(2)].map((_, groupIndex) => (
          <div key={groupIndex}>
            <Skeleton className="h-8 bg-muted rounded w-1/4 mb-4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, cardIndex) => (
                <div key={cardIndex} className="bg-card p-6 rounded-lg shadow-md animate-pulse">
                  <Skeleton className="h-8 bg-muted rounded w-3/4 mb-2" />
                  <Skeleton className="h-4 bg-muted rounded w-1/2 mb-4" />
                  <Skeleton className="h-4 bg-muted rounded w-full mb-2" />
                  <Skeleton className="h-4 bg-muted rounded w-full mb-2" />
                  <Skeleton className="h-10 bg-muted rounded w-1/4 mt-4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // If not loading and words array is empty, page.tsx will handle showing an alert.
  // This component should only render if there are words to display or if it's still in its own loading phase.
  if (!loading && words.length === 0) {
    return null; // page.tsx handles "No words" or "Empty list" scenarios
  }
  
  // Words are already filtered by page.tsx
  // Sort the incoming words directly
  const sortedWords = [...words].sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)));

  const groupedWords = sortedWords.reduce((acc: GroupedWords, word) => {
    const date = new Date(word.createdAt);
    let dateKey: string;

    if (isToday(date)) {
      dateKey = 'Today';
    } else if (isYesterday(date)) {
      dateKey = 'Yesterday';
    } else {
      dateKey = format(date, 'yyyy-MM-dd');
    }

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(word);
    return acc;
  }, {});

  const dateKeys = Object.keys(groupedWords).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return compareDesc(parseISO(a), parseISO(b));
  });

  const formatDateDisplay = (dateKey: string): string => {
    if (dateKey === 'Today' || dateKey === 'Yesterday') {
      return dateKey;
    }
    return format(parseISO(dateKey), 'MMMM d, yyyy');
  }

  return (
    <div className="space-y-8">
      {dateKeys.map((dateKey, index) => {
        let wordsForDateGroup = groupedWords[dateKey];
        if (dateKey === 'Today' && isTodayRandomized) {
          wordsForDateGroup = shuffleArray(wordsForDateGroup);
        }

        return (
          <section key={dateKey}>
            <h2 className="text-2xl font-headline text-primary mb-4 pb-2 border-b border-primary/20">
              {formatDateDisplay(dateKey)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {wordsForDateGroup.map(word => (
                <VocabularyCard 
                  key={word.id} 
                  word={word} 
                  onToggleLearned={toggleLearnedStatus}
                  onDelete={deleteWord}
                  onUpdateDifficulty={updateWordDifficulty}
                  onUpdateWord={updateWord}
                />
              ))}
            </div>
            {index < dateKeys.length - 1 && <Separator className="my-8 bg-border/50" />}
          </section>
        );
      })}
    </div>
  );
}
