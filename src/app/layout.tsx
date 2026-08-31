import { RootProvider } from 'fumadocs-ui/provider/next';
import { Geist_Mono, Inter } from 'next/font/google';
import './global.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400'],
  display: 'swap',
});

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400'],
  display: 'swap',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`dark ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-[#0a0a0a] text-white antialiased">
        <RootProvider
          theme={{ forcedTheme: 'dark', enableSystem: false, hotKey: false }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
