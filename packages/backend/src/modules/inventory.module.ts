// ...existing code...
import { Module } from '@nestjs/common';
import { InventoryController } from '../controllers/inventory.controller.js';
import { ItemOrchestrator } from '../orchestrators/item/index.js';
import { CharacterModule } from './character.module.js';
import { CombatModule } from './combat.module.js';
import { DiceModule } from './dice.module.js';

@Module({
  imports: [CharacterModule, CombatModule, DiceModule],
  controllers: [InventoryController],
  providers: [ItemOrchestrator],
  exports: [ItemOrchestrator],
})
export class InventoryModule {}
