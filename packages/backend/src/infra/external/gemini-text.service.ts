import {
  Chat, Content, GoogleGenAI,
} from '@google/genai';
import {
  Injectable, InternalServerErrorException, Logger,
} from '@nestjs/common';
import { ChatMessageDto } from '../../domain/chat/dto/ChatMessageDto.js';
import { GameInstructionDto } from '../../domain/chat/dto/GameInstructionDto.js';
import { aiResponseSchema } from './gemini-schemas.js';
import { geminiResponseJsonSchema } from './gemini-json-schema.js';

@Injectable()
export class GeminiTextService {
  private readonly logger = new Logger(GeminiTextService.name);
  private client: GoogleGenAI;
  private model = 'gemini-2.5-flash';
  private chatClients = new Map<string, Chat>();

  constructor() {
    this.logger.debug(
      'Initializing GeminiTextService',
      process.env.GOOGLE_API_KEY ? '***' : 'no API key',
    );
    this.client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  }

  initializeChatSession(
    sessionId: string,
    systemInstruction: string,
    initialHistory: ChatMessageDto[] = [],
  ) {
    if (this.chatClients.has(sessionId)) return;

    this.logger.debug(`Creating new chat client for session ${sessionId}`);

    const chat = this.client.chats.create({
      model: this.model,
      history: initialHistory.map(message => ({
        role: 'assistant' == message.role ? 'model' : 'user',
        content: message.narrative,
      } as Content)),
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseJsonSchema: geminiResponseJsonSchema,
      },
    });
    this.chatClients.set(sessionId, chat);
  }

  // eslint-disable-next-line max-statements
  async sendMessage(sessionId: string, message: string): Promise<ChatMessageDto> {
    const chat = this.chatClients.get(sessionId);
    if (!chat) throw new Error(`Chat session ${sessionId} not found. Call getOrCreateChat first.`);

    this.logger.debug(`Sending message: ${message.slice(0, 50)}...`);
    const { text } = await chat.sendMessage({ message });
    this.logger.debug(`Received structured response for session ${sessionId}`, text);
    if (!text) throw new InternalServerErrorException(`No response from AI service for message: ${message}`);

    try {
      const parsed = JSON.parse(text);

      let normalized = parsed;
      if (Array.isArray(parsed?.instructions)) {
        normalized = {
          ...parsed,
          instructions: parsed.instructions.map((inst) => {
            if (inst && typeof inst === 'object' && 'payload' in inst && typeof inst.payload === 'object') {
              // Merge payload fields into the instruction, prefer payload fields but keep type from wrapper
              return {
                type: inst.type,
                ...inst.payload,
              };
            }
            return inst;
          }),
        };
      }

      const validated = aiResponseSchema.parse(normalized);

      const chatMessage: ChatMessageDto = {
        role: 'assistant',
        narrative: validated.narrative,
        instructions: validated.instructions as GameInstructionDto[] | undefined,
      };

      return chatMessage;
    } catch (error) {
      // Log error details without exposing full response content
      this.logger.error('Failed to parse Gemini structured response', {
        error: error instanceof Error ? error.message : String(error),
        responseLength: text.length,
        responsePreview: text.slice(0, 100),
      });
      throw new InternalServerErrorException('Invalid AI response format');
    }
  }

  clearChat(sessionId: string) {
    this.chatClients.delete(sessionId);
    this.logger.debug(`Cleared chat session ${sessionId}`);
  }
}
