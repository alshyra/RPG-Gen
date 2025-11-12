import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { GeminiService } from '../external/gemini.service';

@Module({
  controllers: [ImageController],
  providers: [GeminiService],
})
export class ImageModule {}
