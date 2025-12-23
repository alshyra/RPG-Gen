import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NarrativeController } from './api/controllers/narrative.controller.js';
import { NarrativeAppService } from './application/services/NarrativeAppService.js';
import { GameNarrativeService } from './application/services/GameNarrativeService.js';
import { NARRATIVE_REPOSITORY } from './domain/narrative/repositories/INarrativeRepository.js';
import { MongoNarrativeRepository } from './infrastructure/persistence/mongo/repositories/MongoNarrativeRepository.js';
import { NarrativeDocument , NarrativeSchema } from './infrastructure/persistence/mongo/schemas/NarrativeDocument.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NarrativeDocument.name, schema: NarrativeSchema },
    ]),
  ],
  controllers: [NarrativeController],
  providers: [
    // Repository bindings (port/adapter pattern)
    {
      provide: NARRATIVE_REPOSITORY,
      useClass: MongoNarrativeRepository,
    },
    // Application services
    NarrativeAppService,
    GameNarrativeService,
  ],
  exports: [
    NarrativeAppService,
    GameNarrativeService,
    NARRATIVE_REPOSITORY,
  ],
})
export class GameNarrativeModule {}
