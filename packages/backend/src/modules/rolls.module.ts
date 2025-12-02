import { Module } from '@nestjs/common';
import { RollsController } from '../controllers/rolls.controller.js';

@Module({
  controllers: [RollsController],
})
export class RollsModule {}
