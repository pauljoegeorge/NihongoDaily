
"use client";

import type { VocabularyWord } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Languages, ListChecks, Trash2, CheckCircle2, Circle, BarChart3, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VocabularyCardProps {
  word: VocabularyWord;
  onToggleLearned: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateDifficulty: (id: string, difficulty: 'easy' | 'medium' | 'hard') => void;
}

export default function VocabularyCard({ word, onToggleLearned, onDelete, onUpdateDifficulty }: VocabularyCardProps) {
  
  const getDifficultyBadgeVariant = (difficulty: 'easy' | 'medium' | 'hard' | undefined) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
      default:
        return 'outline';
    }
  };
  
  return (
    <Card className={`transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl ${word.learned ? 'bg-primary/5 border-primary/30' : 'bg-card'}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-3xl text-primary flex items-center">
              {word.japanese}
              {word.learned && <CheckCircle2 className="ml-2 h-6 w-6 text-green-500" />}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`capitalize text-xs px-2 py-1 h-auto ${getDifficultyBadgeVariant(word.difficulty)}`}>
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {word.difficulty || 'Set Difficulty'}
                  <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onUpdateDifficulty(word.id, 'easy')}>
                  Easy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateDifficulty(word.id, 'medium')}>
                  Medium
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateDifficulty(word.id, 'hard')}>
                  Hard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
             <Button
              variant={word.learned ? "secondary" : "outline"}
              size="sm"
              onClick={() => onToggleLearned(word.id)}
              className="flex items-center gap-1 text-sm"
            >
              {word.learned ? <Circle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {word.learned ? 'Unmark' : 'Learned'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <BookOpen className="h-5 w-5 text-accent-foreground" />
          <p>{word.definition}</p>
        </div>
        
        <Separator />

        <Accordion type="single" collapsible className="w-full" defaultValue="item-examples">
          <AccordionItem value="item-reading">
            <AccordionTrigger className="text-base font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-accent-foreground" />
                Reading (Hiragana)
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-2">
              <p className="text-sm text-muted-foreground pl-2 border-l-2 border-accent">
                {word.romaji}
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-examples">
            <AccordionTrigger className="text-base font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-accent-foreground" />
                Example Sentences
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-2">
              {word.exampleSentences && word.exampleSentences.length > 0 ? (
                word.exampleSentences.map((sentence, index) => (
                  <p key={index} className="text-sm text-muted-foreground pl-2 border-l-2 border-accent">
                    {sentence}
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No example sentences provided.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4">
        <Badge variant="outline" className="text-xs font-mono">
          Added: {new Date(word.createdAt).toLocaleDateString()}
        </Badge>
        <Button variant="ghost" size="sm" onClick={() => onDelete(word.id)} className="text-destructive hover:text-destructive/80">
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

