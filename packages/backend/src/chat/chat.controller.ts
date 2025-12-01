import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { readFile } from 'fs/promises';
import path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UserDocument } from '../auth/user.schema.js';
import { CharacterService } from '../character/character.service.js';
import { CharacterResponseDto } from '../character/dto/index.js';
import { GeminiTextService } from '../external/text/gemini-text.service.js';
import { ConversationService } from './conversation.service.js';
import { GameInstructionProcessor } from './game-instruction.processor.js';
import { ChatMessageDto } from './dto/index.js';

const TEMPLATE_PATH = process.env.TEMPLATE_PATH ?? path.join(process.cwd(), 'chat.prompt.txt');
const SCENARIO_PATH = process.env.SCENARIO_PATH ?? path.join(process.cwd(), 'assets/scenarii', 'arene.txt');

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  private systemPrompt: string;
  constructor(
    private readonly geminiTexteService: GeminiTextService,
    private readonly conversationService: ConversationService,
    private readonly characterService: CharacterService,
    private readonly instructionProcessor: GameInstructionProcessor,
  ) {
    Promise.all([
      this.loadSystemPrompt(),
      this.loadScenarii(),
    ])
      .then(([
        systemPrompt,
        scenarioPrompt,
      ]) => {
        this.systemPrompt = systemPrompt + '\n\n' + scenarioPrompt;
        this.logger.log('System prompt and scenario loaded successfully !');
      });
  }

  private async loadSystemPrompt(): Promise<string> {
    this.logger.log(`Loading system prompt from ${TEMPLATE_PATH}`);
    return await readFile(TEMPLATE_PATH, 'utf8');
  }

  private async loadScenarii(): Promise<string> {
    this.logger.log(`Loading scenario prompt from ${SCENARIO_PATH}`);
    return await readFile(SCENARIO_PATH, 'utf8');
  }

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
    @Req() req: Request,
    @Param('characterId') characterId: string,
    @Body() chatMessageDto: ChatMessageDto,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();
    this.logger.log(`Received chat request for characterId ${characterId} with message: ${chatMessageDto}...`);

    const previousChatMessages = await this.conversationService.getHistory(userId, characterId);
    const character = await this.characterService.findByCharacterId(userId, characterId);
    this.geminiTexteService.initializeChatSession(
      characterId,
      this.initPrompt(character),
      previousChatMessages,
    );
    await this.conversationService.append(userId, characterId, chatMessageDto);
    return this.getGMResponse(userId, characterId, chatMessageDto.narrative);
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
  async getHistory(
    @Req() req: Request,
    @Param('characterId') characterId: string,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();
    const previousChatMessages = await this.conversationService.getHistory(userId, characterId);

    await this.processHistoricalCombat(previousChatMessages, userId, characterId);
    await this.initSessionAndStartIfNeeded(userId, characterId, previousChatMessages);

    return this.conversationService.getHistory(userId, characterId);
  }

  private async processHistoricalCombat(
    messages: ChatMessageDto[] | undefined,
    userId: string,
    characterId: string,
  ): Promise<void> {
    if (!messages?.length) return;

    type MessageWithInstructions = ChatMessageDto & { instructions?: { type: string }[] };
    const hasCombatStart = (m: MessageWithInstructions) => m.role === 'assistant' && m.instructions?.some(i => i.type === 'combat_start');

    const lastAssistant = [...messages].reverse()
      .find(hasCombatStart) as MessageWithInstructions | undefined;
    if (!lastAssistant?.instructions) return;

    const combatInstrs = lastAssistant.instructions.filter(i => i.type === 'combat_start');
    if (!combatInstrs.length) return;

    try {
      await this.instructionProcessor.processInstructions(userId, characterId, combatInstrs);
      this.logger.log(`Processed historical combat_start for ${characterId}`);
    } catch (e) {
      this.logger.warn(`Failed to process historical combat_start for ${characterId}: ${(e as Error)?.message}`);
    }
  }

  private async initSessionAndStartIfNeeded(
    userId: string,
    characterId: string,
    previousChatMessages: ChatMessageDto[] | undefined,
  ): Promise<void> {
    const character = await this.characterService.findByCharacterId(userId, characterId);
    this.geminiTexteService.initializeChatSession(characterId, this.initPrompt(character), previousChatMessages ?? []);
    if (!previousChatMessages) {
      await this.getGMResponse(userId, characterId, 'Tu peux commencer l\'aventure');
    }
  }

  private initPrompt(character: CharacterResponseDto) {
    return `${this.systemPrompt}\n\n${this.conversationService.buildCharacterSummary(character)}`;
  }

  private async getGMResponse(
    userId: string,
    characterId: string,
    userText: string,
  ) {
    const parsed = await this.geminiTexteService.sendMessage(characterId, userText);
    const assistantMsg = {
      role: 'assistant' as const,
      narrative: parsed.narrative || '',
      instructions: parsed.instructions || [],
    };

    // Save assistant reply to history
    await this.conversationService.append(userId, characterId, assistantMsg);

    // Process game instructions (apply side-effects) if any
    if (Array.isArray(parsed.instructions) && parsed.instructions.length > 0) {
      try {
        await this.instructionProcessor.processInstructions(userId, characterId, parsed.instructions);
      } catch (e) {
        this.logger.warn(`Instruction processing failed for ${characterId}: ${(e as Error)?.message}`);
      }
    }

    return assistantMsg;
  }
}
