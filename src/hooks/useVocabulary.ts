
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
      console.log(`useVocabulary: Fetched ${fetchedWords.length} words from Firestore via onSnapshot.`);
    }, (error) => {
      console.error("Detailed Firestore Error in onSnapshot:", error);
      setLoading(false);
      let description = "Could not fetch your vocabulary. Check console for details.";
      let title = "Error Fetching Vocabulary";

      if (error.code) {
        description = `Could not fetch vocabulary: ${error.message} (Code: ${error.code})`;
        if (error.code === 'permission-denied' || error.message.includes('permission-denied') || error.message.includes('Missing or insufficient permissions')) {
          title = "Permission Denied";
          description = "You don't have permission to read vocabulary. Check Firestore rules.";
        }
      } else if (error.message) {
        description = `An unexpected error occurred: ${error.message}`;
      }
      
      toast({
        title: title,
        description: description,
        variant: "destructive",
      });
    });

    return () => {
      console.log("useVocabulary: Unsubscribing from Firestore listener.");
      unsubscribe(); 
    }
  }, [user, toast]);

  const addWord = useCallback(async (newWordData: Omit<VocabularyWord, 'id' | 'learned' | 'createdAt'>): Promise<VocabularyWord | undefined> => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be signed in to add words.", variant: "destructive" });
      return undefined;
    }

    console.log(`[DIAGNOSTIC] useVocabulary: Attempting to add word for user ${user.uid}:`, newWordData);
    const vocabularyCollectionRef = collection(db, 'vocabulary');
    const firestoreDocData: FirestoreVocabularyWord = {
      japanese: newWordData.japanese,
      definition: newWordData.definition,
      romaji: newWordData.romaji,
      exampleSentences: newWordData.exampleSentences || [],
      learned: false,
      createdAt: serverTimestamp(),
      difficulty: newWordData.difficulty || 'medium',
      userId: user.uid,
    };

    try {
      console.log("[DIAGNOSTIC] useVocabulary: Calling addDoc with data:", firestoreDocData);
      const docRef = await addDoc(vocabularyCollectionRef, firestoreDocData);
      console.log("[DIAGNOSTIC] useVocabulary: addDoc successful, docRef ID:", docRef.id);
      
      // For faster UI response, we'll rely on onSnapshot to provide the full data with server timestamp.
      // We show a success toast immediately.
      toast({ title: "Success!", description: `Word "${newWordData.japanese}" submitted to the database. It will appear shortly.` });
      
      // Return a temporary representation or just an indication of success.
      // The actual full object with server timestamp will come from the onSnapshot listener.
      return { 
        id: docRef.id, 
        japanese: newWordData.japanese,
        definition: newWordData.definition,
        romaji: newWordData.romaji,
        exampleSentences: newWordData.exampleSentences || [],
        learned: false, 
        createdAt: Date.now(), // Temporary client timestamp
        difficulty: newWordData.difficulty || 'medium'
      } as VocabularyWord;

    } catch (error: any) {
      console.error("[DIAGNOSTIC] Detailed Firestore Error in addWord:", error);
      let description = "Could not add word. Please try again. Check console for details.";
      if (error.code) {
        description = `Error adding word: ${error.message} (Code: ${error.code})`;
        if (error.code === 'permission-denied') {
          description += " Check Firestore rules.";
        }
      } else if (error.message) {
        description = `Error adding word: ${error.message}`;
      }
      toast({ title: "Database Error", description, variant: "destructive" });
      return undefined;
    }
  }, [user, toast]);

  const toggleLearnedStatus = useCallback(async (wordId: string) => {
    if (!user) return; 

    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      console.log(`[DIAGNOSTIC] useVocabulary: Getting doc ${wordId} to toggle learned status.`);
      const docSnap = await getDoc(wordRef);
      console.log(`[DIAGNOSTIC] useVocabulary: Got doc ${wordId}. Exists: ${docSnap.exists()}`);
      if (docSnap.exists()) {
        if (docSnap.data().userId !== user.uid) {
          toast({ title: "Error", description: "Cannot modify this word (permission).", variant: "destructive" });
          return;
        }
        const currentLearnedStatus = docSnap.data().learned;
        console.log(`[DIAGNOSTIC] useVocabulary: Updating learned status for ${wordId} to ${!currentLearnedStatus}.`);
        await updateDoc(wordRef, { learned: !currentLearnedStatus });
        console.log(`[DIAGNOSTIC] useVocabulary: Update successful for ${wordId}.`);
        toast({
          title: "Progress Updated",
          description: `Word marked as ${!currentLearnedStatus ? 'learned' : 'not learned'}.`,
        });
      } else {
        console.warn(`[DIAGNOSTIC] useVocabulary: Word ${wordId} not found for toggleLearnedStatus.`);
        toast({ title: "Error", description: "Word not found.", variant: "destructive" });
      }
    } catch (error: any)
     {
      console.error("[DIAGNOSTIC] Detailed Firestore Error in toggleLearnedStatus:", error);
      let description = "Could not update learned status. Check console.";
      if (error.code) {
        description = `Error: ${error.message} (Code: ${error.code})`;
      } else if (error.message) {
        description = `Error: ${error.message}`;
      }
      toast({ title: "Error", description, variant: "destructive" });
    }
  }, [user, toast]);

  const deleteWord = useCallback(async (wordId: string) => {
    if (!user) return;

    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      console.log(`[DIAGNOSTIC] useVocabulary: Getting doc ${wordId} to delete.`);
      const docSnap = await getDoc(wordRef);
      console.log(`[DIAGNOSTIC] useVocabulary: Got doc ${wordId} for deletion. Exists: ${docSnap.exists()}`);
      const wordJapanese = docSnap.exists() ? docSnap.data().japanese : "Word";
      if (docSnap.exists() && docSnap.data().userId !== user.uid) {
         toast({ title: "Error", description: "Cannot delete this word (permission).", variant: "destructive" });
         return;
      }
      console.log(`[DIAGNOSTIC] useVocabulary: Deleting doc ${wordId}.`);
      await deleteDoc(wordRef);
      console.log(`[DIAGNOSTIC] useVocabulary: Deletion successful for ${wordId}.`);
      toast({ title: "Word Deleted", description: `"${wordJapanese}" has been removed from your database.` });
    } catch (error: any) {
      console.error("[DIAGNOSTIC] Detailed Firestore Error in deleteWord:", error);
      let description = "Could not delete word. Check console.";
      if (error.code) {
        description = `Error: ${error.message} (Code: ${error.code})`;
      } else if (error.message) {
        description = `Error: ${error.message}`;
      }
      toast({ title: "Error", description, variant: "destructive" });
    }
  }, [user, toast]);

  const updateWordDifficulty = useCallback(async (wordId: string, difficulty: Difficulty) => {
    if (!user) return;
    
    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      console.log(`[DIAGNOSTIC] useVocabulary: Getting doc ${wordId} to update difficulty.`);
      const docSnap = await getDoc(wordRef);
      console.log(`[DIAGNOSTIC] useVocabulary: Got doc ${wordId} for difficulty update. Exists: ${docSnap.exists()}`);
      const wordJapanese = docSnap.exists() ? docSnap.data().japanese : "Word";
      if (docSnap.exists() && docSnap.data().userId !== user.uid) {
         toast({ title: "Error", description: "Cannot update difficulty for this word (permission).", variant: "destructive" });
         return;
      }
      console.log(`[DIAGNOSTIC] useVocabulary: Updating difficulty for ${wordId} to ${difficulty}.`);
      await updateDoc(wordRef, { difficulty });
      console.log(`[DIAGNOSTIC] useVocabulary: Difficulty update successful for ${wordId}.`);
      toast({ title: "Difficulty Updated", description: `"${wordJapanese}" marked as ${difficulty}.` });
    } catch (error: any) {
      console.error("[DIAGNOSTIC] Detailed Firestore Error in updateWordDifficulty:", error);
      let description = "Could not update difficulty. Check console.";
      if (error.code) {
        description = `Error: ${error.message} (Code: ${error.code})`;
      } else if (error.message) {
        description = `Error: ${error.message}`;
      }
      toast({ title: "Error", description, variant: "destructive" });
    }
  }, [user, toast]);
  
  return { words, loading, addWord, toggleLearnedStatus, deleteWord, updateWordDifficulty };
}
    
