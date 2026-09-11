import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Wattwise — Optimisez prix et impact électrique',
  description: 'Planifiez vos appareils selon le prix, le carbone et les renouvelables en Europe.',
  applicationName: 'Wattwise',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Wattwise', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  openGraph: {
    title: 'Wattwise',
    description: 'Optimisez vos appareils selon le prix, le carbone et les renouvelables.',
    type: 'website',
    locale: 'fr_FR',
    images: [{ url: '/og.png', width: 1730, height: 909, alt: 'Wattwise — Consommez au bon moment.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wattwise',
    description: 'Optimisez vos appareils selon le prix, le carbone et les renouvelables.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7f1' },
    { media: '(prefers-color-scheme: dark)', color: '#111914' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
