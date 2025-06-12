
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useAuth } from '@/context/AuthContext';
import type { VocabularyWord } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  ArrowRightCircle, 
  CheckCircle, 
  HelpCircle, 
  Loader2, 
  RefreshCcw, 
  Smile, 
  XCircle,
  CalendarDays,
  Shuffle,
  BookOpenCheck
} from 'lucide-react';
import Link from 'next/link';
import { isToday } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

const MAX_QUIZ_WORDS = 10;

type QuizState = 'loading' | 'choosing_scope' | 'playing' | 'finished' | 'no_data';

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function QuizPage() {
  const { user, loading: authLoading } = useAuth();
  const { words: allWords, loading: vocabLoading, toggleLearnedStatus } = useVocabulary();
  const { toast } = useToast();

  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [quizWords, setQuizWords] = useState<VocabularyWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [processingAnswer, setProcessingAnswer] = useState(false);
  const [noDataMessage, setNoDataMessage] = useState<string | null>(null);


  const allLearnedWords = useMemo(() => {
    if (vocabLoading || !allWords) return [];
    return allWords.filter(word => word.learned);
  }, [allWords, vocabLoading]);

  const todayLearnedWords = useMemo(() => {
    if (vocabLoading || !allWords) return [];
    return allWords.filter(word => word.learned && isToday(new Date(word.createdAt)));
  }, [allWords, vocabLoading]);

  useEffect(() => {
    if (authLoading || vocabLoading) {
      setQuizState('loading');
    } else if (!user) {
      setQuizState('loading'); // Sign-in message handled in render
    } else if (allWords.length === 0) {
      setNoDataMessage("You haven't added any words to your vocabulary yet. Start by adding some!");
      setQuizState('no_data');
    } else if (allLearnedWords.length === 0) {
      setNoDataMessage("You don't have any 'learned' words yet. Go to your vocabulary list and mark some words as learned to start quizzing!");
      setQuizState('no_data');
    } else {
      setQuizState('choosing_scope');
    }
  }, [authLoading, vocabLoading, user, allWords, allLearnedWords]);


  const handlePrepareQuiz = useCallback((scope: 'today' | 'random10') => {
    let selectedWordsForQuiz: VocabularyWord[] = [];

    if (scope === 'today') {
      if (todayLearnedWords.length === 0) {
        toast({ title: "No learned words from today", description: "Please learn some words added today or choose another option.", variant: "destructive" });
        setNoDataMessage("No words learned today. Try random words or learn today's vocabulary.");
        setQuizState('no_data'); // Revert to a state where this message can be shown if choosing_scope isn't suitable
        return;
      }
      selectedWordsForQuiz = shuffleArray([...todayLearnedWords]);
    } else { // scope === 'random10'
      // This check is technically redundant due to useEffect, but good for safety
      if (allLearnedWords.length === 0) { 
        toast({ title: "No learned words", description: "Please learn some words first.", variant: "destructive" });
        setNoDataMessage("No learned words found. Mark some words as 'learned' in your vocabulary.");
        setQuizState('no_data');
        return;
      }
      selectedWordsForQuiz = shuffleArray([...allLearnedWords]).slice(0, MAX_QUIZ_WORDS);
    }

    if (selectedWordsForQuiz.length === 0) {
        toast({ title: "Quiz Error", description: "Could not prepare quiz words. Not enough words for the selected scope.", variant: "destructive" });
        setNoDataMessage("Not enough words available for this quiz type. Try adding or learning more.");
        setQuizState('no_data');
        return;
    }

    setQuizWords(selectedWordsForQuiz);
    setCurrentWordIndex(0);
    setIsFlipped(false);
    setProcessingAnswer(false);
    setQuizState('playing');
  }, [allLearnedWords, todayLearnedWords, toast]);


  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = async (knewIt: boolean) => {
    if (processingAnswer || quizWords.length === 0) return;

    setProcessingAnswer(true);
    const currentWord = quizWords[currentWordIndex];

    if (!knewIt) {
      if (currentWord.learned) { // Only toggle if it was marked as learned
         await toggleLearnedStatus(currentWord.id);
      }
    }

    if (currentWordIndex < quizWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setIsFlipped(false);
    } else {
      setQuizState('finished');
    }
    setProcessingAnswer(false);
  };

  const handleRestartQuiz = () => {
    // Re-evaluate available words when going back to choosing scope
    if (allWords.length === 0) {
      setNoDataMessage("You haven't added any words to your vocabulary yet. Start by adding some!");
      setQuizState('no_data');
    } else if (allLearnedWords.length === 0) {
      setNoDataMessage("You don't have any 'learned' words yet. Go to your vocabulary list and mark some words as learned to start quizzing!");
      setQuizState('no_data');
    } else {
      setQuizState('choosing_scope');
    }
  };

  if (quizState === 'loading' || authLoading || (vocabLoading && allWords.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-foreground">Loading your quiz options...</p>
      </div>
    );
  }

  if (!user && quizState !== 'loading') { // Ensure not to show this while initial auth is still loading
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert className="max-w-md text-center bg-primary/5 border-primary/20 mt-8">
          <HelpCircle className="h-6 w-6 mx-auto mb-3 text-primary" />
          <AlertTitle className="font-headline text-2xl text-primary mb-2">Sign In Required</AlertTitle>
          <AlertDescription className="text-primary-foreground/80">
            Please <Link href="/" className="underline hover:text-primary-foreground font-semibold">sign in</Link> to access the quiz.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (quizState === 'no_data') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert className="max-w-lg text-center bg-accent/10 border-accent/30 mt-8">
          <BookOpenCheck className="h-8 w-8 mx-auto mb-4 text-accent-foreground" />
          <AlertTitle className="font-headline text-2xl text-accent-foreground mb-2">Quiz Data Needed</AlertTitle>
          <AlertDescription className="text-muted-foreground mb-4">
            {noDataMessage || "Please add or learn more vocabulary words to start a quiz."}
          </AlertDescription>
          <Button onClick={() => window.location.href='/'} variant="outline">
            Back to Vocabulary
          </Button>
        </Alert>
      </div>
    );
  }

  if (quizState === 'choosing_scope') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md text-center p-8 shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Choose Quiz Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => handlePrepareQuiz('today')} 
              size="lg" 
              className="w-full text-lg"
              disabled={todayLearnedWords.length === 0}
            >
              <CalendarDays className="mr-2 h-5 w-5" />
              Today's Learned Words ({todayLearnedWords.length})
            </Button>
            {todayLearnedWords.length === 0 && <p className="text-xs text-muted-foreground">No words learned today.</p>}
            
            <Button 
              onClick={() => handlePrepareQuiz('random10')} 
              size="lg" 
              className="w-full text-lg"
              disabled={allLearnedWords.length === 0} // Should be covered by quizState logic, but safe
            >
              <Shuffle className="mr-2 h-5 w-5" />
              Random {Math.min(MAX_QUIZ_WORDS, allLearnedWords.length)} Learned Words 
              <span className="text-sm ml-1 text-primary-foreground/80"> (from {allLearnedWords.length})</span>
            </Button>
            {allLearnedWords.length > 0 && allLearnedWords.length < MAX_QUIZ_WORDS && <p className="text-xs text-muted-foreground">Fewer than {MAX_QUIZ_WORDS} learned words available.</p>}

          </CardContent>
        </Card>
      </div>
    );
  }
  

  if (quizState === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md text-center p-8 shadow-xl bg-card">
          <CardHeader>
            <Smile className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="font-headline text-3xl text-primary">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-foreground mb-6">
              Great job reviewing your vocabulary!
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-3">
            <Button onClick={handleRestartQuiz} size="lg" variant="default">
              <RefreshCcw className="mr-2 h-5 w-5" /> New Quiz
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/">Back to Vocabulary</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Fallback for unexpected states or if quizWords is empty during 'playing'
  if (quizState !== 'playing' || quizWords.length === 0 || !quizWords[currentWordIndex]) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert className="max-w-lg text-center">
          <HelpCircle className="h-8 w-8 mx-auto mb-4" />
          <AlertTitle className="font-headline text-2xl">Error</AlertTitle>
          <AlertDescription className="mb-4">
           An unexpected error occurred or no words are available for the quiz. Please try again or <Link href="/" className="underline font-semibold">go back to vocabulary</Link>.
          </AlertDescription>
           <Button onClick={handleRestartQuiz} variant="outline">Try Again</Button>
        </Alert>
      </div>
    );
  }


  const currentWord = quizWords[currentWordIndex];
  const ActionButtons = () => (
    <div className="flex gap-4 w-full justify-center mt-auto pt-4 border-t border-border/20">
      <Button 
        onClick={() => handleAnswer(false)} 
        variant="destructive" 
        size="icon" 
        className="h-12 w-12 rounded-full"
        aria-label="Didn't know"
        disabled={processingAnswer}
      >
        {processingAnswer && !isFlipped ? <Loader2 className="h-6 w-6 animate-spin" /> : <XCircle className="h-6 w-6" />}
      </Button>
      <Button 
        onClick={() => handleAnswer(true)} 
        variant="default" 
        size="icon" 
        className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white"
        aria-label="Knew it"
        disabled={processingAnswer}
      >
        {processingAnswer && isFlipped ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle className="h-6 w-6" />}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col items-center pt-8 space-y-8">
      <p className="text-center text-muted-foreground">
        Word {currentWordIndex + 1} of {quizWords.length}
      </p>
      <Card className="w-full max-w-lg min-h-[420px] shadow-2xl bg-card relative overflow-hidden">
        <div className={`transition-transform duration-700 ease-in-out w-full h-full transform-style-preserve-3d grid grid-cols-1 grid-rows-1 ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front of the Card: English Definition */}
          <div className="col-start-1 row-start-1 w-full h-full flex flex-col items-center backface-hidden p-4 text-center">
            <div className="flex-grow flex flex-col items-center justify-center w-full">
              <p className="text-2xl lg:text-3xl text-foreground mb-6 break-words max-w-full leading-relaxed px-4">{currentWord.definition}</p>
              <Button variant="outline" onClick={handleFlipCard}>Reveal Answer</Button>
            </div>
            <ActionButtons />
          </div>

          {/* Back of the Card: Japanese Word & Romaji */}
          <div className="col-start-1 row-start-1 w-full h-full flex flex-col items-center backface-hidden rotate-y-180 p-4 text-center">
            <div className="flex-grow flex flex-col items-center justify-center w-full space-y-3">
              <p className="font-headline text-5xl text-primary mb-2 break-words max-w-full">{currentWord.japanese}</p>
              <p className="text-2xl text-muted-foreground font-semibold">{currentWord.romaji}</p>
              <Button variant="outline" onClick={handleFlipCard} className="mt-4 mb-3">Flip Back</Button>
            </div>
            <ActionButtons />
          </div>
        </div>
      </Card>

      <style jsx global>{`
        .transform-style-preserve-3d { transform-style: preserve-3d; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}</style>
    </div>
  );
}

