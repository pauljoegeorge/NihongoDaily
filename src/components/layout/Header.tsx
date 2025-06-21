
"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Cherry, BookMarked, LayoutDashboard, FileQuestion, BookText, ChevronDown, Menu } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Reusable NavLink for the sheet to reduce repetition and handle closing the sheet.
const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) => (
  <Link href={href} onClick={onClick} className="flex items-center gap-3 text-lg text-foreground hover:text-primary transition-colors w-full p-3 rounded-md hover:bg-primary/5">
    {children}
  </Link>
);


export default function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="bg-primary/10 py-3 shadow-md sticky top-0 z-40 backdrop-blur-sm">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Cherry className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary">
            Nihongo Daily
          </h1>
        </Link>

        {/* --- Desktop Navigation (Logged In) --- */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 px-3 py-2 rounded-md transition-colors hover:bg-primary/5">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 px-3 py-2 rounded-md transition-colors hover:bg-primary/5 focus-visible:ring-0">
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
          </nav>
        )}

        <div className="flex items-center gap-2">
           <ThemeSwitcher />
           <SignInButton />
          
          {/* --- Mobile Navigation (Logged In) --- */}
          {user && (
            <div className="md:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="text-primary border-primary/30">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-card p-4">
                  <SheetHeader className="text-left mb-8">
                    <SheetTitle className="text-primary font-headline text-2xl flex items-center gap-2">
                      <Cherry className="h-7 w-7" />
                      Navigation
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-2">
                    <NavLink href="/dashboard" onClick={() => setIsSheetOpen(false)}>
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </NavLink>
                    <NavLink href="/quiz" onClick={() => setIsSheetOpen(false)}>
                      <BookMarked className="h-5 w-5" />
                      Flashcards
                    </NavLink>
                    <NavLink href="/fill-quiz" onClick={() => setIsSheetOpen(false)}>
                      <FileQuestion className="h-5 w-5" />
                      Fill Quiz
                    </NavLink>
                    <NavLink href="/kanji" onClick={() => setIsSheetOpen(false)}>
                      <BookText className="h-5 w-5" />
                      Kanji
                    </NavLink>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
