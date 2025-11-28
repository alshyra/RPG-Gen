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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { readFile } from 'fs/promises';
import path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { GeminiTextService } from '../external/text/gemini-text.service.js';
import { UserDocument } from '../auth/user.schema.js';
import { ConversationService } from './conversation.service.js';
import { ChatMessageDto } from './dto/index.js';
import { CharacterService } from 'src/character/character.service.js';
import { CharacterResponseDto } from 'src/character/dto/CharacterResponseDto.js';

const TEMPLATE_PATH = process.env.TEMPLATE_PATH ?? path.join(process.cwd(), 'chat.prompt.txt');
const SCENARIO_PATH = process.env.SCENARIO_PATH ?? path.join(process.cwd(), 'chat.scenario.txt');

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
        this.logger.log('System prompt and scenario loaded successfully');
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
  @ApiResponse({ status: 201, description: 'Chat message (assistant) with narrative and instructions', type: ChatMessageDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 500, description: 'Chat processing failed' })
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
  @ApiResponse({ status: 200, description: 'Conversation history', type: [ChatMessageDto] })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 500, description: 'History retrieval failed' })
  async getHistory(
    @Req() req: Request,
    @Param('characterId') characterId: string,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    const previousChatMessages = await this.conversationService.getHistory(userId, characterId);
    const character = await this.characterService.findByCharacterId(userId, characterId);
    this.geminiTexteService.initializeChatSession(
      characterId,
      this.initPrompt(character),
      previousChatMessages,
    );
    return this.conversationService.getHistory(userId, characterId);
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
    await this.conversationService.append(userId, characterId, {
      role: 'assistant',
      narrative: parsed.text || '',
      instructions: parsed.instructions || [],
    });

    return {
      role: 'assistant',
      narrative: parsed.text || '',
      instructions: parsed.instructions || [],
    };
  }
}
