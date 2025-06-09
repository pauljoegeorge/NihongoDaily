
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { VocabularyWord, FirestoreVocabularyWord, Difficulty } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { 
  db, 
  serverTimestamp, 
  Timestamp as FirestoreTimestamp 
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
      console.log("useVocabulary: No user, clearing words and stopping listener.");
      return; 
    }

    console.log(`useVocabulary: Setting up Firestore listener for user ID: ${user.uid}`);
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
        const createdAtMillis = data.createdAt instanceof FirestoreTimestamp 
          ? data.createdAt.toMillis() 
          : data.createdAt?.seconds 
            ? data.createdAt.seconds * 1000 + (data.createdAt.nanoseconds || 0) / 1000000
            : Date.now(); 

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
      console.log(`useVocabulary: Fetched ${fetchedWords.length} words from Firestore.`);
    }, (error) => {
      console.error("useVocabulary: Error fetching vocabulary from Firestore:", error);
      toast({
        title: "Error",
        description: "Could not fetch your vocabulary. Check console for details.",
        variant: "destructive",
      });
      if (error.code === 'permission-denied') {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to read vocabulary. Check Firestore rules.",
          variant: "destructive",
        });
      }
      setLoading(false);
    });

    return () => {
      console.log("useVocabulary: Unsubscribing from Firestore listener.");
      unsubscribe(); 
    }
  }, [user, toast]);

  const addWord = useCallback(async (newWordData: Omit<VocabularyWord, 'id' | 'learned' | 'createdAt'>) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be signed in to add words.", variant: "destructive" });
      return undefined;
    }

    console.log(`useVocabulary: Attempting to add word to Firestore for user ${user.uid}:`, newWordData);
    try {
      const vocabularyCollectionRef = collection(db, 'vocabulary');
      const firestoreDocData: FirestoreVocabularyWord = {
        ...newWordData,
        userId: user.uid,
        learned: false, 
        createdAt: serverTimestamp(), 
        difficulty: newWordData.difficulty || 'medium',
      };
      
      const docRef = await addDoc(vocabularyCollectionRef, firestoreDocData);
      
      // The onSnapshot listener will update the local state.
      // We can get the doc to return it if needed, but not strictly necessary for state update.
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
        console.log("useVocabulary: Word successfully added to Firestore, ID:", docRef.id);
        return addedWord;
      }
    } catch (error: any) {
      console.error("useVocabulary: Error adding word to Firestore:", error);
      let description = "Could not add word. Please try again.";
      if (error.code === 'permission-denied') {
        description = "Permission denied. Check Firestore rules to allow creating documents.";
      }
      toast({ title: "Database Error", description, variant: "destructive" });
    }
    return undefined;
  }, [user, toast]);

  const toggleLearnedStatus = useCallback(async (wordId: string) => {
    if (!user) return; 

    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      const docSnap = await getDoc(wordRef);
      if (docSnap.exists()) {
        // Ensure the document belongs to the current user before updating (covered by rules, but good practice)
        if (docSnap.data().userId !== user.uid) {
          toast({ title: "Error", description: "Cannot modify this word.", variant: "destructive" });
          return;
        }
        const currentLearnedStatus = docSnap.data().learned;
        await updateDoc(wordRef, { learned: !currentLearnedStatus });
        toast({
          title: "Progress Updated",
          description: `Word marked as ${!currentLearnedStatus ? 'learned' : 'not learned'}.`,
        });
      }
    } catch (error: any) {
      console.error("useVocabulary: Error toggling learned status:", error);
      let description = "Could not update learned status.";
      if (error.code === 'permission-denied') {
        description = "Permission denied. Check Firestore rules.";
      }
      toast({ title: "Error", description, variant: "destructive" });
    }
  }, [user, toast]);

  const deleteWord = useCallback(async (wordId: string) => {
    if (!user) return;

    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      const docSnap = await getDoc(wordRef);
      const wordJapanese = docSnap.exists() ? docSnap.data().japanese : "Word";
      if (docSnap.exists() && docSnap.data().userId !== user.uid) {
         toast({ title: "Error", description: "Cannot delete this word.", variant: "destructive" });
         return;
      }
      await deleteDoc(wordRef);
      toast({ title: "Word Deleted", description: `"${wordJapanese}" has been removed from your database.` });
    } catch (error: any) {
      console.error("useVocabulary: Error deleting word:", error);
      let description = "Could not delete word.";
      if (error.code === 'permission-denied') {
        description = "Permission denied. Check Firestore rules.";
      }
      toast({ title: "Error", description, variant: "destructive" });
    }
  }, [user, toast]);

  const updateWordDifficulty = useCallback(async (wordId: string, difficulty: Difficulty) => {
    if (!user) return;
    
    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      const docSnap = await getDoc(wordRef);
      const wordJapanese = docSnap.exists() ? docSnap.data().japanese : "Word";
      if (docSnap.exists() && docSnap.data().userId !== user.uid) {
         toast({ title: "Error", description: "Cannot update difficulty for this word.", variant: "destructive" });
         return;
      }
      await updateDoc(wordRef, { difficulty });
      toast({ title: "Difficulty Updated", description: `"${wordJapanese}" marked as ${difficulty}.` });
    } catch (error: any) {
      console.error("useVocabulary: Error updating word difficulty:", error);
      let description = "Could not update difficulty.";
      if (error.code === 'permission-denied') {
        description = "Permission denied. Check Firestore rules.";
      }
      toast({ title: "Error", description, variant: "destructive" });
    }
  }, [user, toast]);
  
  return { words, loading, addWord, toggleLearnedStatus, deleteWord, updateWordDifficulty };
}
    