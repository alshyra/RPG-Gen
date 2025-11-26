import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CombatController } from './combat.controller.js';
import { CombatService } from './combat.service.js';
import { CharacterModule } from '../character/character.module.js';
import { CombatSession, CombatSessionSchema } from '../schemas/combat-session.schema.js';

@Module({
  imports: [
    CharacterModule,
    MongooseModule.forFeature([{ name: CombatSession.name, schema: CombatSessionSchema }]),
  ],
  controllers: [CombatController],
  providers: [CombatService],
  exports: [CombatService],
})
export class CombatModule {}
