import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ArchetypeDocument } from '../schemas/ArchetypeDocument.js';
import { ArchetypeMapper } from '../mappers/ArchetypeMapper.js';
import { IArchetypeRepository } from '#archetype/domain/index.js';
import { Archetype } from '#archetype/domain/entities/Archetype.js';

/**
 * MongoDB implementation of IArchetypeRepository
 *
 * @description
 * Handles all persistence operations for Archetype aggregate.
 * Uses ArchetypeMapper to convert between MongoDB documents and domain entities.
 *
 * Adapter pattern: Isolates MongoDB-specific code from domain logic.
 */
@Injectable()
export class MongoArchetypeRepository implements IArchetypeRepository {
  private readonly logger = new Logger(MongoArchetypeRepository.name);

  constructor(
    @InjectModel(ArchetypeDocument.name)
    private readonly model: Model<ArchetypeDocument>,
  ) {}

  /**
   * Retrieve all archetypes sorted by name
   */
  async findAll(): Promise<Archetype[]> {
    const documents = await this.model.find().sort({ name: 1 }).exec();
    return documents.map(doc => ArchetypeMapper.toDomain(doc));
  }

  /**
   * Retrieve an archetype by its unique name (id)
   */
  async findByName(name: string): Promise<Archetype | null> {
    const document = await this.model.findOne({ name }).exec();
    return document ? ArchetypeMapper.toDomain(document) : null;
  }

  /**
   * Retrieve an archetype by name, throw if not found
   */
  async findByNameOrThrow(name: string): Promise<Archetype> {
    const archetype = await this.findByName(name);
    if (!archetype) {
      this.logger.warn(`Archetype not found: ${name}`);
      throw new NotFoundException(`Archetype not found: ${name}`);
    }
    return archetype;
  }

  /**
   * Save or update an archetype
   */
  async save(archetype: Archetype): Promise<Archetype> {
    const persistenceData = ArchetypeMapper.toPersistence(archetype);

    const existing = await this.model.findOne({ name: archetype.name }).exec();
    if (existing) {
      Object.assign(existing, persistenceData);
      await existing.save();
      return ArchetypeMapper.toDomain(existing);
    }

    const created = new this.model(persistenceData);
    const saved = await created.save();
    return ArchetypeMapper.toDomain(saved);
  }

  /**
   * Delete an archetype by name
   */
  async delete(name: string): Promise<void> {
    const result = await this.model.deleteOne({ name }).exec();
    if (result.deletedCount === 0) {
      this.logger.warn(`Archetype not found for deletion: ${name}`);
      throw new NotFoundException(`Archetype not found: ${name}`);
    }
  }
}
