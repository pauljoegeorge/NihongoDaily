
"use client";

import { useState, useMemo, useEffect } from 'react';
import AddVocabularyDialog from '@/components/vocabulary/AddVocabularyDialog';
import VocabularyList from '@/components/vocabulary/VocabularyList';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Button } from '@/components/ui/button';
import type { DifficultyFilter, VocabularyWord } from '@/types';
import { ListFilter, Check, Shuffle, Loader2, Info, Search, ChevronLeft, ChevronRight, Cherry } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { format, isToday, isYesterday, parseISO, compareDesc } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type LearnedStatusFilter = 'all' | 'learned' | 'unlearned';

interface GroupedWords {
  [key: string]: VocabularyWord[];
}

const DAYS_PER_PAGE = 5;

export default function Home() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
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
  const [currentPage, setCurrentPage] = useState(1);

  const processedWords = useMemo(() => {
    let processed = [...words];
    if (searchTerm.trim()) {
      processed = processed.filter(word =>
        word.japanese.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.romaji.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.definition.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedDifficultyFilter !== 'all') {
      processed = processed.filter(word => word.difficulty === selectedDifficultyFilter);
    }
    if (selectedLearnedFilter === 'learned') {
      processed = processed.filter(word => word.learned);
    } else if (selectedLearnedFilter === 'unlearned') {
      processed = processed.filter(word => !word.learned);
    }
    return processed;
  }, [words, searchTerm, selectedLearnedFilter, selectedDifficultyFilter]);

  const paginatedData = useMemo(() => {
    const sortedWords = [...processedWords].sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)));

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

    const allDateKeys = Object.keys(groupedWords).sort((a, b) => {
      if (a === 'Today') return -1;
      if (b === 'Today') return 1;
      if (a === 'Yesterday') return -1;
      if (b === 'Yesterday') return 1;
      return compareDesc(parseISO(a), parseISO(b));
    });

    const totalPages = Math.ceil(allDateKeys.length / DAYS_PER_PAGE);
    
    const startIndex = (currentPage - 1) * DAYS_PER_PAGE;
    const endIndex = startIndex + DAYS_PER_PAGE;
    const dateKeysForPage = allDateKeys.slice(startIndex, endIndex);

    const groupsForPage = dateKeysForPage.reduce((acc: GroupedWords, key) => {
        if (groupedWords[key]) {
          acc[key] = groupedWords[key];
        }
        return acc;
    }, {});

    return {
        groupsForPage,
        dateKeysForPage,
        totalPages,
    };
  }, [processedWords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDifficultyFilter, selectedLearnedFilter]);

  const { groupsForPage, dateKeysForPage, totalPages } = paginatedData;

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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md p-8 shadow-xl bg-card text-center">
          <CardHeader>
            <Cherry className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="font-headline text-4xl text-primary">Welcome to Nihongo Daily</CardTitle>
            <CardDescription className="text-muted-foreground pt-2">
              Your personal space to grow your Japanese vocabulary, one day at a time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-foreground">Sign in with your Google account to get started.</p>
            <Button onClick={signInWithGoogle} size="lg" className="w-full">
              <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.5 512 0 398.8 0 256S110.5 0 244 0c69.8 0 130.8 28.5 173.4 72.6l-65.4 63.5C332.1 102.5 291.1 80 244 80c-82.3 0-152.2 64.5-152.2 143.9S161.7 367.8 244 367.8c59.9 0 97.7-25.2 124.8-51.1 19.4-18.4 32.4-42.8 38.8-70.8H244V261.8h244z"></path>
              </svg>
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
          <span className="hidden sm:inline">{isTodayRandomized ? "Unshuffle Today" : "Shuffle Today's Words"}</span>
          <span className="sm:hidden">{isTodayRandomized ? "Unshuffle" : "Shuffle"}</span>
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
        <>
          <VocabularyList
            groupedWords={groupsForPage}
            dateKeys={dateKeysForPage}
            toggleLearnedStatus={toggleLearnedStatus}
            deleteWord={deleteWord}
            updateWordDifficulty={updateWordDifficulty}
            updateWord={updateWord}
            isTodayRandomized={isTodayRandomized}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
      <AddVocabularyDialog onAddWord={addWord} />
    </div>
  );
}
