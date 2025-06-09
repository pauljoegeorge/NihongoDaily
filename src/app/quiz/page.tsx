
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useAuth } from '@/context/AuthContext';
import type { VocabularyWord } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRightCircle, CheckCircle, HelpCircle, Loader2, RefreshCcw, Smile, XCircle } from 'lucide-react';
import Link from 'next/link';

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

  const [learnedWords, setLearnedWords] = useState<VocabularyWord[]>([]);
  const [quizWords, setQuizWords] = useState<VocabularyWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [processingAnswer, setProcessingAnswer] = useState(false);

  useEffect(() => {
    if (!vocabLoading && allWords.length > 0) {
      setLearnedWords(allWords.filter(word => word.learned));
    } else if (!vocabLoading && allWords.length === 0) {
      setLearnedWords([]);
    }
  }, [allWords, vocabLoading]);

  const startQuiz = useCallback(() => {
    if (learnedWords.length > 0) {
      setQuizWords(shuffleArray([...learnedWords]));
      setCurrentWordIndex(0);
      setIsFlipped(false);
      setQuizComplete(false);
      setQuizStarted(true);
    }
  }, [learnedWords]);

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

    if (currentWordIndex < quizWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setIsFlipped(false);
    } else {
      setQuizComplete(true);
    }
    setProcessingAnswer(false);
  };

  const handleRestartQuiz = () => {
    startQuiz();
  };

  if (authLoading || vocabLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-foreground">Loading your quiz...</p>
      </div>
    );
  }

  if (!user) {
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

  if (!quizStarted) {
    if (learnedWords.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <Alert className="max-w-lg text-center bg-accent/10 border-accent/30 mt-8">
            <HelpCircle className="h-8 w-8 mx-auto mb-4 text-accent-foreground" />
            <AlertTitle className="font-headline text-2xl text-accent-foreground mb-2">No Learned Words for Quiz</AlertTitle>
            <AlertDescription className="text-muted-foreground mb-4">
              You haven't marked any words as "learned" yet. Go to your <Link href="/" className="underline hover:text-accent-foreground font-semibold">vocabulary list</Link> to learn some words first!
            </AlertDescription>
            <Button onClick={() => window.location.href='/'} variant="outline">
              Back to Vocabulary
            </Button>
          </Alert>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md text-center p-8 shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Ready to Quiz Yourself?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-foreground mb-6">
              You have <strong className="text-primary">{learnedWords.length}</strong> learned word{learnedWords.length === 1 ? '' : 's'}. Let's test your knowledge!
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={startQuiz} size="lg" className="text-lg">
              Start Quiz <ArrowRightCircle className="ml-2 h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (quizComplete) {
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
              <RefreshCcw className="mr-2 h-5 w-5" /> Restart Quiz
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/">Back to Vocabulary</Link>
            </Button>
          </CardFooter>
        </Card>
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
      <Card className="w-full max-w-lg min-h-[420px] shadow-2xl bg-card relative overflow-hidden transition-all duration-500 ease-in-out transform-style-preserve-3d">
        <div className={`transition-transform duration-700 ease-in-out w-full h-full transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front of Card */}
          <div className={`absolute w-full h-full flex flex-col items-center backface-hidden p-4 text-center ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex-grow flex flex-col items-center justify-center w-full"> {/* Wrapper for main content */}
              <p className="font-headline text-5xl text-primary mb-4 break-words max-w-full">{currentWord.japanese}</p>
              <Button variant="outline" onClick={handleFlipCard}>Flip Card</Button>
            </div>
            <ActionButtons />
          </div>

          {/* Back of Card */}
          <div className={`absolute w-full h-full flex flex-col items-center backface-hidden rotate-y-180 p-4 text-center ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex-grow flex flex-col items-center justify-center w-full space-y-3"> {/* Wrapper for main content */}
              <p className="text-2xl text-foreground font-semibold">{currentWord.romaji}</p>
              <p className="text-lg text-muted-foreground">{currentWord.definition}</p>
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

