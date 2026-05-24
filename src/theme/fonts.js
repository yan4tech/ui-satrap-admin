import { Vazirmatn } from 'next/font/google';

// Self-hosted by Next.js at build time (reliable with App Router + MUI RTL).
export const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  preload: true,
  variable: '--font-vazirmatn',
  fallback: ['Tahoma', 'Arial', 'sans-serif'],
});
