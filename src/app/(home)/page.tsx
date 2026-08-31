import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing-page';
import { appName } from '@/lib/shared';

export const metadata: Metadata = {
  title: `${appName} Documentation`,
  description:
    'Hierarchical documentation for Harc models, SDKs, and APIs — powered by Fumadocs.',
};

export default function HomePage() {
  return <LandingPage />;
}
