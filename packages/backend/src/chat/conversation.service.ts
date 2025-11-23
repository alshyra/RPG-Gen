import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ChatMessage, MessageMetaDto } from '@rpg-gen/shared';
import { ChatHistory, ChatHistoryDocument } from '../schemas/chat-history.schema.js';

// Re-export for convenience
export type { ChatMessage } from '@rpg-gen/shared';

@Injectable()
export class ConversationService implements OnModuleInit {
  private readonly logger = new Logger(ConversationService.name);
  private readonly MAX_MESSAGES = Number(process.env.CONV_MAX_MESSAGES || '60');

  constructor(
    @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistoryDocument>,
  ) {}

  /**
   * On startup make sure any legacy indexes (userId + sessionId) are removed
   * and the expected unique index (userId + characterId) exists. This prevents
   * duplicate-key errors when sessionId was previously null and multiple
   * characters were used for the same user.
   */
  async onModuleInit(): Promise<void> {
    try {
      const indexes = await this.chatHistoryModel.collection.indexes();

      const hasLegacyIndex = indexes.some((ix: any) => ix.key && ix.key.userId === 1 && ix.key.sessionId === 1);
      if (hasLegacyIndex) {
        try {
          // drop legacy index by name if present
          await this.chatHistoryModel.collection.dropIndex('userId_1_sessionId_1');
          this.logger.log('Dropped legacy index userId_1_sessionId_1 from chat history collection');
        } catch (e) {
          this.logger.warn('Failed to drop legacy userId_1_sessionId_1 index: ' + String(e));
        }
      }

      const hasCharacterIndex = indexes.some((ix: any) => ix.key && ix.key.userId === 1 && ix.key.characterId === 1);
      if (!hasCharacterIndex) {
        try {
          await this.chatHistoryModel.collection.createIndex({ userId: 1, characterId: 1 }, { unique: true });
          this.logger.log('Created unique index userId_1_characterId_1 for chat history collection');
        } catch (e) {
          this.logger.warn('Failed to create index userId_1_characterId_1: ' + String(e));
        }
      }
    } catch (e) {
      this.logger.warn('Could not inspect chat history indexes: ' + String(e));
    }
  }

  async getHistory(userId: string, characterId: string): Promise<ChatMessage[]> {
    const history = await this.chatHistoryModel.findOne({ userId, characterId }).exec();

    if (!history) return [];

    return history.messages.map(m => ({
      role: m.role,
      text: m.text,
      timestamp: m.timestamp,
      meta: (m.meta ? ({ ...m.meta } as MessageMetaDto) : undefined) as MessageMetaDto | undefined,
    })) as ChatMessage[];
  }

  async append(userId: string, characterId: string, msg: ChatMessage) {
    let history = await this.chatHistoryModel.findOne({ userId, characterId });

    if (!history) {
      history = new this.chatHistoryModel({
        userId,
        characterId,
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
    this.logger.log(`💬 Saved message to character ${characterId} (${history.messages.length} messages)`);
  }

  async setHistory(userId: string, characterId: string, list: ChatMessage[]) {
    const truncated = list.slice(-this.MAX_MESSAGES);

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
