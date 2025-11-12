import { Body, Controller, Post, Get, BadRequestException, InternalServerErrorException, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import * as Joi from 'joi';
import { GeminiService } from '../shared/gemini.service';
import { ConversationService, ChatMessage } from './conversation.service';
import { parseGameResponse } from '../shared/game-parser.util';
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

  private async initializeNewSession(sessionId: string, systemPrompt: string, character?: Character): Promise<ChatMessage> {
    this.logger.log(`Initializing new session: ${sessionId}`);
    
    // Create chat client with system template
    this.gemini.getOrCreateChat(sessionId, systemPrompt || undefined, []);
    let initMessage: string;
    
    // Build initialization message with character data
    if (character) {
      this.logger.debug(`Character data received:`, JSON.stringify(character, null, 2));
      
      // Extract ability scores from character - check multiple possible locations
      const getAbilityScore = (key: string): number => {
        // Try direct property (e.g., character.Str)
        let score = character[key];
        if (typeof score === 'number') return score;
        
        // Try lowercase (e.g., character.str)
        score = character[key.toLowerCase()];
        if (typeof score === 'number') return score;
        
        // Try in scores object with capitalized key (e.g., character.scores.Str)
        score = character.scores?.[key];
        if (typeof score === 'number') return score;
        
        // Try in scores object with lowercase key
        score = character.scores?.[key.toLowerCase()];
        if (typeof score === 'number') return score;
        
        // Default to 10
        return 10;
      };

      const charSummary = `
Character Information:
- Name: ${character.name || 'Unknown'}
- Race: ${typeof character.race === 'object' ? character.race?.name : character.race || 'Unknown'}
- Classes: ${character.classes?.map((c: CharacterClass) => `${c.name} (Lvl ${c.level})`).join(', ') || 'None'}
- Gender: ${character.gender || 'Unknown'}
- HP: ${character.hp || character.hpMax || 'Unknown'}/${character.hpMax || 'Unknown'}
- XP: ${character.totalXp || 0}
- Stats: STR ${getAbilityScore('Str')}, DEX ${getAbilityScore('Dex')}, CON ${getAbilityScore('Con')}, INT ${getAbilityScore('Int')}, WIS ${getAbilityScore('Wis')}, CHA ${getAbilityScore('Cha')}
`;
      initMessage = `${systemPrompt}\n\n${charSummary}`;
      this.logger.log(`Session ${sessionId} initialized with character: ${character.name}`);
    }

    // Send init message with character context
    const initResp = await this.gemini.sendMessage(sessionId, initMessage);
    const initMsg: ChatMessage = {
      role: 'assistant',
      text: initResp.text || '',
      timestamp: Date.now(),
      meta: { usage: initResp.usage || null, model: initResp.modelVersion || '' }
    };
    
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

  private formatChatResponse(sessionId: string, responseText: string, model: string, usage: Record<string, unknown> | null) {
    const { narrative, instructions } = parseGameResponse(responseText);
    return {
      text: narrative,
      instructions,
      model: model || 'unknown',
      usage: usage || null,
      raw: null,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Send prompt to Gemini (chat)' })
  @ApiBody({ schema: { type: 'object' } })
  async chat(@Body() body: ChatRequest) {
    const { error, value } = schema.validate(body);
    if (error) throw new BadRequestException(error.message);

    const providedId = value.sessionId;
    let sessionId: string;
    try {
      sessionId = typeof providedId === 'string' && providedId.length
        ? providedId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : ((globalThis as any).crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    } catch {
      sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    try {
      const systemPrompt = await this.loadSystemPrompt();
      const history = await this.conv.getHistory(sessionId);
      const isNewSession = history.length === 0;

      // Initialize new session with system prompt and character data
      if (isNewSession) {
        await this.initializeNewSession(sessionId, systemPrompt, value.character);
      }

      // Process user message
      const { assistantMsg } = await this.processUserMessage(sessionId, value.message || '', systemPrompt);

      // Format and return response
      const result = this.formatChatResponse(sessionId, assistantMsg.text, (assistantMsg.meta?.model || '') as string, (assistantMsg.meta?.usage || null) as Record<string, unknown> | null);

      this.logger.log(`Chat response ready for session ${sessionId}`);
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

  @Get('history')
  @ApiOperation({ summary: 'Get conversation history for a session' })
  async getHistory(@Query('sessionId') sessionId?: string, @Query('character') character?: string) {
    if (!sessionId) throw new BadRequestException('sessionId required');

    try {
      const history = await this.conv.getHistory(sessionId);
      const systemPrompt = await this.loadSystemPrompt();
      let charData: Character | undefined;
      
      // Parse character data if provided as query string (JSON)
      if (character && typeof character === 'string') {
        try {
          charData = JSON.parse(character) as Character;
        } catch {
          // Character data not valid JSON, ignore
        }
      }

      // New session: initialize it with character data
      if (history.length === 0) {
        this.logger.log(`New session detected in getHistory: ${sessionId}`);
        const initMsg = await this.initializeNewSession(sessionId, systemPrompt, charData);
        return { ok: true, sessionId, isNew: true, history: [initMsg] };
      }

      // Existing session: rebuild chat client with history
      const sdkHistory = history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.text }],
      }));
      this.gemini.getOrCreateChat(sessionId, systemPrompt || undefined, sdkHistory);

      // Parse instructions from assistant messages
      const historyWithInstructions = history.map((msg) => {
        if (msg.role === 'assistant') {
          const { narrative, instructions } = parseGameResponse(msg.text);
          return { ...msg, text: narrative, instructions };
        }
        return msg;
      });

      this.logger.log(`History loaded for session ${sessionId}: ${history.length} messages`);
      return { ok: true, sessionId, isNew: false, history: historyWithInstructions };
    } catch (e) {
      this.logger.error('History retrieval failed', (e as Error)?.stack || e, 'ChatController');
      throw new InternalServerErrorException((e as Error)?.message || 'Failed to retrieve history');
    }
  }
}
