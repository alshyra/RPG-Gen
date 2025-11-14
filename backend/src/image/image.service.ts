import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly MAX_WIDTH = 512;
  private readonly MAX_HEIGHT = 512;
  private readonly JPEG_QUALITY = 85;

  /**
   * Compress an image from base64 or buffer
   * Returns compressed image as base64 data URI
   */
  async compressImage(imageData: string | Buffer): Promise<string> {
    try {
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
        .resize(this.MAX_WIDTH, this.MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: this.JPEG_QUALITY })
        .toBuffer();

      // Convert back to base64 data URI
      const base64 = compressed.toString('base64');
      const dataUri = `data:image/jpeg;base64,${base64}`;

      this.logger.debug(
        `Image compressed: ${buffer.length} bytes -> ${compressed.length} bytes`
      );

      return dataUri;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Image compression failed:', message);
      throw new Error(`Failed to compress image: ${message}`);
    }
  }

  /**
   * Validate that the image data is valid
   */
  async validateImage(imageData: string | Buffer): Promise<boolean> {
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
    } catch (error) {
      this.logger.error('Image validation failed:', error);
      return false;
    }
  }
}
