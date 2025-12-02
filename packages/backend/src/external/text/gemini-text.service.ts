import {
  Chat, Content, GoogleGenAI,
} from '@google/genai';
import {
  Injectable, InternalServerErrorException, Logger,
} from '@nestjs/common';
import { ChatMessageDto } from '../../chat/dto/ChatMessageDto.js';
import { parseAIResponse } from './ai-parser.util.js';

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
      },
    });
    this.chatClients.set(sessionId, chat);
  }

  async sendMessage(sessionId: string, message: string) {
    const chat = this.chatClients.get(sessionId);
    if (!chat) throw new Error(`Chat session ${sessionId} not found. Call getOrCreateChat first.`);

    this.logger.debug(`Sending message: ${message.slice(0, 50)}...`);
    const { text } = await chat.sendMessage({ message });
    this.logger.debug(`Received response for session ${sessionId}`, text);
    if (!text) throw new InternalServerErrorException(`No response from AI service for message: ${message}`);
    return parseAIResponse(text);
  }

  clearChat(sessionId: string) {
    this.chatClients.delete(sessionId);
    this.logger.debug(`Cleared chat session ${sessionId}`);
  }
}
