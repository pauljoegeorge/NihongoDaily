
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { VocabularyWord, FirestoreVocabularyWord, Difficulty } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { 
  db, 
  serverTimestamp, 
  Timestamp as FirestoreTimestamp // Alias to avoid conflict if any
} from '@/lib/firebase'; 
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDoc
} from 'firebase/firestore';

export function useVocabulary() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setWords([]);
      setLoading(false);
      return; // No user, no words to fetch
    }

    setLoading(true);
    const vocabularyCollectionRef = collection(db, 'vocabulary');
    const q = query(
      vocabularyCollectionRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedWords: VocabularyWord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore Timestamp to number for createdAt
        const createdAtMillis = data.createdAt instanceof FirestoreTimestamp 
          ? data.createdAt.toMillis() 
          : data.createdAt?.seconds // Handle if it's already partially converted or from cache
            ? data.createdAt.seconds * 1000 + (data.createdAt.nanoseconds || 0) / 1000000
            : Date.now(); // Fallback, though should always be a Timestamp

        fetchedWords.push({
          id: doc.id,
          japanese: data.japanese,
          definition: data.definition,
          romaji: data.romaji,
          exampleSentences: data.exampleSentences || [],
          learned: data.learned,
          createdAt: createdAtMillis,
          difficulty: data.difficulty || 'medium',
        });
      });
      setWords(fetchedWords);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching vocabulary from Firestore:", error);
      toast({
        title: "Error",
        description: "Could not fetch your vocabulary. Please try again later.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount or user change
  }, [user, toast]);

  const addWord = useCallback(async (newWordData: Omit<VocabularyWord, 'id' | 'learned' | 'createdAt'>) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be signed in to add words.", variant: "destructive" });
      return undefined;
    }

    try {
      const vocabularyCollectionRef = collection(db, 'vocabulary');
      const firestoreDocData: FirestoreVocabularyWord = {
        ...newWordData,
        userId: user.uid,
        learned: false, // Default value
        createdAt: serverTimestamp(), // Set by Firestore server
        difficulty: newWordData.difficulty || 'medium',
      };
      
      const docRef = await addDoc(vocabularyCollectionRef, firestoreDocData);
      
      // Get the newly created doc to return it with server-generated ID and timestamp
      // This is useful if the calling component needs the full word object immediately
      const newDocSnapshot = await getDoc(docRef);
      if (newDocSnapshot.exists()) {
        const data = newDocSnapshot.data();
        const createdAtMillis = data.createdAt instanceof FirestoreTimestamp ? data.createdAt.toMillis() : Date.now();
        const addedWord: VocabularyWord = {
          id: newDocSnapshot.id,
          japanese: data.japanese,
          definition: data.definition,
          romaji: data.romaji,
          exampleSentences: data.exampleSentences || [],
          learned: data.learned,
          createdAt: createdAtMillis,
          difficulty: data.difficulty || 'medium',
        };
        toast({ title: "Success!", description: `Word "${addedWord.japanese}" added to your database.` });
        return addedWord; // onSnapshot will update the main list
      }
    } catch (error) {
      console.error("Error adding word to Firestore:", error);
      toast({ title: "Database Error", description: "Could not add word. Please try again.", variant: "destructive" });
    }
    return undefined;
  }, [user, toast]);

  const toggleLearnedStatus = useCallback(async (wordId: string) => {
    if (!user) return; // Should not happen if UI is disabled for non-users

    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      // Get current status to toggle it
      const docSnap = await getDoc(wordRef);
      if (docSnap.exists()) {
        const currentLearnedStatus = docSnap.data().learned;
        await updateDoc(wordRef, { learned: !currentLearnedStatus });
        toast({
          title: "Progress Updated",
          description: `Word marked as ${!currentLearnedStatus ? 'learned' : 'not learned'}.`,
        });
      }
    } catch (error) {
      console.error("Error toggling learned status:", error);
      toast({ title: "Error", description: "Could not update learned status.", variant: "destructive" });
    }
  }, [user, toast]);

  const deleteWord = useCallback(async (wordId: string) => {
    if (!user) return;

    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      // For toast message, get word details before deleting
      const docSnap = await getDoc(wordRef);
      const wordJapanese = docSnap.exists() ? docSnap.data().japanese : "Word";

      await deleteDoc(wordRef);
      toast({ title: "Word Deleted", description: `"${wordJapanese}" has been removed from your database.` });
    } catch (error) {
      console.error("Error deleting word:", error);
      toast({ title: "Error", description: "Could not delete word.", variant: "destructive" });
    }
  }, [user, toast]);

  const updateWordDifficulty = useCallback(async (wordId: string, difficulty: Difficulty) => {
    if (!user) return;
    
    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      await updateDoc(wordRef, { difficulty });
      const docSnap = await getDoc(wordRef);
      const wordJapanese = docSnap.exists() ? docSnap.data().japanese : "Word";
      toast({ title: "Difficulty Updated", description: `"${wordJapanese}" marked as ${difficulty}.` });
    } catch (error) {
      console.error("Error updating word difficulty:", error);
      toast({ title: "Error", description: "Could not update difficulty.", variant: "destructive" });
    }
  }, [user, toast]);
  
  // The updateWord function is not directly exposed; modifications happen via specific functions.
  // If a general updateWord was needed, it would be structured similarly to the above.

  return { words, loading, addWord, toggleLearnedStatus, deleteWord, updateWordDifficulty };
}
