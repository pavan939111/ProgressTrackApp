import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'n4elkdtt',
  api_key: process.env.CLOUDINARY_API_KEY || '613419157179926',
  api_secret: process.env.CLOUDINARY_API_SECRET || '5BwgAR5U7INeP54_5JDu1yNAFRk',
  secure: true,
});

export const cloudinaryService = {
  async uploadImage(fileUrlOrBase64: string, publicId?: string) {
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
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
      secure: true,
    });
  },

  getSquareCropUrl(publicId: string, size = 300): string {
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
