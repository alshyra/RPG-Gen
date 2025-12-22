import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import {
  ICharacterRepository,
} from "../../domain/repositories/ICharacterRepository.js";
import {
  CharacterEntity,
  type ClassName,
  type RaceId,
  type InventoryItem,
} from "../../domain/entities/CharacterEntity.js";
import { CharacterStatsVO } from "../../domain/value-objects/CharacterStatsVO.js";
import type { InventoryItemMeta } from "../../api/dto/response/InventoryItemMeta.js";

export interface AddInventoryItemInput {
  _id?: string;
  definitionId: string;
  name?: string;
  qty?: number;
  description?: string;
  equipped?: boolean;
  meta?: InventoryItemMeta;
}

export interface UpdateInventoryItemInput {
  _id?: string;
  definitionId?: string;
  name?: string;
  qty?: number;
  description?: string;
  equipped?: boolean;
  meta?: InventoryItemMeta;
}

/** Full inventory item input for bulk inventory replacement. All required fields must be provided. */
export interface FullInventoryItemInput {
  _id?: string;
  definitionId: string;
  name: string;
  qty?: number;
  description?: string;
  equipped: boolean;
  meta?: InventoryItemMeta;
}

export interface CreateDraftParams {
  characterId: string;
  userId: string;
}

export interface CompleteDraftParams {
  name: string;
  className: ClassName;
  raceId: RaceId;
  stats: { vigor: number; finesse: number; mind: number; survival: number };
  physicalDescription?: string;
  gender?: string;
  portrait?: string;
}

export interface UpdateCharacterParams {
  name?: string;
  physicalDescription?: string;
  portrait?: string;
  gender?: string;
  className?: ClassName;
  raceId?: RaceId;
  level?: number;
  stats?: { vigor: number; finesse: number; mind: number; survival: number };
  hp?: number;
  hpMax?: number;
  pa?: number;
  paMax?: number;
  pm?: number;
  pmMax?: number;
  totalXp?: number;
  inspirationPoints?: number;
  talentPoints?: number;
  state?: "draft" | "created";
  inventory?: FullInventoryItemInput[];
}

/**
 * Application service for Character operations.
 * Orchestrates domain logic and persistence.
 */
@Injectable()
export class CharacterAppService {
  private readonly logger = new Logger(CharacterAppService.name);

  constructor(
    @Inject(ICharacterRepository)
    private readonly repository: ICharacterRepository,
  ) {}

  generateCharacterId(): string {
    return crypto.randomUUID();
  }

  async createDraft(params: CreateDraftParams): Promise<CharacterEntity> {
    const character = CharacterEntity.createDraft({
      characterId: params.characterId,
      userId: params.userId,
    });
    await this.repository.save(character);
    this.logger.log(`Draft character created: ${character.id}`);
    return character;
  }

  async findById(characterId: string): Promise<CharacterEntity> {
    const character = await this.repository.findById(characterId);
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }
    return character;
  }

  async findByUserAndId(userId: string, characterId: string): Promise<CharacterEntity> {
    const character = await this.repository.findByUserAndId(userId, characterId);
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }
    return character;
  }

  async findByUserId(userId: string, includeDeceased = false): Promise<CharacterEntity[]> {
    return this.repository.findByUserId(userId, includeDeceased);
  }

  async findDraftsByUserId(userId: string): Promise<CharacterEntity[]> {
    return this.repository.findDraftsByUserId(userId);
  }

  async findCompletedByUserId(userId: string): Promise<CharacterEntity[]> {
    return this.repository.findCompletedByUserId(userId);
  }

  async findDeceasedByUserId(userId: string): Promise<CharacterEntity[]> {
    return this.repository.findDeceasedByUserId(userId);
  }

  async completeDraft(
    userId: string,
    characterId: string,
    params: CompleteDraftParams,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);

    const stats = new CharacterStatsVO(params.stats);

    character.completeDraft({
      name: params.name,
      className: params.className,
      raceId: params.raceId,
      stats,
      physicalDescription: params.physicalDescription,
      gender: params.gender,
      portrait: params.portrait,
    });

    await this.repository.save(character);
    this.logger.log(`Character completed: ${characterId}`);
    return character;
  }

  async update(
    userId: string,
    characterId: string,
    params: UpdateCharacterParams,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);

    if (params.name !== undefined) character.updateBasicInfo({ name: params.name });
    if (params.physicalDescription !== undefined)
      character.updateBasicInfo({ physicalDescription: params.physicalDescription });
    if (params.portrait !== undefined) character.updateBasicInfo({ portrait: params.portrait });
    if (params.gender !== undefined) character.updateBasicInfo({ gender: params.gender });

    if (params.className !== undefined) character.updateClass(params.className);
    if (params.raceId !== undefined) character.updateRace(params.raceId);
    if (params.level !== undefined) character.setLevel(params.level);

    if (params.stats !== undefined) {
      character.updateStats(new CharacterStatsVO(params.stats));
    }

    if (params.hp !== undefined || params.hpMax !== undefined) {
      character.setHp(params.hp ?? character.hp, params.hpMax ?? character.hpMax);
    }

    if (params.pa !== undefined || params.paMax !== undefined) {
      character.setPa(params.pa ?? character.pa, params.paMax ?? character.paMax);
    }

    if (params.pm !== undefined || params.pmMax !== undefined) {
      character.setPm(params.pm ?? character.pm, params.pmMax ?? character.pmMax);
    }

    if (params.totalXp !== undefined) character.setTotalXp(params.totalXp);
    if (params.inspirationPoints !== undefined)
      character.setInspirationPoints(params.inspirationPoints);
    if (params.talentPoints !== undefined) character.setTalentPoints(params.talentPoints);
    if (params.state !== undefined) character.setState(params.state);
    if (params.inventory !== undefined) {
      const fullInventory: InventoryItem[] = params.inventory.map((item) => ({
        _id: item._id || crypto.randomUUID(),
        definitionId: item.definitionId,
        name: item.name,
        qty: item.qty ?? 1,
        description: item.description,
        equipped: item.equipped,
        meta: item.meta,
      }));
      character.setInventory(fullInventory);
    }

    await this.repository.save(character);
    this.logger.log(`Character updated: ${characterId}`);
    return character;
  }

  async delete(userId: string, characterId: string): Promise<void> {
    const deleted = await this.repository.deleteByUserAndId(userId, characterId);
    if (!deleted) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }
    this.logger.log(`Character deleted: ${characterId}`);
  }

  async levelUp(characterId: string): Promise<CharacterEntity> {
    const character = await this.findById(characterId);
    character.levelUp();
    await this.repository.save(character);
    this.logger.log(`Character leveled up: ${characterId} to level ${character.level}`);
    return character;
  }

  async addExperience(
    characterId: string,
    amount: number,
  ): Promise<{ character: CharacterEntity; leveledUp: boolean }> {
    const character = await this.findById(characterId);
    const result = character.addExperience(amount);
    await this.repository.save(character);
    this.logger.log(`Added ${amount} XP to character ${characterId}`);
    return { character, leveledUp: result.leveledUp };
  }

  async takeDamage(characterId: string, amount: number): Promise<CharacterEntity> {
    const character = await this.findById(characterId);
    character.takeDamage(amount);
    await this.repository.save(character);
    return character;
  }

  async heal(characterId: string, amount: number): Promise<CharacterEntity> {
    const character = await this.findById(characterId);
    character.heal(amount);
    await this.repository.save(character);
    return character;
  }

  async markAsDeceased(
    userId: string,
    characterId: string,
    deathLocation?: string,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);
    character.markAsDeceased(deathLocation);
    await this.repository.save(character);
    this.logger.log(`Character marked as deceased: ${characterId}`);
    return character;
  }

  async unlockTalentRank(
    characterId: string,
    voieId: string,
    rank: number,
  ): Promise<CharacterEntity> {
    const character = await this.findById(characterId);
    character.unlockTalentRank(voieId, rank);
    await this.repository.save(character);
    this.logger.log(`Unlocked talent rank ${rank} for voie ${voieId} on character ${characterId}`);
    return character;
  }

  async addInspirationPoints(
    userId: string,
    characterId: string,
    amount: number,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);
    character.addInspirationPoints(amount);
    await this.repository.save(character);
    this.logger.log(`Added ${amount} inspiration points to character ${characterId}`);
    return character;
  }

  async addInventoryItem(
    userId: string,
    characterId: string,
    itemDto: AddInventoryItemInput,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);
    const item: InventoryItem = {
      _id: itemDto._id || crypto.randomUUID(),
      definitionId: itemDto.definitionId,
      name: itemDto.name || itemDto.definitionId,
      qty: itemDto.qty ?? 1,
      description: itemDto.description,
      equipped: itemDto.equipped ?? false,
      meta: itemDto.meta,
    };
    character.addInventoryItem(item);
    await this.repository.save(character);
    this.logger.log(`Added item ${item.definitionId} to character ${characterId}`);
    return character;
  }

  async removeInventoryItem(
    userId: string,
    characterId: string,
    definitionId: string,
    qty?: number,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);
    character.removeInventoryItem(definitionId, qty);
    await this.repository.save(character);
    this.logger.log(`Removed item ${definitionId} from character ${characterId}`);
    return character;
  }

  async equipItem(
    userId: string,
    characterId: string,
    definitionId: string,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);
    character.equipItem(definitionId);
    await this.repository.save(character);
    this.logger.log(`Equipped item ${definitionId} on character ${characterId}`);
    return character;
  }

  async updateInventoryItem(
    userId: string,
    characterId: string,
    itemId: string,
    updates: UpdateInventoryItemInput,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);
    character.updateInventoryItem(itemId, updates);
    await this.repository.save(character);
    this.logger.log(`Updated inventory item ${itemId} on character ${characterId}`);
    return character;
  }

  async restoreResources(characterId: string): Promise<CharacterEntity> {
    const character = await this.findById(characterId);
    character.restoreResources();
    await this.repository.save(character);
    return character;
  }

  async spendActionPoints(characterId: string, amount: number): Promise<CharacterEntity> {
    const character = await this.findById(characterId);
    character.spendActionPoints(amount);
    await this.repository.save(character);
    return character;
  }

  async spendMovementPoints(characterId: string, amount: number): Promise<CharacterEntity> {
    const character = await this.findById(characterId);
    character.spendMovementPoints(amount);
    await this.repository.save(character);
    return character;
  }

  async addAptitude(characterId: string, aptitudeId: string): Promise<CharacterEntity> {
    const character = await this.findById(characterId);
    character.addAptitude(aptitudeId);
    await this.repository.save(character);
    this.logger.log(`Added aptitude ${aptitudeId} to character ${characterId}`);
    return character;
  }

  async removeAptitude(characterId: string, aptitudeId: string): Promise<CharacterEntity> {
    const character = await this.findById(characterId);
    character.removeAptitude(aptitudeId);
    await this.repository.save(character);
    this.logger.log(`Removed aptitude ${aptitudeId} from character ${characterId}`);
    return character;
  }
}
