
"use client";

import AddVocabularyDialog from '@/components/vocabulary/AddVocabularyDialog';
import VocabularyList from '@/components/vocabulary/VocabularyList';
import { useVocabulary } from '@/hooks/useVocabulary';

export default function Home() {
  const { words, loading, addWord, toggleLearnedStatus, deleteWord } = useVocabulary();

  return (
    <div className="min-h-screen">
      <VocabularyList
        words={words}
        loading={loading}
        toggleLearnedStatus={toggleLearnedStatus}
        deleteWord={deleteWord}
      />
      <AddVocabularyDialog onAddWord={addWord} />
    </div>
  );
}

