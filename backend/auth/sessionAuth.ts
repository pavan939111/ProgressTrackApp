import { NextRequest } from 'next/server';
import { ensureFirebaseAdmin } from './adminApp';

type Decoded = { uid: string; email?: string; name?: string };

export { toProfile } from './toProfile';

async function verifyWithAdmin(token: string): Promise<Decoded | null> {
  if (!ensureFirebaseAdmin()) return null;
  try {
    // Lazy import — avoids loading jwks-rsa/jose during email login cold starts
    const { getAuth } = await import('firebase-admin/auth');
    const decoded = await getAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email, name: decoded.name };
  } catch (e: any) {
    // jose/jwks-rsa ESM mismatch on some serverless runtimes
    if (String(e?.code || e?.message || '').includes('ERR_REQUIRE_ESM') || String(e?.message || '').includes('ES Module')) {
      return null;
    }
    return null;
  }
}

/** Verify Bearer Firebase ID token. Falls back to Identity Toolkit lookup if Admin missing. */
export async function requireUser(req: NextRequest): Promise<Decoded | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  const viaAdmin = await verifyWithAdmin(token);
  if (viaAdmin) return viaAdmin;

  // Fallback without Admin SDK (also covers jose ESM failures on Vercel)
  try {
    const { lookupAccount } = await import('./firebaseAuthRest');
    const user = await lookupAccount(token);
    return { uid: user.localId, email: user.email, name: user.displayName };
  } catch {
    return null;
  }
}
