import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ICharacterRepository } from "../../../../domain/character/repositories/ICharacterRepository.js";
import { CharacterEntity } from "../../../../domain/character/entities/CharacterEntity.js";
import { Character, CharacterDocument } from "../../../mongo/index.js";
import { CharacterMapper } from "../mappers/CharacterMapper.js";

/**
 * MongoDB implementation of the Character repository.
 */
@Injectable()
export class MongoCharacterRepository implements ICharacterRepository {
  private readonly logger = new Logger(MongoCharacterRepository.name);

  constructor(
    @InjectModel(Character.name) private readonly model: Model<CharacterDocument>,
  ) {}

  async findById(characterId: string): Promise<CharacterEntity | null> {
    const doc = await this.model.findOne({ characterId }).exec();
    return doc ? CharacterMapper.toDomain(doc) : null;
  }

  async findByUserAndId(userId: string, characterId: string): Promise<CharacterEntity | null> {
    const doc = await this.model.findOne({ userId, characterId }).exec();
    return doc ? CharacterMapper.toDomain(doc) : null;
  }

  async findByUserId(userId: string, includeDeceased = false): Promise<CharacterEntity[]> {
    const filter: { userId: string; isDeceased?: boolean } = { userId };
    if (!includeDeceased) {
      filter.isDeceased = false;
    }
    const docs = await this.model.find(filter).sort({ createdAt: -1 }).exec();
    return CharacterMapper.toDomainMany(docs);
  }

  async findDraftsByUserId(userId: string): Promise<CharacterEntity[]> {
    const docs = await this.model
      .find({ userId, state: "draft", isDeceased: false })
      .sort({ createdAt: -1 })
      .exec();
    return CharacterMapper.toDomainMany(docs);
  }

  async findCompletedByUserId(userId: string): Promise<CharacterEntity[]> {
    const docs = await this.model
      .find({ userId, state: "created", isDeceased: false })
      .sort({ createdAt: -1 })
      .exec();
    return CharacterMapper.toDomainMany(docs);
  }

  async findDeceasedByUserId(userId: string): Promise<CharacterEntity[]> {
    const docs = await this.model
      .find({ userId, isDeceased: true })
      .sort({ diedAt: -1 })
      .exec();
    return CharacterMapper.toDomainMany(docs);
  }

  async save(character: CharacterEntity): Promise<void> {
    const persistence = CharacterMapper.toPersistence(character);
    await this.model.findOneAndUpdate(
      { characterId: character.id },
      { $set: persistence },
      { upsert: true, new: true },
    ).exec();
    this.logger.log(`Character saved: ${character.id}`);
  }

  async delete(characterId: string): Promise<void> {
    const result = await this.model.deleteOne({ characterId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }
    this.logger.log(`Character deleted: ${characterId}`);
  }

  async deleteByUserAndId(userId: string, characterId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ userId, characterId }).exec();
    if (result.deletedCount === 0) {
      return false;
    }
    this.logger.log(`Character deleted: ${characterId} for user ${userId}`);
    return true;
  }

  async exists(characterId: string): Promise<boolean> {
    const count = await this.model.countDocuments({ characterId }).exec();
    return count > 0;
  }
}
