import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Character, CharacterDocument } from '../schemas/character.schema';

@Injectable()
export class CharacterService {
  private readonly logger = new Logger(CharacterService.name);

  constructor(
    @InjectModel(Character.name) private characterModel: Model<CharacterDocument>,
  ) {}

  generateUUID = (): string => crypto.randomUUID();

  async create(userId: string, characterData: Partial<Character>): Promise<CharacterDocument> {
    const character = new this.characterModel({
      state: 'draft',
      userId,
      characterId: this.generateUUID(),
      totalXp: 0,
      world: characterData.world,
      proficiency: 2,
      isDeceased: false,
    });

    const saved = await character.save();
    this.logger.log(`Character created: ${saved.name} (${saved.characterId}) for user ${userId}`);
    return saved;
  }

  async findByUserId(userId: string, includeDeceased = false): Promise<CharacterDocument[]> {
    const filter: Record<string, unknown> = { userId };
    if (!includeDeceased) {
      filter.isDeceased = false;
    }
    return this.characterModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findByCharacterId(userId: string, characterId: string): Promise<CharacterDocument | null> {
    return this.characterModel.findOne({ userId, characterId }).exec();
  }

  async update(userId: string, characterId: string, updates: Partial<Character>): Promise<CharacterDocument> {
    const character = await this.characterModel.findOne({ userId, characterId });
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }
    // Update fields (partial updates allowed for drafts)
    this._applyNumericalFields(character, updates);
    this._applyCollectionFields(character, updates);
    this._applyBaseFields(character, updates);

    const saved = await character.save();
    this.logger.log(`Character updated: ${saved.name} (${saved.characterId})`);
    return saved;
  }

  private _applyNumericalFields(character: CharacterDocument, updates: Partial<Character>) {
    if (updates.hp !== undefined) character.hp = updates.hp;
    if (updates.hpMax !== undefined) character.hpMax = updates.hpMax;
    if (updates.totalXp !== undefined) character.totalXp = updates.totalXp;
    if (updates.scores !== undefined) character.scores = updates.scores as Character['scores'];
  }

  private _applyCollectionFields(character: CharacterDocument, updates: Partial<Character>) {
    if (updates.classes !== undefined) character.classes = updates.classes as Character['classes'];
    if (updates.skills !== undefined) character.skills = updates.skills as Character['skills'];
  }

  private _applyBaseFields(character: CharacterDocument, updates: Partial<Character>) {
    if (updates.portrait !== undefined) character.portrait = updates.portrait;
    if (updates.name !== undefined) character.name = updates.name;
    if (updates.world !== undefined) character.world = updates.world as Character['world'];
    if (updates.gender !== undefined) character.gender = updates.gender as Character['gender'];
    if (updates.proficiency !== undefined) character.proficiency = updates.proficiency as Character['proficiency'];
    if (updates.race !== undefined) character.race = updates.race as Character['race'];
    if (updates.physicalDescription !== undefined) character.physicalDescription = updates.physicalDescription as Character['physicalDescription'];
    if (updates.state !== undefined) character.state = updates.state as Character['state'];
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
    return this.characterModel
      .find({ userId, isDeceased: true })
      .sort({ diedAt: -1 }).exec();
  }

  /**
   * Convert a Mongoose document to a plain JS DTO suitable for the frontend
   * (convert ObjectId to string and normalize Date fields)
   */
  toCharacterDto(doc: CharacterDocument) {
    const obj = doc.toObject({ getters: true });
    if (obj.diedAt && obj.diedAt instanceof Date) obj.diedAt = obj.diedAt.toISOString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId, updatedAt, createdAt, __v, _id, id, ...rest } = obj;
    return rest;
  }
}
