import { Module } from '@nestjs/common';
import { RollsController } from './rolls.controller.js';

@Module({
  controllers: [RollsController],
})
export class RollsModule {}
