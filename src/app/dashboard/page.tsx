
"use client";

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useVocabulary } from '@/hooks/useVocabulary';
import type { VocabularyWord } from '@/types';
import { format, parseISO, startOfDay, compareAsc } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart as ChartIcon, Loader2, LogIn, Info, Target } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


const DAILY_GOAL = 5;

interface DailyWordCount {
  date: string; // YYYY-MM-DD
  count: number;
}

const chartConfig = {
  wordsAdded: {
    label: "Words Added",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { words: allWords, loading: vocabLoading } = useVocabulary();

  const processedData = useMemo(() => {
    if (!allWords || allWords.length === 0) {
      return { dailyWordCounts: [], goalMetDays: [], chartData: [] };
    }

    const countsByDate: Record<string, number> = {};
    allWords.forEach(word => {
      const dateStr = format(startOfDay(new Date(word.createdAt)), 'yyyy-MM-dd');
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    });

    const dailyWordCountsArray: DailyWordCount[] = Object.entries(countsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date))); // Sort chronologically for chart

    const goalMetDaysArray = dailyWordCountsArray
      .filter(item => item.count >= DAILY_GOAL)
      .sort((a,b) => compareAsc(parseISO(b.date), parseISO(a.date))); // Sort recent first for list

    return {
      dailyWordCounts: dailyWordCountsArray, // For chart
      goalMetDays: goalMetDaysArray, // For list and total count
      chartData: dailyWordCountsArray.map(item => ({...item, dateForChart: format(parseISO(item.date), 'MMM d') })) // Prepare for chart XAxis
    };
  }, [allWords]);

  const { dailyWordCounts, goalMetDays, chartData } = processedData;

  if (authLoading || vocabLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert className="max-w-md text-center bg-primary/5 border-primary/20 mt-8">
          <LogIn className="h-6 w-6 mx-auto mb-3 text-primary" />
          <AlertTitle className="font-headline text-2xl text-primary mb-2">Sign In Required</AlertTitle>
          <AlertDescription className="text-primary-foreground/80">
            Please <Link href="/" className="underline hover:text-primary-foreground font-semibold">sign in</Link> to view your dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (allWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert className="max-w-lg text-center bg-accent/10 border-accent/30 mt-8">
          <Info className="h-8 w-8 mx-auto mb-4 text-accent-foreground" />
          <AlertTitle className="font-headline text-2xl text-accent-foreground mb-2">No Vocabulary Yet</AlertTitle>
          <AlertDescription className="text-muted-foreground mb-4">
            You haven't added any words to your vocabulary list. Start by <Link href="/" className="underline hover:text-accent-foreground font-semibold">adding some words</Link>!
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-headline text-primary">Your Progress Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-primary-foreground">
              <Target className="h-7 w-7 text-primary" />
              Daily Goal Tracker
            </CardTitle>
            <CardDescription>Days you added at least {DAILY_GOAL} words.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-primary">{goalMetDays.length}</p>
            <p className="text-muted-foreground">day{goalMetDays.length === 1 ? '' : 's'} goal achieved</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg bg-card md:col-span-1">
           <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-primary-foreground">
              <ChartIcon className="h-7 w-7 text-primary" />
              Words Added Per Day
            </CardTitle>
            <CardDescription>Visualizing your daily vocabulary additions.</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                    <XAxis 
                      dataKey="dateForChart" 
                      tickLine={false} 
                      axisLine={false} 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      allowDecimals={false} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'hsl(var(--accent)/0.3)' }}
                      content={<ChartTooltipContent indicator="dot" />} 
                    />
                    <ReferenceLine y={DAILY_GOAL} stroke="hsl(var(--destructive))" strokeDasharray="3 3">
                       <RechartsTooltip.Label value={`Goal: ${DAILY_GOAL}`} position="insideTopRight" fill="hsl(var(--destructive))" fontSize={10} />
                    </ReferenceLine>
                    <Bar dataKey="count" name="Words Added" fill="var(--color-wordsAdded)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">No word data to display in chart yet.</p>
            )}
          </CardContent>
        </Card>
      </div>


      {goalMetDays.length > 0 && (
        <Card className="shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="text-2xl text-primary-foreground">Goal Achievement Days</CardTitle>
            <CardDescription>Dates you met your daily goal of adding at least {DAILY_GOAL} words, sorted by most recent.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] text-muted-foreground">Date</TableHead>
                    <TableHead className="text-right text-muted-foreground">Words Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goalMetDays.map(day => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium text-foreground">
                        {format(parseISO(day.date), 'EEEE, MMMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right text-foreground">{day.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
