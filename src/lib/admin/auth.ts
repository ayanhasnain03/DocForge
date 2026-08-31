import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'harc_admin_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) {
    throw new Error('ADMIN_SECRET_KEY is not configured');
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function createSessionToken(): string {
  const payload = JSON.stringify({ iat: Date.now() });
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

export function verifySessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const dot = decoded.lastIndexOf('.');
    if (dot === -1) return false;

    const payload = decoded.slice(0, dot);
    const signature = decoded.slice(dot + 1);
    const expected = sign(payload);

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expBuf)) return false;

    const data = JSON.parse(payload) as { iat?: number };
    if (!data.iat || Date.now() - data.iat > SESSION_MAX_AGE_MS) return false;

    return true;
  } catch {
    return false;
  }
}

export function verifyAdminKey(key: string): boolean {
  try {
    const secret = getSecret();
    const keyBuf = Buffer.from(key, 'utf8');
    const secretBuf = Buffer.from(secret, 'utf8');
    if (keyBuf.length !== secretBuf.length) return false;
    return timingSafeEqual(keyBuf, secretBuf);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export function adminCookieOptions(token: string) {
  return {
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  };
}
