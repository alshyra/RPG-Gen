import { Injectable, Logger } from '@nestjs/common';
import { compressImage as compressImageUtil, validateImage as validateImageUtil } from './image.util';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  exractOriginalSize(imageData: string | Buffer): number {
    if (typeof imageData !== 'string') return imageData.length;

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64').length;
  }

  /**
   * Compress an image from base64 or buffer
   * Returns compressed image as base64 data URI
   */
  async compressImage(imageData: string | Buffer): Promise<string> {
    try {
      const result = await compressImageUtil(imageData);
      const originalSize = this.exractOriginalSize(imageData);
      const compressedSize = Buffer.from(result.replace(/^data:image\/\w+;base64,/, ''), 'base64').length;
      this.logger.debug(
        `Image compressed: ${originalSize} bytes -> ${compressedSize} bytes`,
      );

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Image compression failed:', message);
      throw new Error(`Failed to compress image: ${message}`);
    }
  }
}
