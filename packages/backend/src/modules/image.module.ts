import { Module } from '@nestjs/common';
import { ImageController } from '../controllers/image.controller.js';
import { GeminiImageService } from '../infra/external/gemini-image.service.js';
import { ImageService } from '../domain/image/image.service.js';
import { CharacterModule } from './character.module.js';

@Module({
  imports: [CharacterModule],
  controllers: [ImageController],
  providers: [
    GeminiImageService,
    ImageService,
  ],
  exports: [ImageService],
})
export class ImageModule {}
