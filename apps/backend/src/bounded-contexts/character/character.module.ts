import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharacterController } from './api/controllers/CharacterController.js';
import { CharacterAvatarController } from './api/controllers/CharacterAvatarController.js';
import { CharacterAppService } from './application/services/CharacterAppService.js';
import { ICharacterRepository } from './domain/repositories/ICharacterRepository.js';
import { MongoCharacterRepository } from './infrastructure/persistence/mongo/repositories/MongoCharacterRepository.js';
import { CharacterSchema } from './infrastructure/persistence/mongo/schemas/CharacterDocument.js';
import { GeminiImageService } from './infrastructure/external/GeminiImageService.js';
import { ImageService } from './domain/services/ImageService.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Character', schema: CharacterSchema }
    ]),
  ],
  controllers: [CharacterController, CharacterAvatarController],
  providers: [
    CharacterAppService,
    GeminiImageService,
    ImageService,
    {
      provide: ICharacterRepository,
      useClass: MongoCharacterRepository,
    },
  ],
  exports: [CharacterAppService, ImageService],
})
export class CharacterModule {}