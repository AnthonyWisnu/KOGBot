import sharp from 'sharp';

const hdScaleFactor = 2;
const maxOutputLongSide = 5000;
const jpegQuality = 92;

export type EnhancedImage = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  width?: number;
  height?: number;
};

export async function enhancePhoto(input: Buffer): Promise<EnhancedImage> {
  const image = sharp(input, {
    failOn: 'none',
  }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const target = getTargetSize(width, height);
  const buffer = await image
    .resize({
      width: target.width,
      height: target.height,
      fit: 'inside',
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
    .flatten({
      background: {
        r: 255,
        g: 255,
        b: 255,
      },
    })
    .sharpen({
      sigma: 0.8,
      m1: 0.7,
      m2: 1.4,
    })
    .jpeg({
      quality: jpegQuality,
      mozjpeg: true,
    })
    .toBuffer();

  return {
    buffer,
    filename: 'hd-photo.jpg',
    mimeType: 'image/jpeg',
    width: target.width,
    height: target.height,
  };
}

function getTargetSize(
  width: number,
  height: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return {
      width: maxOutputLongSide,
      height: maxOutputLongSide,
    };
  }

  const scaledWidth = width * hdScaleFactor;
  const scaledHeight = height * hdScaleFactor;
  const longSide = Math.max(scaledWidth, scaledHeight);

  if (longSide <= maxOutputLongSide) {
    return {
      width: scaledWidth,
      height: scaledHeight,
    };
  }

  // Batasi sisi terpanjang agar output tidak terlalu berat untuk WhatsApp dan VPS kecil.
  const ratio = maxOutputLongSide / longSide;

  return {
    width: Math.max(1, Math.round(scaledWidth * ratio)),
    height: Math.max(1, Math.round(scaledHeight * ratio)),
  };
}
