import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharacterController } from './api/controllers/CharacterController.js';
import { CharacterAvatarController } from './api/controllers/CharacterAvatarController.js';
import { CharacterInventoryController } from './api/controllers/CharacterInventoryController.js';
import { CharacterInspirationController } from './api/controllers/CharacterInspirationController.js';
import { CharacterAppService } from './application/services/CharacterAppService.js';
import { ICharacterRepository } from './domain/repositories/ICharacterRepository.js';
import { MongoCharacterRepository } from './infrastructure/persistence/mongo/repositories/MongoCharacterRepository.js';
import { CharacterDocument, CharacterSchema } from './infrastructure/persistence/mongo/schemas/CharacterDocument.js';
import { GeminiImageService } from './infrastructure/external/GeminiImageService.js';
import { ImageService } from './domain/services/ImageService.js';
import { CharacterDtoMapper } from './api/dto/mappers/CharacterDtoMapper.js';
import { GameDataModule } from '../game-data/game-data.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CharacterDocument.name, schema: CharacterSchema }
    ]),
    forwardRef(() => GameDataModule),
  ],
  controllers: [
    CharacterController,
    CharacterAvatarController,
    CharacterInventoryController,
    CharacterInspirationController,
  ],
  providers: [
    CharacterAppService,
    CharacterDtoMapper,
    GeminiImageService,
    ImageService,
    {
      provide: ICharacterRepository,
      useClass: MongoCharacterRepository,
    },
  ],
  exports: [CharacterAppService, ImageService, CharacterDtoMapper],
})
export class CharacterModule {}