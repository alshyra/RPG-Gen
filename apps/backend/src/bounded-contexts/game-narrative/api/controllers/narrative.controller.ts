import { Body, Controller, Delete, Get, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { RPGRequest } from '../../../../global.types.js';
import { JwtAuthGuard } from '../../../auth/infrastructure/auth/guards/JwtAuthGuard.js';
import { GameNarrativeService } from '../../application/services/GameNarrativeService.js';
import { ConversationService } from '../../application/services/ConversationService.js';
import { GeminiTextService } from '../../infrastructure/external/index.js';
import { ConversationResponseDto, NarrativeResponseDto, NarrativeResponseMapper } from '../dto/index.js';
import { ChatMessageRequestDto } from '../dto/request/ChatMessageRequest.js';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NarrativeController {
  private readonly logger = new Logger(NarrativeController.name);

  constructor(
    private readonly narrativeService: GameNarrativeService,
    private readonly conversationService: ConversationService,
    private readonly geminiTextService: GeminiTextService,
  ) {}

  @Post(':characterId')
  @ApiOperation({ summary: 'Send a chat message and get AI response' })
  @ApiBody({ type: ChatMessageRequestDto })
  @ApiResponse({
    status: 201,
    description: 'AI response with narrative and instructions',
    type: NarrativeResponseDto,
  })
  async sendMessage(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Body() body: ChatMessageRequestDto,
  ): Promise<NarrativeResponseDto> {
    const userId = req.user.id;
    
    // Save user message to history
    await this.conversationService.append(userId, characterId, {
      role: 'user',
      narrative: body.message,
      instructions: [],
    });
    
    // Get AI response
    const parsed = await this.geminiTextService.sendMessage(characterId, body.message);
    
    // Save assistant reply to history
    await this.conversationService.append(userId, characterId, {
      role: 'assistant',
      narrative: parsed.narrative || '',
      instructions: parsed.instructions || [],
    });
    
    return new NarrativeResponseDto({
      narrative: parsed.narrative || '',
      instructions: parsed.instructions || [],
    });
  }

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
    const userId = req.user.id;
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
    type: [NarrativeResponseDto],
  })
  async getRecentMessages(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<NarrativeResponseDto[]> {
    const userId = req.user.id;
    const messages = await this.narrativeService.getNarrativeHistory(userId, characterId);
    return messages.map(msg => new NarrativeResponseDto({
      narrative: msg.narrative,
      instructions: [...msg.instructions],
    }));
  }

  @Delete(':characterId/history')
  @ApiOperation({ summary: 'Clear narrative history' })
  @ApiResponse({ status: 204, description: 'Narrative cleared' })
  async clearNarrative(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<void> {
    const userId = req.user.id;
    await this.narrativeService.clearNarrative(userId, characterId);
  }
}
