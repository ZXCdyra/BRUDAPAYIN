import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { NavigationProgress } from '@/components/navigation-progress';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/lib/query-provider';
import ruMessages from '../../messages/ru.json';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrudaPay',
  description: 'BrudaPay — P2P payment processing platform',
  openGraph: {
    title: 'BrudaPay',
    description: 'BrudaPay — P2P payment processing platform',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen bg-surface-primary text-text-primary antialiased">
        <ThemeProvider>
          <NextIntlClientProvider locale="ru" messages={ruMessages}>
            <QueryProvider>
              <NavigationProgress />
              {children}
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
