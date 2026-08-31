'use client';

import type { ComponentProps } from 'react';
import { useNotebookLayout } from 'fumadocs-ui/layouts/notebook';
import { SiteNavbar } from '@/components/site-navbar';

export function DocsHeader(props: ComponentProps<'header'>) {
  const { navItems, slots, isNavTransparent } = useNotebookLayout();
  const Search = slots.searchTrigger ? slots.searchTrigger.sm : null;
  const Theme = slots.themeSwitch;

  return (
    <SiteNavbar
      {...props}
      variant="docs"
      navItems={navItems}
      data-transparent={isNavTransparent}
      search={
        Search ? (
          <Search hideIfDisabled className="site-nav-icon" />
        ) : null
      }
      themeSwitch={Theme ? <Theme className="site-nav-icon" /> : null}
    />
  );
}
