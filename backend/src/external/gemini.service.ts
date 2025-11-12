import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

type GeminiResponse = Record<string, unknown>;

interface GeminiMessage {
  text: string;
  raw: GeminiResponse;
  usage: Record<string, unknown> | null;
  modelVersion: string;
}

const extractTextFromParts = (parts: Array<unknown>): string => ((parts[0] as Record<string, unknown>)?.text as string) || '';

const extractTextFromArrayContent = (content: Array<unknown>): string => {
  const first = (content[0] as Record<string, unknown>);
  if (first?.text) return first.text as string;
  const parts = first?.parts as Array<unknown>;
  return Array.isArray(parts) ? extractTextFromParts(parts) : '';
};

const extractTextFromObjectContent = (obj: Record<string, unknown>): string => {
  if (obj.text) return obj.text as string;
  const parts = obj.parts as Array<unknown>;
  return Array.isArray(parts) ? extractTextFromParts(parts) : '';
};

const extractTextFromContent = (content: unknown): string => (Array.isArray(content) ? extractTextFromArrayContent(content) : (content && typeof content === 'object' ? extractTextFromObjectContent(content as Record<string, unknown>) : ''));

const extractTextFromFirstCandidate = (candidates: Array<unknown>): string => {
  const firstCand = candidates[0] as Record<string, unknown>;
  const content = firstCand?.content;
  const text = extractTextFromContent(content);
  if (text) return text;
  return typeof firstCand?.output === 'string' ? firstCand.output : '';
};

const extractTextFromCandidates = (candidates: Array<unknown>): string => {
  const found = candidates.find((cand: unknown) => {
    const candObj = cand as Record<string, unknown>;
    const parts = (candObj?.content as Record<string, unknown>)?.parts as Array<unknown>;
    return Array.isArray(parts) && (parts[0] as Record<string, unknown>)?.text;
  });
  if (!found) return '';
  const parts = ((found as Record<string, unknown>)?.content as Record<string, unknown>)?.parts as Array<unknown>;
  return extractTextFromParts(parts);
};

const parseJsonString = (str: string): unknown => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

const extractFromCandidate = (candidates: Array<unknown>): string => {
  const text = extractTextFromFirstCandidate(candidates);
  return text || extractTextFromCandidates(candidates);
};

function textFromResponse(data: unknown): string {
  if (!data) return '';
  if (typeof data === 'string') {
    const parsed = parseJsonString(data);
    return parsed ? textFromResponse(parsed) : data;
  }
  const obj = data as Record<string, unknown>;
  if (obj.outputText) return obj.outputText as string;
  if (obj.candidates && Array.isArray(obj.candidates) && obj.candidates.length) return extractFromCandidate(obj.candidates);
  const result = obj.result as Record<string, unknown>;
  return result?.outputText ? (result.outputText as string) : JSON.stringify(data);
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private client: GoogleGenAI | null = null;
  private model = 'gemini-2.0-flash';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chatClients = new Map<string, any>();

  constructor() {
    this.logger.debug('Initializing GeminiService', process.env.GOOGLE_API_KEY ? '***' : 'no API key');
    this.client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  }

  private isMock() {
    return process.env.MOCK_GEMINI === 'true';
  }

  private mockText(prompt: string): GeminiMessage {
    const text = `[[MOCK GEMINI - ${this.model}]]\n\n${prompt.slice(0, 1000)}`;
    const promptTokens = Math.max(1, Math.ceil(prompt.length / 4));
    const genTokens = Math.max(20, Math.min(1500, Math.ceil(text.length / 4)));
    const usage = { promptTokenCount: promptTokens, candidatesTokenCount: genTokens, totalTokenCount: promptTokens + genTokens };
    const raw = { candidates: [{ content: [{ text }] }], modelVersion: this.model };
    return { text, raw, usage, modelVersion: this.model };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOrCreateChat(sessionId: string, systemInstruction?: string, initialHistory: any[] = []) {
    if (this.chatClients.has(sessionId)) return this.chatClients.get(sessionId);
  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = { model: this.model, history: initialHistory };
    if (systemInstruction) config.config = { systemInstruction };
    this.logger.debug(`Creating new chat client for session ${sessionId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chat = (this.client as any).chats.create(config);
    this.chatClients.set(sessionId, chat);
    return chat;
  }

  private extractResponseMetadata = (response: Record<string, unknown>): { usage: Record<string, unknown> | null; modelVersion: string } => ({
    usage: ((response?.usageMetadata || response?.usage) as Record<string, unknown> | null) || null,
    modelVersion: (response?.modelVersion || response?.model || this.model) as string
  });

  private async handleChatMessage(chat: any, message: string): Promise<GeminiMessage> { // eslint-disable-line @typescript-eslint/no-explicit-any
    this.logger.debug(`Sending message: ${message.slice(0, 50)}...`);
    const response = await chat.sendMessage({ message });
    const text = textFromResponse(response);
    const { usage, modelVersion } = this.extractResponseMetadata(response as Record<string, unknown>);
    return { text, raw: response as GeminiResponse, usage, modelVersion };
  }

  async sendMessage(sessionId: string, message: string): Promise<GeminiMessage> {
    if (this.isMock()) return this.mockText(message);
    const chat = this.chatClients.get(sessionId) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
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
