
"use client";

import { useState } from 'react';
import type { KanjiEntry } from '@/types';
import type { KanjiFormData } from '@/hooks/useKanji';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit3, Trash2 } from 'lucide-react';
import KanjiDetailsDialog from './KanjiDetailsDialog';
import EditKanjiDialog from './EditKanjiDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


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
      <TooltipProvider>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {kanjiEntries.map((entry) => (
            <Card key={entry.id} className="flex flex-col justify-between text-center shadow-md hover:shadow-lg transition-shadow bg-card">
              <CardHeader className="cursor-pointer p-4" onClick={() => handleViewDetails(entry)}>
                <CardTitle className="font-headline text-5xl text-primary">{entry.kanji}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 cursor-pointer" onClick={() => handleViewDetails(entry)}>
                <p className="text-sm text-muted-foreground truncate" title={entry.meaning}>
                  {entry.meaning || "No meaning"}
                </p>
              </CardContent>
              <CardFooter className="p-2 border-t bg-muted/20 flex justify-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(entry)} className="text-foreground/70 hover:text-primary h-8 w-8">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>View Details</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)} className="text-foreground/70 hover:text-primary h-8 w-8">
                      <Edit3 className="h-4 w-4" />
                      <span className="sr-only">Edit Kanji</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Edit Kanji</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteKanji(entry.id)} className="text-destructive hover:text-destructive/80 h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Kanji</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Delete Kanji</p></TooltipContent>
                </Tooltip>
              </CardFooter>
            </Card>
          ))}
        </div>
      </TooltipProvider>

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
