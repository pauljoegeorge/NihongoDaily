"use client";

import AddVocabularyDialog from '@/components/vocabulary/AddVocabularyDialog';
import VocabularyList from '@/components/vocabulary/VocabularyList';
import { useVocabulary } from '@/hooks/useVocabulary';

export default function Home() {
  const { addWord } = useVocabulary();

  return (
    <div className="min-h-screen">
      <VocabularyList />
      <AddVocabularyDialog onAddWord={addWord} />
    </div>
  );
}
