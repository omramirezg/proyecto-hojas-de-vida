import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { esES } from '@clerk/localizations';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'Angélica — Reclutamiento con IA',
    template: '%s · Angélica',
  },
  description:
    'Plataforma de reclutamiento y selección con IA: reclutamiento ciego, Índice de Ajuste al Cargo (IAC) y ranking explicable para empresas de LATAM.',
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
