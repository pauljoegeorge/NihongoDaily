
"use client";

import type { VocabularyWord, DifficultyFilter } from '@/types';
import VocabularyCard from './VocabularyCard';
import { FileText, FilterX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, isToday, isYesterday, parseISO, compareDesc } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import type { EditFormData } from './EditVocabularyDialog'; // Import EditFormData type

interface VocabularyListProps {
  words: VocabularyWord[];
  loading: boolean;
  toggleLearnedStatus: (id: string) => void;
  deleteWord: (id: string) => void;
  updateWordDifficulty: (id: string, difficulty: 'easy' | 'medium' | 'hard') => void;
  updateWord: (id: string, data: EditFormData) => Promise<void>; // Add prop for updating word
  selectedDifficultyFilter: DifficultyFilter;
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
  updateWord, // Destructure new prop
  selectedDifficultyFilter,
  isTodayRandomized
}: VocabularyListProps) {

  if (loading) {
    return (
      <div className="space-y-8">
        {[...Array(2)].map((_, groupIndex) => (
          <div key={groupIndex}>
            <div className="h-8 bg-muted rounded w-1/4 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, cardIndex) => (
                <div key={cardIndex} className="bg-card p-6 rounded-lg shadow-md animate-pulse">
                  <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-10 bg-muted rounded w-1/4 mt-4"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const filteredWords = selectedDifficultyFilter === 'all' 
    ? words 
    : words.filter(word => word.difficulty === selectedDifficultyFilter);

  if (filteredWords.length === 0) {
    if (selectedDifficultyFilter === 'all') {
      return (
         <Alert className="max-w-md mx-auto bg-primary/5 border-primary/20">
            <FileText className="h-5 w-5 text-primary" />
            <AlertTitle className="font-headline text-xl text-primary">Your Vocabulary List is Empty</AlertTitle>
            <AlertDescription className="text-primary-foreground/80">
              Start your Japanese learning journey by adding your first vocabulary word. Click the "Add Word" button to begin!
            </AlertDescription>
          </Alert>
      );
    } else {
      return (
        <Alert className="max-w-md mx-auto bg-accent/20 border-accent/50">
           <FilterX className="h-5 w-5 text-accent-foreground" />
           <AlertTitle className="font-headline text-xl text-accent-foreground">No Words Match Filter</AlertTitle>
           <AlertDescription className="text-muted-foreground">
             No vocabulary words found with the difficulty level "{selectedDifficultyFilter}". Try a different filter or add more words!
           </AlertDescription>
         </Alert>
     );
    }
  }
  
  const sortedWords = [...filteredWords].sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)));

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
                  onUpdateWord={updateWord} // Pass down updateWord function
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
