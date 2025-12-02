import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CombatController } from '../controllers/combat.controller.js';
import { CombatService } from '../domain/combat/combat.service.js';
import { CharacterModule } from './character.module.js';
import { DiceModule } from './dice.module.js';
import {
  CombatSession, CombatSessionSchema,
} from '../infra/mongo/combat-session.schema.js';
import {
  ActionRecord, ActionRecordSchema,
} from '../infra/mongo/action-record.schema.js';
import { ActionRecordService } from '../domain/combat/action-record.service.js';
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
      {
        name: ActionRecord.name,
        schema: ActionRecordSchema,
      },
    ]),
  ],
  controllers: [CombatController],
  providers: [
    CombatService,
    ActionRecordService,
    CombatOrchestrator,
  ],
  exports: [
    CombatService,
    ActionRecordService,
    CombatOrchestrator,
  ],
})
export class CombatModule {}
