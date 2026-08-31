'use client';

import type { ComponentProps } from 'react';
import { useHomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteNavbar } from '@/components/site-navbar';

export function HomeHeader(props: ComponentProps<'header'>) {
  const { navItems, slots } = useHomeLayout();
  const Search = slots.searchTrigger ? slots.searchTrigger.sm : null;
  const Theme = slots.themeSwitch;

  return (
    <SiteNavbar
      {...props}
      variant="home"
      navItems={navItems}
      search={
        Search ? (
          <Search hideIfDisabled className="site-nav-icon" />
        ) : null
      }
      themeSwitch={Theme ? <Theme className="site-nav-icon" /> : null}
    />
  );
}
