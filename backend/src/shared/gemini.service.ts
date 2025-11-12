import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

type GeminiResponse = Record<string, unknown>;

interface GeminiMessage {
  text: string;
  raw: GeminiResponse;
  usage: Record<string, unknown> | null;
  modelVersion: string;
}

function textFromResponse(data: unknown): string {
  if (!data) return '';
  const obj = data as Record<string, unknown>;
  
  // If the SDK gave us a JSON string, try to parse and re-evaluate
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return textFromResponse(parsed);
    } catch {
      return data;
    }
  }

  if (obj.outputText) return obj.outputText as string;

  // Common SDK shape: { candidates: [ { content: { parts: [ { text } ] } } ] }
  if (obj.candidates && Array.isArray(obj.candidates) && obj.candidates.length) {
    const c = (obj.candidates[0] as Record<string, unknown>) || {};
    const content = c?.content as Record<string, unknown> | Array<unknown>;
    
    if (Array.isArray(content)) {
      const first = (content[0] as Record<string, unknown>);
      if (first?.text) return first.text as string;
      const parts = first?.parts as Array<unknown>;
      if (Array.isArray(parts) && (parts[0] as Record<string, unknown>)?.text) return (parts[0] as Record<string, unknown>).text as string;
    } else if (content && typeof content === 'object') {
      if (content.text) return content.text as string;
      const parts = content.parts as Array<unknown>;
      if (Array.isArray(parts) && (parts[0] as Record<string, unknown>)?.text) return (parts[0] as Record<string, unknown>).text as string;
    }
    if (c.output) return typeof c.output === 'string' ? c.output : JSON.stringify(c.output);
  }

  // another common nested shape: candidates[].content.parts[].text
  if (obj.candidates && Array.isArray(obj.candidates)) {
    for (const cand of obj.candidates) {
      const candObj = cand as Record<string, unknown>;
      const contentObj = candObj?.content as Record<string, unknown>;
      const parts = contentObj?.parts as Array<unknown>;
      if (Array.isArray(parts)) {
        const t = (parts[0] as Record<string, unknown>)?.text;
        if (t) return t as string;
      }
    }
  }

  const result = (obj.result as Record<string, unknown>);
  if (result?.outputText) return result.outputText as string;
  
  return JSON.stringify(data);
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private client: GoogleGenAI | null = null;
  private model = 'gemini-2.5-flash';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chatClients = new Map<string, any>();

  constructor() {
    this.logger.debug('Initializing GeminiService', process.env.GOOGLE_API_KEY ? '***' : 'no API key');
    this.client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || undefined });
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

  /**
   * Get or create a persistent chat client for a sessionId.
   * Initialize with optional system instruction and history.
   */
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

  /**
   * Send a message via an existing chat session. Returns { text, raw, usage, modelVersion }
   */
  async sendMessage(sessionId: string, message: string): Promise<GeminiMessage> {
    if (this.isMock()) return this.mockText(message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chat = this.chatClients.get(sessionId) as any;
    if (!chat) throw new Error(`Chat session ${sessionId} not found. Call getOrCreateChat first.`);

    try {
      this.logger.debug(`Sending message to chat ${sessionId}: ${message.slice(0, 50)}...`);
      const response = await chat.sendMessage({ message });
      const text = textFromResponse(response);
      const usage = ((response as Record<string, unknown>)?.usageMetadata || (response as Record<string, unknown>)?.usage) as Record<string, unknown> | null || null;
      const modelVersion = ((response as Record<string, unknown>)?.modelVersion || (response as Record<string, unknown>)?.model || this.model) as string;
      return { text, raw: response as GeminiResponse, usage, modelVersion };
    } catch (e) {
      this.logger.warn(`Chat sendMessage failed for ${sessionId}`, (e as Error)?.stack || e);
      throw e;
    }
  }

  /**
   * Clear a chat session (for cleanup, e.g., when session expires)
   */
  clearChat(sessionId: string) {
    this.chatClients.delete(sessionId);
    this.logger.debug(`Cleared chat session ${sessionId}`);
  }
}
