import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import fs, { readFile } from 'fs/promises';
import type { CharacterDto } from '@rpg-gen/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { GameInstruction, parseGameResponse } from '../external/game-parser.util.js';
import { GeminiTextService } from '../external/text/gemini-text.service.js';
import { UserDocument } from '../schemas/user.schema.js';
import { ChatMessage, ConversationService } from './conversation.service.js';
import { CharacterService } from '../character/character.service.js';
import path from 'path';

const TEMPLATE_PATH = process.env.TEMPLATE_PATH ?? path.join(process.cwd(), 'packages/backend', 'chat.prompt.txt');

class ChatRequest {
  message: string;
  characterId: string;
}

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  private systemPrompt: string;
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
  }

  private async loadSystemPrompt(): Promise<string> {
    try {
      this.logger.log(`Loading system prompt from ${TEMPLATE_PATH}`);
      return await readFile(TEMPLATE_PATH, 'utf8');
    } catch {
      return '';
    }
  }

  private getAbilityScore(character: CharacterDto, key: string): number {
    let score = character[key];
    if (typeof score === 'number') return score;
    score = character[key.toLowerCase()];
    if (typeof score === 'number') return score;
    score = character.scores?.[key];
    if (typeof score === 'number') return score;
    score = character.scores?.[key.toLowerCase()];
    return typeof score === 'number' ? score : 10;
  }

  private buildCharacterSummary(character: CharacterDto): string {
    let summary = `
Character Information:
- Name: ${character.name || 'Unknown'}
- Race: ${typeof character.race === 'object' ? character.race?.name : character.race || 'Unknown'}
- Classes: ${character.classes?.map(c => `${c.name} (Lvl ${c.level})`).join(', ') || 'None'}
- Gender: ${character.gender || 'Unknown'}
- HP: ${character.hp || character.hpMax || 'Unknown'}/${character.hpMax || 'Unknown'}
- XP: ${character.totalXp || 0}
- Stats: STR ${this.getAbilityScore(character, 'Str')}, DEX ${this.getAbilityScore(
  character,
  'Dex',
)}, CON ${this.getAbilityScore(character, 'Con')}, INT ${this.getAbilityScore(
  character,
  'Int',
)}, WIS ${this.getAbilityScore(character, 'Wis')}, CHA ${this.getAbilityScore(character, 'Cha')}
`;

    // Add spells if character has any
    const charAny = character as any;
    if (charAny.spells && charAny.spells.length > 0) {
      summary += `- Spells Known: ${charAny.spells.map((s: any) => `${s.name} (Lvl ${s.level})`).join(', ')}\n`;
    }

    // Add inventory if character has any
    if (charAny.inventory && charAny.inventory.length > 0) {
      summary += `- Inventory: ${charAny.inventory.map((i: any) => `${i.name} (x${i.quantity || 1})`).join(', ')}\n`;
    }

    return summary;
  }

  private async startChat(
    userId: string,
    characterId: string,
  ): Promise<ChatMessage> {
    this.gemini.getOrCreateChat(characterId, this.systemPrompt, []);

    const character = await this.characterService.findByCharacterId(userId, characterId);
    if (!character)
      throw new BadRequestException('Character not found for chat initialization');
    const initMessage = `${this.systemPrompt}\n\n${this.buildCharacterSummary(character)}`;

    const initResp = await this.gemini.sendMessage(characterId, initMessage);
    const initMsg: ChatMessage = {
      role: 'assistant',
      text: initResp.text || '',
      timestamp: Date.now(),
      meta: {
        model: initResp.modelVersion,
        usage: initResp.usage || {},
      },
    };

    await this.conv.append(userId, characterId, initMsg);

    this.logger.log(`Chat ${characterId} started with ${initMsg.text.length} chars`);
    return initMsg;
  }

  private async processUserMessage(
    userId: string,
    characterId: string,
    userText: string,
  ): Promise<{ userMsg: ChatMessage; assistantMsg: ChatMessage }> {
    this.logger.log(
      `Processing message for character ${characterId}: "${userText.substring(0, 50)}..."`,
    );

    // Append user message to history
    const userMsg: ChatMessage = { role: 'user', text: userText, timestamp: Date.now() };
    await this.conv.append(userId, characterId, userMsg);

    // Send via chat (context handled automatically)
    const resp = await this.gemini.sendMessage(characterId, userText);

    // Save assistant response
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      text: resp.text || '',
      timestamp: Date.now(),
      meta: { usage: resp.usage || {}, model: resp.modelVersion || '' },
    };
    await this.conv.append(userId, characterId, assistantMsg);

    return { userMsg, assistantMsg };
  }

  private formatChatResponse(
    responseText: string,
    model: string,
    usage: Record<string, unknown> | null,
  ) {
    const { narrative, instructions } = parseGameResponse(responseText);
    return {
      text: narrative,
      instructions,
      model: model || 'unknown',
      usage: usage || null,
      raw: null,
    };
  }

  private async handleChat(
    userId: string,
    characterId: string,
    message: string,
  ): Promise<{ characterId: string; result: Record<string, unknown> }> {
    const history = await this.conv.getHistory(userId, characterId);
    if (history.length === 0) await this.startChat(userId, characterId);

    const { assistantMsg } = await this.processUserMessage(userId, characterId, message || '');
    const result = this.formatChatResponse(
      assistantMsg.text,
      (assistantMsg.meta?.model || '') as string,
      (assistantMsg.meta?.usage || null) as Record<string, unknown> | null,
    );

    this.logger.log(`Chat response ready for character ${characterId}`);
    return { characterId, result };
  }

  @Post()
  @ApiOperation({ summary: 'Send prompt to Gemini (chat)' })
  @ApiBody({ type: [ChatRequest] })
  async chat(@Req() req: Request, @Body() body: ChatRequest) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();
    try {
      if (!body.characterId || typeof body.characterId !== 'string')
        throw new BadRequestException('characterId required');
      const { result } = await this.handleChat(
        userId,
        body.characterId as string,
        body.message || '',
      );
      return result;
    } catch (e) {
      this.logger.error('Chat failed', (e as Error)?.stack || e, 'ChatController');
      throw new InternalServerErrorException((e as Error)?.message || 'Chat failed');
    }
  }

  @Post('template/get')
  @ApiOperation({ summary: 'Get developer prompt template (dev only)' })
  async getTemplate() {
    try {
      const txt = await fs.readFile(TEMPLATE_PATH, 'utf8');
      return { ok: true, template: txt };
    } catch {
      return { ok: true, template: '' };
    }
  }

  private parseCharacterFromQuery(character?: string): CharacterDto | undefined {
    if (!character || typeof character !== 'string') return undefined;
    try {
      return JSON.parse(character) as CharacterDto;
    } catch {
      return undefined;
    }
  }

  private buildSdkHistory(
    history: ChatMessage[],
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    return history.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.text }],
    }));
  }

  private addInstructionsToHistory(
    history: ChatMessage[],
  ): Array<ChatMessage & { instructions?: GameInstruction[] }> {
    return history.map(msg =>
      msg.role === 'assistant' ? { ...msg, ...parseGameResponse(msg.text) } : msg,
    );
  }

  private async handleNewChatHistory(
    userId: string,
    characterId: string,
  ): Promise<{ ok: boolean; characterId: string; isNew: boolean; history: ChatMessage[] }> {
    const initMsg = await this.startChat(userId, characterId);
    return { ok: true, characterId, isNew: true, history: [initMsg] };
  }

  private async handleExistingChatHistory(
    characterId: string,
    history: ChatMessage[],
  ): Promise<{
    ok: boolean;
    characterId: string;
    isNew: boolean;
    history: Array<ChatMessage & { instructions?: GameInstruction[] }>;
  }> {
    this.gemini.getOrCreateChat(
      characterId,
      this.systemPrompt,
      this.buildSdkHistory(history),
    );
    const historyWithInstructions = this.addInstructionsToHistory(history);
    this.logger.log(`History loaded for character ${characterId}: ${history.length} messages`);
    return { ok: true, characterId, isNew: false, history: historyWithInstructions };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get conversation history for a character' })
  async getHistory(
    @Req() req: Request,
    @Query('characterId') characterId?: string,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    if (!characterId) throw new BadRequestException('characterId required');
    try {
      const history = await this.conv.getHistory(userId, characterId);
      return history.length === 0
        ? this.handleNewChatHistory(userId, characterId)
        : this.handleExistingChatHistory(characterId, history);
    } catch (e) {
      this.logger.error('History retrieval failed', (e as Error)?.stack || e, 'ChatController');
      throw new InternalServerErrorException((e as Error)?.message || 'Failed to retrieve history');
    }
  }
}
