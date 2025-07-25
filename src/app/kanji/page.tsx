
"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useKanji } from '@/hooks/useKanji';
import AddKanjiDialog from '@/components/kanji/AddKanjiDialog';
import KanjiList from '@/components/kanji/KanjiList';
import { LogIn, Info, Search, BookText, Shuffle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function KanjiPage() {
  const { user, loading: authLoading } = useAuth();
  const { kanjiList, loading: kanjiLoading, addKanji, updateKanji, deleteKanji } = useKanji();
  const [searchTerm, setSearchTerm] = useState('');
  const [isShuffled, setIsShuffled] = useState(false);

  if (authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-full mb-4" /> 
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert className="max-w-md text-center bg-primary/5 border-primary/20">
          <LogIn className="h-6 w-6 mx-auto mb-3 text-primary" />
          <AlertTitle className="font-headline text-2xl text-primary mb-2">Sign In Required</AlertTitle>
          <AlertDescription className="text-primary-foreground/80">
            Please <Link href="/" className="underline hover:text-primary-foreground font-semibold">sign in</Link> to manage and view your Kanji collection.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const displayedKanjiList = useMemo(() => {
    const filtered = kanjiList.filter(k => {
      const term = searchTerm.toLowerCase();
      return (
        k.kanji.toLowerCase().includes(term) ||
        (k.meaning && k.meaning.toLowerCase().includes(term)) ||
        k.onyomi.some(on => on.toLowerCase().includes(term)) ||
        k.kunyomi.some(kun => kun.toLowerCase().includes(term))
      );
    });

    if (isShuffled) {
      return shuffleArray(filtered);
    }
    return filtered;
  }, [kanjiList, searchTerm, isShuffled]);


  return (
    <div className="min-h-screen">
      <div className="mb-6 p-4 bg-card shadow rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-headline text-primary flex items-center">
          <BookText className="h-8 w-8 mr-3 text-primary" /> My Kanji Collection
        </h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search Kanji, meaning, readings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs bg-background"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsShuffled(!isShuffled)}
            aria-label={isShuffled ? "Unshuffle list" : "Shuffle list"}
            className={isShuffled ? 'text-primary bg-primary/10' : ''}
          >
            <Shuffle className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {kanjiLoading ? (
         <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
            {[...Array(24)].map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded-lg" />)}
        </div>
      ) : displayedKanjiList.length === 0 ? (
        <Alert className="max-w-md mx-auto bg-accent/10 border-accent/30">
          <Info className="h-5 w-5 text-accent-foreground" />
          <AlertTitle className="font-headline text-xl text-accent-foreground">
            {kanjiList.length === 0 ? "Your Kanji Collection is Empty" : "No Kanji Match Search"}
          </AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {kanjiList.length === 0
              ? "Start by adding your first Kanji character using the 'Add Kanji' button."
              : "No Kanji match your current search term. Try a different search or clear it."
            }
          </AlertDescription>
        </Alert>
      ) : (
        <KanjiList
          kanjiEntries={displayedKanjiList}
          onUpdateKanji={updateKanji}
          onDeleteKanji={deleteKanji}
        />
      )}
      <AddKanjiDialog onAddKanji={addKanji} />
    </div>
  );
}
