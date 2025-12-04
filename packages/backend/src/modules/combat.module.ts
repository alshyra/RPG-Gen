import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CombatController } from '../controllers/combat.controller.js';
import { CombatAppService } from '../domain/combat/combat.app.service.js';
import { CharacterModule } from './character.module.js';
import { DiceModule } from './dice.module.js';
import {
  CombatSession, CombatSessionSchema,
} from '../infra/mongo/combat-session.schema.js';
import { CombatOrchestrator } from '../orchestrators/combat/index.js';

@Module({
  imports: [
    CharacterModule,
    DiceModule,
    MongooseModule.forFeature([
      {
        name: CombatSession.name,
        schema: CombatSessionSchema,
      },
    ]),
  ],
  controllers: [CombatController],
  providers: [
    CombatAppService,

    CombatOrchestrator,
  ],
  exports: [
    CombatAppService,

    CombatOrchestrator,
  ],
})
export class CombatModule {}
