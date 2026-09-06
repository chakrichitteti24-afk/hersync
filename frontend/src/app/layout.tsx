import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from '@/i18n/useTranslation';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Svanexa AI | Intelligent Wellness, Empowered by AI',
  description: 'Svanexa AI is an AI-powered women\'s wellness platform designed to provide personalized wellness guidance, secure health tracking, and intelligent insights through Artificial Intelligence.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.jpg', type: 'image/jpeg' },
    ],
    apple: [
      { url: '/apple-icon.jpg' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased`} suppressHydrationWarning>
        <I18nProvider>
          {children}
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}

