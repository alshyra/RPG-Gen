import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UserDocument } from '../auth/user.schema.js';
import { GameInstructionProcessor } from './game-instruction.processor.js';

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
  @ApiBody({ schema: { type: 'object', properties: { instructions: { type: 'array', items: { type: 'object' } } } } })
  @ApiResponse({ status: 200, description: 'Processed instructions', schema: { type: 'object', properties: { pendingRolls: { type: 'array', items: { type: 'object' } } } } })
  async submitRoll(
    @Req() req: any,
    @Param('characterId') characterId: string,
    @Body() body: { instructions?: any[]; instruction?: any },
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();
    const instructions = Array.isArray(body.instructions)
      ? body.instructions
      : body.instruction
        ? [body.instruction]
        : [];

    const result = await this.instructionProcessor.processInstructions(userId, characterId, instructions);
    return { pendingRolls: result.pendingRolls };
  }
}
