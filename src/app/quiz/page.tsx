
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useAuth } from '@/context/AuthContext';
import type { VocabularyWord, DifficultyFilter } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle, 
  HelpCircle, 
  Loader2, 
  RefreshCcw, 
  Smile, 
  XCircle,
  CalendarDays,
  Shuffle,
  BookOpenCheck,
  ListChecks,
  MinusCircle,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { isToday } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';

const MAX_QUIZ_WORDS = 10; // This constant is no longer used for slicing but kept for reference

type QuizState = 'loading' | 'choosing_scope' | 'playing' | 'finished' | 'no_data';

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const difficultyFilters: { label: string; value: DifficultyFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

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
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');

  const allLearnedWords = useMemo(() => {
    if (vocabLoading || !allWords) return [];
    return allWords.filter(word => word.learned);
  }, [allWords, vocabLoading]);

  const todayLearnedWords = useMemo(() => {
    if (vocabLoading || !allWords) return [];
    return allWords.filter(word => word.learned && isToday(new Date(word.createdAt)));
  }, [allWords, vocabLoading]);

  const filteredLearnedWords = useMemo(() => {
    if (difficultyFilter === 'all') {
      return allLearnedWords;
    }
    return allLearnedWords.filter(word => word.difficulty === difficultyFilter);
  }, [allLearnedWords, difficultyFilter]);

  useEffect(() => {
    if (authLoading || vocabLoading) {
      setQuizState('loading');
    } else if (!user) {
      setQuizState('loading'); 
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

  const startQuiz = useCallback((wordsToQuiz: VocabularyWord[]) => {
    if (wordsToQuiz.length === 0) {
      toast({
        title: "No Words to Quiz",
        description: "There are no learned words matching your selection.",
        variant: "destructive",
      });
      return;
    }
    
    setQuizWords(shuffleArray([...wordsToQuiz]));
    setCurrentWordIndex(0);
    setIsFlipped(false);
    setProcessingAnswer(false);
    setQuizState('playing');
  }, [toast]);

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = async (knewIt: boolean) => {
    if (processingAnswer || quizWords.length === 0) return;

    setProcessingAnswer(true);
    const currentWord = quizWords[currentWordIndex];

    if (!knewIt) {
      if (currentWord.learned) {
        await toggleLearnedStatus(currentWord.id);
      }
    }

    // Immediately start the flip-back animation
    setIsFlipped(false);

    // Use a short timeout to allow the animation to start before changing the card's content
    setTimeout(() => {
      if (currentWordIndex < quizWords.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
      } else {
        setQuizState('finished');
      }
      // The processing state ends after the next card is ready
      setProcessingAnswer(false);
    }, 200); // 200ms delay to prevent content flicker during flip animation
  };

  const handleRestartQuiz = () => {
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
  
  const currentWord = useMemo(() => {
    if (quizState === 'playing' && quizWords.length > 0 && quizWords[currentWordIndex]) {
      return quizWords[currentWordIndex];
    }
    return null;
  }, [quizState, quizWords, currentWordIndex]);

  const displayableExampleParts = useMemo(() => {
    if (quizState === 'playing' && currentWord && currentWord.exampleSentences && currentWord.exampleSentences.length > 0) {
      const sentenceIndex = Math.floor(Math.random() * currentWord.exampleSentences.length);
      const fullSentence = currentWord.exampleSentences[sentenceIndex];
      
      let jpPart = fullSentence; // Default to full sentence
      let enPart = "";
      let splitSuccessful = false;

      const jpEndMarkers = ['。', '．', '.']; 
      for (const marker of jpEndMarkers) {
        const markerIndex = fullSentence.indexOf(marker);
        if (markerIndex > 0 && markerIndex < fullSentence.length - 1) { 
          const potentialEn = fullSentence.substring(markerIndex + 1).trim();
          if (potentialEn.length > 0 && /[a-zA-Z]/.test(potentialEn[0])) { 
            jpPart = fullSentence.substring(0, markerIndex + 1).trim();
            enPart = potentialEn;
            splitSuccessful = true;
            break;
          }
        }
      }

      if (!splitSuccessful) {
        const dashSeparatorIndex = fullSentence.indexOf(' - ');
        if (dashSeparatorIndex > 0) {
          const potentialEn = fullSentence.substring(dashSeparatorIndex + 3).trim();
           if (potentialEn.length > 0 && /[a-zA-Z]/.test(potentialEn[0])) { 
             jpPart = fullSentence.substring(0, dashSeparatorIndex).trim();
             enPart = potentialEn;
           }
        }
      }
      
      return { japanese: jpPart, english: enPart };
    }
    return null;
  }, [currentWord, quizState]);


  if (quizState === 'loading' || authLoading || (vocabLoading && allWords.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-foreground">Loading your quiz options...</p>
      </div>
    );
  }

  if (!user && quizState !== 'loading') { 
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
        <Card className="w-full max-w-lg text-center p-6 shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Flashcard Quiz</CardTitle>
            <CardDescription className="text-muted-foreground">Choose which words you want to review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div>
              <Button 
                onClick={() => startQuiz(todayLearnedWords)} 
                size="lg" 
                className="w-full text-lg"
                disabled={todayLearnedWords.length === 0}
              >
                <CalendarDays className="mr-2 h-5 w-5" />
                Quiz Today's Learned Words ({todayLearnedWords.length})
              </Button>
              {todayLearnedWords.length === 0 && <p className="text-xs text-muted-foreground mt-1">No words learned today.</p>}
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Review All Learned Words</h3>
              
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ListChecks className="h-5 w-5 text-primary" />
                  Difficulty:
                </div>
                {difficultyFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={difficultyFilter === filter.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDifficultyFilter(filter.value)}
                    className="capitalize transition-all duration-150 ease-in-out"
                  >
                    {difficultyFilter === filter.value && <Check className="h-4 w-4 mr-1" />}
                    {filter.label}
                  </Button>
                ))}
              </div>
              
              <Button 
                onClick={() => startQuiz(filteredLearnedWords)} 
                size="lg" 
                className="w-full text-lg"
                disabled={filteredLearnedWords.length === 0}
              >
                <Shuffle className="mr-2 h-5 w-5" />
                Start Quiz ({filteredLearnedWords.length} words)
              </Button>
              {allLearnedWords.length > 0 && filteredLearnedWords.length === 0 && <p className="text-xs text-muted-foreground text-center mt-1">No learned words match this difficulty.</p>}
            </div>
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
  
  if (quizState !== 'playing' || !currentWord) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert className="max-w-lg text-center">
          <HelpCircle className="h-8 w-8 mx-auto mb-4" />
          <AlertTitle className="font-headline text-2xl">Error or Loading</AlertTitle>
          <AlertDescription className="mb-4">
           Please wait, or if the problem persists, <Link href="/" className="underline font-semibold">go back to vocabulary</Link> and try again.
          </AlertDescription>
           <Button onClick={handleRestartQuiz} variant="outline">Restart Quiz Setup</Button>
        </Alert>
      </div>
    );
  }

  const ActionButtons = () => (
    <div className="flex-shrink-0 flex gap-4 w-full justify-center pt-4 border-t border-border/20">
      <Button 
        onClick={() => handleAnswer(false)} 
        variant="destructive" 
        size="icon" 
        className="h-12 w-12 rounded-full"
        aria-label="Didn't know"
        disabled={processingAnswer}
      >
        {processingAnswer && !isFlipped ? <Loader2 className="h-6 w-6 animate-spin" /> : <MinusCircle className="h-6 w-6" />}
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
      <Card className="w-full max-w-lg min-h-[450px] shadow-2xl bg-card relative overflow-hidden flex flex-col">
        <div className={`transition-transform duration-700 ease-in-out w-full h-full transform-style-preserve-3d grid grid-cols-1 grid-rows-1 ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front of the Card - Always Japanese word & Romaji */}
          <div className="col-start-1 row-start-1 w-full h-full flex flex-col backface-hidden p-4">
            <div className="flex-grow flex flex-col justify-center overflow-hidden">
              <div className="overflow-y-auto text-center space-y-3">
                <p className="font-headline text-5xl text-primary mb-2 break-words max-w-full">{currentWord.japanese}</p>
                <p className="text-xl text-muted-foreground">{currentWord.romaji}</p>
                <Button variant="outline" onClick={handleFlipCard} className="mt-4 mb-3">
                  Reveal Definition
                </Button>
              </div>
            </div>
            <ActionButtons />
          </div>

          {/* Back of the Card - Always Definition & Examples */}
          <div className="col-start-1 row-start-1 w-full h-full flex flex-col backface-hidden rotate-y-180 p-4">
            <div className="flex-grow flex flex-col justify-center overflow-hidden">
              <div className="overflow-y-auto text-center space-y-3 p-2">
                <p className="text-2xl lg:text-3xl text-foreground break-words max-w-full leading-relaxed px-4">{currentWord.definition}</p>
              
                {displayableExampleParts && (
                  <div className="mt-4 pt-3 border-t border-border/20 w-full max-w-md mx-auto">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center justify-center">
                      <ListChecks className="h-4 w-4 mr-2 text-primary" />
                      Example Sentence:
                    </h4>
                    <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/20 text-left mb-1">
                      {displayableExampleParts.japanese}
                    </p>
                    {displayableExampleParts.english && (
                      <p className="text-xs text-muted-foreground/80 p-2 border rounded-md bg-muted/10 text-left mt-1">
                        <span className="font-semibold">EN:</span> {displayableExampleParts.english}
                      </p>
                    )}
                  </div>
                )}
              
                <Button variant="outline" onClick={handleFlipCard} className="mt-3 mb-2">Flip Back</Button>
              </div>
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

    