import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CombatController } from './combat.controller.js';
import { CombatService } from './combat.service.js';
import { CharacterModule } from '../character/character.module.js';
import { CombatSession, CombatSessionSchema } from './combat-session.schema.js';
import { ActionRecord, ActionRecordSchema } from './action-record.schema.js';
import { ActionRecordService } from './action-record.service.js';

@Module({
  imports: [
    CharacterModule,
    MongooseModule.forFeature([
      { name: CombatSession.name, schema: CombatSessionSchema },
      { name: ActionRecord.name, schema: ActionRecordSchema },
    ]),
  ],
  controllers: [CombatController],
  providers: [
    CombatService,
    ActionRecordService,
  ],
  exports: [
    CombatService,
    ActionRecordService,
  ],
})
export class CombatModule {}
