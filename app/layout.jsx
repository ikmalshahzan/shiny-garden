import './globals.css';
import localFont from 'next/font/local';
import { assetPath } from '../lib/assets';

const heading = localFont({
  src: [
    { path: './fonts/cormorant.woff2', weight: '300 700', style: 'normal' },
    { path: './fonts/cormorant-italic.woff2', weight: '300 700', style: 'italic' },
  ],
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
  variable: '--font-garden-heading',
});
const body = localFont({
  src: './fonts/plus-jakarta.woff2',
  weight: '200 800',
  display: 'swap',
  preload: false,
  variable: '--font-garden-body',
});
const arabic = localFont({
  src: './fonts/amiri-arabic.woff2',
  weight: '400',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  variable: '--font-garden-arabic',
});

export const metadata = {
  title: "'Adani & Ikmal | Petang Pertunangan",
  description: "Join 'Adani and Ikmal for Petang Pertunangan on 25 December 2026.",
  icons: { icon: assetPath('monogram.svg') },
  referrer: 'no-referrer',
};

export const viewport = { themeColor: '#FAF8F5' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} ${arabic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
