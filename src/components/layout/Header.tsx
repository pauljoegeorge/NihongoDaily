
import { Cherry, BookMarked, LayoutDashboard, FileQuestion, BookText, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import SignInButton from '@/components/auth/SignInButton';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 px-2 py-2 rounded-md transition-colors hover:bg-primary/5 focus-visible:ring-0">
                Study Tools
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border shadow-lg">
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-primary/10">
                <Link href="/quiz" className="flex items-center gap-2 text-primary w-full">
                  <BookMarked className="h-5 w-5" />
                  Flashcards
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-primary/10">
                <Link href="/fill-quiz" className="flex items-center gap-2 text-primary w-full">
                  <FileQuestion className="h-5 w-5" />
                  Fill Quiz
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-primary/10">
                <Link href="/kanji" className="flex items-center gap-2 text-primary w-full">
                  <BookText className="h-5 w-5" />
                  Kanji
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ThemeSwitcher />
          <SignInButton />
        </div>
      </div>
    </header>
  );
}
