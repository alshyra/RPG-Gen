import { Module } from '@nestjs/common';
import { DiceController } from './dice.controller.js';

@Module({
  controllers: [DiceController],
})
export class DiceModule {}
