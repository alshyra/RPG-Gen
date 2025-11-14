import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ChatMessage } from '../../../shared/types';
import { ChatHistory, ChatHistoryDocument } from '../schemas/chat-history.schema';

// Re-export for convenience
export type { ChatMessage, ChatRole } from '../../../shared/types';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private readonly MAX_MESSAGES = Number(process.env.CONV_MAX_MESSAGES || '60');

  constructor(
    @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistoryDocument>
  ) {}

  async getHistory(userId: string, sessionId: string): Promise<ChatMessage[]> {
    const history = await this.chatHistoryModel.findOne({ userId, sessionId }).exec();
    if (history) {
      return history.messages.map(m => ({
        role: m.role,
        text: m.text,
        timestamp: m.timestamp,
        meta: (m.meta ? { ...m.meta } : undefined) as Record<string, unknown> | undefined,
      })) as ChatMessage[];
    }
    return [];
  }

  async append(userId: string, sessionId: string, msg: ChatMessage) {
    let history = await this.chatHistoryModel.findOne({ userId, sessionId });
    
    if (!history) {
      history = new this.chatHistoryModel({
        userId,
        sessionId,
        messages: [msg],
        lastUpdated: new Date(),
      });
    } else {
      history.messages.push(msg as any);
      // Prune oldest if too long
      if (history.messages.length > this.MAX_MESSAGES) {
        history.messages = history.messages.slice(-this.MAX_MESSAGES);
      }
      history.lastUpdated = new Date();
    }

    await history.save();
    this.logger.log(`💬 Saved message to session ${sessionId} (${history.messages.length} messages)`);
  }

  async setHistory(userId: string, sessionId: string, list: ChatMessage[]) {
    const truncated = list.slice(-this.MAX_MESSAGES);
    
    await this.chatHistoryModel.findOneAndUpdate(
      { userId, sessionId },
      {
        messages: truncated,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );
    
    this.logger.log(`📝 Set history for session ${sessionId} (${truncated.length} messages)`);
  }

  async clear(userId: string, sessionId: string) {
    await this.chatHistoryModel.findOneAndUpdate(
      { userId, sessionId },
      {
        messages: [],
        lastUpdated: new Date(),
      },
      { upsert: true }
    );
    
    this.logger.log(`🗑️ Cleared history for session ${sessionId}`);
  }
}
