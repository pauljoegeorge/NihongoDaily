
import { Cherry, BookMarked, LayoutDashboard, FileQuestion, BookText } from 'lucide-react';
import Link from 'next/link';
import SignInButton from '@/components/auth/SignInButton';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';

export default function Header() {
  return (
    <header className="bg-primary/10 py-4 shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Cherry className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-headline font-bold text-primary">
            Nihongo Daily
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 px-2 py-2 rounded-md transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/quiz" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 px-2 py-2 rounded-md transition-colors">
            <BookMarked className="h-5 w-5" />
            Flashcards
          </Link>
          <Link href="/fill-quiz" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 px-2 py-2 rounded-md transition-colors">
            <FileQuestion className="h-5 w-5" />
            Fill Quiz
          </Link>
          <Link href="/kanji" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 px-2 py-2 rounded-md transition-colors">
            <BookText className="h-5 w-5" />
            Kanji
          </Link>
          <ThemeSwitcher />
          <SignInButton />
        </div>
      </div>
    </header>
  );
}
