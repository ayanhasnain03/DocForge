'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { cn } from '@/lib/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => setTheme(next));
      });
    } else {
      setTheme(next);
    }
  };

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      data-theme-toggle=""
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-[6px] text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground',
        className,
      )}
      onClick={toggle}
    >
      {isDark ? (
        <Sun className="size-4" fill="currentColor" />
      ) : (
        <Moon className="size-4" fill="currentColor" />
      )}
    </button>
  );
}
