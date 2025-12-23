import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Race } from '../../../../domain/race/entities/Race.js';
import { IRaceRepository } from '../../../../domain/race/repositories/IRaceRepository.js';
import { RaceDocument } from '../schemas/RaceDocument.js';
import { RaceMapper } from '../../mappers/RaceMapper.js';

/**
 * MongoDB implementation of IRaceRepository
 * 
 * @infrastructure game-data
 */
@Injectable()
export class MongoRaceRepository extends IRaceRepository {
  constructor(
    @InjectModel(RaceDocument.name) private raceModel: Model<RaceDocument>,
  ) {
    super();
  }

  async findById(id: string): Promise<Race | null> {
    const doc = await this.raceModel.findOne({ raceId: id }).exec();
    return doc ? RaceMapper.toDomain(doc) : null;
  }

  async findAll(): Promise<Race[]> {
    const docs = await this.raceModel.find().exec();
    return docs.map(doc => RaceMapper.toDomain(doc));
  }

  async upsert(race: Race): Promise<void> {
    const data = RaceMapper.toPersistence(race);
    await this.raceModel.updateOne(
      { raceId: race.id },
      { $set: data },
      { upsert: true }
    ).exec();
  }

  async delete(id: string): Promise<void> {
    await this.raceModel.deleteOne({ raceId: id }).exec();
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.raceModel.countDocuments({ raceId: id }).exec();
    return count > 0;
  }
}
