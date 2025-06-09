
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { VocabularyWord } from '@/types';
import { generateExampleSentences } from '@/ai/flows/generate-example-sentences';
import { useToast } from "@/hooks/use-toast";

const VOCABULARY_KEY = 'nihongoDailyVocabulary';

export function useVocabulary() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedWords = localStorage.getItem(VOCABULARY_KEY);
      if (storedWords) {
        setWords(JSON.parse(storedWords));
      }
    } catch (error) {
      console.error("Failed to load words from localStorage", error);
      toast({
        title: "Error",
        description: "Could not load vocabulary data.",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [toast]);

  const persistWords = useCallback((updatedWords: VocabularyWord[]) => {
    try {
      localStorage.setItem(VOCABULARY_KEY, JSON.stringify(updatedWords));
      setWords(updatedWords);
    } catch (error) {
      console.error("Failed to save words to localStorage", error);
      toast({
        title: "Error",
        description: "Could not save vocabulary data.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const addWord = useCallback(async (newWordData: Omit<VocabularyWord, 'id' | 'exampleSentences' | 'learned' | 'createdAt'>) => {
    const newWord: VocabularyWord = {
      ...newWordData,
      id: Date.now().toString(),
      exampleSentences: [],
      learned: false,
      createdAt: Date.now(),
    };

    const updatedWords = [newWord, ...words];
    persistWords(updatedWords);
    toast({
      title: "Success!",
      description: `Word "${newWord.japanese}" added. Generating example sentences...`,
    });

    try {
      const sentenceResult = await generateExampleSentences({ word: newWord.japanese });
      if (sentenceResult && sentenceResult.sentences) {
        const wordWithSentences = { ...newWord, exampleSentences: sentenceResult.sentences };
        const finalWords = updatedWords.map(w => w.id === newWord.id ? wordWithSentences : w);
        persistWords(finalWords);
        toast({
          title: "Sentences Generated!",
          description: `Example sentences for "${newWord.japanese}" are ready.`,
        });
      } else {
         toast({
          title: "Notice",
          description: `Could not generate example sentences for "${newWord.japanese}". You can try again later.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to generate example sentences", error);
      toast({
        title: "AI Error",
        description: `Failed to generate example sentences for "${newWord.japanese}".`,
        variant: "destructive",
      });
    }
    return newWord;
  }, [words, persistWords, toast]);

  const updateWord = useCallback((updatedWord: VocabularyWord) => {
    const updatedWords = words.map(word => (word.id === updatedWord.id ? updatedWord : word));
    persistWords(updatedWords);
  }, [words, persistWords]);

  const toggleLearnedStatus = useCallback((wordId: string) => {
    const updatedWords = words.map(word =>
      word.id === wordId ? { ...word, learned: !word.learned } : word
    );
    persistWords(updatedWords);
    const toggledWord = updatedWords.find(w => w.id === wordId);
    if (toggledWord) {
        toast({
            title: "Progress Updated",
            description: `"${toggledWord.japanese}" marked as ${toggledWord.learned ? 'learned' : 'not learned'}.`,
        });
    }
  }, [words, persistWords, toast]);

  const deleteWord = useCallback((wordId: string) => {
    const wordToDelete = words.find(w => w.id === wordId);
    const updatedWords = words.filter(word => word.id !== wordId);
    persistWords(updatedWords);
    if (wordToDelete) {
      toast({
        title: "Word Deleted",
        description: `"${wordToDelete.japanese}" has been removed.`,
      });
    }
  }, [words, persistWords, toast]);
  
  const regenerateSentences = useCallback(async (wordId: string) => {
    const wordToUpdate = words.find(w => w.id === wordId);
    if (!wordToUpdate) {
      toast({ title: "Error", description: "Word not found.", variant: "destructive" });
      return;
    }

    toast({
      title: "Processing...",
      description: `Regenerating sentences for "${wordToUpdate.japanese}".`,
    });

    try {
      const sentenceResult = await generateExampleSentences({ word: wordToUpdate.japanese });
      if (sentenceResult && sentenceResult.sentences) {
        const updatedWordWithSentences = { ...wordToUpdate, exampleSentences: sentenceResult.sentences };
        const finalWords = words.map(w => w.id === wordId ? updatedWordWithSentences : w);
        persistWords(finalWords);
        toast({
          title: "Sentences Regenerated!",
          description: `New example sentences for "${wordToUpdate.japanese}" are ready.`,
        });
      } else {
        toast({
          title: "Notice",
          description: `Could not regenerate example sentences for "${wordToUpdate.japanese}".`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to regenerate example sentences", error);
      toast({
        title: "AI Error",
        description: `Failed to regenerate example sentences for "${wordToUpdate.japanese}".`,
        variant: "destructive",
      });
    }
  }, [words, persistWords, toast]);


  return { words, loading, addWord, updateWord, toggleLearnedStatus, deleteWord, regenerateSentences };
}
