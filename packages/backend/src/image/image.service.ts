import {
  Injectable, Logger,
} from '@nestjs/common';
import {
  compressImage as compressImageUtil, validateImage as validateImageUtil,
} from './image.util.js';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  /**
   * Compress an image from base64 or buffer
   * Returns compressed image as base64 data URI
   */
  async compressImage(imageData: string | Buffer): Promise<string> {
    try {
      const result = await compressImageUtil(imageData);

      // Log compression details
      let originalSize = 0;
      if (typeof imageData === 'string') {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        originalSize = Buffer.from(base64Data, 'base64').length;
      } else {
        originalSize = imageData.length;
      }

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

  /**
   * Validate that the image data is valid
   */
  async validateImage(imageData: string | Buffer): Promise<boolean> {
    const isValid = await validateImageUtil(imageData);
    if (!isValid) {
      this.logger.error('Image validation failed');
    }
    return isValid;
  }
}
