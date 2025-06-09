
"use client";

import type { VocabularyWord } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Removed: import { Checkbox } from '@/components/ui/checkbox'; (not used directly)
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Languages, ListChecks, Trash2, CheckCircle2, Circle } from 'lucide-react'; // Removed Sparkles
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';
// Removed: import { useState } from 'react';

interface VocabularyCardProps {
  word: VocabularyWord;
  onToggleLearned: (id: string) => void;
  onDelete: (id: string) => void;
  // Removed: onRegenerateSentences: (id: string) => Promise<void>;
}

export default function VocabularyCard({ word, onToggleLearned, onDelete }: VocabularyCardProps) {
  // Removed: const [isGenerating, setIsGenerating] = useState(false);

  // Removed: handleRegenerate function
  
  return (
    <Card className={`transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl ${word.learned ? 'bg-primary/5 border-primary/30' : 'bg-card'}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-3xl text-primary flex items-center">
              {word.japanese}
              {word.learned && <CheckCircle2 className="ml-2 h-6 w-6 text-green-500" />}
            </CardTitle>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Languages className="h-4 w-4" /> {word.romaji}
            </p>
          </div>
          <div className="flex items-center space-x-2">
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

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
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
               {/* Removed Regenerate Sentences Button */}
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
