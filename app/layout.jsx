import './globals.css';
import { assetPath } from '../lib/assets';

export const metadata = {
  title: "'Adani & Ikmal | Petang Pertunangan",
  description: "Join 'Adani and Ikmal for Petang Pertunangan on 25 December 2026.",
  icons: { icon: assetPath('monogram.svg') },
  referrer: 'no-referrer',
};

export const viewport = { themeColor: '#FAF8F5' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri&amp;family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
