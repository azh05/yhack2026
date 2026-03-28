import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ConflictLens — AI-Powered Global Conflict Intelligence',
  description: 'Interactive 3D map tracking armed conflicts worldwide with AI analysis, news aggregation, and timelapse visualization.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="bg-surface text-white antialiased noise-overlay">
        {children}
      </body>
    </html>
  );
}
