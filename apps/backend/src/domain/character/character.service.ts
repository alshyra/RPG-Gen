import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Character, CharacterDocument, Item } from "../../infra/mongo/index.js";
import { ItemDefinition } from "../../infra/mongo/item/ItemDefinition.js";
import {
  calculateDamage,
  calculateHealing,
  getComputedStats as computeStats,
  type ComputedCharacterStats,
} from "../combat/scaling.util.js";
import { ItemDefinitionService } from "../item-definition/item-definition.service.js";
import { BaseCharacterResponseDto } from "./dto/BaseCharacterResponseDto.js";
import { CharacterResponseDto } from "./dto/CharacterResponseDto.js";
import { CreateInventoryItemDto } from "./dto/CreateInventoryItemDto.js";
import { UpdateCharacterRequestDto } from "./dto/UpdateCharacterRequestDto.js";
import { type StatAttribute } from "./dto/StatAttribute.js";

@Injectable()
export class CharacterService {
  private readonly logger = new Logger(CharacterService.name);
  private readonly DEFAULT_BASE_STATS = {
    vigor: 0,
    finesse: 0,
    mind: 0,
    survival: 0,
  };

  constructor(
    @InjectModel(Character.name) private characterModel: Model<CharacterDocument>,
    private itemDefinitionService: ItemDefinitionService,
  ) {}

  generateCharacterId(): string {
    return crypto.randomUUID();
  }

  async create(userId: string): Promise<CharacterDocument> {
    const character = new this.characterModel({
      userId,
      characterId: this.generateCharacterId(),
      totalXp: 0,
      state: "draft",
      isDeceased: false,
      inventory: [],
      stats: this.DEFAULT_BASE_STATS,
    });

    const saved = await character.save();
    this.logger.log(`Character created: ${saved.name} (${saved.characterId}) for user ${userId}`);
    return saved;
  }

  async findByUserId(userId: string, includeDeceased = false): Promise<CharacterDocument[]> {
    const filter: {
      userId: string;

      isDeceased?: boolean;
    } = { userId };
    if (!includeDeceased) {
      filter.isDeceased = false;
    }
    return this.characterModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findByCharacterId(userId: string, characterId: string): Promise<CharacterResponseDto> {
    const doc = await this.getDocument(userId, characterId);
    return this.toCharacterDto(doc);
  }

  /**
   * Get the raw CharacterDocument (for use by CharacterResponseMapper).
   */
  async getDocument(userId: string, characterId: string): Promise<CharacterDocument> {
    const doc = await this.characterModel
      .findOne({
        userId,
        characterId,
      })
      .exec();
    if (!doc) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }
    return doc;
  }

  // eslint-disable-next-line max-statements
  async update(
    userId: string,
    characterId: string,
    updates: UpdateCharacterRequestDto,
  ): Promise<CharacterDocument> {
    const updateDoc: { [key in keyof UpdateCharacterRequestDto]?: UpdateCharacterRequestDto[key] } =
      {};
    // Build update document - tactical system fields
    if (updates.hp !== undefined) updateDoc.hp = updates.hp;
    if (updates.hpMax !== undefined) updateDoc.hpMax = updates.hpMax;
    if (updates.totalXp !== undefined) updateDoc.totalXp = updates.totalXp;
    if (updates.portrait !== undefined) updateDoc.portrait = updates.portrait;
    if (updates.name !== undefined) updateDoc.name = updates.name;
    if (updates.race !== undefined) updateDoc.race = updates.race;
    if (updates.gender !== undefined) updateDoc.gender = updates.gender;
    if (updates.inspirationPoints !== undefined)
      updateDoc.inspirationPoints = updates.inspirationPoints;
    if (updates.physicalDescription !== undefined)
      updateDoc.physicalDescription = updates.physicalDescription;
    if (updates.state !== undefined) updateDoc.state = updates.state;
    if (updates.inventory !== undefined) updateDoc.inventory = updates.inventory;
    // New tactical system fields
    if (updates.className !== undefined) updateDoc.className = updates.className;
    if (updates.level !== undefined) updateDoc.level = updates.level;
    if (updates.raceId !== undefined) updateDoc.raceId = updates.raceId;
    if (updates.stats !== undefined) updateDoc.stats = updates.stats;
    if (updates.pa !== undefined) updateDoc.pa = updates.pa;
    if (updates.paMax !== undefined) updateDoc.paMax = updates.paMax;
    if (updates.pm !== undefined) updateDoc.pm = updates.pm;
    if (updates.pmMax !== undefined) updateDoc.pmMax = updates.pmMax;
    if (updates.talentPoints !== undefined) updateDoc.talentPoints = updates.talentPoints;

    const character = await this.characterModel.findOneAndUpdate(
      {
        userId,
        characterId,
      },
      { $set: updateDoc },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    this.logger.log(`Character updated: ${character.name} (${character.characterId})`);
    return character;
  }

  async delete(userId: string, characterId: string): Promise<void> {
    const result = await this.characterModel.deleteOne({
      userId,
      characterId,
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }
    this.logger.log(`Character deleted: ${characterId} for user ${userId}`);
  }

  /**
   * Add XP to a character by characterId only (for use in combat orchestrator).
   * Returns the updated total XP.
   */
  async addXp(characterId: string, xpToAdd: number): Promise<number> {
    const character = await this.characterModel.findOne({ characterId });
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }
    const newTotal = (character.totalXp || 0) + xpToAdd;
    character.totalXp = newTotal;
    await character.save();
    this.logger.log(`Added ${xpToAdd} XP to ${characterId}, new total: ${newTotal}`);
    return newTotal;
  }

  async markAsDeceased(
    userId: string,
    characterId: string,
    deathLocation?: string,
  ): Promise<CharacterDocument> {
    const character = await this.characterModel.findOne({
      userId,
      characterId,
    });
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    character.isDeceased = true;
    character.diedAt = new Date();
    character.deathLocation = deathLocation || "Unknown location";

    const saved = await character.save();
    this.logger.log(`Character marked as deceased: ${saved.name} (${saved.characterId})`);
    return saved;
  }

  async addInventoryItem(userId: string, characterId: string, createItem: CreateInventoryItemDto) {
    const character = await this.characterModel.findOne({
      userId,
      characterId,
    });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);
    if (!createItem.definitionId)
      throw new NotFoundException(`Item definitionId is required to add item`);

    const foundItem = (character.inventory || []).find(
      item => item.definitionId && item.definitionId === createItem.definitionId,
    );
    if (foundItem) return this.mergeIntoExistingItem(character, foundItem, createItem);
    const itemDefinition = await this.itemDefinitionService.findByDefinitionId(
      createItem.definitionId,
    );
    if (!itemDefinition)
      throw new NotFoundException(`Item definition ${createItem.definitionId} not found`);
    return this.addNewItemToCharacter(character, createItem, itemDefinition, characterId);
  }

  /**
   * Equip an inventory item identified by its definitionId.
   * If the item is not present, it will be added from the item definition.
   * Only items whose definition meta.type === 'weapon' are allowed to be equipped by this helper.
   */
  // eslint-disable-next-line max-statements
  async equipInventoryItem(userId: string, characterId: string, definitionId: string) {
    const character = await this.characterModel.findOne({
      userId,
      characterId,
    });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);
    if (!definitionId) throw new BadRequestException("definitionId is required");

    // Resolve definition and ensure it's a weapon
    const def = await this.itemDefinitionService.findByDefinitionId(definitionId).catch(() => null);
    if (!def) throw new NotFoundException(`Item definition ${definitionId} not found`);
    const meta = def.meta || {};
    if ((meta.type || "").toString().toLowerCase() !== "weapon") {
      throw new BadRequestException("Only weapon items can be equipped via this endpoint");
    }

    // Find existing inventory item with this definitionId
    let item = (character.inventory || []).find(i => i.definitionId === definitionId);

    // If not found, create one from the definition and add it
    if (!item) {
      const newItem: Item = {
        _id: crypto.randomUUID(),
        name: def.name || definitionId,
        definitionId: def.definitionId,
        qty: 1,
        description: def.description || "",
        equipped: false,
        meta: def.meta || {},
      };
      character.inventory = character.inventory || [];
      character.inventory.push(newItem);
      item = newItem;
    }

    // Ensure only the targeted weapon is equipped (no for loop)
    if (character.inventory) {
      for (const item of character.inventory) {
        try {
          const type = (item?.meta?.type || "").toString().toLowerCase();
          if (type === "weapon") {
            item.equipped = item.definitionId === definitionId;
          }
        } catch {
          // Continue if item processing fails
        }
      }
    }

    // Rebind `item` to the updated inventory entry so subsequent mutation targets the array item
    item = (character.inventory || []).find(i => i.definitionId === definitionId) || item;

    // Equip target item
    item.equipped = true;

    const saved = await character.save();
    this.logger.log(`Equipped ${definitionId} for ${characterId}`);
    return this.toCharacterDto(saved);
  }

  private async mergeIntoExistingItem(
    character: CharacterDocument,
    foundItem: Item,
    item: CreateInventoryItemDto,
  ) {
    foundItem.qty = foundItem.qty + (item.qty || 1);
    character.inventory = [
      ...character.inventory.filter(i => i.definitionId !== foundItem.definitionId),
      foundItem,
    ];
    const saved = await character.save();
    this.logger.log(`Inventory updated for ${character.characterId}`);
    return saved;
  }

  private async addNewItemToCharacter(
    character: CharacterDocument,
    item: CreateInventoryItemDto,
    itemDefinition: ItemDefinition,
    characterId: string,
  ) {
    const newItem: Item = {
      _id: crypto.randomUUID(),
      name: item.name || itemDefinition?.name,
      definitionId: item.definitionId,
      qty: item.qty || 1,
      description: item.description ?? itemDefinition?.description,
      equipped: item.equipped || false,
      meta: Object.assign({}, itemDefinition?.meta || {}, item.meta || {}),
    };
    character.inventory = character.inventory || [];
    character.inventory.push(newItem);
    const saved = await character.save();
    this.logger.log(`Inventory updated for ${characterId}`);
    return saved;
  }

  async updateInventoryItem(
    userId: string,
    characterId: string,
    itemId: string,
    updates: CreateInventoryItemDto,
  ) {
    const character = await this.characterModel.findOne({
      userId,
      characterId,
    });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);

    const item = (character.inventory || []).find(it => it.definitionId === itemId);
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

  async removeInventoryItem(
    userId: string,
    characterId: string,
    itemId: string,
    qtyToRemove: number,
  ) {
    const character = await this.characterModel.findOne({
      userId,
      characterId,
    });
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);

    const idx = (character.inventory || []).findIndex(it => it.definitionId === itemId);
    if (idx === -1)
      throw new NotFoundException(`Item ${itemId} not found on character ${characterId}`);

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
    return this.characterModel
      .find({
        userId,
        isDeceased: true,
      })
      .sort({ diedAt: -1 })
      .exec();
  }

  // Convert MongoDB document to frontend CharacterDto format
  toCharacterDto(doc: CharacterDocument): BaseCharacterResponseDto {
    return new BaseCharacterResponseDto(doc);
  }

  /**
   * Get computed stats for a character (Base + Level + Equipment bonuses)
   * Uses the new Talent Tree scaling system with zero RNG
   */
  async getComputedStats(userId: string, characterId: string): Promise<ComputedCharacterStats> {
    const character = await this.characterModel.findOne({ userId, characterId }).exec();
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    if (!character.className) {
      throw new BadRequestException("Character has no class selected");
    }

    // Calculate equipment bonuses from inventory
    const equipmentBonuses = await this.calculateEquipmentBonuses(character.inventory || []);

    // Get base stats from character
    const baseStats = character.stats || { vigor: 0, finesse: 0, mind: 0, survival: 0 };

    // Compute final stats
    return computeStats(
      character.className,
      character.level || 1,
      baseStats,
      equipmentBonuses,
    );
  }

  /**
   * Calculate aptitude damage using the scaling formula
   */
  calculateAptitudeDamage(
    basePower: number,
    scalingAttribute: StatAttribute | null,
    characterStats: { vigor?: number; finesse?: number; mind?: number; survival?: number },
    level: number,
  ): number {
    return calculateDamage(
      basePower,
      scalingAttribute,
      { vigor: characterStats.vigor || 0, finesse: characterStats.finesse || 0, mind: characterStats.mind || 0, survival: characterStats.survival || 0 },
      level,
    );
  }

  /**
   * Calculate healing using the scaling formula
   */
  calculateAptitudeHealing(
    basePower: number,
    scalingAttribute: StatAttribute | null,
    characterStats: { vigor?: number; finesse?: number; mind?: number; survival?: number },
    level: number,
  ): number {
    return calculateHealing(
      basePower,
      scalingAttribute,
      { vigor: characterStats.vigor || 0, finesse: characterStats.finesse || 0, mind: characterStats.mind || 0, survival: characterStats.survival || 0 },
      level,
    );
  }

  /**
   * Calculate equipment bonuses from equipped inventory items
   */
  private async calculateEquipmentBonuses(inventory: Item[]): Promise<{
    pa?: number;
    pm?: number;
    vigor?: number;
    finesse?: number;
    mind?: number;
    survival?: number;
  }> {
    const bonuses: { pa: number; pm: number; vigor: number; finesse: number; mind: number; survival: number } = {
      pa: 0,
      pm: 0,
      vigor: 0,
      finesse: 0,
      mind: 0,
      survival: 0,
    };

    const equippedItems = inventory.filter(item => item.equipped);
    
    for (const item of equippedItems) {
      if (!item.definitionId) continue;
      
      const definition = await this.itemDefinitionService.findByDefinitionId(item.definitionId);
      if (definition?.bonuses) {
        bonuses.pa += definition.bonuses.pa || 0;
        bonuses.pm += definition.bonuses.pm || 0;
        bonuses.vigor += definition.bonuses.vigor || 0;
        bonuses.finesse += definition.bonuses.finesse || 0;
        bonuses.mind += definition.bonuses.mind || 0;
        bonuses.survival += definition.bonuses.survival || 0;
      }
    }

    return bonuses;
  }
}
