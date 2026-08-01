import { v2 as cloudinary } from 'cloudinary';

function configureFromEnv() {
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    // cloudinary SDK reads CLOUDINARY_URL when config() called with no overrides
    cloudinary.config(true);
    return Boolean(cloudinary.config().cloud_name && cloudinary.config().api_key && cloudinary.config().api_secret);
  }
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '';
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }
  return false;
}

export const isCloudinaryConfigured = configureFromEnv();

export const cloudinaryService = {
  async uploadImage(fileUrlOrBase64: string, publicId?: string) {
    if (!isCloudinaryConfigured && !configureFromEnv()) {
      return {
        success: false,
        error: 'Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_* env vars.',
      };
    }
    try {
      const uploadResult = await cloudinary.uploader.upload(fileUrlOrBase64, {
        public_id: publicId || undefined,
        folder: 'pta_app_uploads',
        overwrite: true,
        invalidate: true,
        resource_type: 'image',
        transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'auto', quality: 'auto' }],
      });
      return {
        success: true,
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
      };
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      const msg = error?.message || error?.error?.message || 'Image upload failed';
      const hint =
        /signature|api_secret mismatch|401/i.test(String(msg))
          ? ' Cloudinary API secret is invalid — create a new API key in Cloudinary Dashboard and update CLOUDINARY_API_SECRET / CLOUDINARY_URL on Vercel.'
          : '';
      return {
        success: false,
        error: `${msg}${hint}`,
      };
    }
  },

  getOptimizedUrl(publicId: string): string {
    if (!isCloudinaryConfigured) return '';
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
      secure: true,
    });
  },

  getSquareCropUrl(publicId: string, size = 300): string {
    if (!isCloudinaryConfigured) return '';
    return cloudinary.url(publicId, {
      crop: 'auto',
      gravity: 'auto',
      width: size,
      height: size,
      fetch_format: 'auto',
      quality: 'auto',
      secure: true,
    });
  },
};
