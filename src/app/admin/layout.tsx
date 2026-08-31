import type { Metadata } from 'next';
import { AdminProviders } from '@/components/admin/providers';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="admin-root">
      <AdminProviders>{children}</AdminProviders>
    </div>
  );
}
