import { Body, Controller, Get, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../domain/auth/jwt-auth.guard.js';
import { CharacterService } from '../domain/character/character.service.js';
import { ConversationService } from '../domain/chat/conversation.service.js';
import { ChatMessageDto } from '../domain/chat/dto/index.js';
import type { RPGRequest } from '../global.types.js';
import { GeminiTextService } from '../infra/external/gemini-text.service.js';
import { ChatOrchestrator } from '../orchestrators/index.js';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(
    private readonly geminiTexteService: GeminiTextService,
    private readonly conversationService: ConversationService,
    private readonly characterService: CharacterService,
    private readonly chatOrchestrator: ChatOrchestrator,
  ) {}

  @Post(':characterId')
  @ApiOperation({ summary: 'Send prompt to Gemini (chat)' })
  @ApiBody({ type: ChatMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Chat message (assistant) with narrative and instructions',
    type: ChatMessageDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
  })
  @ApiResponse({
    status: 500,
    description: 'Chat processing failed',
  })
  async chat(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Body() chatMessageDto: ChatMessageDto,
  ) {
    const { user } = req;
    const userId = user._id.toString();
    this.logger.log(
      `Received chat request for characterId ${characterId} with message: `,
      chatMessageDto,
    );

    const previousChatMessages = await this.conversationService.getHistoryMessages(
      userId,
      characterId,
    );
    const character = await this.characterService.findByCharacterId(userId, characterId);
    this.geminiTexteService.initializeChatSession(
      characterId,
      this.geminiTexteService.initPrompt(
        character,
        this.conversationService.buildCharacterSummary(character),
      ),
      previousChatMessages,
    );
    await this.conversationService.append(userId, characterId, chatMessageDto);
    return this.chatOrchestrator.getGMResponse(userId, characterId, chatMessageDto.narrative);
  }

  @Get('/:characterId/history')
  @ApiOperation({ summary: 'Get conversation history for a character' })
  @ApiResponse({
    status: 200,
    description: 'Conversation history',
    type: [ChatMessageDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
  })
  @ApiResponse({
    status: 500,
    description: 'History retrieval failed',
  })
  async getHistory(@Req() req: RPGRequest, @Param('characterId') characterId: string) {
    this.logger.log(`Fetching chat history for characterId ${characterId}...`);
    const { user } = req;
    const userId = user._id.toString();
    const previousChatMessages = await this.conversationService.getHistoryMessages(
      userId,
      characterId,
    );

    await this.processHistoricalCombat(previousChatMessages, userId, characterId);
    await this.initSessionAndStartIfNeeded(userId, characterId, previousChatMessages);

    return this.conversationService.getHistoryMessages(userId, characterId);
  }

  private async processHistoricalCombat(
    messages: ChatMessageDto[] | undefined,
    userId: string,
    characterId: string,
  ): Promise<void> {
    if (!messages?.length) return;
    const lastMessage = messages[messages.length - 1]; // last message
    const combatInstrs = lastMessage?.instructions?.find(i => i.type === 'combat_start');
    if (!combatInstrs) return;

    await this.chatOrchestrator.processInstructions(userId, characterId, [combatInstrs]);
  }

  private async initSessionAndStartIfNeeded(
    userId: string,
    characterId: string,
    previousChatMessages: ChatMessageDto[] | undefined,
  ): Promise<void> {
    const character = await this.characterService.findByCharacterId(userId, characterId);
    this.geminiTexteService.initializeChatSession(
      characterId,
      this.geminiTexteService.initPrompt(
        character,
        this.conversationService.buildCharacterSummary(character),
      ),
      previousChatMessages ?? [],
    );
    if (!previousChatMessages) {
      await this.chatOrchestrator.getGMResponse(
        userId,
        characterId,
        "Tu peux commencer l'aventure",
      );
    }
  }
}
