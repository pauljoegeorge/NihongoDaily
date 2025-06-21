import { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/Header';
import { AuthProvider } from '@/context/AuthContext';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Nihongo Daily',
  description: 'Add and list 5 Japanese vocabulary words every day.',
};

const InitialThemeScript = () => {
  const script = `
    (function() {
      const theme = localStorage.getItem('nihongo-daily-theme');
      if (theme && theme !== 'default') {
        document.documentElement.setAttribute('data-theme', theme);
      } else if (!theme) {
        // Set 'forest-calm' as the default theme if nothing is in localStorage
        document.documentElement.setAttribute('data-theme', 'forest-calm'); 
      }
    })();
  `.trim();
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true} className="flex flex-col min-h-screen">
      <head>
        <InitialThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col flex-grow">
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <AuthProvider>
          <Header />
          <main className="container mx-auto px-4 py-8 flex-grow">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
        <footer className="bg-card border-t border-border/20 py-6 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary underline">Privacy Policy</Link>
            <p className="mt-2">&copy; 2024 Nihongo Daily. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
