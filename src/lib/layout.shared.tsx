import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { SiteNavTitle } from '@/components/site-nav-title';
import { gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <SiteNavTitle />,
    },
    themeSwitch: {
      enabled: false,
    },
    links: [
      {
        text: 'API',
        url: '/api',
        active: 'nested-url',
      },
      {
        text: 'SDK',
        url: '/sdk',
        active: 'nested-url',
      },
      {
        text: 'OWM',
        url: '/owm',
        active: 'nested-url',
      },
      {
        text: 'Research',
        url: '/research',
        active: 'nested-url',
      },
      {
        text: 'Legal',
        url: '/legal',
        active: 'nested-url',
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
