import {
  Body, Controller, Param, Post, Req, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import type { RPGRequest } from '../global.types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RollInstructionMessageDto } from '../chat/dto/RollInstructionMessageDto.js';
import { GameInstructionProcessor } from '../chat/game-instruction.processor.js';
import { SubmitRollDto } from './SubmitRollDto.js';

@ApiTags('rolls')
@Controller('rolls')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RollsController {
  constructor(
    private readonly instructionProcessor: GameInstructionProcessor,
  ) {}

  @Post(':characterId')
  @ApiOperation({ summary: 'Submit resolved roll(s) (non-chat) for processing' })
  @ApiBody({ type: SubmitRollDto })
  @ApiResponse({
    status: 200,
    type: [RollInstructionMessageDto],
  })
  async submitRoll(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Body('instructions') instructions: RollInstructionMessageDto[],
  ) {
    const { user } = req;
    const userId = user._id.toString();
    const { pendingRolls } = await this.instructionProcessor.processInstructions(userId, characterId, instructions);
    return pendingRolls;
  }
}
