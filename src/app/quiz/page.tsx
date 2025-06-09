
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
      // If they didn't know it, and it was marked as learned, toggle its status.
      // The toggleLearnedStatus function handles the logic of flipping the boolean.
      if (currentWord.learned) {
         await toggleLearnedStatus(currentWord.id);
      }
    }
    // If they knew it, and it's already learned, no DB change needed.

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
        <Alert className="max-w-md text-center bg-primary/5 border-primary/20">
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
          <Alert className="max-w-lg text-center bg-accent/10 border-accent/30">
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

  return (
    <div className="flex flex-col items-center pt-8 space-y-8">
      <p className="text-center text-muted-foreground">
        Word {currentWordIndex + 1} of {quizWords.length}
      </p>
      <Card className="w-full max-w-lg min-h-[250px] flex flex-col justify-between items-center p-6 shadow-2xl bg-card relative overflow-hidden transition-all duration-500 ease-in-out transform-style-preserve-3d">
        <div className={`transition-transform duration-700 ease-in-out w-full h-full flex flex-col items-center justify-center text-center ${isFlipped ? 'rotate-y-180' : ''} transform-style-preserve-3d`}>
          {/* Front of Card */}
          <div className={`absolute w-full h-full flex flex-col items-center justify-center backface-hidden ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <p className="font-headline text-6xl text-primary mb-4">{currentWord.japanese}</p>
            <Button variant="outline" onClick={handleFlipCard}>Flip Card</Button>
          </div>

          {/* Back of Card */}
          <div className={`absolute w-full h-full flex flex-col items-center justify-center space-y-3 backface-hidden rotate-y-180 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <p className="text-2xl text-foreground font-semibold">{currentWord.romaji}</p>
            <p className="text-lg text-muted-foreground">{currentWord.definition}</p>
            <Button variant="outline" onClick={handleFlipCard} className="mt-4">Flip Back</Button>
          </div>
        </div>
      </Card>

      {isFlipped && (
        <div className="flex flex-col sm:flex-row gap-4 mt-6 animate-in fade-in duration-500">
          <Button 
            onClick={() => handleAnswer(false)} 
            variant="destructive" 
            size="lg" 
            className="w-full sm:w-auto text-lg px-8 py-6"
            disabled={processingAnswer}
          >
            {processingAnswer ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <XCircle className="mr-2 h-5 w-5" />}
            Didn't Know
          </Button>
          <Button 
            onClick={() => handleAnswer(true)} 
            variant="default" 
            size="lg" 
            className="w-full sm:w-auto text-lg px-8 py-6 bg-green-600 hover:bg-green-700 text-white"
            disabled={processingAnswer}
          >
            {processingAnswer ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
            Knew It!
          </Button>
        </div>
      )}
      <style jsx global>{`
        .transform-style-preserve-3d { transform-style: preserve-3d; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}</style>
    </div>
  );
}
