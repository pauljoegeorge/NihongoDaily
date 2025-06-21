
"use client";

import { useState } from 'react';
import type { KanjiEntry } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Edit3, BookOpen, Mic, MessageSquareText, ListChecks } from 'lucide-react';
import EditKanjiDialog from './EditKanjiDialog';
import type { KanjiFormData } from '@/hooks/useKanji';

interface KanjiCardProps {
  entry: KanjiEntry;
  onUpdate: (id: string, data: KanjiFormData) => Promise<void>;
  onDelete: (id: string) => void;
}

// Helper to parse example text into an array of lines, filtering empty ones
const parseExamples = (text: string | undefined): string[] => {
  if (!text) return [];
  return text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
};

export default function KanjiCard({ entry, onUpdate, onDelete }: KanjiCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const onyomiExamples = parseExamples(entry.onyomiExamplesText);
  const kunyomiExamples = parseExamples(entry.kunyomiExamplesText);
  // entry.usageExampleSentences is already string[]

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl bg-card flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-5xl text-primary">{entry.kanji}</CardTitle>
              <CardDescription className="text-lg text-foreground pt-1">{entry.meaning}</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono mt-1">
              Added: {new Date(entry.createdAt).toLocaleDateString()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-grow">
          <Separator />
          <div className="space-y-2">
            {entry.onyomi && entry.onyomi.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center"><Mic className="h-4 w-4 mr-2 text-primary" />On'yomi</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {entry.onyomi.map((on, index) => <Badge key={`on-${index}`} variant="secondary">{on}</Badge>)}
                </div>
              </div>
            )}
            {entry.kunyomi && entry.kunyomi.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center"><Mic className="h-4 w-4 mr-2 text-primary" />Kun'yomi</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {entry.kunyomi.map((kun, index) => <Badge key={`kun-${index}`} variant="secondary">{kun}</Badge>)}
                </div>
              </div>
            )}
          </div>
          
          {(onyomiExamples.length > 0 || kunyomiExamples.length > 0 || entry.usageExampleSentences.length > 0) && <Separator />}

          <Accordion type="single" collapsible className="w-full" defaultValue="item-onyomi-ex">
            {onyomiExamples.length > 0 && (
              <AccordionItem value="item-onyomi-ex">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  <div className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />On'yomi Examples</div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-1 max-h-40 overflow-y-auto">
                  {onyomiExamples.map((ex, index) => (
                    <p key={`on-ex-${index}`} className="text-sm text-muted-foreground pl-2 border-l-2 border-accent">{ex}</p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}
            {kunyomiExamples.length > 0 && (
              <AccordionItem value="item-kunyomi-ex">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  <div className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />Kun'yomi Examples</div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-1 max-h-40 overflow-y-auto">
                  {kunyomiExamples.map((ex, index) => (
                    <p key={`kun-ex-${index}`} className="text-sm text-muted-foreground pl-2 border-l-2 border-accent">{ex}</p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}
            {entry.usageExampleSentences && entry.usageExampleSentences.length > 0 && (
              <AccordionItem value="item-usage-ex">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                   <div className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-primary" />Usage Examples</div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-1 max-h-40 overflow-y-auto">
                  {entry.usageExampleSentences.map((sentence, index) => (
                    <p key={`usage-ex-${index}`} className="text-sm text-muted-foreground pl-2 border-l-2 border-accent">{sentence}</p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>

        <CardFooter className="flex justify-end items-center pt-4 border-t mt-auto">
          <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)} className="text-foreground/70 hover:text-primary h-8 w-8">
            <Edit3 className="h-4 w-4" />
            <span className="sr-only">Edit Kanji</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)} className="text-destructive hover:text-destructive/80 h-8 w-8">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete Kanji</span>
          </Button>
        </CardFooter>
      </Card>
      {entry && (
         <EditKanjiDialog
            isOpen={isEditDialogOpen}
            setIsOpen={setIsEditDialogOpen}
            kanjiToEdit={entry}
            onUpdateKanji={onUpdate}
        />
      )}
    </>
  );
}
