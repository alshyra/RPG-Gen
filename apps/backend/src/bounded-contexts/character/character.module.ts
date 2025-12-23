import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharacterController } from './api/controllers/CharacterController.js';
import { CharacterAppService } from './application/services/CharacterAppService.js';
import { ICharacterRepository } from './domain/repositories/ICharacterRepository.js';
import { MongoCharacterRepository } from './infrastructure/persistence/mongo/repositories/MongoCharacterRepository.js';
import { CharacterSchema } from './infrastructure/persistence/mongo/schemas/CharacterDocument.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Character', schema: CharacterSchema }
    ]),
  ],
  controllers: [CharacterController],
  providers: [
    CharacterAppService,
    {
      provide: ICharacterRepository,
      useClass: MongoCharacterRepository,
    },
  ],
  exports: [CharacterAppService],
})
export class CharacterModule {}