import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Character, CharacterDocument } from '../schemas/character.schema.js';
import type { CharacterDto } from '@rpg-gen/shared';

@Injectable()
export class CharacterService {
  private readonly logger = new Logger(CharacterService.name);
  private readonly DEFAULT_BASE_SCORES = { Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 };

  constructor(
    @InjectModel(Character.name) private characterModel: Model<CharacterDocument>,
  ) {}

  generateCharacterId(): string {
    return crypto.randomUUID();
  }

  async create(userId: string, world: string): Promise<CharacterDocument> {
    const character = new this.characterModel({
      userId,
      characterId: this.generateCharacterId(),
      totalXp: 0,
      proficiency: 2,
      world,
      state: 'draft',
      isDeceased: false,
      scores: this.DEFAULT_BASE_SCORES,
    });

    const saved = await character.save();
    this.logger.log(`Character created: ${saved.name} (${saved.characterId}) for user ${userId}`);
    return saved;
  }

  async findByUserId(userId: string, includeDeceased = false): Promise<CharacterDocument[]> {
    const filter: any = { userId };
    if (!includeDeceased) {
      filter.isDeceased = false;
    }
    return this.characterModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findByCharacterId(userId: string, characterId: string): Promise<CharacterDocument | null> {
    return this.characterModel.findOne({ userId, characterId }).exec();
  }

  // eslint-disable-next-line max-statements
  async update(userId: string, characterId: string, updates: Partial<CharacterDto>): Promise<CharacterDocument> {
    const character = await this.characterModel.findOne({ userId, characterId });
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    // Update fields
    if (updates.hp !== undefined) character.hp = updates.hp;
    if (updates.hpMax !== undefined) character.hpMax = updates.hpMax;
    if (updates.totalXp !== undefined) character.totalXp = updates.totalXp;
    if (updates.classes !== undefined) character.classes = updates.classes as any;
    if (updates.skills !== undefined) character.skills = updates.skills as any;
    if (updates.portrait !== undefined) character.portrait = updates.portrait;
    if (updates.scores !== undefined) character.scores = updates.scores as any;
    if (updates.name !== undefined) character.name = updates.name;
    if (updates.race !== undefined) character.race = updates.race as any;
    if (updates.gender !== undefined) character.gender = updates.gender as any;
    if (updates.proficiency !== undefined) character.proficiency = updates.proficiency;
    if (updates.isDeceased !== undefined) character.isDeceased = updates.isDeceased;
    if (updates.physicalDescription !== undefined) character.physicalDescription = updates.physicalDescription;
    if (updates.state !== undefined) character.state = updates.state;

    const saved = await character.save();
    this.logger.log(`Character updated: ${saved.name} (${saved.characterId})`);
    return saved;
  }

  async delete(userId: string, characterId: string): Promise<void> {
    const result = await this.characterModel.deleteOne({ userId, characterId });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }
    this.logger.log(`Character deleted: ${characterId} for user ${userId}`);
  }

  async markAsDeceased(
    userId: string,
    characterId: string,
    deathLocation?: string,
  ): Promise<CharacterDocument> {
    const character = await this.characterModel.findOne({ userId, characterId });
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    character.isDeceased = true;
    character.diedAt = new Date();
    character.deathLocation = deathLocation || 'Unknown location';

    const saved = await character.save();
    this.logger.log(`Character marked as deceased: ${saved.name} (${saved.characterId})`);
    return saved;
  }

  async getDeceasedCharacters(userId: string): Promise<CharacterDocument[]> {
    return this.characterModel.find({ userId, isDeceased: true }).sort({ diedAt: -1 }).exec();
  }

  // Convert MongoDB document to frontend CharacterDto format
  toCharacterDto(doc: CharacterDocument): CharacterDto {
    return {
      characterId: doc.characterId,
      name: doc.name,
      race: doc.race as any,
      scores: doc.scores as any,
      hp: doc.hp,
      hpMax: doc.hpMax,
      totalXp: doc.totalXp,
      classes: doc.classes as any,
      skills: doc.skills as any,
      world: doc.world,
      portrait: doc.portrait,
      gender: doc.gender as 'male' | 'female',
      proficiency: doc.proficiency,
      isDeceased: doc.isDeceased || false,
      diedAt: doc.diedAt,
      deathLocation: doc.deathLocation,
      physicalDescription: doc.physicalDescription,
      state: doc.state,
    };
  }
}
