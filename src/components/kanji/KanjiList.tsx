
"use client";

import { useState } from 'react';
import type { KanjiEntry } from '@/types';
import type { KanjiFormData } from '@/hooks/useKanji';
import { Card } from '@/components/ui/card';
import KanjiDetailsDialog from './KanjiDetailsDialog';
import EditKanjiDialog from './EditKanjiDialog';

interface KanjiListProps {
  kanjiEntries: KanjiEntry[];
  onUpdateKanji: (id: string, data: KanjiFormData) => Promise<void>;
  onDeleteKanji: (id: string) => void;
}

export default function KanjiList({ kanjiEntries, onUpdateKanji, onDeleteKanji }: KanjiListProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedKanji, setSelectedKanji] = useState<KanjiEntry | null>(null);

  const handleViewDetails = (kanji: KanjiEntry) => {
    setSelectedKanji(kanji);
    setDetailsOpen(true);
  };

  const handleEditRequest = (kanji: KanjiEntry) => {
    setSelectedKanji(kanji);
    setDetailsOpen(false); // Close details dialog
    setEditOpen(true); // Open edit dialog
  };

  const handleDeleteRequest = (id: string) => {
    setDetailsOpen(false); // Close details dialog before deleting
    onDeleteKanji(id);
  };

  if (kanjiEntries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
        {kanjiEntries.map((entry) => (
          <Card 
            key={entry.id} 
            className="flex flex-col justify-center items-center text-center shadow-md hover:shadow-lg transition-all bg-card aspect-square cursor-pointer hover:bg-card/80"
            onClick={() => handleViewDetails(entry)}
          >
            <p className="font-headline text-4xl sm:text-5xl text-primary transition-transform">{entry.kanji}</p>
          </Card>
        ))}
      </div>

      {selectedKanji && (
        <KanjiDetailsDialog
          isOpen={detailsOpen}
          setIsOpen={setDetailsOpen}
          kanjiEntry={selectedKanji}
          onEdit={handleEditRequest}
          onDelete={handleDeleteRequest}
        />
      )}
      {selectedKanji && (
         <EditKanjiDialog
            isOpen={editOpen}
            setIsOpen={setEditOpen}
            kanjiToEdit={selectedKanji}
            onUpdateKanji={onUpdateKanji}
        />
      )}
    </>
  );
}
