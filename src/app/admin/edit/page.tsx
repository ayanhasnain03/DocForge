import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import { AdminShell } from '@/components/admin/admin-shell';

export default async function AdminEditPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  return <AdminShell />;
}
