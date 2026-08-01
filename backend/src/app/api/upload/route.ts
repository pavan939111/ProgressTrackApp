import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryService, isCloudinaryConfigured } from '../../../../cloudinary/cloudinaryService';

export async function POST(req: NextRequest) {
  try {
    if (!isCloudinaryConfigured) {
      return NextResponse.json(
        { success: false, message: 'Cloudinary not configured' },
        { status: 503 }
      );
    }
    const body = await req.json();
    const { image, uid, folder } = body as { image?: string; uid?: string; folder?: string };
    if (!image) {
      return NextResponse.json({ success: false, message: 'image (base64/data URL) required' }, { status: 400 });
    }
    const publicId = uid ? `profile_${uid}` : undefined;
    const result = await cloudinaryService.uploadImage(image, publicId);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      data: {
        url: result.secureUrl,
        publicId: result.publicId,
        folder: folder || 'pta_app_uploads',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message || 'Upload failed' }, { status: 500 });
  }
}
