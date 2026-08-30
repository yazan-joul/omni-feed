import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'OmniFeed - Universal Content Aggregator',
  description: 'A unified stream of YouTube videos, Substack posts, Tech news, and RSS feeds built for the modern web.',
  keywords: ['RSS', 'YouTube', 'Content Aggregator', 'Substack', 'Hacker News', 'Next.js', 'OmniFeed'],
  authors: [{ name: 'OmniFeed Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0b0f19] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
