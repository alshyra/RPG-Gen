import { Module } from '@nestjs/common';
import { RollsController } from '../controllers/rolls.controller.js';
import { CharacterModule } from './character.module.js';
import { CombatModule } from './combat.module.js';
import { GameInstructionProcessor } from '../domain/chat/game-instruction.processor.js';

@Module({
  imports: [CharacterModule, CombatModule],
  controllers: [RollsController],
  providers: [GameInstructionProcessor],
  exports: [GameInstructionProcessor],
})
export class RollsModule {}
