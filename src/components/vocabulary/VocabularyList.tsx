
"use client";

import type { VocabularyWord } from '@/types';
import VocabularyCard from './VocabularyCard';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import type { EditFormData } from './EditVocabularyDialog'; 

interface VocabularyListProps {
  groupedWords: { [key: string]: VocabularyWord[] };
  dateKeys: string[];
  toggleLearnedStatus: (id: string) => void;
  deleteWord: (id: string) => void;
  updateWordDifficulty: (id: string, difficulty: 'easy' | 'medium' | 'hard') => void;
  updateWord: (id: string, data: EditFormData) => Promise<void>;
  isTodayRandomized: boolean;
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
  groupedWords,
  dateKeys,
  toggleLearnedStatus, 
  deleteWord, 
  updateWordDifficulty,
  updateWord,
  isTodayRandomized
}: VocabularyListProps) {
  
  if (dateKeys.length === 0) {
    return null;
  }
  
  const formatDateDisplay = (dateKey: string): string => {
    if (dateKey === 'Today' || dateKey === 'Yesterday') {
      return dateKey;
    }
    return format(parseISO(dateKey), 'MMMM d, yyyy');
  }

  return (
    <div className="space-y-8">
      {dateKeys.map((dateKey, index) => {
        let wordsForDateGroup = groupedWords[dateKey] || [];
        if (dateKey === 'Today' && isTodayRandomized) {
          wordsForDateGroup = shuffleArray(wordsForDateGroup);
        }

        if (wordsForDateGroup.length === 0) return null;

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
