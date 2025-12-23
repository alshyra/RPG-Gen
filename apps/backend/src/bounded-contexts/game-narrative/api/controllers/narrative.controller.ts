import { Controller, Delete, Get, Logger, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { RPGRequest } from '../../../../global.types.js';
import { JwtAuthGuard } from '../../../auth/infrastructure/auth/guards/JwtAuthGuard.js';
import { GameNarrativeService } from '../../application/services/GameNarrativeService.js';
import { ConversationResponseDto, NarrativeResponseMapper } from '../dto/index.js';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NarrativeController {
  private readonly logger = new Logger(NarrativeController.name);

  constructor(private readonly narrativeService: GameNarrativeService) {}

  @Get(':characterId/history')
  @ApiOperation({ summary: 'Get narrative history with a character' })
  @ApiResponse({
    status: 200,
    description: 'Narrative history',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Narrative not found' })
  async getNarrativeHistory(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<ConversationResponseDto> {
    const userId = req.user._id.toString();
    const messages = await this.narrativeService.getNarrativeHistory(userId, characterId);
    return new ConversationResponseDto({
      userId,
      characterId,
      sessionId: `${userId}_${characterId}`,
      messages: NarrativeResponseMapper.messagesToDtos(messages),
    });
  }

  @Get(':characterId/messages')
  @ApiOperation({ summary: 'Get recent messages from narrative' })
  @ApiResponse({
    status: 200,
    description: 'List of recent messages',
    type: [Object],
  })
  async getRecentMessages(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<Array<{ role: string; narrative: string; timestamp: Date; instructions: ReadonlyArray<import('../dto/response/GameInstructionDto.js').GameInstructionDto> }>> {
    const userId = req.user._id.toString();
    const messages = await this.narrativeService.getNarrativeHistory(userId, characterId);
    return messages.map(msg => ({
      role: msg.role,
      narrative: msg.narrative,
      timestamp: msg.timestamp,
      instructions: msg.instructions,
    }));
  }

  @Delete(':characterId/history')
  @ApiOperation({ summary: 'Clear narrative history' })
  @ApiResponse({ status: 204, description: 'Narrative cleared' })
  async clearNarrative(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<void> {
    const userId = req.user._id.toString();
    await this.narrativeService.clearNarrative(userId, characterId);
  }

  // NOTE: The chat message endpoint (POST :characterId) should use the ChatOrchestrator
  // which integrates with GeminiTextService for AI narrative generation
}
