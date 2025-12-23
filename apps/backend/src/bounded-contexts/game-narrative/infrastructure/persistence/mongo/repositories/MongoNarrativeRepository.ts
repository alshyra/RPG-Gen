import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Narrative } from '../../../domain/narrative/entities/Narrative.js';
import { INarrativeRepository } from '../../../domain/narrative/repositories/INarrativeRepository.js';
import { NarrativeDocument, NarrativeSchema } from '../schemas/NarrativeDocument.js';
import { NarrativeMapper } from '../mappers/NarrativeMapper.js';

/**
 * MongoDB implementation of INarrativeRepository
 * 
 * @infrastructure game-narrative
 */
@Injectable()
export class MongoNarrativeRepository implements INarrativeRepository {
  private readonly logger = new Logger(MongoNarrativeRepository.name);

  constructor(@InjectModel(NarrativeSchema.name) private narrativeModel: Model<NarrativeDocument>) {}

  async findByUserAndCharacter(userId: string, characterId: string): Promise<Narrative | null> {
    const doc = await this.narrativeModel.findOne({ userId, characterId }).exec();
    return doc ? NarrativeMapper.toDomain(doc) : null;
  }

  async findBySessionId(sessionId: string): Promise<Narrative | null> {
    const doc = await this.narrativeModel.findOne({ sessionId }).exec();
    return doc ? NarrativeMapper.toDomain(doc) : null;
  }

  async save(narrative: Narrative): Promise<void> {
    await this.narrativeModel.updateOne(
      { userId: narrative.userId, characterId: narrative.characterId },
      {
        userId: narrative.userId,
        characterId: narrative.characterId,
        sessionId: narrative.sessionId,
        messages: narrative.messages.map(msg => NarrativeMapper.messageToPersistence(msg)),
        context: {
          characterContext: narrative.context.characterContext,
          systemPrompt: narrative.context.systemPrompt,
          scenarioPrompt: narrative.context.scenarioPrompt,
        },
        updatedAt: new Date(),
      },
      { upsert: true },
    );
  }

  async delete(userId: string, characterId: string): Promise<void> {
    await this.narrativeModel.deleteOne({ userId, characterId }).exec();
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    await this.narrativeModel.deleteOne({ sessionId }).exec();
  }
}
