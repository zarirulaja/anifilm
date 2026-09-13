import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/ui/Toast';
import { MediaModeProvider } from '@/context/MediaModeContext';

export const metadata: Metadata = {
  title: 'NontonStreaming — Personal Anime & Film Dashboard',
  description: 'Website streaming anime & film pribadi modern terintegrasi dengan Wajik Anime API & LK21 API.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen flex flex-col bg-[#080b11] text-slate-100 antialiased selection:bg-red-500 selection:text-white">
        <MediaModeProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </MediaModeProvider>
      </body>
    </html>
  );
}
