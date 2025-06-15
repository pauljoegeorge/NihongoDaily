
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
    }, (error) => {
      console.error("Error fetching Kanji list:", error);
      toast({
        title: "Error Fetching Kanji",
        description: "Could not fetch your Kanji list. Please check console for details.",
        variant: "destructive",
        duration: 10000,
      });
      setLoading(false);
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
      // For immediate UI update, construct and return the client-side object
      // Note: createdAt will be an estimate until listener picks up actual server timestamp
      return {
        id: docRef.id,
        ...newKanjiData,
        createdAt: Date.now(), // Estimate
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
      const kanjiChar = docSnap.exists() ? docSnap.data().kanji : "Kanji";
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
