'use client';

import { ToastProvider } from '@/components/admin/toast';

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
