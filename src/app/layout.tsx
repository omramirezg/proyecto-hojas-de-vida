import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { esES } from '@clerk/localizations';
import { Toaster } from 'sonner';
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '@/lib/brand';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={esES}>
      <html lang="es" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
