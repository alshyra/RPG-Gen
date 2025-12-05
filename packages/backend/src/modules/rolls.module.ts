import { Module } from '@nestjs/common';
import { RollsController } from '../controllers/rolls.controller.js';
import { ChatModule } from './chat.module.js';

@Module({
  imports: [ChatModule],
  controllers: [RollsController],
})
export class RollsModule {}
