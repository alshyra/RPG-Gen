import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ChatMessage, ChatRole } from '@rpg-gen/shared';
import { Model } from 'mongoose';
import * as Schema from '../schemas/chat-history.schema.js';

// Re-export the shared ChatMessage type for convenience
export type { ChatMessage } from '@rpg-gen/shared';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private readonly MAX_MESSAGES = Number(process.env.CONV_MAX_MESSAGES || '60');

  constructor(
    @InjectModel(Schema.ChatHistory.name) private chatHistoryModel: Model<Schema.ChatHistoryDocument>,
  ) {}

  async getHistory(userId: string, characterId: string): Promise<ChatMessage[]> {
    const history = await this.chatHistoryModel.findOne({ userId, characterId }).exec();

    if (!history) return [];

    return history.messages.map(m => ({
      role: m.role as ChatRole,
      text: m.text,
      timestamp: m.timestamp,
      meta: m.meta ? { usage: m.meta.usage, model: m.meta.model } : undefined,
    }));
  }

  async append(userId: string, characterId: string, msg: ChatMessage) {
    let history = await this.chatHistoryModel.findOne({ userId, characterId });

    // Convert shared message type to schema message type
    const schemaMsg: Schema.ChatMessage = {
      role: msg.role,
      text: msg.text,
      timestamp: msg.timestamp,
      meta: msg.meta
        ? { usage: msg.meta.usage, model: msg.meta.model }
        : undefined,
    };

    if (!history) {
      history = new this.chatHistoryModel({
        userId,
        characterId,
        messages: [schemaMsg],
        lastUpdated: new Date(),
      });
    } else {
      history.messages.push(schemaMsg);
      // Prune oldest if too long
      if (history.messages.length > this.MAX_MESSAGES) {
        history.messages = history.messages.slice(-this.MAX_MESSAGES);
      }
      history.lastUpdated = new Date();
    }

    await history.save();
    this.logger.log(`💬 Saved message to character ${characterId} (${history.messages.length} messages)`);
  }

  async setHistory(userId: string, characterId: string, list: ChatMessage[]) {
    // Convert shared messages to schema messages
    const schemaMessages: Schema.ChatMessage[] = list.map(msg => ({
      role: msg.role,
      text: msg.text,
      timestamp: msg.timestamp,
      meta: msg.meta
        ? { usage: msg.meta.usage, model: msg.meta.model }
        : undefined,
    }));
    const truncated = schemaMessages.slice(-this.MAX_MESSAGES);

    await this.chatHistoryModel.findOneAndUpdate(
      { userId, characterId },
      {
        messages: truncated,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true },
    );

    this.logger.log(`📝 Set history for character ${characterId} (${truncated.length} messages)`);
  }

  async clear(userId: string, characterId: string) {
    await this.chatHistoryModel.findOneAndUpdate(
      { userId, characterId },
      {
        messages: [],
        lastUpdated: new Date(),
      },
      { upsert: true },
    );

    this.logger.log(`🗑️ Cleared history for character ${characterId}`);
  }
}
