import { appName } from '@/lib/shared';

export function SiteNavTitle() {
  return (
    <span className="text-sm font-normal tracking-normal text-[var(--harc-ink)]">
      {appName}
    </span>
  );
}
