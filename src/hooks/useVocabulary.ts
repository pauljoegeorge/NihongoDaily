
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { VocabularyWord } from '@/types';
// Removed: import { generateExampleSentences } from '@/ai/flows/generate-example-sentences';
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

  const addWord = useCallback(async (newWordData: Omit<VocabularyWord, 'id' | 'learned' | 'createdAt'>) => {
    const newWord: VocabularyWord = {
      ...newWordData, // newWordData now includes exampleSentences directly
      id: Date.now().toString(),
      learned: false,
      createdAt: Date.now(),
    };

    const updatedWords = [newWord, ...words];
    persistWords(updatedWords);
    toast({
      title: "Success!",
      description: `Word "${newWord.japanese}" added.`,
    });
    
    // Removed AI sentence generation logic
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
  
  // Removed regenerateSentences function

  return { words, loading, addWord, updateWord, toggleLearnedStatus, deleteWord }; // Removed regenerateSentences from return
}
