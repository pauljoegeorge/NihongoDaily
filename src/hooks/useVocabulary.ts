
"use client";

import { useState, useEffect, useCallback }
from 'react';
import type { VocabularyWord, FirestoreVocabularyWord, Difficulty }
from '@/types';
import { useToast }
from "@/hooks/use-toast";
import { useAuth }
from '@/context/AuthContext';
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
  orderBy, // Keep orderBy for potential re-add, but don't use it in the q variable for now
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
      console.log("[DIAGNOSTIC] useVocabulary: No user, clearing words and stopping listener.");
      return;
    }

    const userIdForQuery = user.uid;
    console.log(`[DIAGNOSTIC] useVocabulary: Setting up Firestore listener for user ID: ${userIdForQuery}`);
    setLoading(true);
    const vocabularyCollectionRef = collection(db, 'vocabulary');
    
    // TEMPORARY DIAGNOSTIC: Query without orderBy
    const q = query(
      vocabularyCollectionRef,
      where('userId', '==', userIdForQuery)
      // Temporarily removed: orderBy('createdAt', 'desc') 
    );

    console.log("[DIAGNOSTIC] useVocabulary: Query constructed for onSnapshot (TEMPORARILY SIMPLIFIED):", q);

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
      console.log(`[DIAGNOSTIC] useVocabulary: Fetched ${fetchedWords.length} words for user ${userIdForQuery} from Firestore via onSnapshot (using SIMPLIFIED query).`);
    }, (error: any) => {
      console.error("[DIAGNOSTIC] Full Firestore Error object in onSnapshot listener:", error);
      const errorCode = error.code || 'N/A';
      const errorMessage = error.message || 'No specific message';
      console.error(`[DIAGNOSTIC] Firestore onSnapshot Error - Code: ${errorCode}, Message: ${errorMessage}`);
      
      setLoading(false);
      let title = "Error Fetching Vocabulary";
      let description = `Could not fetch your vocabulary. Code: ${errorCode}. Message: ${errorMessage}.`;

      if (errorCode === 'failed-precondition' || errorMessage.toLowerCase().includes('index')) {
        title = "Indexing Error (from onSnapshot)";
        description = "A required Firestore index is missing, not yet built, or incorrect for the onSnapshot listener. Please check the Firebase console (Firestore > Indexes). The query likely requires an index on 'vocabulary' collection: userId (Ascending), createdAt (Descending). Ensure it's for the correct project ID and fully built.";
      } else if (errorCode === 'permission-denied' || errorMessage.includes('permission-denied') || errorMessage.includes('Missing or insufficient permissions')) {
        title = "Permission Denied (from onSnapshot)";
        description = "You don't have permission to read vocabulary. Check Firestore rules.";
      } else if (error.name === 'FirebaseError' && error.code === 'cancelled') {
        // This can happen if the component unmounts or query changes quickly. Usually benign.
        console.warn("[DIAGNOSTIC] Firestore onSnapshot listener was cancelled. This is often normal during component unmount or query changes.");
        return; // Don't toast for cancellations
      }
      
      toast({
        title: title,
        description: description,
        variant: "destructive",
        duration: 15000, 
      });
    });

    return () => {
      console.log(`[DIAGNOSTIC] useVocabulary: Unsubscribing from Firestore listener for user ${userIdForQuery}.`);
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
      
      toast({ title: "Success!", description: `Word "${newWordData.japanese}" submitted. It will appear shortly.` });
      
      // Return a client-side representation; onSnapshot will provide the server-confirmed data
      return {
        id: docRef.id,
        japanese: newWordData.japanese,
        definition: newWordData.definition,
        romaji: newWordData.romaji,
        exampleSentences: newWordData.exampleSentences || [],
        learned: false,
        createdAt: Date.now(), // Temporary, will be updated by onSnapshot
        difficulty: newWordData.difficulty || 'medium'
      } as VocabularyWord;

    } catch (error: any) {
      console.error("[DIAGNOSTIC] Full Firestore Error object in addWord:", error);
      const errorCode = error.code || 'N/A';
      const errorMessage = error.message || 'No specific message';
      console.error(`[DIAGNOSTIC] Firestore addWord Error - Code: ${errorCode}, Message: ${errorMessage}`);

      let description = `Could not add word. Code: ${errorCode}. Message: ${errorMessage}.`;
      if (errorCode === 'permission-denied') {
        description += " Check Firestore rules.";
      }
      toast({ title: "Database Error", description, variant: "destructive", duration: 10000 });
      return undefined;
    }
  }, [user, toast]);

  const toggleLearnedStatus = useCallback(async (wordId: string) => {
    if (!user) return;

    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      const docSnap = await getDoc(wordRef);
      if (docSnap.exists()) {
        if (docSnap.data().userId !== user.uid) {
          toast({ title: "Error", description: "Cannot modify this word (permission).", variant: "destructive" });
          return;
        }
        const currentLearnedStatus = docSnap.data().learned;
        await updateDoc(wordRef, { learned: !currentLearnedStatus });
        toast({
          title: "Progress Updated",
          description: `Word marked as ${!currentLearnedStatus ? 'learned' : 'not learned'}.`,
        });
      } else {
        toast({ title: "Error", description: "Word not found.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("[DIAGNOSTIC] Full Firestore Error object in toggleLearnedStatus:", error);
      const errorCode = error.code || 'N/A';
      const errorMessage = error.message || 'No specific message';
      console.error(`[DIAGNOSTIC] Firestore toggleLearnedStatus Error - Code: ${errorCode}, Message: ${errorMessage}`);
      toast({ title: "Error", description: `Could not update learned status. Code: ${errorCode}.`, variant: "destructive" });
    }
  }, [user, toast]);

  const deleteWord = useCallback(async (wordId: string) => {
    if (!user) return;

    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      const docSnap = await getDoc(wordRef);
      const wordJapanese = docSnap.exists() ? docSnap.data().japanese : "Word";
      if (docSnap.exists() && docSnap.data().userId !== user.uid) {
         toast({ title: "Error", description: "Cannot delete this word (permission).", variant: "destructive" });
         return;
      }
      await deleteDoc(wordRef);
      toast({ title: "Word Deleted", description: `"${wordJapanese}" has been removed from your database.` });
    } catch (error: any) {
      console.error("[DIAGNOSTIC] Full Firestore Error object in deleteWord:", error);
      const errorCode = error.code || 'N/A';
      const errorMessage = error.message || 'No specific message';
      console.error(`[DIAGNOSTIC] Firestore deleteWord Error - Code: ${errorCode}, Message: ${errorMessage}`);
      toast({ title: "Error", description: `Could not delete word. Code: ${errorCode}.`, variant: "destructive" });
    }
  }, [user, toast]);

  const updateWordDifficulty = useCallback(async (wordId: string, difficulty: Difficulty) => {
    if (!user) return;
    
    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      const docSnap = await getDoc(wordRef);
      const wordJapanese = docSnap.exists() ? docSnap.data().japanese : "Word";
      if (docSnap.exists() && docSnap.data().userId !== user.uid) {
         toast({ title: "Error", description: "Cannot update difficulty for this word (permission).", variant: "destructive" });
         return;
      }
      await updateDoc(wordRef, { difficulty });
      toast({ title: "Difficulty Updated", description: `"${wordJapanese}" marked as ${difficulty}.` });
    } catch (error: any) {
      console.error("[DIAGNOSTIC] Full Firestore Error object in updateWordDifficulty:", error);
      const errorCode = error.code || 'N/A';
      const errorMessage = error.message || 'No specific message';
      console.error(`[DIAGNOSTIC] Firestore updateWordDifficulty Error - Code: ${errorCode}, Message: ${errorMessage}`);
      toast({ title: "Error", description: `Could not update difficulty. Code: ${errorCode}.`, variant: "destructive" });
    }
  }, [user, toast]);
  
  return { words, loading, addWord, toggleLearnedStatus, deleteWord, updateWordDifficulty };
}
    
