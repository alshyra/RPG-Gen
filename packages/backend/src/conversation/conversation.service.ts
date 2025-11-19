import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ChatMessageDto } from '@rpg/shared';
import { Conversation, ConversationDocument } from '../schemas/conversation.schema';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private readonly MAX_MESSAGES = Number(process.env.CONV_MAX_MESSAGES || '60');

  constructor(
    @InjectModel(Conversation.name) private conversationHistoryModel: Model<ConversationDocument>,
  ) {}

  async getHistory(userId: string, characterId: string): Promise<ChatMessageDto[]> {
    const history = await this.conversationHistoryModel.findOne({ userId, characterId }).exec();

    if (!history) return [];

    return history.messages.map(m => ({
      role: m.role,
      text: m.text,
      timestamp: m.timestamp,
      meta: m.meta ? { usage: m.meta.usage, model: m.meta.model } : undefined,
    }));
  }

  async append(userId: string, characterId: string, msg: ChatMessageDto) {
    let history = await this.conversationHistoryModel.findOne({ userId, characterId });

    if (!history) {
      history = new this.conversationHistoryModel({
        userId,
        characterId,
        messages: [msg],
        lastUpdated: new Date(),
      });
    } else {
      history.messages.push(msg);
      // Prune oldest if too long
      if (history.messages.length > this.MAX_MESSAGES) {
        history.messages = history.messages.slice(-this.MAX_MESSAGES);
      }
      history.lastUpdated = new Date();
    }

    await history.save();
    this.logger.log(`💬 Saved message to character ${characterId} (${history.messages.length} messages)`);
  }

  async setHistory(userId: string, characterId: string, list: ChatMessageDto[]) {
    const truncated = list.slice(-this.MAX_MESSAGES);

    await this.conversationHistoryModel.findOneAndUpdate(
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
    await this.conversationHistoryModel.findOneAndUpdate(
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
