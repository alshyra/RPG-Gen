import { Candidate, Chat, Content, GenerateContentResponse, GoogleGenAI, Part } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';

const extractTextFromParts = (parts?: Part[]): string => parts?.[0]?.text || '';

const extractTextFromArrayContent = (content: Content[]): string => {
  const first = content[0];
  const parts = first?.parts;
  return Array.isArray(parts) ? extractTextFromParts(parts) : '';
};

const extractTextFromObjectContent = (obj: Content): string => {
  const parts = obj.parts;
  return Array.isArray(parts) ? extractTextFromParts(parts) : '';
};

const extractTextFromContent = (content?: Content): string =>
  Array.isArray(content)
    ? extractTextFromArrayContent(content)
    : content && typeof content === 'object'
      ? extractTextFromObjectContent(content)
      : '';

const extractTextFromFirstCandidate = (candidates: Candidate[]): string => {
  const firstCand = candidates[0];
  const content = firstCand?.content;
  return extractTextFromContent(content);
};

const extractTextFromCandidates = (candidates: Candidate[]): string => {
  const found = candidates.find((candidate) => {
    const parts = candidate?.content?.parts;
    return Array.isArray(parts) && parts[0]?.text;
  });
  if (!found) return '';

  return extractTextFromParts(found?.content?.parts);
};

const parseJsonString = (str: string) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

const extractFromCandidate = (candidates: Candidate[]): string => {
  const text = extractTextFromFirstCandidate(candidates);
  return text || extractTextFromCandidates(candidates);
};

const textFromResponse = (data: GenerateContentResponse) => {
  if (!data) return '';
  if (typeof data === 'string') {
    const parsed = parseJsonString(data);
    return parsed ? textFromResponse(parsed) : data;
  }
  if (data.candidates && Array.isArray(data.candidates) && data.candidates.length)
    return extractFromCandidate(data.candidates);
};

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
    initialHistory: any[] = [],
  ) {
    if (this.chatClients.has(sessionId)) return;

    this.logger.debug(`Creating new chat client for session ${sessionId}`);
    const chat = this.client.chats.create({
      model: this.model,
      history: initialHistory,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    this.chatClients.set(sessionId, chat);
  }

  private extractResponseMetadata = (response: GenerateContentResponse) => ({
    usage: response?.usageMetadata || null,
    modelVersion: this.model,
  });

  private async handleChatMessage(chat: Chat, message: string) {
    this.logger.debug(`Sending message: ${message.slice(0, 50)}...`);
    const response = await chat.sendMessage({ message });
    const text = textFromResponse(response);
    const { usage, modelVersion } = this.extractResponseMetadata(response);
    return { text, raw: response, usage, modelVersion };
  }

  async sendMessage(sessionId: string, message: string) {
    const chat = this.chatClients.get(sessionId);
    if (!chat) throw new Error(`Chat session ${sessionId} not found. Call getOrCreateChat first.`);

    try {
      return await this.handleChatMessage(chat, message);
    } catch (e) {
      this.logger.warn(`Chat sendMessage failed for ${sessionId}`, (e as Error)?.stack || e);
      throw e;
    }
  }

  clearChat(sessionId: string) {
    this.chatClients.delete(sessionId);
    this.logger.debug(`Cleared chat session ${sessionId}`);
  }
}
