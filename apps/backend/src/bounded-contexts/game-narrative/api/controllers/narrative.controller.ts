import { Body, Controller, Get, Logger, Param, Post, Req, UseGuards, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/auth/guards/JwtAuthGuard.js';
import { GameNarrativeService } from '../../application/services/GameNarrativeService.js';
import { NarrativeResponseMapper, ConversationResponseDto } from '../dto/index.js';
import { ChatMessageRequestDto } from '../dto/request/index.js';
import type { RPGRequest } from '../../../../global.types.js';

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
  ): Promise<any[]> {
    const userId = req.user._id.toString();
    const messages = await this.narrativeService.getNarrativeHistory(userId, characterId);
    return messages.map(msg => ({
      role: msg.role,
      narrative: msg.narrative,
      timestamp: msg.timestamp,
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
