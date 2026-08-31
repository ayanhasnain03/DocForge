'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';
import { isLinkItemActive, type LinkItemType } from 'fumadocs-ui/layouts/shared';
import { cn } from '@/lib/cn';
import { SiteNavTitle } from '@/components/site-nav-title';

type SiteNavbarProps = ComponentProps<'header'> & {
  variant: 'home' | 'docs';
  navItems: LinkItemType[];
  search?: ReactNode;
  themeSwitch?: ReactNode;
};

function isSectionLink(
  item: LinkItemType,
): item is Extract<LinkItemType, { url: string; text: ReactNode }> {
  return (
    (item.type === 'main' || item.type === undefined) &&
    'url' in item &&
    typeof item.url === 'string'
  );
}

function isIconLink(
  item: LinkItemType,
): item is Extract<LinkItemType, { type: 'icon'; url: string }> {
  return item.type === 'icon';
}

export function SiteNavbar({
  variant,
  navItems,
  search,
  themeSwitch,
  className,
  ...props
}: SiteNavbarProps) {
  const pathname = usePathname();
  const sections = navItems.filter(isSectionLink);
  const icons = navItems.filter(isIconLink);

  return (
    <header
      id={variant === 'docs' ? 'nd-subnav' : 'nd-nav'}
      className={cn('site-nav', variant === 'docs' && 'site-nav-docs', className)}
      {...props}
    >
      <div className="site-nav-bar">
        <Link href="/" className="site-nav-brand">
          <SiteNavTitle />
        </Link>

        <nav className="site-nav-links" aria-label="Sections">
          {sections.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              data-active={isLinkItemActive(item, pathname)}
              className="site-nav-link"
            >
              {item.text}
            </Link>
          ))}
        </nav>

        <div className="site-nav-tools">
          {search}
          {icons.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noreferrer noopener' : undefined}
              aria-label={item.label}
              className="site-nav-icon"
            >
              {item.icon}
            </Link>
          ))}
          {themeSwitch}
        </div>
      </div>
    </header>
  );
}
