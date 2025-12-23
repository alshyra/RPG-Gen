import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EnemyDefinition } from '../../../../domain/enemy/entities/EnemyDefinition.js';
import { IEnemyRepository } from '../../../../domain/enemy/repositories/IEnemyRepository.js';
import { EnemyDocument } from '../schemas/EnemyDocument.js';
import { EnemyMapper } from '../../mappers/EnemyMapper.js';

/**
 * MongoDB implementation of IEnemyRepository
 * 
 * @infrastructure game-data
 */
@Injectable()
export class MongoEnemyRepository extends IEnemyRepository {
  constructor(
    @InjectModel(EnemyDocument.name) private enemyModel: Model<EnemyDocument>,
  ) {
    super();
  }

  async findById(id: string): Promise<EnemyDefinition | null> {
    const doc = await this.enemyModel.findOne({ enemyId: id }).exec();
    return doc ? EnemyMapper.toDomain(doc) : null;
  }

  async findByName(name: string): Promise<EnemyDefinition | null> {
    const doc = await this.enemyModel.findOne({ name }).exec();
    return doc ? EnemyMapper.toDomain(doc) : null;
  }

  async findByIds(ids: string[]): Promise<EnemyDefinition[]> {
    const docs = await this.enemyModel.find({ enemyId: { $in: ids } }).exec();
    return docs.map(doc => EnemyMapper.toDomain(doc));
  }

  async findAll(): Promise<EnemyDefinition[]> {
    const docs = await this.enemyModel.find().exec();
    return docs.map(doc => EnemyMapper.toDomain(doc));
  }

  async findByLevelRange(minLevel: number, maxLevel: number): Promise<EnemyDefinition[]> {
    const docs = await this.enemyModel.find({
      level: { $gte: minLevel, $lte: maxLevel }
    }).exec();
    return docs.map(doc => EnemyMapper.toDomain(doc));
  }

  async upsert(enemy: EnemyDefinition): Promise<void> {
    const data = EnemyMapper.toPersistence(enemy);
    await this.enemyModel.updateOne(
      { enemyId: enemy.id },
      { $set: data },
      { upsert: true }
    ).exec();
  }

  async bulkUpsert(enemies: EnemyDefinition[]): Promise<void> {
    const operations = enemies.map(enemy => ({
      updateOne: {
        filter: { enemyId: enemy.id },
        update: { $set: EnemyMapper.toPersistence(enemy) },
        upsert: true,
      },
    }));
    await this.enemyModel.bulkWrite(operations);
  }

  async delete(id: string): Promise<void> {
    await this.enemyModel.deleteOne({ enemyId: id }).exec();
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.enemyModel.countDocuments({ enemyId: id }).exec();
    return count > 0;
  }
}
