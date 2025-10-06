import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const secret = process.env.NEXTAUTH_SECRET!;

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  userId: string;
  isPaid: boolean;
  isTrialUsed: boolean;
  freeMcqUsed: number;
  maxFreeMcq: number;
  testsCreated: number;
  maxFreeTests: number;
  iat: number;
  exp: number;
}

export async function verifyJWTFromCookie(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('next-auth.session-token')?.value || 
                  cookieStore.get('__Secure-next-auth.session-token')?.value;
    
    if (!token) {
      return null;
    }

    const payload = jwt.verify(token, secret) as JWTPayload;
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function requireAuth(): Promise<JWTPayload> {
  const payload = await verifyJWTFromCookie();
  if (!payload) {
    throw new Error('Unauthorized');
  }
  return payload;
}

