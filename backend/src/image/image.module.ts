import { Module } from "@nestjs/common";
import { ImageController } from "./image.controller";
import { GeminiImageService } from "../external/image/gemini-image.service";
import { ImageService } from "./image.service";
import { CharacterModule } from "../character/character.module";

@Module({
  imports: [CharacterModule],
  controllers: [ImageController],
  providers: [GeminiImageService, ImageService],
  exports: [ImageService],
})
export class ImageModule {}
