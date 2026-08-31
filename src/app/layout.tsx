import { RootProvider } from 'fumadocs-ui/provider/next';
import { Geist_Mono, Instrument_Sans, Newsreader, Geist } from 'next/font/google';
import './global.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const serif = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
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
      className={cn("dark", serif.variable, mono.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-[var(--harc-canvas)] text-[var(--harc-ink)] antialiased">
        <RootProvider
          theme={{ forcedTheme: 'dark', enableSystem: false, hotKey: false }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
