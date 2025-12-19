import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CombatController } from "../controllers/combat.controller.js";
import { CombatAppService } from "../domain/combat/combat.app.service.js";
import { EnemyTurnService } from "../domain/combat/enemy-turn.service.js";
import { InitService } from "../domain/combat/services/init.service.js";
import { TurnOrderService } from "../domain/combat/services/turn-order.service.js";
import { ActionEconomyService } from "../domain/combat/services/action-economy.service.js";
import { CombatGridService } from "../domain/combat/services/combat-grid.service.js";
import { OpportunityAttackResolver } from "../domain/combat/services/opportunity-attack.service.js";
import { CombatActionService } from "../domain/combat/services/combat-action.service.js";
import { CharacterModule } from "./character.module.js";
import { ChatModule } from "./chat.module.js";
import { DiceModule } from "./dice.module.js";
import { AptitudeModule } from "../domain/aptitude/aptitude.module.js";
import { CombatSession, CombatSessionSchema } from "../infra/mongo/combat/CombatSession.js";
import { CombatOrchestrator } from "../orchestrators/combat/index.js";
import { CombatMovementOrchestrator } from "../orchestrators/combat/combat-movement.orchestrator.js";
import { CombatActionOrchestrator } from "../orchestrators/combat/combat-action.orchestrator.js";
import { GeminiTextService } from "../infra/external/gemini-text.service.js";

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
