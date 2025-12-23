import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ItemDefinition } from '../../../../domain/item/entities/ItemDefinition.js';
import { IItemRepository } from '../../../../domain/item/repositories/IItemRepository.js';
import { ItemDocument } from '../schemas/ItemDocument.js';
import { ItemMapper } from '../../mappers/ItemMapper.js';

/**
 * MongoDB implementation of IItemRepository
 * 
 * @infrastructure game-data
 */
@Injectable()
export class MongoItemRepository extends IItemRepository {
  constructor(
    @InjectModel(ItemDocument.name) private itemModel: Model<ItemDocument>,
  ) {
    super();
  }

  async findById(definitionId: string): Promise<ItemDefinition | null> {
    const doc = await this.itemModel.findOne({ definitionId }).exec();
    return doc ? ItemMapper.toDomain(doc) : null;
  }

  async findByIds(definitionIds: string[]): Promise<ItemDefinition[]> {
    const docs = await this.itemModel.find({ definitionId: { $in: definitionIds } }).exec();
    return docs.map(doc => ItemMapper.toDomain(doc));
  }

  async findAll(): Promise<ItemDefinition[]> {
    const docs = await this.itemModel.find().exec();
    return docs.map(doc => ItemMapper.toDomain(doc));
  }

  async findByType(type: string): Promise<ItemDefinition[]> {
    const docs = await this.itemModel.find({ 'meta.type': type }).exec();
    return docs.map(doc => ItemMapper.toDomain(doc));
  }

  async findStarters(): Promise<ItemDefinition[]> {
    const docs = await this.itemModel.find({ 'meta.starter': true }).exec();
    return docs.map(doc => ItemMapper.toDomain(doc));
  }

  async upsert(item: ItemDefinition): Promise<void> {
    const data = ItemMapper.toPersistence(item);
    await this.itemModel.updateOne(
      { definitionId: item.definitionId },
      { $set: data },
      { upsert: true }
    ).exec();
  }

  async bulkUpsert(items: ItemDefinition[]): Promise<void> {
    const operations = items.map(item => ({
      updateOne: {
        filter: { definitionId: item.definitionId },
        update: { $set: ItemMapper.toPersistence(item) },
        upsert: true,
      },
    }));
    await this.itemModel.bulkWrite(operations);
  }

  async delete(definitionId: string): Promise<void> {
    await this.itemModel.deleteOne({ definitionId }).exec();
  }

  async exists(definitionId: string): Promise<boolean> {
    const count = await this.itemModel.countDocuments({ definitionId }).exec();
    return count > 0;
  }
}
