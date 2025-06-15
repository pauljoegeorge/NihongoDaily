
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { KanjiEntry, FirestoreKanjiEntry } from '@/types';
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
import * as z from 'zod';

export const kanjiFormSchema = z.object({
  kanji: z.string().min(1, 'Kanji character is required.').max(5, 'Kanji input is too long, typically a single character.'), // Max 5 for rare cases or phrases
  meaning: z.string().min(1, 'Meaning is required.'),
  onyomi: z.string().optional(), // Comma-separated
  kunyomi: z.string().optional(), // Comma-separated
  onyomiExamplesText: z.string().optional(),
  kunyomiExamplesText: z.string().optional(),
  usageExampleSentences: z.string().optional(), // Newline-separated
});

export type KanjiFormData = z.infer<typeof kanjiFormSchema>;

export function useKanji() {
  const [kanjiList, setKanjiList] = useState<KanjiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setKanjiList([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    const kanjiCollectionRef = collection(db, 'kanjiEntries');
    const q = query(
      kanjiCollectionRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedKanji: KanjiEntry[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as FirestoreKanjiEntry;
        const createdAtMillis = data.createdAt instanceof FirestoreTimestamp
          ? data.createdAt.toMillis()
          : data.createdAt?.seconds
            ? data.createdAt.seconds * 1000 + (data.createdAt.nanoseconds || 0) / 1000000
            : Date.now();

        fetchedKanji.push({
          id: docSnapshot.id,
          kanji: data.kanji,
          meaning: data.meaning,
          onyomi: data.onyomi || [],
          kunyomi: data.kunyomi || [],
          onyomiExamplesText: data.onyomiExamplesText || '',
          kunyomiExamplesText: data.kunyomiExamplesText || '',
          usageExampleSentences: data.usageExampleSentences || [],
          createdAt: createdAtMillis,
          userId: data.userId,
        });
      });
      setKanjiList(fetchedKanji);
      setLoading(false);
    }, (error: any) => {
      console.error("[DIAGNOSTIC] Full Firestore Error object in useKanji onSnapshot listener:", error);
      const errorCode = error.code || 'N/A';
      const errorMessage = error.message || 'No specific message';
      
      setLoading(false);
      let title = "Error Fetching Kanji";
      let description = `Could not fetch your Kanji list. Code: ${errorCode}. Message: ${errorMessage}.`;

      if ((errorCode === 'failed-precondition' || (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('index')))) {
        title = "Firestore Indexing Error (Kanji)";
        let detailedDescription = `A required Firestore index is missing or not yet built for the 'kanjiEntries' collection. Fields needed: userId (Ascending) AND createdAt (Descending). `;
        const createIndexUrlMatch = typeof errorMessage === 'string' ? errorMessage.match(/(https?:\/\/[^\s]*console\.firebase\.google\.com[^\s]*)/) : null;
        if (createIndexUrlMatch && createIndexUrlMatch[0]) {
          detailedDescription += `Firestore suggests creating it here: ${createIndexUrlMatch[0]}.`;
        } else {
           detailedDescription += `Please check your browser's developer console for a direct link from Firestore to create the required index.`;
        }
        description = detailedDescription;
      } else if (errorCode === 'permission-denied' || (typeof errorMessage === 'string' && (errorMessage.includes('permission-denied') || errorMessage.includes('Missing or insufficient permissions')))) {
        title = "Permission Denied (Kanji)";
        description = `You don't have permission to read Kanji entries. Please check your Firestore security rules.`;
      } else if (error.name === 'FirebaseError' && error.code === 'cancelled') {
        console.warn("[DIAGNOSTIC] Kanji Firestore onSnapshot listener was cancelled.");
        return; 
      } else if (error.name === 'FirebaseError' && error.code === 'unimplemented') {
        title = "Operation Not Supported (Kanji)";
        description = "The query operation is not supported. " + errorMessage;
      } else {
        title = `Firestore Error (${errorCode}) - Kanji`;
        description = `An unexpected error occurred while fetching Kanji: ${errorMessage}`;
      }
      
      toast({
        title: title,
        description: description,
        variant: "destructive",
        duration: 30000, // Longer duration for important errors like indexing
      });
    });

    return () => unsubscribe();
  }, [user, toast]);

  const addKanji = useCallback(async (formData: KanjiFormData): Promise<KanjiEntry | undefined> => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be signed in to add Kanji.", variant: "destructive" });
      return undefined;
    }

    const newKanjiData: FirestoreKanjiEntry = {
      kanji: formData.kanji.trim(),
      meaning: formData.meaning.trim(),
      onyomi: formData.onyomi ? formData.onyomi.split(',').map(s => s.trim()).filter(s => s) : [],
      kunyomi: formData.kunyomi ? formData.kunyomi.split(',').map(s => s.trim()).filter(s => s) : [],
      onyomiExamplesText: formData.onyomiExamplesText || '',
      kunyomiExamplesText: formData.kunyomiExamplesText || '',
      usageExampleSentences: formData.usageExampleSentences ? formData.usageExampleSentences.split('\n').map(s => s.trim()).filter(s => s) : [],
      createdAt: serverTimestamp(),
      userId: user.uid,
    };

    try {
      const docRef = await addDoc(collection(db, 'kanjiEntries'), newKanjiData);
      toast({ title: "Kanji Added", description: `Kanji "${newKanjiData.kanji}" added successfully.` });
      // Construct the KanjiEntry to return, approximating the timestamp
      const { createdAt, ...restOfData } = newKanjiData; // separate serverTimestamp
      return {
        id: docRef.id,
        ...restOfData, // spread the rest of the data
        createdAt: Date.now(), // Use current client time as an approximation
      } as KanjiEntry;
    } catch (error: any) {
      console.error("Error adding Kanji:", error);
      toast({ title: "Database Error", description: `Could not add Kanji. ${error.message}`, variant: "destructive" });
      return undefined;
    }
  }, [user, toast]);

  const updateKanji = useCallback(async (kanjiId: string, formData: KanjiFormData) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be signed in to update Kanji.", variant: "destructive" });
      return;
    }

    const kanjiRef = doc(db, 'kanjiEntries', kanjiId);
    try {
      const docSnap = await getDoc(kanjiRef);
      if (!docSnap.exists() || docSnap.data().userId !== user.uid) {
        toast({ title: "Error", description: "Kanji not found or permission denied.", variant: "destructive" });
        return;
      }

      const updatedKanjiData: Partial<FirestoreKanjiEntry> = {
        kanji: formData.kanji.trim(),
        meaning: formData.meaning.trim(),
        onyomi: formData.onyomi ? formData.onyomi.split(',').map(s => s.trim()).filter(s => s) : [],
        kunyomi: formData.kunyomi ? formData.kunyomi.split(',').map(s => s.trim()).filter(s => s) : [],
        onyomiExamplesText: formData.onyomiExamplesText || '',
        kunyomiExamplesText: formData.kunyomiExamplesText || '',
        usageExampleSentences: formData.usageExampleSentences ? formData.usageExampleSentences.split('\n').map(s => s.trim()).filter(s => s) : [],
        // Note: createdAt is not updated here as it's a creation timestamp
      };

      await updateDoc(kanjiRef, updatedKanjiData);
      toast({ title: "Kanji Updated", description: `Kanji "${formData.kanji}" has been updated.` });
    } catch (error: any) {
      console.error("Error updating Kanji:", error);
      toast({ title: "Database Error", description: `Could not update Kanji. ${error.message}`, variant: "destructive" });
    }
  }, [user, toast]);

  const deleteKanji = useCallback(async (kanjiId: string) => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be signed in to delete Kanji.", variant: "destructive" });
      return;
    }

    const kanjiRef = doc(db, 'kanjiEntries', kanjiId);
    try {
      const docSnap = await getDoc(kanjiRef);
      const kanjiChar = docSnap.exists() ? docSnap.data().kanji : "Kanji"; // Get char before delete
      if (docSnap.exists() && docSnap.data().userId !== user.uid) {
         toast({ title: "Error", description: "Cannot delete this Kanji (permission).", variant: "destructive" });
         return;
      }
      await deleteDoc(kanjiRef);
      toast({ title: "Kanji Deleted", description: `"${kanjiChar}" has been removed.` });
    } catch (error: any) {
      console.error("Error deleting Kanji:", error);
      toast({ title: "Error", description: `Could not delete Kanji. ${error.message}`, variant: "destructive" });
    }
  }, [user, toast]);

  return { kanjiList, loading, addKanji, updateKanji, deleteKanji };
}
