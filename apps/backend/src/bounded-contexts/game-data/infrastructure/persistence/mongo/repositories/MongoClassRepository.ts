import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CharacterClass } from '../../../../domain/class/entities/CharacterClass.js';
import { IClassRepository } from '../../../../domain/class/repositories/IClassRepository.js';
import { ClassDocument } from '../schemas/ClassDocument.js';
import { ClassMapper } from '../../mappers/ClassMapper.js';

/**
 * MongoDB implementation of IClassRepository
 * 
 * @infrastructure game-data
 */
@Injectable()
export class MongoClassRepository extends IClassRepository {
  constructor(
    @InjectModel(ClassDocument.name) private classModel: Model<ClassDocument>,
  ) {
    super();
  }

  async findByName(name: string): Promise<CharacterClass | null> {
    const doc = await this.classModel.findOne({ name }).exec();
    return doc ? ClassMapper.toDomain(doc) : null;
  }

  async findAll(): Promise<CharacterClass[]> {
    const docs = await this.classModel.find().exec();
    return docs.map(doc => ClassMapper.toDomain(doc));
  }

  async upsert(characterClass: CharacterClass): Promise<void> {
    const data = ClassMapper.toPersistence(characterClass);
    await this.classModel.updateOne(
      { name: characterClass.name },
      { $set: data },
      { upsert: true }
    ).exec();
  }

  async delete(name: string): Promise<void> {
    await this.classModel.deleteOne({ name }).exec();
  }

  async exists(name: string): Promise<boolean> {
    const count = await this.classModel.countDocuments({ name }).exec();
    return count > 0;
  }
}
