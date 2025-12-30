import { Body, Controller, Delete, Get, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { RPGRequest } from '../../../../global.types.js';
import { JwtAuthGuard } from '../../../auth/infrastructure/auth/guards/JwtAuthGuard.js';
import { NarrativeAppService } from '../../application/services/NarrativeAppService.js';
import { ConversationService } from '../../application/services/ConversationService.js';
import { NarrativeStartupService } from '../../application/services/NarrativeStartupService.js';
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
    private readonly narrativeAppService: NarrativeAppService,
    private readonly conversationService: ConversationService,
    private readonly narrativeStartupService: NarrativeStartupService,
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
    
    // Process game instructions (combat_start, etc.) via startup service
    if (parsed.instructions?.length) {
      await this.narrativeStartupService.processInstructionsForCharacter(userId, characterId, parsed.instructions);
    }
    
    return new NarrativeResponseDto({
      role: 'assistant',
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
  async getNarrativeHistory(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<ConversationResponseDto> {
    const userId = req.user.id;
    const messages = await this.narrativeAppService.getAllMessages(userId, characterId);
    return new ConversationResponseDto({
      characterId,
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
    const messages = await this.narrativeAppService.getAllMessages(userId, characterId);
    return NarrativeResponseMapper.messagesToDtos(messages);
  }

  @Post(':characterId/start')
  @ApiOperation({ summary: 'Initialize a new narrative session for a character and start the story' })
  @ApiResponse({
    status: 201,
    description: 'Narrative session initialized with GM intro',
    type: ConversationResponseDto,
  })
  async startNarrative(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<ConversationResponseDto> {
    const userId = req.user.id;
    
    const gmResponse = await this.narrativeStartupService.startNarrative(userId, characterId);
    
    return new ConversationResponseDto({
      characterId,
      messages: [new NarrativeResponseDto({
        role: 'assistant',
        narrative: gmResponse.narrative,
        instructions: gmResponse.instructions,
      })],
    });
  }

  @Delete(':characterId/history')
  @ApiOperation({ summary: 'Clear narrative history' })
  @ApiResponse({ status: 204, description: 'Narrative cleared' })
  async clearNarrative(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<void> {
    const userId = req.user.id;
    await this.narrativeAppService.clearNarrative(userId, characterId);
  }
}
