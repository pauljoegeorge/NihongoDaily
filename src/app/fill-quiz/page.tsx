
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useAuth } from '@/context/AuthContext';
import type { VocabularyWord } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRightCircle, CheckCircle, Loader2, LogIn, FileQuestion, AlertTriangle, RefreshCcw, XCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const MAX_QUIZ_QUESTIONS = 10;
const NUM_OPTIONS = 3; // 1 correct, 2 distractors

interface FillQuizQuestion {
  id: string; // vocab word ID
  originalSentence: string;
  blankedSentence: string;
  options: string[]; // Japanese words
  correctAnswer: string; // Japanese word
  vocabWord: VocabularyWord; // Store the full word for context if needed
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function FillQuizPage() {
  const { user, loading: authLoading } = useAuth();
  const { words: allWords, loading: vocabLoading } = useVocabulary();

  const [quizQuestions, setQuizQuestions] = useState<FillQuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizState, setQuizState] = useState<'initial' | 'playing' | 'finished' | 'insufficient_data'>('initial');

  const quizzableWords = useMemo(() => {
    return allWords.filter(word => word.exampleSentences && word.exampleSentences.length > 0);
  }, [allWords]);

  const prepareQuiz = useCallback(() => {
    if (quizzableWords.length === 0) {
      setQuizState('insufficient_data');
      return;
    }
    if (allWords.length < NUM_OPTIONS) { // Need enough words for distractors
      setQuizState('insufficient_data');
      return;
    }

    const shuffledQuizzableWords = shuffleArray([...quizzableWords]);
    const selectedForQuiz = shuffledQuizzableWords.slice(0, MAX_QUIZ_QUESTIONS);

    const generatedQuestions: FillQuizQuestion[] = [];

    for (const word of selectedForQuiz) {
      if (!word.exampleSentences || word.exampleSentences.length === 0) continue;
      
      const sentenceIndex = Math.floor(Math.random() * word.exampleSentences.length);
      const originalSentence = word.exampleSentences[sentenceIndex];
      
      // More robust blanking: case-insensitive, whole word
      const wordToBlank = word.japanese;
      // Escape regex special characters in wordToBlank
      const escapedWordToBlank = wordToBlank.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const blankRegex = new RegExp(`\\b${escapedWordToBlank}\\b`, 'gi'); // word boundary, global, case-insensitive
      
      if (!blankRegex.test(originalSentence)) { // If word not found (should be rare if data is good)
          console.warn(`Word "${wordToBlank}" not found in sentence "${originalSentence}". Skipping.`);
          continue;
      }
      const blankedSentence = originalSentence.replace(blankRegex, "_______");


      const correctAnswer = word.japanese;
      const distractors: string[] = [];
      
      const potentialDistractors = shuffleArray(allWords.filter(w => w.id !== word.id));

      for (const distractorWord of potentialDistractors) {
        if (distractors.length < NUM_OPTIONS - 1) {
          if (distractorWord.japanese !== correctAnswer && !distractors.includes(distractorWord.japanese)) {
            distractors.push(distractorWord.japanese);
          }
        } else {
          break;
        }
      }
      
      // If not enough distractors found from unique words, we might have an issue.
      // For now, we proceed, but ideally, we need at least NUM_OPTIONS unique words in allWords.
      if (distractors.length < NUM_OPTIONS - 1) {
          console.warn(`Not enough unique distractors for word "${word.japanese}". Quiz quality might be affected.`);
          // Fill with placeholders if absolutely necessary, or skip question
          while(distractors.length < NUM_OPTIONS - 1) distractors.push("選択肢" + (distractors.length + 1)); // Placeholder "Option X"
      }


      const options = shuffleArray([correctAnswer, ...distractors]);

      generatedQuestions.push({
        id: word.id,
        originalSentence,
        blankedSentence,
        options,
        correctAnswer,
        vocabWord: word,
      });
    }
    
    if (generatedQuestions.length === 0) {
        setQuizState('insufficient_data'); // Possible if all selected words failed blanking
        return;
    }

    setQuizQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setQuizState('playing');
  }, [quizzableWords, allWords]);


  const handleSubmitAnswer = () => {
    if (selectedOption === null || !quizQuestions[currentQuestionIndex]) return;

    const currentQuestion = quizQuestions[currentQuestionIndex];
    const correct = selectedOption === currentQuestion.correctAnswer;
    
    setIsCorrect(correct);
    if (correct) {
      setScore(score + 1);
    }
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizState('finished');
    }
  };
  
  const handleRestartQuiz = () => {
    setQuizState('initial'); 
    // prepareQuiz will be called by useEffect when quizState changes to 'initial' and user/words are loaded
  };

  useEffect(() => {
    if (quizState === 'initial' && user && !vocabLoading && allWords.length > 0) {
      prepareQuiz();
    }
  }, [quizState, user, vocabLoading, allWords, prepareQuiz]);


  if (authLoading || vocabLoading && quizState === 'initial') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-foreground">Loading Fill-in-the-Blanks Quiz...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert className="max-w-md text-center bg-primary/5 border-primary/20 mt-8">
          <LogIn className="h-6 w-6 mx-auto mb-3 text-primary" />
          <AlertTitle className="font-headline text-2xl text-primary mb-2">Sign In Required</AlertTitle>
          <AlertDescription className="text-primary-foreground/80">
            Please <Link href="/" className="underline hover:text-primary-foreground font-semibold">sign in</Link> to access the Fill-in-the-Blanks quiz.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (quizState === 'insufficient_data') {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert className="max-w-lg text-center bg-accent/10 border-accent/30 mt-8">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-accent-foreground" />
          <AlertTitle className="font-headline text-2xl text-accent-foreground mb-2">Not Enough Data for Quiz</AlertTitle>
          <AlertDescription className="text-muted-foreground mb-4">
            This quiz requires words with example sentences and enough total words to create options.
            Please add more words, ensure some have example sentences, and that you have at least {NUM_OPTIONS} words in total.
          </AlertDescription>
          <Button onClick={() => window.location.href='/'} variant="outline">
            Back to Vocabulary
          </Button>
        </Alert>
      </div>
    );
  }


  if (quizState === 'initial') { // Still here means user is logged in, but prepareQuiz hasn't run or finished
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-lg text-center p-8 shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary mb-2">Fill-in-the-Blanks Quiz</CardTitle>
            <CardDescription className="text-muted-foreground">
              Test your knowledge by choosing the correct Japanese word to complete the sentence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-foreground mb-6">
              Ready to start? The quiz will have up to {MAX_QUIZ_QUESTIONS} questions.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
             <Button onClick={prepareQuiz} size="lg" className="text-lg" disabled={vocabLoading || quizzableWords.length === 0}>
              {vocabLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRightCircle className="mr-2 h-5 w-5" />}
              Start Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (quizState === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md text-center p-8 shadow-xl bg-card">
          <CardHeader>
            <CheckCircle className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="font-headline text-3xl text-primary">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-foreground mb-2">
              You scored: <strong className="text-primary">{score}</strong> out of <strong className="text-primary">{quizQuestions.length}</strong>
            </p>
            <p className="text-muted-foreground">
              Great job reviewing your vocabulary in context!
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
  
  if (quizState !== 'playing' || quizQuestions.length === 0 || !quizQuestions[currentQuestionIndex]) {
    // Fallback for unexpected states, or if questions are not ready
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert className="max-w-lg text-center">
          <HelpCircle className="h-8 w-8 mx-auto mb-4" />
          <AlertTitle className="font-headline text-2xl">Loading Quiz Data</AlertTitle>
          <AlertDescription className="mb-4">
           Please wait while the quiz is being prepared or <Link href="/" className="underline font-semibold">go back to vocabulary</Link>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQ = quizQuestions[currentQuestionIndex];

  return (
    <div className="flex flex-col items-center pt-8 space-y-6 max-w-2xl mx-auto">
      <p className="text-lg text-muted-foreground">
        Question {currentQuestionIndex + 1} of {quizQuestions.length} | Score: {score}
      </p>
      
      <Card className="w-full shadow-xl bg-card p-6">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl lg:text-2xl font-normal text-foreground leading-relaxed">
            Fill in the blank:
          </CardTitle>
          <p className="text-2xl lg:text-3xl font-semibold text-primary mt-2 min-h-[4rem] flex items-center justify-center">
            {currentQ.blankedSentence}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={selectedOption || ""}
            onValueChange={setSelectedOption}
            className="space-y-3"
            disabled={showFeedback}
          >
            {currentQ.options.map((option, index) => (
              <Label 
                key={index} 
                htmlFor={`option-${index}`}
                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all
                  ${selectedOption === option ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-border hover:bg-muted/50'}
                  ${showFeedback && option === currentQ.correctAnswer ? 'border-green-500 bg-green-500/10 ring-2 ring-green-500' : ''}
                  ${showFeedback && selectedOption === option && option !== currentQ.correctAnswer ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500' : ''}
                  ${showFeedback ? 'cursor-not-allowed' : ''}
                `}
              >
                <RadioGroupItem value={option} id={`option-${index}`} className="h-5 w-5"/>
                <span className="text-lg font-japanese">{option}</span>
              </Label>
            ))}
          </RadioGroup>

          {showFeedback && (
            <Alert variant={isCorrect ? "default" : "destructive"} className={`border-2 ${isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
              {isCorrect ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
              <AlertTitle className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                {isCorrect ? "Correct!" : "Not quite!"}
              </AlertTitle>
              <AlertDescription className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                {isCorrect ? `The answer is indeed "${currentQ.correctAnswer}".` : `The correct answer was "${currentQ.correctAnswer}".`}
                <p className="mt-1 text-sm">Original sentence: <span className="font-medium">{currentQ.originalSentence}</span></p>
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter className="flex justify-center pt-6">
          {!showFeedback ? (
            <Button onClick={handleSubmitAnswer} disabled={selectedOption === null} size="lg">
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} size="lg">
              {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'} <ArrowRightCircle className="ml-2 h-5 w-5" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

