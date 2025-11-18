import sharp from 'sharp';

const MAX_WIDTH = 512;
const MAX_HEIGHT = 512;
const JPEG_QUALITY = 85;

/**
 * Compress an image from base64 or buffer
 * Returns compressed image as base64 data URI
 */
export async function compressImage(imageData: string | Buffer): Promise<string> {
  let buffer: Buffer;

  // Convert base64 to buffer if needed
  if (typeof imageData === 'string') {
    // Remove data URI prefix if present
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    buffer = imageData;
  }

  // Compress and resize image
  const compressed = await sharp(buffer)
    .resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  // Convert back to base64 data URI
  const base64 = compressed.toString('base64');
  const dataUri = `data:image/jpeg;base64,${base64}`;

  return dataUri;
}

/**
 * Validate that the image data is valid
 */
export async function validateImage(imageData: string | Buffer): Promise<boolean> {
  try {
    let buffer: Buffer;

    if (typeof imageData === 'string') {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = imageData;
    }

    const metadata = await sharp(buffer).metadata();
    return !!(metadata.width && metadata.height);
  } catch {
    return false;
  }
}
