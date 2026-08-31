import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import { AdminLoginForm } from '@/components/admin/login-form';

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect('/admin/edit');

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <p className="admin-kicker">Harc docs</p>
        <h1>Admin</h1>
        <p className="admin-muted">Sign in with your admin key to edit MDX content.</p>
        <AdminLoginForm />
      </div>
    </div>
  );
}
