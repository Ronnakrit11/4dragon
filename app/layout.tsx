import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Anuphan } from 'next/font/google';
import { UserProvider } from '@/lib/auth';
import { getUser } from '@/lib/db/queries';
import { ThemeProvider } from '@/lib/theme-provider';

export const metadata: Metadata = {
  title: 'Aurienn Demo Gold Trading',
  description: 'Demo Gold Trading and Saving ',
};

export const viewport: Viewport = {
  maximumScale: 1,
};

const anuphan = Anuphan({ 
  subsets: ['thai', 'latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userPromise = getUser();

  return (
    <html
      lang="en"
      className={`${anuphan.className}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh]">
        <ThemeProvider>
          <UserProvider userPromise={userPromise}>{children}</UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
