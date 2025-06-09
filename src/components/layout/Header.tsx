
import { Cherry } from 'lucide-react';
import Link from 'next/link';
import SignInButton from '@/components/auth/SignInButton'; // Added SignInButton import

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
        <SignInButton /> {/* Added SignInButton component */}
      </div>
    </header>
  );
}
