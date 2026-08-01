'use client';

/** Compress/resize an image file to a JPEG data URL suitable for upload. */
export async function compressImageForUpload(
  file: File,
  opts?: { maxSide?: number; quality?: number }
): Promise<string> {
  const maxSide = opts?.maxSide ?? 512;
  const quality = opts?.quality ?? 0.82;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas not supported');
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  // Guard against huge payloads (Vercel ~4.5MB body)
  if (dataUrl.length > 3_500_000) {
    return canvas.toDataURL('image/jpeg', 0.65);
  }
  return dataUrl;
}
