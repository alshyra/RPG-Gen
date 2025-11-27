import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
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
import { CharacterResponseDto } from 'src/character/dto/CharacterResponseDto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { calculateArmorClass } from '../character/armor-class.util.js';
import { CharacterService } from '../character/character.service.js';
import { parseGameResponse } from '../external/game-parser.util.js';
import { GeminiTextService } from '../external/text/gemini-text.service.js';
import { UserDocument } from '../schemas/user.schema.js';
import { ConversationService } from './conversation.service.js';
import { ChatMessageDto, ChatRequestDto, ChatResponseDto } from './dto/index.js';

const TEMPLATE_PATH = process.env.TEMPLATE_PATH ?? path.join(process.cwd(), 'chat.prompt.txt');
const SCENARIO_PATH = process.env.SCENARIO_PATH ?? path.join(process.cwd(), 'chat.scenario.txt');

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  private systemPrompt: string;
  private scenarioPrompt: string;
  constructor(
    private readonly gemini: GeminiTextService,
    private readonly conv: ConversationService,
    private readonly characterService: CharacterService,
  ) {
    this.loadSystemPrompt().then((systemPrompt) => {
      this.systemPrompt = systemPrompt;
      this.logger.log(
        `System prompt loaded (${systemPrompt.length} chars)`,
      );
    });
    this.loadScenarii().then((scenarioPrompt) => {
      this.scenarioPrompt = scenarioPrompt;
      this.logger.log(
        `Scenario prompt loaded (${scenarioPrompt.length} chars)`,
      );
    });
  }

  private async loadSystemPrompt(): Promise<string> {
    try {
      this.logger.log(`Loading system prompt from ${TEMPLATE_PATH}`);
      return await readFile(TEMPLATE_PATH, 'utf8');
    } catch {
      return '';
    }
  }

  private async loadScenarii(): Promise<string> {
    try {
      this.logger.log(`Loading scenario prompt from ${SCENARIO_PATH}`);
      return await readFile(SCENARIO_PATH, 'utf8');
    } catch {
      return '';
    }
  }

  private getAbilityScore(character: CharacterResponseDto, key: string): number {
    let score = character[key];
    if (typeof score === 'number') return score;
    score = character[key.toLowerCase()];
    if (typeof score === 'number') return score;
    score = character.scores?.[key];
    if (typeof score === 'number') return score;
    score = character.scores?.[key.toLowerCase()];
    return typeof score === 'number' ? score : 10;
  }

  private buildCharacterSummary(character: CharacterResponseDto): string {
    const armorClass = calculateArmorClass(character);
    let summary = `
Character Information:
- Name: ${character.name || 'Unknown'}
- Race: ${typeof character.race === 'object' ? character.race?.name : character.race || 'Unknown'}
- Classes: ${character.classes?.map(c => `${c.name} (Lvl ${c.level})`).join(', ') || 'None'}
- Gender: ${character.gender || 'Unknown'}
- HP: ${character.hp || character.hpMax || 'Unknown'}/${character.hpMax || 'Unknown'}
- AC: ${armorClass}
- XP: ${character.totalXp || 0}
- Level: 1
- Stats:
STR ${this.getAbilityScore(character, 'Str')},
DEX ${this.getAbilityScore(character, 'Dex')},
CON ${this.getAbilityScore(character, 'Con')},
INT ${this.getAbilityScore(character, 'Int')},
WIS ${this.getAbilityScore(character, 'Wis')},
CHA ${this.getAbilityScore(character, 'Cha')}
`;

    // Add spells if character has any
    if (character.spells && character.spells.length > 0) {
      summary += `- Spells Known: ${character.spells.map(s => `${s.name} (Lvl ${s.level})`).join(', ')}\n`;
    }

    // Add inventory if character has any
    if (character.inventory && character.inventory.length > 0) {
      summary += `- Inventory: ${character.inventory.map(item => `${item.name} (x${item.qty || 1}) ${item.meta}`).join(', ')}\n`;
    }

    return summary;
  }

  private async processUserMessage(
    userId: string,
    characterId: string,
    userText: string,
  ) {
    this.logger.log(
      `Processing message for character ${characterId}: "${userText.substring(0, 50)}..."`,
    );
    const userMsg: ChatMessageDto = { role: 'user', text: userText, timestamp: Date.now() };
    await this.conv.append(userId, characterId, userMsg);

    await this.ensureChatSession(userId, characterId);
    const resp = await this.gemini.sendMessage(characterId, userText);

    // Save assistant response
    const assistantMsg: ChatMessageDto = {
      role: 'assistant',
      text: resp.text || '',
      timestamp: Date.now(),
      meta: { usage: resp.usage ? { ...resp.usage } : undefined, model: resp.modelVersion || '' },
    };
    await this.conv.append(userId, characterId, assistantMsg);

    return assistantMsg;
  }

  @Post(':characterId')
  @ApiOperation({ summary: 'Send prompt to Gemini (chat)' })
  @ApiBody({ type: ChatRequestDto })
  @ApiResponse({ status: 201, description: 'Chat response with narrative and instructions', type: ChatResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 500, description: 'Chat processing failed' })
  async chat(
    @Req() req: Request,
    @Param('characterId') characterId: string,
    @Body() body: unknown,
    @Body('message') message: string,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();
    this.logger.log(`Received chat request for characterId ${characterId} with message: ${message}...`);
    if (!message) throw new BadRequestException('message required');
    if (!characterId) throw new BadRequestException('characterId required');

    try {
      const assistantMsg = await this.processUserMessage(userId, characterId, message || '');
      const { narrative, instructions } = parseGameResponse(assistantMsg.text);
      return {
        text: narrative,
        instructions,
        model: assistantMsg.meta?.model || 'unknown',
        usage: assistantMsg.meta?.usage || null,
        raw: null,
      };
    } catch (e) {
      throw new InternalServerErrorException((e as Error)?.message || 'Chat failed');
    }
  }

  private async startChat(
    userId: string,
    characterId: string,
  ): Promise<ChatMessageDto> {
    this.gemini.initializeChatSession(characterId, this.systemPrompt, []);

    const characterDoc = await this.characterService.findByCharacterId(userId, characterId);
    if (!characterDoc)
      throw new BadRequestException('Character not found for chat initialization');
    const character = this.characterService.toCharacterDto(characterDoc);
    const initMessage = `${this.systemPrompt}\n\n${this.scenarioPrompt}\n\n${this.buildCharacterSummary(character)}`;

    const initResp = await this.gemini.sendMessage(characterId, initMessage);
    const initMsg: ChatMessageDto = {
      role: 'assistant',
      text: initResp.text || '',
      timestamp: Date.now(),
      meta: {
        model: initResp.modelVersion,
        usage: initResp.usage ? { ...initResp.usage } : undefined,
      },
    };

    await this.conv.append(userId, characterId, initMsg);
    return initMsg;
  }

  private respondToChat(characterId: string, history: ChatMessageDto[]) {
    this.gemini.initializeChatSession(
      characterId,
      this.systemPrompt,
      history.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.text }],
      })),
    );
    this.logger.log(`History loaded for character ${characterId}: ${history.length} messages`);
    return history.map(msg =>
      msg.role === 'assistant' ? { ...msg, ...parseGameResponse(msg.text) } : msg,
    );
  }

  private async ensureChatSession(userId: string, characterId: string) {
    const history = await this.conv.getHistory(userId, characterId);
    const chatHistory = history.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.text }],
    }));
    this.gemini.initializeChatSession(characterId, this.systemPrompt, chatHistory);
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

    if (!characterId) throw new BadRequestException('characterId required');
    try {
      const history = await this.conv.getHistory(userId, characterId);
      if (history.length === 0) {
        return await this.startChat(userId, characterId);
      }
      return this.respondToChat(characterId, history);
    } catch (e) {
      this.logger.error('History retrieval failed', (e as Error)?.stack || e, 'ChatController');
      throw new InternalServerErrorException((e as Error)?.message || 'Failed to retrieve history');
    }
  }
}
