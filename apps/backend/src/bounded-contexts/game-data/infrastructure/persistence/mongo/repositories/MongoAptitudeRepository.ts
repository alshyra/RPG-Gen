import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Aptitude } from '../../../../domain/aptitude/entities/Aptitude.js';
import { IAptitudeRepository } from '../../../../domain/aptitude/repositories/IAptitudeRepository.js';
import { AptitudeDocument } from '../schemas/AptitudeDocument.js';
import { AptitudeMapper } from '../../mappers/AptitudeMapper.js';

/**
 * MongoDB implementation of IAptitudeRepository
 * 
 * @infrastructure game-data
 */
@Injectable()
export class MongoAptitudeRepository extends IAptitudeRepository {
  constructor(
    @InjectModel(AptitudeDocument.name) private aptitudeModel: Model<AptitudeDocument>,
  ) {
    super();
  }

  async findById(id: string): Promise<Aptitude | null> {
    const doc = await this.aptitudeModel.findOne({ aptitudeId: id }).exec();
    return doc ? AptitudeMapper.toDomain(doc) : null;
  }

  async findByIds(ids: string[]): Promise<Aptitude[]> {
    const docs = await this.aptitudeModel.find({ aptitudeId: { $in: ids } }).exec();
    return docs.map(doc => AptitudeMapper.toDomain(doc));
  }

  async findAll(): Promise<Aptitude[]> {
    const docs = await this.aptitudeModel.find().exec();
    return docs.map(doc => AptitudeMapper.toDomain(doc));
  }

  async findByEffectType(effectType: string): Promise<Aptitude[]> {
    const docs = await this.aptitudeModel.find({ effectType }).exec();
    return docs.map(doc => AptitudeMapper.toDomain(doc));
  }

  async upsert(aptitude: Aptitude): Promise<void> {
    const data = AptitudeMapper.toPersistence(aptitude);
    await this.aptitudeModel.updateOne(
      { aptitudeId: aptitude.id },
      { $set: data },
      { upsert: true }
    ).exec();
  }

  async bulkUpsert(aptitudes: Aptitude[]): Promise<void> {
    const operations = aptitudes.map(aptitude => ({
      updateOne: {
        filter: { aptitudeId: aptitude.id },
        update: { $set: AptitudeMapper.toPersistence(aptitude) },
        upsert: true,
      },
    }));
    await this.aptitudeModel.bulkWrite(operations);
  }

  async delete(id: string): Promise<void> {
    await this.aptitudeModel.deleteOne({ aptitudeId: id }).exec();
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.aptitudeModel.countDocuments({ aptitudeId: id }).exec();
    return count > 0;
  }
}
