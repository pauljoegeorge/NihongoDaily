
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
// Label import is not directly used, FormLabel is preferred from react-hook-form context
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react'; 
import type { VocabularyWord, Difficulty } from '@/types';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const difficultyLevels = z.enum(['easy', 'medium', 'hard']);

const formSchema = z.object({
  japanese: z.string().min(1, 'Japanese word is required.'),
  romaji: z.string().min(1, 'Reading is required.'),
  definition: z.string().min(1, 'Definition is required.'),
  exampleSentences: z.string().optional(),
  difficulty: difficultyLevels.default('medium'),
});

export type EditFormData = z.infer<typeof formSchema>;

interface EditVocabularyDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  wordToEdit: VocabularyWord;
  onUpdateWord: (wordId: string, data: EditFormData) => Promise<void>;
}

export default function EditVocabularyDialog({ isOpen, setIsOpen, wordToEdit, onUpdateWord }: EditVocabularyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditFormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (wordToEdit && isOpen) {
      form.reset({
        japanese: wordToEdit.japanese,
        romaji: wordToEdit.romaji,
        definition: wordToEdit.definition,
        exampleSentences: wordToEdit.exampleSentences.join('\n'),
        difficulty: wordToEdit.difficulty,
      });
    }
  }, [wordToEdit, isOpen, form]);

  const onSubmit = async (values: EditFormData) => {
    setIsSubmitting(true);
    try {
      await onUpdateWord(wordToEdit.id, values);
      setIsOpen(false); 
    } catch (error) {
      console.error("Error updating word:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Edit Vocabulary Word</DialogTitle>
          <DialogDescription>
            Update the details for the Japanese word: <strong className="text-primary">{wordToEdit?.japanese}</strong>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          {/* Removed max-h-[70vh], overflow-y-auto, and pr-4 from the form's className */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="japanese"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Japanese Word</FormLabel>
                  <FormControl>
                    <Input {...field} className="mt-1 bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="romaji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Reading</FormLabel>
                  <FormControl>
                    <Input {...field} className="mt-1 bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="definition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Definition (English)</FormLabel>
                  <FormControl>
                    <Input {...field} className="mt-1 bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="exampleSentences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Example Sentences (one per line)</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="mt-1 bg-background" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-foreground">Difficulty</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value} 
                      className="flex space-x-4"
                    >
                      {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                        <FormItem key={level} className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={level} />
                          </FormControl>
                          <FormLabel className="font-normal text-foreground capitalize">{level}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
