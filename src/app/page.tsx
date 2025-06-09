
"use client";

import AddVocabularyDialog from '@/components/vocabulary/AddVocabularyDialog';
import VocabularyList from '@/components/vocabulary/VocabularyList';
import { useVocabulary } from '@/hooks/useVocabulary';

export default function Home() {
  const { words, loading, addWord, toggleLearnedStatus, deleteWord, updateWordDifficulty } = useVocabulary();

  return (
    <div className="min-h-screen">
      <VocabularyList
        words={words}
        loading={loading}
        toggleLearnedStatus={toggleLearnedStatus}
        deleteWord={deleteWord}
        updateWordDifficulty={updateWordDifficulty}
      />
      <AddVocabularyDialog onAddWord={addWord} />
    </div>
  );
}

