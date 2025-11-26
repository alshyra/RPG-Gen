import { Module } from '@nestjs/common';
import { CombatController } from './combat.controller.js';
import { CombatService } from './combat.service.js';
import { CharacterModule } from '../character/character.module.js';

@Module({
  imports: [CharacterModule],
  controllers: [CombatController],
  providers: [CombatService],
  exports: [CombatService],
})
export class CombatModule {}
