import { Inter, JetBrains_Mono } from 'next/font/google';

/**
 * Primary brand font — Inter.
 * next/font downloads the font at build time and serves it from the same origin,
 * eliminating external network round-trips and completely preventing FOIT/FOUT.
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

/**
 * Monospace font used for addresses, code snippets, and numeric data.
 */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});
