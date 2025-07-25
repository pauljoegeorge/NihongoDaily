
"use client";

import { useState } from 'react';
import type { KanjiEntry } from '@/types';
import type { KanjiFormData } from '@/hooks/useKanji';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit3, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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

  const handleEdit = (kanji: KanjiEntry) => {
    setSelectedKanji(kanji);
    setEditOpen(true);
  };
  
  if (kanjiEntries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">Kanji</TableHead>
              <TableHead>Meaning</TableHead>
              <TableHead className="hidden md:table-cell">Readings</TableHead>
              <TableHead className="hidden lg:table-cell">Date Added</TableHead>
              <TableHead className="text-right w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kanjiEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-headline text-2xl text-primary text-center">{entry.kanji}</TableCell>
                <TableCell className="text-foreground">{entry.meaning}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col gap-1">
                    {entry.onyomi.length > 0 && 
                      <div className="flex flex-wrap items-center gap-1 text-xs">
                          <span className="font-semibold w-16">On'yomi:</span>
                          {entry.onyomi.map((on, i) => <Badge key={i} variant="secondary">{on}</Badge>)}
                      </div>
                    }
                    {entry.kunyomi.length > 0 &&
                       <div className="flex flex-wrap items-center gap-1 text-xs">
                          <span className="font-semibold w-16">Kun'yomi:</span>
                          {entry.kunyomi.map((kun, i) => <Badge key={i} variant="secondary">{kun}</Badge>)}
                      </div>
                    }
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                  {format(new Date(entry.createdAt), 'yyyy-MM-dd')}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleViewDetails(entry)} className="text-foreground/70 hover:text-primary h-8 w-8">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View Details</span>
                  </Button>
                   <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)} className="text-foreground/70 hover:text-primary h-8 w-8">
                    <Edit3 className="h-4 w-4" />
                    <span className="sr-only">Edit Kanji</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteKanji(entry.id)} className="text-destructive hover:text-destructive/80 h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Kanji</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedKanji && (
        <KanjiDetailsDialog
          isOpen={detailsOpen}
          setIsOpen={setDetailsOpen}
          kanjiEntry={selectedKanji}
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
