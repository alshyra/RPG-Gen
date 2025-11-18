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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { CharacterDto, GameInstruction } from '@rpg/shared';
import { Request } from 'express';
import { readFile } from 'fs/promises';
import path from 'path';
import { Character } from 'src/schemas/character.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CharacterService } from '../character/character.service';
import { parseGameResponse } from '../external/game-parser.util';
import { GeminiTextService } from '../external/text/gemini-text.service';
import type { ChatMessage } from '../schemas/conversation.schema';
import { UserDocument } from '../schemas/user.schema';
import { ConversationService } from './conversation.service';
import { SendMessageDto } from './dto/send-message.dto';
import { Content } from '@google/genai';
import { GameConversation } from './dto/GameConversation';

const TEMPLATE_PATH = path.join(__dirname, 'dnd.prompt.txt');

@ApiTags('conversation')
@Controller('conversation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationController {
  private readonly logger = new Logger(ConversationController.name);
  private systemPrompt: string;
  constructor(
    private readonly gemini: GeminiTextService,
    private readonly conversationService: ConversationService,
    private readonly characterService: CharacterService,
  ) {
    this.loadSystemPrompt();
  }

  /**
   * maybe one day implement other worlds
   */
  private async loadSystemPrompt(world?: string) {
    this.systemPrompt = await readFile(TEMPLATE_PATH, 'utf8');
  }

  @Get(':characterId')
  @ApiOperation({ summary: 'Get conversation for a character' })
  @ApiParam({ name: 'characterId', required: true })
  async getConversation(
    @Req() req: Request,
    @Param('characterId') characterId: string,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    try {
      const messages = await this.conversationService.getMessages(userId, characterId);
      if (messages.length === 0) return { ok: false, message: 'Conversation not found' };

      return this.handleExistingConversation(characterId, messages);
    } catch (e: unknown) {
      this.logger.error('Conversation retrieval failed', (e as Error).stack || e, ConversationController.name);
      throw new InternalServerErrorException((e as Error)?.message || 'Failed to retrieve Conversation');
    }
  }

  @Post(':characterId/message')
  @ApiOperation({ summary: 'Post a message to an existing conversation (creates if needed)' })
  @ApiParam({ name: 'characterId', required: true })
  @ApiBody({ type: SendMessageDto })
  async sendMessage(@Req() req: Request<UserDocument>, @Param('characterId') characterId: string, @Body() body: SendMessageDto) {
    const userId = req.user._id.toString();
    try {
      const character = await this.validateAndGetCharacter(userId, characterId);
      const message = typeof body?.message === 'string' ? body.message : '';
      return await this.handleConversation(userId, characterId, message || '', character);
    } catch (e) {
      this.logger.error('Conversation send failed', (e as Error)?.stack || e, ConversationController.name);
      throw new InternalServerErrorException((e as Error)?.message || 'Failed to send message');
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
    character: CharacterDto,
  ): Promise<ChatMessage> {
    this.logger.log(`Starting conversation for character ${characterId} (user: ${userId})`);
    this.logger.log(`Starting conversation for character ${characterId} (user: ${userId})`);
    this.gemini.getOrCreateChat(characterId, this.systemPrompt || undefined, []);
    const initMessage = character
      ? (this.logger.debug(`Character data received:`, JSON.stringify(character, null, 2)),
        `${this.systemPrompt}\n\n${this.buildCharacterSummary(character)}`)
      : this.systemPrompt;
    if (character)
      this.logger.log(`Conversation ${characterId} started with character: ${character.name}`);
    const initResp = await this.gemini.sendMessage(characterId, initMessage);
    const initMsg: ChatMessage = {
      role: 'assistant',
      text: initResp.text || '',
      timestamp: Date.now(),
      meta: { usage: initResp.usage || null, model: initResp.modelVersion || '' },
    };
    await this.conversationService.append(userId, characterId, initMsg);
    this.logger.log(`Conversation ${characterId} started with ${initMsg.text.length} chars`);
    return initMsg;
  }

  private async processConversationMessage(
    userId: string,
    characterId: string,
    userText: string,
  ): Promise<{ userMsg: ChatMessage; assistantMsg: ChatMessage }> {
    this.logger.log(
      `Processing message for character ${characterId}: "${userText.substring(0, 50)}..."`,
    );

    // Append user message to history
    const userMsg: ChatMessage = { role: 'user', text: userText, timestamp: Date.now() };
    await this.conversationService.append(userId, characterId, userMsg);

    // Send via chat (context handled automatically)
    const resp = await this.gemini.sendMessage(characterId, userText);

    // Save assistant response
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      text: resp.text || '',
      timestamp: Date.now(),
      meta: { usage: resp.usage || null, model: resp.modelVersion || '' },
    };
    await this.conversationService.append(userId, characterId, assistantMsg);

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
    character: Character | CharacterDto | undefined,
  ): Promise<{ characterId: string; result: Record<string, unknown> }> {
    const history = await this.conversationService.getMessages(userId, characterId);
    if (history.length === 0) await this.startConversation(userId, characterId, character);
    const { assistantMsg } = await this.processConversationMessage(userId, characterId, message || '');
    const result = this.formatChatResponse(
      assistantMsg.text,
      (assistantMsg.meta?.model || '') as string,
      (assistantMsg.meta?.usage || null) as Record<string, unknown> | null,
    );
    this.logger.log(`Conversation response ready for character ${characterId}`);
    return { characterId, result };
  }

  private async validateAndGetCharacter(userId: string, characterId: string) {
    const characterDocument = await this.characterService.findByCharacterId(userId, characterId);
    if (!characterDocument) throw new BadRequestException('character not found');
    return this.characterService.toCharacterDto(characterDocument) as CharacterDto;
  }

  private buildSdkHistory(history: ChatMessage[]): Content[] {
    return history.map(message => ({
      role: message.role === 'assistant' ? 'model' : message.role,
      parts: [{ text: message.text }],
    }));
  }

  private addInstructionsToMessages(messages: ChatMessage[]): Array<ChatMessage & { instructions?: GameInstruction[] }> {
    return messages.map(msg =>
      msg.role === 'assistant' ? { ...msg, ...GameMessage.fromMessage(msg.text) } : msg,
    );
  }

  private async handleExistingConversation(
    characterId: string,
    messages: ChatMessage[],
  ) {
    this.gemini.getOrCreateChat(
      characterId,
      this.systemPrompt,
      this.buildSdkHistory(messages),
    );
    this.logger.log(`Conversation loaded for character ${characterId}: ${messages.length} messages`);
    return this.addInstructionsToMessages(messages);
  }
}
