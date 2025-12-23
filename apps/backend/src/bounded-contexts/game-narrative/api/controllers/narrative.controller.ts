import { Body, Controller, Get, Logger, Param, Post, Req, UseGuards, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/auth/guards/JwtAuthGuard.js';
import { GameNarrativeService } from '../../application/services/GameNarrativeService.js';
import { ConversationResponseMapper } from '../dto/ConversationResponseMapper.js';
import { ChatMessageRequestDto, ChatResponseDto, ConversationResponseDto } from '../dto/index.js';
import type { RPGRequest } from '../../../../global.types.js';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NarrativeController {
  private readonly logger = new Logger(NarrativeController.name);

  constructor(private readonly narrativeService: GameNarrativeService) {}

  @Get(':characterId/history')
  @ApiOperation({ summary: 'Get conversation history with a character' })
  @ApiResponse({
    status: 200,
    description: 'Conversation history',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversationHistory(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<ConversationResponseDto> {
    const userId = req.user._id.toString();
    const { conversation } = await this.narrativeService.getConversationWithContext(userId, characterId);
    return ConversationResponseMapper.toDto(conversation);
  }

  @Get(':characterId/messages')
  @ApiOperation({ summary: 'Get recent messages from a conversation' })
  @ApiResponse({
    status: 200,
    description: 'List of recent messages',
    type: [String],
  })
  async getRecentMessages(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<any[]> {
    const userId = req.user._id.toString();
    const messages = await this.narrativeService.getConversationHistory(userId, characterId);
    return messages.map(msg => ({
      role: msg.role,
      narrative: msg.narrative,
      timestamp: msg.timestamp,
    }));
  }

  @Delete(':characterId/history')
  @ApiOperation({ summary: 'Clear conversation history' })
  @ApiResponse({ status: 204, description: 'Conversation cleared' })
  async clearConversation(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<void> {
    const userId = req.user._id.toString();
    await this.narrativeService.clearConversation(userId, characterId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all conversations for user' })
  @ApiResponse({
    status: 200,
    description: 'All conversations',
    type: [ConversationResponseDto],
  })
  async getUserConversations(@Req() req: RPGRequest): Promise<ConversationResponseDto[]> {
    const userId = req.user._id.toString();
    const conversations = await this.narrativeService.getUserConversations(userId);
    return conversations.map(conv => ConversationResponseMapper.toDto(conv));
  }

  // NOTE: The chat message endpoint (POST :characterId) should use the ChatOrchestrator
  // which integrates with GeminiTextService for AI narrative generation
  // This is preserved for backward compatibility and requires Gemini integration
}
