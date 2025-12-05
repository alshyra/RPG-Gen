import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CombatController } from '../controllers/combat.controller.js';
import { CombatAppService } from '../domain/combat/combat.app.service.js';
import { InitService } from '../domain/combat/services/init.service.js';
import { TurnOrderService } from '../domain/combat/services/turn-order.service.js';
import { ActionEconomyService } from '../domain/combat/services/action-economy.service.js';
import { CharacterModule } from './character.module.js';
import { ChatModule } from './chat.module.js';
import { DiceModule } from './dice.module.js';
import {
  CombatSession, CombatSessionSchema,
} from '../infra/mongo/combat-session.schema.js';
import { CombatOrchestrator } from '../orchestrators/combat/index.js';
import { GeminiTextService } from '../infra/external/gemini-text.service.js';

@Module({
  imports: [
    CharacterModule,
    DiceModule,
    forwardRef(() => ChatModule),
    MongooseModule.forFeature([
      {
        name: CombatSession.name,
        schema: CombatSessionSchema,
      },
    ]),
  ],
  controllers: [CombatController],
  providers: [
    // Domain services required by CombatAppService
    InitService,
    TurnOrderService,
    ActionEconomyService,
    GeminiTextService,
    // App service facade
    CombatAppService,

    // Orchestrator
    CombatOrchestrator,
  ],
  exports: [
    CombatAppService,
    CombatOrchestrator,
  ],
})
export class CombatModule {}
