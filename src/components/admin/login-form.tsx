'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminLoginForm() {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? 'Login failed');
      return;
    }

    router.push('/admin/edit');
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <label className="admin-label" htmlFor="admin-key">
        Admin key
      </label>
      <input
        id="admin-key"
        className="admin-input"
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="Enter your secret key"
        autoComplete="current-password"
        required
      />
      {error ? <p className="admin-error">{error}</p> : null}
      <button className="admin-btn admin-btn-primary" type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
