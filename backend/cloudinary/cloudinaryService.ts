import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const cloudinaryService = {
  async uploadImage(fileUrlOrBase64: string, publicId?: string) {
    if (!isCloudinaryConfigured) {
      return {
        success: false,
        error: 'Cloudinary is not configured. Set CLOUDINARY_* in .env.local.',
      };
    }
    try {
      const uploadResult = await cloudinary.uploader.upload(fileUrlOrBase64, {
        public_id: publicId || `pta_${Date.now()}`,
        folder: 'pta_app_uploads',
      });
      return {
        success: true,
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
      };
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message || 'Image upload failed',
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
