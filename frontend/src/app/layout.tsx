import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { ThemeSync } from '@/components/ThemeSync';
import { PwaRegister } from '@/components/PwaRegister';

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Progress Tracker App — High Focus Execution System',
  description: 'Daily accountability and 5-session execution platform for ambitious engineers',
  applicationName: 'PTA',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'PTA',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F4F4' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0F14' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Static file — avoid dangerouslySetInnerHTML for theme FOUC bootstrap */}
        <script src="/theme-init.js" />
      </head>
      <body className="min-h-dvh antialiased">
        <PwaRegister>
          <AuthProvider>
            <AppProvider>
              <ThemeSync />
              {children}
            </AppProvider>
          </AuthProvider>
        </PwaRegister>
      </body>
    </html>
  );
}
