import { NextRequest } from 'next/server';
import { cloudinaryService, isCloudinaryConfigured } from '../../../../cloudinary/cloudinaryService';
import { uploadProfileToFirebaseStorage } from '../../../../cloudinary/profileStorage';
import { requireUser } from '../../../../auth/sessionAuth';
import { getAdminFirestore } from '../../../../auth/adminApp';
import { apiSuccess, apiError } from '../../../../shared/errors/apiResponse';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Profile photo upload.
 * 1) Cloudinary (when API secret is valid)
 * 2) Firebase Storage (when bucket exists / billing on)
 * 3) Inline compressed data URL on users/{uid} via Admin (always works)
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return apiError('Unauthorized — sign in to update your photo', 'UPLOAD_401', 401);

  try {
    const body = await req.json();
    const { image } = body as { image?: string };
    if (!image || typeof image !== 'string') {
      return apiError('image (base64/data URL) required', 'UPLOAD_400', 400);
    }
    if (image.length > 8_000_000) {
      return apiError('Image too large — choose a smaller photo', 'UPLOAD_413', 413);
    }

    const uid = user.uid;
    const publicId = `profile_${uid}`;
    const errors: string[] = [];

    if (isCloudinaryConfigured) {
      const result = await cloudinaryService.uploadImage(image, publicId);
      if (result.success && result.secureUrl) {
        await mirrorProfileImage(uid, result.secureUrl);
        return apiSuccess(
          { url: result.secureUrl, publicId: result.publicId, provider: 'cloudinary' },
          'Uploaded'
        );
      }
      errors.push(result.error || 'Cloudinary failed');
    } else {
      errors.push('Cloudinary not configured');
    }

    const fb = await uploadProfileToFirebaseStorage(uid, image);
    if (fb.success && fb.url) {
      await mirrorProfileImage(uid, fb.url);
      return apiSuccess({ url: fb.url, provider: 'firebase' }, 'Uploaded to Firebase Storage');
    }
    if (fb.error) errors.push(fb.error);

    // Last resort: compressed data URL on profile (client compresses to ~512px JPEG)
    if (image.startsWith('data:image/') && image.length <= 700_000) {
      await mirrorProfileImage(uid, image);
      return apiSuccess({ url: image, provider: 'inline' }, 'Photo saved to your profile');
    }

    return apiError(
      `Photo upload failed. ${errors.filter(Boolean).join(' | ') || 'Unknown error'}`,
      'UPLOAD_500',
      500
    );
  } catch (e: any) {
    return apiError(e?.message || 'Upload failed', 'UPLOAD_500', 500);
  }
}

async function mirrorProfileImage(uid: string, profileImage: string) {
  const db = getAdminFirestore();
  if (!db) return;
  await db.collection('users').doc(uid).set(
    { uid, profileImage, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}
