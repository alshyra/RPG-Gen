import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

function textFromResponse(data: any): string {
  if (!data) return '';
  // If the SDK gave us a JSON string, try to parse and re-evaluate
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return textFromResponse(parsed);
    } catch (_) {
      return data;
    }
  }

  if (data.outputText) return data.outputText;

  // Common SDK shape: { candidates: [ { content: { parts: [ { text } ] } } ] }
  if (data.candidates && Array.isArray(data.candidates) && data.candidates.length) {
    const c = data.candidates[0];
    const content = c?.content;
    // content may be an array or an object with parts
    if (Array.isArray(content)) {
      // e.g. [{ text: '...' }] or [{ parts: [ { text } ] }]
      if (content[0]?.text) return content[0].text;
      if (content[0]?.parts && Array.isArray(content[0].parts) && content[0].parts[0]?.text) return content[0].parts[0].text;
    } else if (content && typeof content === 'object') {
      if (content.text) return content.text;
      if (Array.isArray(content.parts) && content.parts[0]?.text) return content.parts[0].text;
    }
    // fallback common fields
    if (c.output) return typeof c.output === 'string' ? c.output : JSON.stringify(c.output);
  }

  // another common nested shape: candidates[].content.parts[].text
  if (data.candidates && Array.isArray(data.candidates)) {
    for (const cand of data.candidates) {
      const t = cand?.content?.parts?.[0]?.text;
      if (t) return t;
    }
  }

  if (data.result && data.result.outputText) return data.result.outputText;
  // last resort: stringify
  return JSON.stringify(data);
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private client: any | null = null;
  private model = 'gemini-2.0-flash';
  private chatClients = new Map<string, any>(); // sessionId -> chat client

  constructor() {
    this.logger.debug('Initializing GeminiService', process.env.GOOGLE_API_KEY ? '***' : 'no API key');
    this.client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || undefined });
  }

  private isMock() {
    return process.env.MOCK_GEMINI === 'true';
  }

  private mockText(prompt: string) {
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
  getOrCreateChat(sessionId: string, systemInstruction?: string, initialHistory: any[] = []) {
    if (this.chatClients.has(sessionId)) return this.chatClients.get(sessionId);
  
    const config: any = { model: this.model, history: initialHistory };
    if (systemInstruction) config.config = { systemInstruction };
    this.logger.debug(`Creating new chat client for session ${sessionId}`);
    this.chatClients.set(sessionId, this.client.chats.create(config));
    return this.chatClients.get(sessionId);
  }

  /**
   * Send a message via an existing chat session. Returns { text, raw, usage, modelVersion }
   */
  async sendMessage(sessionId: string, message: string) {
    if (this.isMock()) return this.mockText(message);

    const chat = this.chatClients.get(sessionId);
    if (!chat) throw new Error(`Chat session ${sessionId} not found. Call getOrCreateChat first.`);

    try {
      this.logger.debug(`Sending message to chat ${sessionId}: ${message.slice(0, 50)}...`);
      const response = await chat.sendMessage({ message });
      const text = textFromResponse(response);
      const usage = response?.usageMetadata || response?.usage || null;
      const modelVersion = response?.modelVersion || response?.model || this.model;
      return { text, raw: response, usage, modelVersion };
    } catch (e: any) {
      this.logger.warn(`Chat sendMessage failed for ${sessionId}`, e?.stack || e);
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
