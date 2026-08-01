import { randomUUID } from 'crypto';
import { getStorage } from 'firebase-admin/storage';
import { ensureFirebaseAdmin, getFirebaseAdminApp } from '../auth/adminApp';

function parseDataUrl(input: string): { buffer: Buffer; contentType: string } | null {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(input.trim());
  if (m) {
    return { contentType: m[1] || 'image/jpeg', buffer: Buffer.from(m[2], 'base64') };
  }
  // raw base64
  if (/^[A-Za-z0-9+/=\s]+$/.test(input.slice(0, 80))) {
    try {
      return { contentType: 'image/jpeg', buffer: Buffer.from(input, 'base64') };
    } catch {
      return null;
    }
  }
  return null;
}

function extFor(contentType: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}

/**
 * Upload profile image to Firebase Storage (works when Cloudinary secret is wrong/missing).
 */
export async function uploadProfileToFirebaseStorage(
  uid: string,
  imageDataUrlOrBase64: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!ensureFirebaseAdmin() || !getFirebaseAdminApp()) {
    return { success: false, error: 'Firebase Admin not configured' };
  }

  const parsed = parseDataUrl(imageDataUrlOrBase64);
  if (!parsed || parsed.buffer.length < 32) {
    return { success: false, error: 'Invalid image data' };
  }
  if (parsed.buffer.length > 5 * 1024 * 1024) {
    return { success: false, error: 'Image too large (max 5MB after compress)' };
  }

  const bucketName =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    '';
  if (!bucketName) {
    return {
      success: false,
      error: 'FIREBASE storage bucket not set (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)',
    };
  }

  try {
    const bucket = getStorage().bucket(bucketName);
    const token = randomUUID();
    const ext = extFor(parsed.contentType);
    const objectPath = `profiles/${uid}/avatar.${ext}`;
    const file = bucket.file(objectPath);

    await file.save(parsed.buffer, {
      resumable: false,
      metadata: {
        contentType: parsed.contentType,
        cacheControl: 'public,max-age=86400',
        metadata: {
          firebaseStorageDownloadTokens: token,
          ownerUid: uid,
        },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      objectPath
    )}?alt=media&token=${token}`;

    return { success: true, url };
  } catch (e: any) {
    console.error('Firebase Storage upload error:', e);
    return {
      success: false,
      error: e?.message || 'Firebase Storage upload failed',
    };
  }
}
