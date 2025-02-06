'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/lib/theme-provider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      {children}
      <Toaster richColors position="top-center" />
    </section>
  );
}