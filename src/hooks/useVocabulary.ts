
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
  orderBy,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import * as z from 'zod';

// Define FormData type used by Add/Edit dialogs
// This should ideally be in types/forms.ts or similar if it grows
const difficultyLevels = z.enum(['easy', 'medium', 'hard']);
const formSchema = z.object({
  japanese: z.string().min(1, 'Japanese word is required.'),
  romaji: z.string().min(1, 'Reading is required.'),
  definition: z.string().min(1, 'Definition is required.'),
  exampleSentences: z.string().optional(),
  difficulty: difficultyLevels.default('medium'),
});
export type VocabularyFormDataType = z.infer<typeof formSchema>;


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
      return () => {};
    }

    const userIdForQuery = user.uid;
    console.log(`[DIAGNOSTIC] useVocabulary: Setting up Firestore listener for user ID: ${userIdForQuery}`);
    setLoading(true);
    const vocabularyCollectionRef = collection(db, 'vocabulary');
    
    const q = query(
      vocabularyCollectionRef,
      where('userId', '==', userIdForQuery),
      orderBy('createdAt', 'desc') 
    );
    console.log("[DIAGNOSTIC] useVocabulary: Query constructed for onSnapshot:", q);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedWords: VocabularyWord[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const createdAtMillis = data.createdAt instanceof FirestoreTimestamp
          ? data.createdAt.toMillis()
          : data.createdAt?.seconds 
            ? data.createdAt.seconds * 1000 + (data.createdAt.nanoseconds || 0) / 1000000
            : Date.now(); 

        fetchedWords.push({
          id: docSnapshot.id,
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
      console.log(`[DIAGNOSTIC] useVocabulary: Fetched ${fetchedWords.length} words from Firestore via onSnapshot.`);
    }, (error: any) => {
      console.error("[DIAGNOSTIC] Full Firestore Error object in onSnapshot listener:", error);
      const errorCode = error.code || 'N/A';
      const errorMessage = error.message || 'No specific message';
      console.error(`[DIAGNOSTIC] Firestore onSnapshot Error - Code: ${errorCode}, Message: ${errorMessage}`);
      
      setLoading(false);
      let title = "Error Fetching Vocabulary";
      let description = `Could not fetch your vocabulary. Code: ${errorCode}. Message: ${errorMessage}.`;

      if ((errorCode === 'failed-precondition' || (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('index')))) {
        title = "Firestore Indexing Error (Listener)";
        let detailedDescription = `A required Firestore index is missing or not yet built for the 'vocabulary' collection. `;
        
        const createIndexUrlMatch = typeof errorMessage === 'string' ? errorMessage.match(/(https?:\/\/[^\s]*console\.firebase\.google\.com[^\s]*)/) : null;

        if (createIndexUrlMatch && createIndexUrlMatch[0]) {
          detailedDescription += `Firestore suggests creating it here: ${createIndexUrlMatch[0]} (You may need to copy this URL from your browser's developer console and open it in a new tab). Please ensure your index fields are: userId (Ascending) AND createdAt (Descending).`;
        } else {
           detailedDescription += `Please check your browser's developer console for a direct link from Firestore to create the required index. Ensure your index fields are: userId (Ascending) AND createdAt (Descending).`;
        }
        detailedDescription += ` Original error: ${errorMessage}`;
        description = detailedDescription;
      } else if (errorCode === 'permission-denied' || (typeof errorMessage === 'string' && (errorMessage.includes('permission-denied') || errorMessage.includes('Missing or insufficient permissions')))) {
        title = "Permission Denied (Listener)";
        description = `You don't have permission to read vocabulary. Check Firestore rules for project '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}'.`;
      } else if (error.name === 'FirebaseError' && error.code === 'cancelled') {
        console.warn("[DIAGNOSTIC] Firestore onSnapshot listener was cancelled. This is often normal during component unmount or query changes.");
        return; 
      } else if (error.name === 'FirebaseError' && error.code === 'unimplemented') {
        title = "Operation Not Supported (Listener)";
        description = "The query operation is not supported. " + errorMessage;
      } else if (error.status === 400 || errorCode === 'invalid-argument' || (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 400)) {
        title = "Error 400 (Bad Request) from Firestore";
        description = `Firestore rejected the request to listen for updates. This often means an issue with the query (like a missing or mismatched index) or data. Original error: ${errorMessage}`;
      } else {
        title = `Firestore Error (${errorCode})`;
        description = `An unexpected error occurred while fetching vocabulary: ${errorMessage}`;
      }
      
      toast({
        title: title,
        description: description,
        variant: "destructive",
        duration: 30000,
      });
    });

    return () => {
      if (user) { 
        console.log(`[DIAGNOSTIC] useVocabulary: Unsubscribing from Firestore listener for user ${userIdForQuery}.`);
      }
      unsubscribe();
    };
  }, [user, toast]);

  const addWord = useCallback(async (newWordData: Omit<VocabularyWord, 'id' | 'learned' | 'createdAt'>): Promise<VocabularyWord | undefined> => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be signed in to add words.", variant: "destructive" });
      return undefined;
    }

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
      const vocabularyCollectionRef = collection(db, 'vocabulary');
      const docRef = await addDoc(vocabularyCollectionRef, firestoreDocData);
      toast({ title: "Word Added", description: `Word "${newWordData.japanese}" added successfully.` });
      return {
        id: docRef.id,
        ...newWordData,
        learned: false,
        createdAt: Date.now(), 
      } as VocabularyWord;

    } catch (error: any) {
      console.error("[DIAGNOSTIC] Full Firestore Error object in addWord:", error);
      const errorCode = error.code || 'N/A';
      const errorMessage = error.message || 'No specific message';
      toast({ title: "Database Error", description: `Could not add word. Code: ${errorCode}. Message: ${errorMessage}.`, variant: "destructive", duration: 10000 });
      return undefined;
    }
  }, [user, toast]);

  const updateWord = useCallback(async (wordId: string, updatedFormData: VocabularyFormDataType) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be signed in to update words.", variant: "destructive" });
      return;
    }

    const wordRef = doc(db, 'vocabulary', wordId);
    try {
      const docSnap = await getDoc(wordRef);
      if (!docSnap.exists()) {
        toast({ title: "Error", description: "Word not found.", variant: "destructive" });
        return;
      }
      if (docSnap.data().userId !== user.uid) {
        toast({ title: "Permission Denied", description: "You cannot edit this word.", variant: "destructive" });
        return;
      }

      const exampleSentencesArray = updatedFormData.exampleSentences
        ? updatedFormData.exampleSentences.split('\n').map(s => s.trim()).filter(s => s.length > 0)
        : [];

      const dataToUpdate: Partial<FirestoreVocabularyWord> = {
        japanese: updatedFormData.japanese,
        romaji: updatedFormData.romaji,
        definition: updatedFormData.definition,
        exampleSentences: exampleSentencesArray,
        difficulty: updatedFormData.difficulty,
      };

      await updateDoc(wordRef, dataToUpdate);
      toast({ title: "Word Updated", description: `Word "${updatedFormData.japanese}" has been updated.` });

    } catch (error: any) {
      console.error("[DIAGNOSTIC] Full Firestore Error object in updateWord:", error);
      const errorCode = error.code || 'N/A';
      const errorMessage = error.message || 'No specific message';
      console.error(`[DIAGNOSTIC] Firestore updateWord Error - Code: ${errorCode}, Message: ${errorMessage}`);
      toast({ title: "Database Error", description: `Could not update word. Code: ${errorCode}.`, variant: "destructive" });
    }
  }, [user, toast]);


  const toggleLearnedStatus = useCallback(async (wordId: string) => {
    if (!user) {
       toast({ title: "Not Authenticated", description: "You must be signed in to update words.", variant: "destructive" });
       return;
    }

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
      toast({ title: "Error", description: `Could not update learned status. Code: ${errorCode}.`, variant: "destructive" });
    }
  }, [user, toast]);

  const deleteWord = useCallback(async (wordId: string) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be signed in to delete words.", variant: "destructive" });
      return;
    }

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
      toast({ title: "Error", description: `Could not delete word. Code: ${errorCode}.`, variant: "destructive" });
    }
  }, [user, toast]);

  const updateWordDifficulty = useCallback(async (wordId: string, difficulty: Difficulty) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be signed in to update difficulty.", variant: "destructive" });
      return;
    }
    
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
    } catch (error: any)
{
      console.error("[DIAGNOSTIC] Full Firestore Error object in updateWordDifficulty:", error);
      const errorCode = error.code || 'N/A';
      const errorMessage = error.message || 'No specific message';
      toast({ title: "Error", description: `Could not update difficulty. Code: ${errorCode}.`, variant: "destructive" });
    }
  }, [user, toast]);
  
  return { words, loading, addWord, updateWord, toggleLearnedStatus, deleteWord, updateWordDifficulty };
}
