import { Module } from '@nestjs/common';
import { DiceController } from '../controllers/dice.controller.js';
import { DiceService } from '../domain/dice/dice.service.js';

@Module({
  controllers: [DiceController],
  providers: [DiceService],
  exports: [DiceService],
})
export class DiceModule {}
