import { Body, Controller, Post, Get, BadRequestException, InternalServerErrorException, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import * as Joi from 'joi';
import { GeminiService } from '../external/gemini.service';
import { ConversationService, ChatMessage } from './conversation.service';
import { parseGameResponse, GameInstruction } from '../external/game-parser.util';
import { readFile } from 'fs/promises';

interface CharacterClass {
  name: string;
  level: number;
}

interface CharacterRace {
  name: string;
}

interface Character {
  name?: string;
  race?: CharacterRace | string;
  classes?: CharacterClass[];
  gender?: string;
  hp?: number;
  hpMax?: number;
  totalXp?: number;
  Str?: number;
  Dex?: number;
  Con?: number;
  Int?: number;
  Wis?: number;
  Cha?: number;
  scores?: Record<string, number>;
}

interface ChatRequest {
  message?: string;
  sessionId?: string;
  character?: Character;
}

const schema = Joi.object({
  message: Joi.string().allow('').optional(),
  sessionId: Joi.string().optional(),
  character: Joi.object().optional()
});

const TEMPLATE_PATH = process.cwd() + '/chat.prompt.txt';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(private readonly gemini: GeminiService, private readonly conv: ConversationService) {}

  private async loadSystemPrompt(): Promise<string> {
    try {
      return await readFile(TEMPLATE_PATH, 'utf8');
    } catch {
      return '';
    }
  }

  private getAbilityScore(character: Character, key: string): number {
    let score = character[key];
    if (typeof score === 'number') return score;
    score = character[key.toLowerCase()];
    if (typeof score === 'number') return score;
    score = character.scores?.[key];
    if (typeof score === 'number') return score;
    score = character.scores?.[key.toLowerCase()];
    return typeof score === 'number' ? score : 10;
  }

  private buildCharacterSummary(character: Character): string {
    return `
Character Information:
- Name: ${character.name || 'Unknown'}
- Race: ${typeof character.race === 'object' ? character.race?.name : character.race || 'Unknown'}
- Classes: ${character.classes?.map((c: CharacterClass) => `${c.name} (Lvl ${c.level})`).join(', ') || 'None'}
- Gender: ${character.gender || 'Unknown'}
- HP: ${character.hp || character.hpMax || 'Unknown'}/${character.hpMax || 'Unknown'}
- XP: ${character.totalXp || 0}
- Stats: STR ${this.getAbilityScore(character, 'Str')}, DEX ${this.getAbilityScore(character, 'Dex')}, CON ${this.getAbilityScore(character, 'Con')}, INT ${this.getAbilityScore(character, 'Int')}, WIS ${this.getAbilityScore(character, 'Wis')}, CHA ${this.getAbilityScore(character, 'Cha')}
`;
  }

  private async initializeNewSession(sessionId: string, systemPrompt: string, character?: Character): Promise<ChatMessage> {
    this.logger.log(`Initializing new session: ${sessionId}`);
    this.gemini.getOrCreateChat(sessionId, systemPrompt || undefined, []);
    const initMessage = character ? (this.logger.debug(`Character data received:`, JSON.stringify(character, null, 2)), `${systemPrompt}\n\n${this.buildCharacterSummary(character)}`) : systemPrompt;
    if (character) this.logger.log(`Session ${sessionId} initialized with character: ${character.name}`);
    const initResp = await this.gemini.sendMessage(sessionId, initMessage);
    const initMsg: ChatMessage = { role: 'assistant', text: initResp.text || '', timestamp: Date.now(), meta: { usage: initResp.usage || null, model: initResp.modelVersion || '' } };
    await this.conv.append(sessionId, initMsg);
    this.logger.log(`Session ${sessionId} initialized with ${initMsg.text.length} chars`);
    return initMsg;
  }

  private async processUserMessage(sessionId: string, userText: string, _systemPrompt: string): Promise<{ userMsg: ChatMessage; assistantMsg: ChatMessage }> {
    this.logger.log(`Processing message for session ${sessionId}: "${userText.substring(0, 50)}..."`);

    // Append user message to history
    const userMsg: ChatMessage = { role: 'user', text: userText, timestamp: Date.now() };
    await this.conv.append(sessionId, userMsg);

    // Send via chat (context handled automatically)
    const resp = await this.gemini.sendMessage(sessionId, userText);

    // Save assistant response
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      text: resp.text || '',
      timestamp: Date.now(),
      meta: { usage: resp.usage || null, model: resp.modelVersion || '' }
    };
    await this.conv.append(sessionId, assistantMsg);

    return { userMsg, assistantMsg };
  }

  private generateSessionId(providedId?: string): string {
    if (typeof providedId === 'string' && providedId.length) return providedId;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((globalThis as any).crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    } catch {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
  }

  private formatChatResponse(sessionId: string, responseText: string, model: string, usage: Record<string, unknown> | null) {
    const { narrative, instructions } = parseGameResponse(responseText);
    return { text: narrative, instructions, model: model || 'unknown', usage: usage || null, raw: null };
  }

  private async handleChatSession(sessionId: string, message: string, character: Character | undefined): Promise<{ sessionId: string; result: Record<string, unknown> }> {
    const systemPrompt = await this.loadSystemPrompt();
    const history = await this.conv.getHistory(sessionId);
    if (history.length === 0) await this.initializeNewSession(sessionId, systemPrompt, character);
    const { assistantMsg } = await this.processUserMessage(sessionId, message || '', systemPrompt);
    const result = this.formatChatResponse(sessionId, assistantMsg.text, (assistantMsg.meta?.model || '') as string, (assistantMsg.meta?.usage || null) as Record<string, unknown> | null);
    this.logger.log(`Chat response ready for session ${sessionId}`);
    return { sessionId, result };
  }

  @Post()
  @ApiOperation({ summary: 'Send prompt to Gemini (chat)' })
  @ApiBody({ schema: { type: 'object' } })
  async chat(@Body() body: ChatRequest) {
    const { error, value } = schema.validate(body);
    if (error) throw new BadRequestException(error.message);
    try {
      const sessionId = this.generateSessionId(value.sessionId);
      const { result } = await this.handleChatSession(sessionId, value.message || '', value.character);
      return { ok: true, sessionId, result };
    } catch (e) {
      this.logger.error('Chat failed', (e as Error)?.stack || e, 'ChatController');
      throw new InternalServerErrorException((e as Error)?.message || 'Chat failed');
    }
  }

  @Post('template')
  @ApiOperation({ summary: 'Update developer prompt template (dev only)' })
  @ApiBody({ schema: { type: 'object' } })
  async updateTemplate(@Body() body: Record<string, unknown>) {
    const text = body?.template;
    if (typeof text !== 'string') throw new BadRequestException('template required');
    const fs = await import('fs/promises');
    await fs.writeFile(TEMPLATE_PATH, text, 'utf8');
    return { ok: true };
  }

  @Post('template/get')
  @ApiOperation({ summary: 'Get developer prompt template (dev only)' })
  async getTemplate() {
    const fs = await import('fs/promises');
    try {
      const txt = await fs.readFile(TEMPLATE_PATH, 'utf8');
      return { ok: true, template: txt };
    } catch {
      return { ok: true, template: '' };
    }
  }

  private parseCharacterFromQuery(character?: string): Character | undefined {
    if (!character || typeof character !== 'string') return undefined;
    try {
      return JSON.parse(character) as Character;
    } catch {
      return undefined;
    }
  }

  private buildSdkHistory(history: ChatMessage[]): Array<{ role: string; parts: Array<{ text: string }> }> {
    return history.map((m) => ({ role: m.role === 'assistant' ? 'model' : m.role, parts: [{ text: m.text }] }));
  }

  private addInstructionsToHistory(history: ChatMessage[]): Array<ChatMessage & { instructions?: GameInstruction[] }> {
    return history.map((msg) => (msg.role === 'assistant' ? { ...msg, ...parseGameResponse(msg.text) } : msg));
  }

  private async handleNewSessionHistory(sessionId: string, systemPrompt: string, charData: Character | undefined): Promise<{ ok: boolean; sessionId: string; isNew: boolean; history: ChatMessage[] }> {
    const initMsg = await this.initializeNewSession(sessionId, systemPrompt, charData);
    return { ok: true, sessionId, isNew: true, history: [initMsg] };
  }

  private async handleExistingSessionHistory(sessionId: string, systemPrompt: string, history: ChatMessage[]): Promise<{ ok: boolean; sessionId: string; isNew: boolean; history: Array<ChatMessage & { instructions?: GameInstruction[] }> }> {
    this.gemini.getOrCreateChat(sessionId, systemPrompt || undefined, this.buildSdkHistory(history));
    const historyWithInstructions = this.addInstructionsToHistory(history);
    this.logger.log(`History loaded for session ${sessionId}: ${history.length} messages`);
    return { ok: true, sessionId, isNew: false, history: historyWithInstructions };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get conversation history for a session' })
  async getHistory(@Query('sessionId') sessionId?: string, @Query('character') character?: string) {
    if (!sessionId) throw new BadRequestException('sessionId required');
    try {
      const history = await this.conv.getHistory(sessionId);
      const systemPrompt = await this.loadSystemPrompt();
      const charData = this.parseCharacterFromQuery(character);
      return history.length === 0 ? this.handleNewSessionHistory(sessionId, systemPrompt, charData) : this.handleExistingSessionHistory(sessionId, systemPrompt, history);
    } catch (e) {
      this.logger.error('History retrieval failed', (e as Error)?.stack || e, 'ChatController');
      throw new InternalServerErrorException((e as Error)?.message || 'Failed to retrieve history');
    }
  }
}
