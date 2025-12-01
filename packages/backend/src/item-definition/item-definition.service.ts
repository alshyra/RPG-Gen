import {
  Injectable, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ItemDefinition, ItemDefinitionDocument,
} from './item-definition.schema.js';

@Injectable()
export class ItemDefinitionService {
  private readonly logger = new Logger(ItemDefinitionService.name);

  constructor(@InjectModel(ItemDefinition.name) private model: Model<ItemDefinitionDocument>) {}

  async findAll(): Promise<ItemDefinition[]> {
    return this.model.find()
      .sort({ name: 1 })
      .exec();
  }

  async findByDefinitionId(id: string): Promise<ItemDefinition | null> {
    return this.model.findOne({ definitionId: id })
      .exec();
  }

  async upsert(def: Partial<ItemDefinition>) {
    if (!def.definitionId) throw new Error('definitionId required');
    const existing = await this.model.findOne({ definitionId: def.definitionId })
      .exec();
    if (existing) {
      Object.assign(existing, def);
      return existing.save();
    }
    const created = new this.model(def);
    return created.save();
  }
}
