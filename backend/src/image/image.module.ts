import { Module } from "@nestjs/common";
import { ImageController } from "./image.controller";
import { GeminiImageService } from "../external/image/gemini-image.service";

@Module({
  controllers: [ImageController],
  providers: [GeminiImageService],
})
export class ImageModule {}
