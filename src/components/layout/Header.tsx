
import { Cherry, BookMarked, LayoutDashboard } from 'lucide-react'; // Added LayoutDashboard icon
import Link from 'next/link';
import SignInButton from '@/components/auth/SignInButton';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';

export default function Header() {
  return (
    <header className="bg-primary/10 py-4 shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary-foreground hover:text-primary-foreground/80 transition-colors">
          <Cherry className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-headline font-bold text-primary">
            Nihongo Daily
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-md transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/quiz" className="flex items-center gap-1.5 text-sm font-medium text-primary-foreground hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-md transition-colors">
            <BookMarked className="h-5 w-5" />
            Quiz
          </Link>
          <ThemeSwitcher />
          <SignInButton />
        </div>
      </div>
    </header>
  );
}

