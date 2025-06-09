
"use client";

import { useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2 } from 'lucide-react';
import type { VocabularyWord } from '@/types';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"; // Imported Form components


const difficultyLevels = z.enum(['easy', 'medium', 'hard']);

const formSchema = z.object({
  japanese: z.string().min(1, 'Japanese word is required.'),
  romaji: z.string().min(1, 'Reading is required.'), // This stores Hiragana
  definition: z.string().min(1, 'Definition is required.'),
  exampleSentences: z.string().optional(),
  difficulty: difficultyLevels.default('medium'),
});

type FormData = z.infer<typeof formSchema>;

interface AddVocabularyDialogProps {
  onAddWord: (wordData: Omit<VocabularyWord, 'id' | 'learned' | 'createdAt'>) => Promise<VocabularyWord | undefined>;
}

export default function AddVocabularyDialog({ onAddWord }: AddVocabularyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      japanese: '',
      romaji: '',
      definition: '',
      exampleSentences: '',
      difficulty: 'medium',
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      const exampleSentencesArray = values.exampleSentences
        ? values.exampleSentences.split('\n').map(s => s.trim()).filter(s => s.length > 0)
        : [];
      
      await onAddWord({
        japanese: values.japanese,
        romaji: values.romaji,
        definition: values.definition,
        exampleSentences: exampleSentencesArray,
        difficulty: values.difficulty,
      });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding word:", error);
      // Toast for error is handled in useVocabulary hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-8 right-8 rounded-full shadow-lg p-4 h-16 w-16  md:h-14 md:w-auto md:px-6 md:py-3">
          <PlusCircle className="h-8 w-8 md:h-5 md:w-5 md:mr-2" />
          <span className="hidden md:inline">Add Word</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Add New Vocabulary</DialogTitle>
          <DialogDescription>
            Enter the details for the new Japanese word. You can also add example sentences, each on a new line.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="japanese" className="text-foreground">Japanese Word</Label>
            <Input
              id="japanese"
              {...form.register('japanese')}
              className="mt-1 bg-background"
              aria-invalid={form.formState.errors.japanese ? "true" : "false"}
            />
            {form.formState.errors.japanese && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.japanese.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="romaji" className="text-foreground">Reading</Label>
            <Input
              id="romaji"
              {...form.register('romaji')}
              className="mt-1 bg-background"
              aria-invalid={form.formState.errors.romaji ? "true" : "false"}
            />
            {form.formState.errors.romaji && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.romaji.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="definition" className="text-foreground">Definition (English)</Label>
            <Input
              id="definition"
              {...form.register('definition')}
              className="mt-1 bg-background"
              aria-invalid={form.formState.errors.definition ? "true" : "false"}
            />
            {form.formState.errors.definition && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.definition.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="exampleSentences" className="text-foreground">Example Sentences (one per line)</Label>
            <Textarea
              id="exampleSentences"
              {...form.register('exampleSentences')}
              className="mt-1 bg-background"
              rows={3}
            />
          </div>
          
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-foreground">Difficulty</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="easy" />
                      </FormControl>
                      <FormLabel className="font-normal text-foreground">Easy</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="medium" />
                      </FormControl>
                      <FormLabel className="font-normal text-foreground">Medium</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="hard" />
                      </FormControl>
                      <FormLabel className="font-normal text-foreground">Hard</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Word'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

