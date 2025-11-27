import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessageDto } from './dto/ChatMessageDto.js';
import { ChatHistory, ChatHistoryDocument } from './schema/index.js';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private readonly MAX_MESSAGES = Number(process.env.CONV_MAX_MESSAGES || '60');

  constructor(
    @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistoryDocument>,
  ) {}

  async getHistory(userId: string, characterId: string) {
    const history = await this.chatHistoryModel.findOne({ userId, characterId }).exec();

    if (!history) return [];

    return history.messages;
  }

  async append(userId: string, characterId: string, msg: ChatMessageDto) {
    let history = await this.chatHistoryModel.findOne({ userId, characterId });

    if (!history) {
      history = new this.chatHistoryModel({
        userId,
        characterId,
        messages: [msg],
        lastUpdated: new Date(),
      });
      await history.save();
      this.logger.log(`💬 Saved new history to character ${characterId})`);
      return;
    }

    history.messages.push(msg);
    if (history.messages.length > this.MAX_MESSAGES) {
      history.messages = history.messages.slice(-this.MAX_MESSAGES);
    }
    history.lastUpdated = new Date();

    await history.save();
    this.logger.log(`💬 Saved message to character ${characterId} (${history.messages.length} messages)`);
  }
}
