
"use client";

import { useState } from 'react';
import type { VocabularyWord } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Languages, ListChecks, Trash2, CheckCircle2, MinusCircle, BarChart3, ChevronDown, Edit3, Copy } from 'lucide-react'; // Changed XCircle to MinusCircle
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditVocabularyDialog from './EditVocabularyDialog';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { VocabularyFormData } from '@/hooks/useVocabulary';

interface VocabularyCardProps {
  word: VocabularyWord;
  onToggleLearned: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateDifficulty: (id: string, difficulty: 'easy' | 'medium' | 'hard') => void;
  onUpdateWord: (id: string, data: VocabularyFormData) => Promise<void>;
}

export default function VocabularyCard({ word, onToggleLearned, onDelete, onUpdateDifficulty, onUpdateWord }: VocabularyCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

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

  const handleCopyToClipboard = async () => {
    let textToCopy = `Word: ${word.japanese}\n`;
    textToCopy += `Reading: ${word.romaji}\n`;
    textToCopy += `Meaning: ${word.definition}\n`;

    if (word.exampleSentences && word.exampleSentences.length > 0) {
      textToCopy += `Usage:\n${word.exampleSentences.join('\n')}`;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "Copied!",
        description: "Word details copied to clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Copy Failed",
        description: "Could not copy details to clipboard. Check browser permissions.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <Card className={`transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl ${word.learned ? 'bg-primary/5 border-primary/30' : 'bg-card'}`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-3xl text-primary flex items-center">
                {word.japanese}
                {word.learned && <CheckCircle2 className="ml-2 h-6 w-6 text-green-500" />}
              </CardTitle>
            </div>
            <TooltipProvider delayDuration={100}>
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
                
                {!word.learned && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline" 
                        size="icon" 
                        onClick={() => onToggleLearned(word.id)}
                        className="text-green-500 hover:text-green-600 hover:bg-green-500/10 border-green-500" 
                        aria-label="Mark as Learned"
                      >
                        <CheckCircle2 className="h-6 w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mark as Learned</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {word.learned && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline" 
                        size="icon" 
                        onClick={() => onToggleLearned(word.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500" 
                        aria-label="Mark as Unlearned"
                      >
                        <MinusCircle className="h-6 w-6" /> 
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mark as Unlearned</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            <p>{word.definition}</p>
          </div>
          
          <Separator />

          <Accordion type="single" collapsible className="w-full" defaultValue="item-examples">
            <AccordionItem value="item-reading">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
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
                  <ListChecks className="h-5 w-5 text-primary" />
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
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs font-mono mr-1">
              Added: {new Date(word.createdAt).toLocaleDateString()}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)} className="text-foreground/70 hover:text-primary h-7 w-7">
              <Edit3 className="h-4 w-4" />
              <span className="sr-only">Edit word</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCopyToClipboard} className="text-foreground/70 hover:text-primary h-7 w-7">
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy word details</span>
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onDelete(word.id)} className="text-destructive hover:text-destructive/80">
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </CardFooter>
      </Card>
      {word && ( 
        <EditVocabularyDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          wordToEdit={word}
          onUpdateWord={onUpdateWord}
        />
      )}
    </>
  );
}
