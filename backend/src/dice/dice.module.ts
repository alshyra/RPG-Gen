import { Module } from '@nestjs/common';
import { DiceController } from './dice.controller';

@Module({
  controllers: [DiceController]
})
export class DiceModule {}
