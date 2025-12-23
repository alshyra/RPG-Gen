import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NarrativeContext } from '../../domain/narrative/entities/NarrativeContext.js';
import { INarrativeContextRepository } from '../../domain/narrative/repositories/INarrativeContextRepository.js';
import { NarrativeContextDocument, NarrativeContextSchema } from '../mongo/schemas/NarrativeContextDocument.js';
import { NarrativeContextMapper } from '../mappers/NarrativeContextMapper.js';

/**
 * MongoDB implementation of INarrativeContextRepository
 * 
 * @infrastructure game-narrative
 */
@Injectable()
export class MongoNarrativeContextRepository implements INarrativeContextRepository {
  private readonly logger = new Logger(MongoNarrativeContextRepository.name);

  constructor(@InjectModel(NarrativeContextSchema.name) private contextModel: Model<NarrativeContextDocument>) {}

  async findBySessionId(sessionId: string): Promise<NarrativeContext | null> {
    const doc = await this.contextModel.findOne({ sessionId }).exec();
    return doc ? NarrativeContextMapper.toDomain(doc) : null;
  }

  async save(context: NarrativeContext): Promise<void> {
    await this.contextModel.updateOne(
      { sessionId: context.sessionId },
      NarrativeContextMapper.toDocument(context),
      { upsert: true },
    );
  }

  async delete(sessionId: string): Promise<void> {
    await this.contextModel.deleteOne({ sessionId }).exec();
  }

  async exists(sessionId: string): Promise<boolean> {
    const count = await this.contextModel.countDocuments({ sessionId }).exec();
    return count > 0;
  }
}
