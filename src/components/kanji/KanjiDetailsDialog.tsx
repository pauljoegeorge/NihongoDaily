
"use client";

import type { KanjiEntry } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mic, MessageSquareText, ListChecks, Edit3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';

interface KanjiDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  kanjiEntry: KanjiEntry;
  onEdit: (kanji: KanjiEntry) => void;
  onDelete: (id: string) => void;
}

// Helper to parse example text into an array of lines, filtering empty ones
const parseExamples = (text: string | undefined): string[] => {
  if (!text) return [];
  return text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
};

export default function KanjiDetailsDialog({ isOpen, setIsOpen, kanjiEntry, onEdit, onDelete }: KanjiDetailsDialogProps) {
  if (!kanjiEntry) return null;
  
  const onyomiExamples = parseExamples(kanjiEntry.onyomiExamplesText);
  const kunyomiExamples = parseExamples(kanjiEntry.kunyomiExamplesText);
  const usageExamples = kanjiEntry.usageExampleSentences || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-baseline">
             <DialogTitle className="font-headline text-6xl text-primary">{kanjiEntry.kanji}</DialogTitle>
             <DialogDescription className="text-sm text-muted-foreground pt-1">
                Added: {format(new Date(kanjiEntry.createdAt), 'PPP')}
             </DialogDescription>
          </div>
          <p className="text-xl text-foreground text-left !mt-2">{kanjiEntry.meaning}</p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 -mr-6 pl-1 -ml-1">
            <div className="space-y-4 py-4">
              <Separator />
              <div className="space-y-3">
                {kanjiEntry.onyomi && kanjiEntry.onyomi.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold text-muted-foreground flex items-center mb-2"><Mic className="h-5 w-5 mr-2 text-primary" />On'yomi</h4>
                    <div className="flex flex-wrap gap-1">
                      {kanjiEntry.onyomi.map((on, index) => <Badge key={`on-${index}`} variant="secondary" className="text-base">{on}</Badge>)}
                    </div>
                  </div>
                )}
                {kanjiEntry.kunyomi && kanjiEntry.kunyomi.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold text-muted-foreground flex items-center mb-2"><Mic className="h-5 w-5 mr-2 text-primary" />Kun'yomi</h4>
                    <div className="flex flex-wrap gap-1">
                      {kanjiEntry.kunyomi.map((kun, index) => <Badge key={`kun-${index}`} variant="secondary" className="text-base">{kun}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
              
              {(onyomiExamples.length > 0 || kunyomiExamples.length > 0 || usageExamples.length > 0) && <Separator />}

              <Accordion type="multiple" className="w-full" defaultValue={['item-onyomi-ex', 'item-kunyomi-ex', 'item-usage-ex']}>
                {onyomiExamples.length > 0 && (
                  <AccordionItem value="item-onyomi-ex">
                    <AccordionTrigger className="text-base font-semibold hover:no-underline">
                      <div className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />On'yomi Examples</div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 space-y-1.5">
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
                    <AccordionContent className="pt-2 space-y-1.5">
                      {kunyomiExamples.map((ex, index) => (
                        <p key={`kun-ex-${index}`} className="text-sm text-muted-foreground pl-2 border-l-2 border-accent">{ex}</p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}
                {usageExamples.length > 0 && (
                  <AccordionItem value="item-usage-ex">
                    <AccordionTrigger className="text-base font-semibold hover:no-underline">
                       <div className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-primary" />Usage Examples</div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 space-y-1.5">
                      {usageExamples.map((sentence, index) => (
                        <p key={`usage-ex-${index}`} className="text-sm text-muted-foreground pl-2 border-l-2 border-accent">{sentence}</p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
        </div>
         <DialogFooter className="pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onEdit(kanjiEntry)}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => onDelete(kanjiEntry.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
