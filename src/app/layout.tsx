
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/Header';
import { AuthProvider } from '@/context/AuthContext';

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
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <InitialThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
