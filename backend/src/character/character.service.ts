import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Character, CharacterDocument } from '../schemas/character.schema';
import type { CharacterEntry } from '../../../shared/types';

@Injectable()
export class CharacterService {
  private readonly logger = new Logger(CharacterService.name);

  constructor(
    @InjectModel(Character.name) private characterModel: Model<CharacterDocument>
  ) {}

  async create(userId: string, characterData: CharacterEntry): Promise<CharacterDocument> {
    const character = new this.characterModel({
      userId,
      characterId: characterData.id,
      name: characterData.name,
      race: characterData.race,
      scores: characterData.scores,
      hp: characterData.hp,
      hpMax: characterData.hpMax,
      totalXp: characterData.totalXp || 0,
      classes: characterData.classes,
      skills: characterData.skills,
      world: characterData.world,
      portrait: characterData.portrait,
      gender: characterData.gender,
      proficiency: characterData.proficiency || 2,
      isDeceased: false,
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

  async update(userId: string, characterId: string, updates: Partial<CharacterEntry>): Promise<CharacterDocument> {
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
    deathLocation?: string
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

  // Convert MongoDB document to frontend CharacterEntry format
  toCharacterEntry(doc: CharacterDocument): CharacterEntry {
    return {
      id: doc.characterId,
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
      gender: doc.gender,
      proficiency: doc.proficiency,
    };
  }
}
