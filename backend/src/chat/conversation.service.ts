import { Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile, readFile as fsReadFile } from 'fs/promises';
import { join } from 'path';
import type { ChatMessage } from '../../../shared/types';

// Re-export for convenience
export type { ChatMessage, ChatRole } from '../../../shared/types';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private store = new Map<string, ChatMessage[]>();
  private readonly MAX_MESSAGES = Number(process.env.CONV_MAX_MESSAGES || '60');
  private readonly ARCHIVE_DIR = join(process.cwd(), 'archives');

  constructor() {
    this.ensureArchiveDir();
  }

  private async ensureArchiveDir() {
    try {
      await mkdir(this.ARCHIVE_DIR, { recursive: true });
    } catch {
      this.logger.error('Failed to create archives directory');
    }
  }

  private getHistoryPath(id: string): string {
    return join(this.ARCHIVE_DIR, id, 'history.json');
  }

  private async saveToFile(id: string, messages: ChatMessage[]) {
    try {
      const dir = join(this.ARCHIVE_DIR, id);
      await mkdir(dir, { recursive: true });
      const path = this.getHistoryPath(id);
      await writeFile(path, JSON.stringify(messages, null, 2), 'utf-8');
      this.logger.log(`📁 Saved history to ${path} (${messages.length} messages)`);
    } catch (e) {
      this.logger.error(`Failed to save history for session ${id}`, e);
    }
  }

  private async loadFromFile(id: string): Promise<ChatMessage[] | null> {
    try {
      const path = this.getHistoryPath(id);
      const data = await fsReadFile(path, 'utf-8');
      return JSON.parse(data);
    } catch {
      // File doesn't exist or is invalid, that's ok
      return null;
    }
  }

  async getHistory(id: string): Promise<ChatMessage[]> {
    // Check in-memory first
    if (this.store.has(id)) {
      return [...this.store.get(id)!];
    }
    
    // Try to load from file
    const fileHistory = await this.loadFromFile(id);
    if (fileHistory) {
      this.store.set(id, fileHistory);
      return [...fileHistory];
    }
    
    return [];
  }

  async append(id: string, msg: ChatMessage) {
    const arr = this.store.get(id) || [];
    arr.push(msg);
    // prune oldest if too long
    if (arr.length > this.MAX_MESSAGES) arr.splice(0, arr.length - this.MAX_MESSAGES);
    this.store.set(id, arr);
    
    // Persist to file
    await this.saveToFile(id, arr);
  }

  async setHistory(id: string, list: ChatMessage[]) {
    const truncated = list.slice(-this.MAX_MESSAGES);
    this.store.set(id, truncated);
    
    // Persist to file
    await this.saveToFile(id, truncated);
  }

  async clear(id: string) {
    this.store.delete(id);
    await this.saveToFile(id, []);
  }
}
