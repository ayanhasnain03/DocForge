import { NextResponse } from 'next/server';
import {
  adminCookieOptions,
  createSessionToken,
  verifyAdminKey,
} from '@/lib/admin/auth';

export async function POST(request: Request) {
  try {
    const { key } = (await request.json()) as { key?: string };
    if (!key || !verifyAdminKey(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
    }

    const token = createSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminCookieOptions(token));
    return response;
  } catch {
    return NextResponse.json(
      { error: 'Admin is not configured. Set ADMIN_SECRET_KEY.' },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: adminCookieOptions('').name,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
