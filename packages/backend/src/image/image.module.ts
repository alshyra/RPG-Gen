import { Module } from '@nestjs/common';
import { ImageController } from './image.controller.js';
import { GeminiImageService } from '../external/image/gemini-image.service.js';
import { ImageService } from './image.service.js';
import { CharacterModule } from '../character/character.module.js';

@Module({
  imports: [CharacterModule],
  controllers: [ImageController],
  providers: [GeminiImageService, ImageService],
  exports: [ImageService],
})
export class ImageModule {}
