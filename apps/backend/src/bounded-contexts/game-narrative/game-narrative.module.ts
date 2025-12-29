import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NarrativeController } from './api/controllers/narrative.controller.js';
import { DiceController } from './api/controllers/dice.controller.js';
import { NarrativeAppService } from './application/services/NarrativeAppService.js';
import { GameNarrativeService } from './application/services/GameNarrativeService.js';
import { DiceService } from './domain/dice/DiceService.js';
import { NARRATIVE_REPOSITORY } from './domain/narrative/repositories/INarrativeRepository.js';
import { MongoNarrativeRepository } from './infrastructure/persistence/mongo/repositories/MongoNarrativeRepository.js';
import { NarrativeDocument , NarrativeSchema } from './infrastructure/persistence/mongo/schemas/NarrativeDocument.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NarrativeDocument.name, schema: NarrativeSchema },
    ]),
  ],
  controllers: [NarrativeController, DiceController],
  providers: [
    // Repository bindings (port/adapter pattern)
    {
      provide: NARRATIVE_REPOSITORY,
      useClass: MongoNarrativeRepository,
    },
    // Application services
    NarrativeAppService,
    GameNarrativeService,
    // Dice domain service
    DiceService,
  ],
  exports: [
    NarrativeAppService,
    GameNarrativeService,
    DiceService,
    NARRATIVE_REPOSITORY,
  ],
})
export class GameNarrativeModule {}
