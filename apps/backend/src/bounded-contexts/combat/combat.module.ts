import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CombatController } from "./api/controllers/CombatController.js";
import { CombatAppService } from "./application/services/CombatAppService.js";
import { EnemyTurnService } from "./domain/services/enemy-turn.service.js";
import { InitService } from "./domain/services/init.service.js";
import { TurnOrderService } from "./domain/services/turn-order.service.js";
import { ActionEconomyService } from "./domain/services/action-economy.service.js";
import { CombatGridService } from "./domain/services/combat-grid.service.js";
import { OpportunityAttackResolver } from "./domain/services/opportunity-attack.service.js";
import { CombatActionService } from "./domain/services/combat-action.service.js";
import { CharacterModule } from "../character/character.module.js";
import { ChatModule } from "../game-narrative/chat.module.js";
import { DiceModule } from "../dice/dice.module.js";
import { AptitudeModule } from "../aptitude/aptitude.module.js";
import { CombatSession, CombatSessionSchema } from "./infrastructure/persistence/mongo/schemas/CombatSession.js";
import { CombatOrchestrator, CombatMovementOrchestrator, CombatActionOrchestrator } from "../../orchestrators/combat/index.js";
import { GeminiTextService } from "../game-narrative/infrastructure/external/index.js";

@Module({
  imports: [
    CharacterModule,
    DiceModule,
    AptitudeModule,
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
    CombatGridService,
    OpportunityAttackResolver,
    CombatActionService,
    GeminiTextService,
    EnemyTurnService,
    // App service facade
    CombatAppService,

    // Orchestrators
    CombatOrchestrator,
    CombatMovementOrchestrator,
    CombatActionOrchestrator,
  ],
  exports: [CombatAppService, CombatOrchestrator, CombatGridService, CombatActionService],
})
export class CombatModule {}
