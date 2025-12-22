import { Module } from "@nestjs/common";
import { ImageController } from "./api/controllers/ImageController.js";
import { GeminiImageService } from "./infrastructure/external/GeminiImageService.js";
import { ImageService } from "./domain/services/ImageService.js";
import { CharacterModule } from "../character/character.module.js";

@Module({
  imports: [CharacterModule],
  controllers: [ImageController],
  providers: [GeminiImageService, ImageService],
  exports: [ImageService],
})
export class ImageModule {}
