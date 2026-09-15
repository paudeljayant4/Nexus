import * as jose from 'jose';
import bcrypt from 'bcryptjs';
import { User } from '@nexus/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
);

const JWT_ISSUER = 'nexus';
const JWT_AUDIENCE = 'nexus-app';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: { id: string; email: string; name: string }): Promise<string> {
  return new jose.SignJWT({ sub: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ sub: string; email: string; name: string } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as { sub: string; email: string; name: string };
  } catch {
    return null;
  }
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export async function getUserFromRequest(request: Request): Promise<{ userId: string; email: string; name: string } | null> {
  const authHeader = request.headers.get('authorization');
  const token = getTokenFromHeader(authHeader);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return { userId: payload.sub, email: payload.email, name: payload.name };
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return Response.json({ data: null, error: { code: 'UNAUTHORIZED', message } }, { status: 401 });
}
