import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SendMessageDto } from './dto/send-message.dto';
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
// Swagger decorators
import { Request } from 'express';
import { readFile } from 'fs/promises';
import path from 'path';
// Joi removed; optional validation can be implemented with NestJS validation pipe
import type { CharacterEntry } from '../../../shared/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GameInstruction, parseGameResponse } from '../external/game-parser.util';
import { GeminiTextService } from '../external/text/gemini-text.service';
import { CharacterService } from '../character/character.service';
import { UserDocument } from '../schemas/user.schema';
import type { ChatMessage } from '../../../shared/types';
import { ConversationService } from './conversation.service';

const TEMPLATE_PATH = path.join(__dirname, 'dnd.prompt.txt');

@ApiTags('conversation')
@Controller('conversation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationController {
  private readonly logger = new Logger(ConversationController.name);
  constructor(
    private readonly gemini: GeminiTextService,
    private readonly conv: ConversationService,
    private readonly characterService: CharacterService,
  ) {}

  private async loadSystemPrompt(world?: string): Promise<string> {
    try {
      if (world) {
        const candidate = path.join(__dirname, `${world}.prompt.txt`);
        try {
          return await readFile(candidate, 'utf8');
        } catch {
          // fallback to default
        }
      }
      return await readFile(TEMPLATE_PATH, 'utf8');
    } catch {
      return '';
    }
  }

  private getAbilityScore(character: CharacterEntry, key: string): number {
    let score = character[key];
    if (typeof score === 'number') return score;
    score = character[key.toLowerCase()];
    if (typeof score === 'number') return score;
    score = character.scores?.[key];
    if (typeof score === 'number') return score;
    score = character.scores?.[key.toLowerCase()];
    return typeof score === 'number' ? score : 10;
  }

  private buildCharacterSummary(character: CharacterEntry): string {
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
    if (character.spells && character.spells.length > 0) {
      summary += `- Spells Known: ${character.spells.map(s => `${s.name} (Lvl ${s.level})`).join(', ')}\n`;
    }

    // Add inventory if character has any
    if (character.inventory && character.inventory.length > 0) {
      summary += `- Inventory: ${character.inventory.map(i => `${i.name} (x${i.quantity || 1})`).join(', ')}\n`;
    }

    return summary;
  }

  private async startConversation(
    userId: string,
    characterId: string,
    systemPrompt: string,
    character?: CharacterEntry,
  ): Promise<ChatMessage> {
    this.logger.log(`Starting conversation for character ${characterId} (user: ${userId})`);
    this.logger.log(`Starting conversation for character ${characterId} (user: ${userId})`);
    this.gemini.getOrCreateChat(characterId, systemPrompt || undefined, []);
    const initMessage = character
      ? (this.logger.debug(`Character data received:`, JSON.stringify(character, null, 2)),
        `${systemPrompt}\n\n${this.buildCharacterSummary(character)}`)
      : systemPrompt;
    if (character)
      this.logger.log(`Conversation ${characterId} started with character: ${character.name}`);
    const initResp = await this.gemini.sendMessage(characterId, initMessage);
    const initMsg: ChatMessage = {
      role: 'assistant',
      text: initResp.text || '',
      timestamp: Date.now(),
      meta: { usage: initResp.usage || null, model: initResp.modelVersion || '' },
    };
    await this.conv.append(userId, characterId, initMsg);
    this.logger.log(`Conversation ${characterId} started with ${initMsg.text.length} chars`);
    return initMsg;
  }

  private async processConversationMessage(
    userId: string,
    characterId: string,
    userText: string,
    _systemPrompt: string,
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
      meta: { usage: resp.usage || null, model: resp.modelVersion || '' },
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

  private async handleConversation(
    userId: string,
    characterId: string,
    message: string,
    character: CharacterEntry | undefined,
  ): Promise<{ characterId: string; result: Record<string, unknown> }> {
    const systemPrompt = await this.loadSystemPrompt(character?.world as string | undefined);
    const history = await this.conv.getHistory(userId, characterId);
    if (history.length === 0) await this.startConversation(userId, characterId, systemPrompt, character);
    const { assistantMsg } = await this.processConversationMessage(userId, characterId, message || '', systemPrompt);
    const result = this.formatChatResponse(
      assistantMsg.text,
      (assistantMsg.meta?.model || '') as string,
      (assistantMsg.meta?.usage || null) as Record<string, unknown> | null,
    );
    this.logger.log(`Conversation response ready for character ${characterId}`);
    return { characterId, result };
  }

  @Post(':characterId')
  @ApiOperation({ summary: 'Create a conversation for a character client initiates' })
  @ApiParam({ name: 'characterId', required: true })
  async conversation(
    @Req() req: Request<UserDocument>,
    @Param('characterId') characterId: string,
  ) {
    const { user } = req;
    const userId = user._id.toString();
    try {
      if (!characterId || typeof characterId !== 'string')
        throw new BadRequestException('characterId required');
      const charEntry = await this.validateAndGetCharacter(userId, characterId);

      return await this.createConversationForCharacter(userId, characterId, charEntry);
    } catch (e) {
      this.logger.error('Conversation failed', (e as Error)?.stack || e, ConversationController.name);
      throw new InternalServerErrorException((e as Error)?.message || 'Conversation failed');
    }
  }

  @Post(':characterId/message')
  @ApiOperation({ summary: 'Post a message to an existing conversation (creates if needed)' })
  @ApiParam({ name: 'characterId', required: true })
  @ApiBody({ type: SendMessageDto })
  async sendMessage(@Req() req: Request<UserDocument>, @Param('characterId') characterId: string, @Body() body: SendMessageDto) {
    const userId = req.user._id.toString();
    try {
      const charEntry = await this.validateAndGetCharacter(userId, characterId);
      const message = typeof body?.message === 'string' ? body.message : '';
      // Call the existing conversation handler (this will create the conversation if absent and process message)
      return await this.handleConversation(userId, characterId, message || '', charEntry);
    } catch (e) {
      this.logger.error('Conversation send failed', (e as Error)?.stack || e, ConversationController.name);
      throw new InternalServerErrorException((e as Error)?.message || 'Failed to send message');
    }
  }

  private async validateAndGetCharacter(userId: string, characterId: string) {
    const characterDocument = await this.characterService.findByCharacterId(userId, characterId);
    if (!characterDocument) throw new BadRequestException('character not found');
    return this.characterService.toCharacterEntry(characterDocument);
  }

  private async createConversationForCharacter(userId: string, characterId: string, charEntry: CharacterEntry) {
    const systemPrompt = await this.loadSystemPrompt(charEntry.world);
    const initMsg = await this.startConversation(userId, characterId, systemPrompt, charEntry);
    return { ok: true, characterId, isNew: true, history: [initMsg] };
  }

  private buildSdkHistory(
    history: ChatMessage[],
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    return history.map(message => ({
      role: message.role === 'assistant' ? 'model' : message.role,
      parts: [{ text: message.text }],
    }));
  }

  private addInstructionsToHistory(
    history: ChatMessage[],
  ): Array<ChatMessage & { instructions?: GameInstruction[] }> {
    return history.map(msg =>
      msg.role === 'assistant' ? { ...msg, ...parseGameResponse(msg.text) } : msg,
    );
  }

  private async handleExistingConversationHistory(
    characterId: string,
    systemPrompt: string,
    history: ChatMessage[],
  ): Promise<{
    ok: boolean;
    characterId: string;
    isNew: boolean;
    history: Array<ChatMessage & { instructions?: GameInstruction[] }>;
  }> {
    this.gemini.getOrCreateChat(
      characterId,
      systemPrompt || undefined,
      this.buildSdkHistory(history),
    );
    const historyWithInstructions = this.addInstructionsToHistory(history);
    this.logger.log(`History loaded for character ${characterId}: ${history.length} messages`);
    return { ok: true, characterId, isNew: false, history: historyWithInstructions };
  }

  @Get(':characterId')
  @ApiOperation({ summary: 'Get conversation for a character' })
  @ApiParam({ name: 'characterId', required: true })
  async getHistory(
    @Req() req: Request,
    @Param('characterId') characterId: string,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    try {
      return await this.returnExistingConversationOrNotFound(userId, characterId);
    } catch (e: unknown) {
      this.logger.error('Conversation retrieval failed', (e as Error).stack || e, ConversationController.name);
      throw new InternalServerErrorException((e as Error)?.message || 'Failed to retrieve Conversation');
    }
  }

  private async returnExistingConversationOrNotFound(userId: string, characterId: string) {
    const history = await this.conv.getHistory(userId, characterId);
    if (history.length === 0) {
      return { ok: false, message: 'conversation not found' };
    }
    const charDoc = await this.characterService.findByCharacterId(userId, characterId);
    const systemPrompt = await this.loadSystemPrompt(charDoc?.world as string | undefined);
    return this.handleExistingConversationHistory(characterId, systemPrompt, history);
  }
}
