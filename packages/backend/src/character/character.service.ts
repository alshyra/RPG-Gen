import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Character, CharacterDocument, Item } from './schema/index.js';
import { CreateInventoryItemDto } from './dto/CreateInventoryItemDto.js';
import { ItemDefinitionService } from '../item-definition/item-definition.service.js';
import type { CharacterResponseDto } from './dto/CharacterResponseDto.js';
import { UpdateCharacterRequestDto } from './dto/UpdateCharacterRequestDto.js';

@Injectable()
export class CharacterService {
  private readonly logger = new Logger(CharacterService.name);
  private readonly DEFAULT_BASE_SCORES = { Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 };

  constructor(
    @InjectModel(Character.name) private characterModel: Model<CharacterDocument>,
    private itemDefinitionService: ItemDefinitionService,
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
      inventory: [],
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

  async findByCharacterId(userId: string, characterId: string): Promise<CharacterResponseDto> {
    const doc = await this.characterModel.findOne({ userId, characterId }).exec();
    if (!doc) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }
    return this.toCharacterDto(doc);
  }

  // eslint-disable-next-line max-statements
  async update(userId: string, characterId: string, updates: UpdateCharacterRequestDto): Promise<CharacterDocument> {
    const updateDoc: any = {};
    // Build update document
    if (updates.hp !== undefined) updateDoc.hp = updates.hp;
    if (updates.hpMax !== undefined) updateDoc.hpMax = updates.hpMax;
    if (updates.totalXp !== undefined) updateDoc.totalXp = updates.totalXp;
    if (updates.classes !== undefined) updateDoc.classes = updates.classes;
    if (updates.skills !== undefined) updateDoc.skills = updates.skills;
    if (updates.portrait !== undefined) updateDoc.portrait = updates.portrait;
    if (updates.scores !== undefined) updateDoc.scores = updates.scores;
    if (updates.name !== undefined) updateDoc.name = updates.name;
    if (updates.race !== undefined) updateDoc.race = updates.race;
    if (updates.gender !== undefined) updateDoc.gender = updates.gender;
    if (updates.proficiency !== undefined) updateDoc.proficiency = updates.proficiency;
    if (updates.inspirationPoints !== undefined) updateDoc.inspirationPoints = updates.inspirationPoints;
    if (updates.physicalDescription !== undefined) updateDoc.physicalDescription = updates.physicalDescription;
    if (updates.state !== undefined) updateDoc.state = updates.state;
    if (updates.inventory !== undefined) updateDoc.inventory = updates.inventory;
    updateDoc.
    const character = await this.characterModel.findOneAndUpdate(
      { userId, characterId },
      { $set: updateDoc },
      { new: true, runValidators: true },
    );

    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    this.logger.log(`Character updated: ${character.name} (${character.characterId})`);
    return character;
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

  async addInventoryItem(userId: string, characterId: string, createItem: CreateInventoryItemDto) {
    const character = await this.characterModel.findOne({ userId, characterId });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);
    if (!createItem.definitionId) throw new NotFoundException(`Item definitionId is required to add item`);

    const foundItem = (character.inventory || []).find(item =>
      item.definitionId && item.definitionId === createItem.definitionId);
    if (foundItem) return this.mergeIntoExistingItem(character, foundItem, createItem);
    const itemDefinition = await this.itemDefinitionService.findByDefinitionId(createItem.definitionId);
    return this.addNewItemToCharacter(character, createItem, itemDefinition, characterId);
  }

  private async mergeIntoExistingItem(character: CharacterDocument, foundItem: Item, item: CreateInventoryItemDto) {
    foundItem.qty = foundItem.qty + (item.qty || 1);
    character.inventory = [
      ...character.inventory.filter(i => i.definitionId !== foundItem.definitionId),
      foundItem,
    ];
    const saved = await character.save();
    this.logger.log(`Inventory updated for ${character.characterId}`);
    return saved;
  }

  private async addNewItemToCharacter(character: CharacterDocument, item: CreateInventoryItemDto, itemDefinition: any, characterId: string) {
    const newItem: Item = {
      _id: crypto.randomUUID(),
      name: item.name || itemDefinition?.name,
      definitionId: item.definitionId || (itemDefinition?.definitionId),
      qty: item.qty || 1,
      description: item.description ?? itemDefinition?.description,
      equipped: item.equipped || false,
      meta: { ...(itemDefinition?.meta || {}), ...(item.meta || {}) },
    };
    character.inventory = character.inventory || [];
    character.inventory.push(newItem);
    const saved = await character.save();
    this.logger.log(`Inventory updated for ${characterId}`);
    return saved;
  }

  async updateInventoryItem(userId: string, characterId: string, itemId: string, updates: Partial<any>) {
    const character = await this.characterModel.findOne({ userId, characterId });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);

    const item = (character.inventory || []).find(it => it._id === itemId);
    if (!item) throw new NotFoundException(`Item ${itemId} not found on character ${characterId}`);

    if (updates.name !== undefined) item.name = updates.name;
    if (updates.qty !== undefined) item.qty = updates.qty;
    if (updates.description !== undefined) item.description = updates.description;
    if (updates.equipped !== undefined) item.equipped = updates.equipped;
    if (updates.meta !== undefined) item.meta = updates.meta;

    const saved = await character.save();
    this.logger.log(`Inventory item ${itemId} updated for ${characterId}`);
    return saved;
  }

  async removeInventoryItem(userId: string, characterId: string, itemId: string, qtyToRemove: number) {
    const character = await this.characterModel.findOne({ userId, characterId });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);

    const idx = (character.inventory || []).findIndex(it => it._id === itemId);
    if (idx === -1) throw new NotFoundException(`Item ${itemId} not found on character ${characterId}`);

    if (qtyToRemove > 0) {
      const current = character.inventory[idx].qty || 0;
      if (qtyToRemove >= current) {
        character.inventory.splice(idx, 1);
      } else {
        character.inventory[idx].qty = current - qtyToRemove;
      }
    } else {
      character.inventory.splice(idx, 1);
    }

    const saved = await character.save();
    this.logger.log(`Inventory item ${itemId} removed for ${characterId}`);
    return saved;
  }

  async getDeceasedCharacters(userId: string): Promise<CharacterDocument[]> {
    return this.characterModel.find({ userId, isDeceased: true }).sort({ diedAt: -1 }).exec();
  }

  // Convert MongoDB document to frontend CharacterDto format
  toCharacterDto(doc: CharacterDocument): CharacterResponseDto {
    return {
      characterId: doc.characterId,
      name: doc.name,
      race: doc.race,
      scores: doc.scores,
      hp: doc.hp,
      hpMax: doc.hpMax,
      totalXp: doc.totalXp,
      classes: doc.classes,
      skills: doc.skills,
      world: doc.world,
      portrait: doc.portrait,
      gender: doc.gender,
      proficiency: doc.proficiency,
      inspirationPoints: doc.inspirationPoints,
      isDeceased: doc.isDeceased || false,
      inventory: doc.inventory,
      diedAt: doc.diedAt?.toISOString(),
      deathLocation: doc.deathLocation,
      physicalDescription: doc.physicalDescription,
      state: doc.state,
    };
  }
}
