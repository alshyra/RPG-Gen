import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NarrativeController } from './api/controllers/narrative.controller.js';
import { DiceController } from './api/controllers/dice.controller.js';
import { NarrativeAppService } from './application/services/NarrativeAppService.js';
import { ConversationService } from './application/services/ConversationService.js';
import { NarrativeStartupService } from './application/services/NarrativeStartupService.js';
import { DiceService } from './domain/dice/DiceService.js';
import { NARRATIVE_REPOSITORY } from './domain/narrative/repositories/INarrativeRepository.js';
import { MongoNarrativeRepository } from './infrastructure/persistence/mongo/repositories/MongoNarrativeRepository.js';
import { NarrativeDocument , NarrativeSchema } from './infrastructure/persistence/mongo/schemas/NarrativeDocument.js';
import { GeminiTextService } from './infrastructure/external/index.js';
import { CharacterModule } from '../character/character.module.js';
import { CombatModule } from '../combat/combat.module.js';

@Module({
  imports: [
    CharacterModule,
    forwardRef(() => CombatModule),
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
    ConversationService,
    NarrativeStartupService,
    // External services
    GeminiTextService,
    // Dice domain service
    DiceService,
  ],
  exports: [
    NarrativeAppService,
    ConversationService,
    NarrativeStartupService,
    GeminiTextService,
    DiceService,
    NARRATIVE_REPOSITORY,
  ],
})
export class GameNarrativeModule {}
