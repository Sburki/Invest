import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Investment Signals App',
  description: 'Research- und Signal-Plattform für Investmentideen',
  applicationName: 'Investment Signals',
  appleWebApp: {
    capable: true,
    title: 'Investment Signals',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
