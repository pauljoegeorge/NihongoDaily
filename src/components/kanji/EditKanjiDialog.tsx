
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, BookText } from 'lucide-react';
import type { KanjiEntry } from '@/types';
import { kanjiFormSchema, type KanjiFormData } from '@/hooks/useKanji';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface EditKanjiDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  kanjiToEdit: KanjiEntry;
  onUpdateKanji: (id: string, data: KanjiFormData) => Promise<void>;
}

export default function EditKanjiDialog({ isOpen, setIsOpen, kanjiToEdit, onUpdateKanji }: EditKanjiDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<KanjiFormData>({
    resolver: zodResolver(kanjiFormSchema),
  });

  useEffect(() => {
    if (kanjiToEdit && isOpen) {
      form.reset({
        kanji: kanjiToEdit.kanji,
        meaning: kanjiToEdit.meaning,
        onyomi: kanjiToEdit.onyomi.join(', '),
        kunyomi: kanjiToEdit.kunyomi.join(', '),
        onyomiExamplesText: kanjiToEdit.onyomiExamplesText,
        kunyomiExamplesText: kanjiToEdit.kunyomiExamplesText,
        usageExampleSentences: kanjiToEdit.usageExampleSentences.join('\n'),
      });
    }
  }, [kanjiToEdit, isOpen, form]);

  const onSubmit = async (values: KanjiFormData) => {
    setIsSubmitting(true);
    try {
      await onUpdateKanji(kanjiToEdit.id, values);
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating Kanji:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!kanjiToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary flex items-center">
             <BookText className="h-6 w-6 mr-2"/> Edit Kanji: {kanjiToEdit.kanji}
          </DialogTitle>
          <DialogDescription>
            Update the details for this Kanji. For readings, use comma-separated values. For examples, use one per line.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-3 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="kanji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Kanji Character</FormLabel>
                  <FormControl><Input {...field} className="bg-background"/></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="meaning"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Meaning (English)</FormLabel>
                  <FormControl><Input {...field} className="bg-background"/></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="onyomi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">On'yomi Readings (comma-separated)</FormLabel>
                  <FormControl><Input {...field} placeholder="例: ニチ, ジツ" className="bg-background"/></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kunyomi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Kun'yomi Readings (comma-separated)</FormLabel>
                  <FormControl><Input {...field} placeholder="例: ひ, -び, -か" className="bg-background"/></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="onyomiExamplesText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">On'yomi Example Words/Phrases</FormLabel>
                  <FormControl><Textarea {...field} rows={3} placeholder="Example: 日本 (にほん) - Japan&#x0a;日光 (にっこう) - Sunlight" className="bg-background"/></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kunyomiExamplesText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Kun'yomi Example Words/Phrases</FormLabel>
                  <FormControl><Textarea {...field} rows={3} placeholder="Example: 日 (ひ) - Day, Sun&#x0a;日向 (ひなた) - Sunny place" className="bg-background"/></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usageExampleSentences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">General Usage Example Sentences (one per line)</FormLabel>
                  <FormControl><Textarea {...field} rows={3} placeholder="Example: 今日は良い天気です。&#x0a;Kyou wa yoi tenki desu. - Today is good weather." className="bg-background"/></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
