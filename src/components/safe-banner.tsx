'use client';

import { Banner as FumadocsBanner } from 'fumadocs-ui/components/banner';
import type { ComponentProps } from 'react';

type BannerProps = ComponentProps<typeof FumadocsBanner>;

/**
 * Fumadocs Banner injects a `<script>` when `id` is set (dismiss persistence).
 * React 19 rejects `<script>` inside client components, so MDX must use this wrapper.
 * For dismissable site-wide banners, add Banner to `layout.tsx` via a server boundary
 * or implement dismiss with useState/localStorage here instead of `id`.
 */
export function SafeBanner({
  id: _id,
  changeLayout = false,
  ...props
}: BannerProps) {
  return <FumadocsBanner changeLayout={changeLayout} {...props} />;
}
