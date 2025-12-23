import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from '../../../domain/conversation/entities/Conversation.js';
import { IConversationRepository } from '../../../domain/conversation/repositories/IConversationRepository.js';
import { ConversationDocument, ConversationSchema } from '../schemas/ConversationDocument.js';
import { ConversationMapper } from '../mappers/ConversationMapper.js';

/**
 * MongoDB implementation of IConversationRepository
 * 
 * @infrastructure game-narrative
 */
@Injectable()
export class MongoConversationRepository implements IConversationRepository {
  private readonly logger = new Logger(MongoConversationRepository.name);

  constructor(@InjectModel(ConversationSchema.name) private conversationModel: Model<ConversationDocument>) {}

  async findByUserAndCharacter(userId: string, characterId: string): Promise<Conversation | null> {
    const doc = await this.conversationModel.findOne({ userId, characterId }).exec();
    return doc ? ConversationMapper.toDomain(doc) : null;
  }

  async save(conversation: Conversation): Promise<void> {
    await this.conversationModel.updateOne(
      { userId: conversation.userId, characterId: conversation.characterId },
      {
        userId: conversation.userId,
        characterId: conversation.characterId,
        messages: conversation.messages.map(msg => ({
          role: msg.role,
          narrative: msg.narrative,
          instructions: msg.instructions,
          timestamp: msg.timestamp,
        })),
        updatedAt: conversation.updatedAt,
      },
      { upsert: true },
    );
  }

  async delete(userId: string, characterId: string): Promise<void> {
    await this.conversationModel.deleteOne({ userId, characterId }).exec();
  }

  async exists(userId: string, characterId: string): Promise<boolean> {
    const count = await this.conversationModel.countDocuments({ userId, characterId }).exec();
    return count > 0;
  }

  async findByUser(userId: string): Promise<Conversation[]> {
    const docs = await this.conversationModel.find({ userId }).exec();
    return docs.map(doc => ConversationMapper.toDomain(doc));
  }

  async findByCharacter(characterId: string): Promise<Conversation[]> {
    const docs = await this.conversationModel.find({ characterId }).exec();
    return docs.map(doc => ConversationMapper.toDomain(doc));
  }
}
