
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { VocabularyWord } from '@/types';
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
        const parsedWords: VocabularyWord[] = JSON.parse(storedWords);
        // Add default difficulty to words that don't have it
        const wordsWithDifficulty = parsedWords.map(word => ({
          ...word,
          difficulty: word.difficulty || 'medium', 
        }));
        setWords(wordsWithDifficulty);
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
      ...newWordData,
      id: Date.now().toString(),
      learned: false,
      createdAt: Date.now(),
      difficulty: newWordData.difficulty || 'medium', // Ensure difficulty is set
    };

    const updatedWords = [newWord, ...words];
    persistWords(updatedWords);
    toast({
      title: "Success!",
      description: `Word "${newWord.japanese}" added.`,
    });
    
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

  const updateWordDifficulty = useCallback((wordId: string, difficulty: 'easy' | 'medium' | 'hard') => {
    const updatedWords = words.map(word =>
      word.id === wordId ? { ...word, difficulty } : word
    );
    persistWords(updatedWords);
    const updatedWord = updatedWords.find(w => w.id === wordId);
    if (updatedWord) {
      toast({
        title: "Difficulty Updated",
        description: `"${updatedWord.japanese}" marked as ${difficulty}.`,
      });
    }
  }, [words, persistWords, toast]);
  

  return { words, loading, addWord, updateWord, toggleLearnedStatus, deleteWord, updateWordDifficulty };
}

