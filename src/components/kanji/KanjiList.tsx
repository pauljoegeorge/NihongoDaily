
"use client";

import type { KanjiEntry } from '@/types';
import KanjiCard from './KanjiCard';
import { format, isToday, isYesterday, parseISO, compareDesc } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import type { KanjiFormData } from '@/hooks/useKanji';

interface KanjiListProps {
  kanjiEntries: KanjiEntry[];
  onUpdateKanji: (id: string, data: KanjiFormData) => Promise<void>;
  onDeleteKanji: (id: string) => void;
}

interface GroupedKanji {
  [key: string]: KanjiEntry[];
}

export default function KanjiList({ kanjiEntries, onUpdateKanji, onDeleteKanji }: KanjiListProps) {
  if (kanjiEntries.length === 0) {
    // This case should be handled by the page.tsx with an Alert
    return null;
  }

  const sortedKanji = [...kanjiEntries].sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)));

  const groupedKanji = sortedKanji.reduce((acc: GroupedKanji, entry) => {
    const date = new Date(entry.createdAt);
    let dateKey: string;

    if (isToday(date)) {
      dateKey = 'Today';
    } else if (isYesterday(date)) {
      dateKey = 'Yesterday';
    } else {
      dateKey = format(date, 'yyyy-MM-dd');
    }

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {});

  const dateKeys = Object.keys(groupedKanji).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return compareDesc(parseISO(a), parseISO(b));
  });

  const formatDateDisplay = (dateKey: string): string => {
    if (dateKey === 'Today' || dateKey === 'Yesterday') {
      return dateKey;
    }
    return format(parseISO(dateKey), 'MMMM d, yyyy');
  };

  return (
    <div className="space-y-8">
      {dateKeys.map((dateKey, index) => (
        <section key={dateKey}>
          <h2 className="text-2xl font-headline text-primary mb-4 pb-2 border-b border-primary/20">
            {formatDateDisplay(dateKey)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6"> {/* Max 2 cards for Kanji for readability */}
            {groupedKanji[dateKey].map(entry => (
              <KanjiCard
                key={entry.id}
                entry={entry}
                onUpdate={onUpdateKanji}
                onDelete={onDeleteKanji}
              />
            ))}
          </div>
          {index < dateKeys.length - 1 && <Separator className="my-8 bg-border/50" />}
        </section>
      ))}
    </div>
  );
}
