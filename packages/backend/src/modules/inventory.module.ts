import { Module } from '@nestjs/common';
import { InventoryController } from '../controllers/inventory.controller.js';
import { ItemOrchestrator } from '../orchestrators/item/index.js';

@Module({
  controllers: [InventoryController],
  providers: [ItemOrchestrator],
  exports: [ItemOrchestrator],
})
export class InventoryModule {}
