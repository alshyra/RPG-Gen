// bounded-contexts/character/application/services/CharacterAppService.ts

import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CharacterEntity, InventoryItem } from "../../domain/entities/CharacterEntity.js";
import { ICharacterRepository } from "../../domain/repositories/ICharacterRepository.js";
import { CharacterStats } from "../../domain/value-objects/CharacterStats.js";
import { TalentProgress } from "../../domain/value-objects/TalentRank.js";
import { ClassDataService } from "../../../game-data/application/services/ClassDataService.js";

import {
  AddInventoryItemCommand,
  CompleteDraftCommand,
  CreateDraftCommand,
  UpdateCharacterCommand,
  UpdateInventoryItemCommand,
} from "../commands/index.js";

/**
 * Application Service for Character bounded context
 *
 * @description
 * Orchestrates character use cases by:
 * - Loading entities from repository
 * - Delegating business logic to entities
 * - Persisting changes
 * - Logging operations
 *
 * NO business logic here - all in CharacterEntity
 */
@Injectable()
export class CharacterAppService {
  private readonly logger = new Logger(CharacterAppService.name);

  constructor(
    @Inject(ICharacterRepository)
    private readonly repository: ICharacterRepository,
    private readonly classDataService: ClassDataService,
  ) {}

  // ========================================
  // QUERIES (Read Operations)
  // ========================================

  /**
   * Find a character by ID
   * @throws NotFoundException if character not found
   */
  async findById(characterId: string): Promise<CharacterEntity> {
    const character = await this.repository.findById(characterId);
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }
    return character;
  }

  /**
   * Find a character by user and character ID
   * @throws NotFoundException if character not found or doesn't belong to user
   */
  async findByUserAndId(userId: string, characterId: string): Promise<CharacterEntity> {
    const character = await this.repository.findByUserAndId(userId, characterId);
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found for user ${userId}`);
    }
    return character;
  }

  /**
   * Find all characters for a user
   */
  async findByUserId(userId: string, includeDeceased = false): Promise<CharacterEntity[]> {
    return this.repository.findByUserId(userId, includeDeceased);
  }

  /**
   * Find all draft characters for a user
   */
  async findDraftsByUserId(userId: string): Promise<CharacterEntity[]> {
    return this.repository.findDraftsByUserId(userId);
  }

  /**
   * Find all completed (active) characters for a user
   */
  async findCompletedByUserId(userId: string): Promise<CharacterEntity[]> {
    return this.repository.findCompletedByUserId(userId);
  }

  /**
   * Find all deceased characters for a user
   */
  async findDeceasedByUserId(userId: string): Promise<CharacterEntity[]> {
    return this.repository.findDeceasedByUserId(userId);
  }

  // ========================================
  // COMMANDS (Write Operations)
  // ========================================

  /**
   * Generate a new unique character ID
   */
  generateCharacterId(): string {
    return crypto.randomUUID();
  }

  /**
   * Create a new draft character
   *
   * @description
   * Creates a minimal character in "draft" state.
   * Must be completed via completeDraft() before being playable.
   */
  async createDraft(command: CreateDraftCommand): Promise<CharacterEntity> {
    const character = CharacterEntity.createDraft({
      characterId: command.characterId,
      userId: command.userId,
    });

    await this.repository.save(character);
    this.logger.log(`Draft character created: ${character.id}`);

    return character;
  }

  /**
   * Complete a draft character
   *
   * @description
   * Transforms a draft into a playable character by:
   * - Setting name, class, race, stats
   * - Initializing HP/PA/PM based on class
   * - Granting starting aptitudes
   * - Changing state to "created"
   *
   * @throws NotFoundException if character not found
   * @throws BadRequestException if not in draft state or invalid stats
   */
  async completeDraft(
    userId: string,
    characterId: string,
    command: CompleteDraftCommand,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);

    // ✅ Validation métier (application layer)
    if (character.state !== "draft") {
      throw new BadRequestException("Character must be in draft state");
    }

    const stats = new CharacterStats(command.stats);

    // Validation des stats (total = 27)
    if (stats.getTotalPoints() !== 27) {
      throw new BadRequestException("Stats must total exactly 27 points");
    }

    // Fetch class stats from game-data seed
    const classData = await this.classDataService.findByName(command.className);
    if (!classData) {
      throw new NotFoundException(`Class ${command.className} not found in game data`);
    }

    // ✅ Délégation à l'entité (domain logic)
    character.completeDraft({
      name: command.name,
      className: command.className,
      raceId: command.raceId,
      stats,
      classStats: {
        hpBase: classData.stats.hpBase,
        hpGain: classData.stats.hpGain,
        pa: classData.stats.pa,
        pm: classData.stats.pm,
      },
      physicalDescription: command.physicalDescription,
      gender: command.gender,
      portrait: command.portrait,
    });

    await this.repository.save(character);
    this.logger.log(`Character completed: ${characterId} (${command.name})`);

    return character;
  }

  /**
   * Update character properties
   *
   * @description
   * Generic update for administrative purposes.
   * For specific game actions, use dedicated methods.
   *
   * @throws NotFoundException if character not found
   */
  async update(
    userId: string,
    characterId: string,
    command: UpdateCharacterCommand,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);
    
    this.logger.log(`[UPDATE] Before update - stats: ${JSON.stringify(character.stats)}, command.stats: ${JSON.stringify(command.stats)}`);

    // Basic info
    if (command.name || command.physicalDescription || command.portrait || command.gender) {
      character.updateBasicInfo({
        name: command.name,
        physicalDescription: command.physicalDescription,
        portrait: command.portrait,
        gender: command.gender,
      });
    }

    // Class and race
    if (command.className !== undefined) {
      character.updateClass(command.className);
    }
    if (command.raceId !== undefined) {
      character.updateRace(command.raceId);
    }

    // Level
    if (command.level !== undefined) {
      character.setLevel(command.level);
    }

    // Stats
    if (command.stats !== undefined) {
      character.updateStats(new CharacterStats(command.stats));
    }

    // Resources
    if (command.hp !== undefined || command.hpMax !== undefined) {
      character.setHp(command.hp ?? character.hp, command.hpMax ?? character.hpMax);
    }

    if (command.pa !== undefined || command.paMax !== undefined) {
      character.setPa(command.pa ?? character.pa, command.paMax ?? character.paMax);
    }

    if (command.pm !== undefined || command.pmMax !== undefined) {
      character.setPm(command.pm ?? character.pm, command.pmMax ?? character.pmMax);
    }

    // Progression
    if (command.totalXp !== undefined) {
      character.setTotalXp(command.totalXp);
    }
    if (command.inspirationPoints !== undefined) {
      character.setInspirationPoints(command.inspirationPoints);
    }
    if (command.talentPoints !== undefined) {
      character.setTalentPoints(command.talentPoints);
    }

    // State
    if (command.state !== undefined) {
      character.setState(command.state);
    }

    // Inventory (bulk replacement)
    if (command.inventory !== undefined) {
      const items: InventoryItem[] = command.inventory.map(item => ({
        definitionId: item.definitionId,
        name: item.name,
        qty: item.qty ?? 1,
        description: item.description,
        equipped: item.equipped,
        meta: item.meta as InventoryItem['meta'],
      }));
      character.setInventory(items);
    }

    // Talent progress (voies) - set directly for character creation/admin
    if (command.voies !== undefined && command.voies.length > 0) {
      const talentProgress: TalentProgress[] = command.voies.map(v => 
        new TalentProgress(v.voieId, v.currentRank)
      );
      character.setTalentProgress(talentProgress);
    }

    await this.repository.save(character);
    this.logger.log(`Character updated: ${characterId}`);
    this.logger.log(`[UPDATE] After save - stats: ${JSON.stringify(character.stats)}`);

    return character;
  }

  /**
   * Delete a character
   *
   * @throws NotFoundException if character not found
   */
  async delete(userId: string, characterId: string): Promise<void> {
    const deleted = await this.repository.deleteByUserAndId(userId, characterId);
    if (!deleted) {
      throw new NotFoundException(`Character ${characterId} not found for user ${userId}`);
    }
    this.logger.log(`Character deleted: ${characterId}`);
  }

  // ========================================
  // PROGRESSION
  // ========================================

  /**
   * Level up a character
   *
   * @description
   * Increases level, grants talent point, increases HP max.
   * Called automatically when character gains enough XP.
   */
  async levelUp(characterId: string): Promise<CharacterEntity> {
    const character = await this.findById(characterId);

    character.levelUp();

    await this.repository.save(character);
    this.logger.log(`Character leveled up: ${characterId} → level ${character.level}`);

    return character;
  }

  /**
   * Add experience points to a character
   *
   * @description
   * Adds XP and automatically levels up if threshold reached.
   * Can level up multiple times in one call.
   *
   * @returns Character entity and whether it leveled up
   */
  async addExperience(
    characterId: string,
    amount: number,
  ): Promise<{ character: CharacterEntity; leveledUp: boolean }> {
    if (amount <= 0) {
      throw new BadRequestException("XP amount must be positive");
    }

    const character = await this.findById(characterId);
    const result = character.addExperience(amount);

    await this.repository.save(character);
    this.logger.log(
      `Added ${amount} XP to character ${characterId}${result.leveledUp ? " (leveled up!)" : ""}`,
    );

    return { character, leveledUp: result.leveledUp };
  }

  /**
   * Unlock a talent rank
   *
   * @description
   * Spends talent points to unlock the next rank in a talent tree.
   *
   * @throws BadRequestException if insufficient points or prerequisites not met
   */
  async unlockTalentRank(
    characterId: string,
    voieId: string,
    rank: number,
  ): Promise<CharacterEntity> {
    const character = await this.findById(characterId);

    character.unlockTalentRank(voieId, rank);

    await this.repository.save(character);
    this.logger.log(`Unlocked talent rank ${rank} in ${voieId} for character ${characterId}`);

    return character;
  }

  /**
   * Add inspiration points
   */
  async addInspirationPoints(
    userId: string,
    characterId: string,
    amount: number,
  ): Promise<CharacterEntity> {
    if (amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    const character = await this.findByUserAndId(userId, characterId);
    character.addInspirationPoints(amount);

    await this.repository.save(character);
    this.logger.log(`Added ${amount} inspiration points to character ${characterId}`);

    return character;
  }

  // ========================================
  // COMBAT & RESOURCES
  // ========================================

  /**
   * Apply damage to a character
   *
   * @description
   * Reduces HP. If HP reaches 0, marks character as deceased.
   */
  async takeDamage(characterId: string, amount: number): Promise<CharacterEntity> {
    if (amount < 0) {
      throw new BadRequestException("Damage cannot be negative");
    }

    const character = await this.findById(characterId);
    character.takeDamage(amount);

    await this.repository.save(character);

    if (character.isDeceased) {
      this.logger.warn(`Character ${characterId} died from ${amount} damage`);
    }

    return character;
  }

  /**
   * Heal a character
   *
   * @description
   * Restores HP up to max. Cannot heal deceased characters.
   *
   * @throws BadRequestException if character is deceased
   */
  async heal(characterId: string, amount: number): Promise<CharacterEntity> {
    if (amount <= 0) {
      throw new BadRequestException("Heal amount must be positive");
    }

    const character = await this.findById(characterId);

    if (character.isDeceased) {
      throw new BadRequestException("Cannot heal a deceased character");
    }

    character.heal(amount);

    await this.repository.save(character);

    return character;
  }

  /**
   * Manually mark character as deceased
   *
   * @description
   * For GM/admin use or special death scenarios.
   * Normal deaths happen automatically via takeDamage().
   */
  async markAsDeceased(
    userId: string,
    characterId: string,
    deathLocation?: string,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);

    character.markAsDeceased(deathLocation);

    await this.repository.save(character);
    this.logger.log(`Character manually marked as deceased: ${characterId}`);

    return character;
  }

  /**
   * Restore action points and movement points
   *
   * @description
   * Called at the start of character's turn in combat.
   */
  async restoreResources(characterId: string): Promise<CharacterEntity> {
    const character = await this.findById(characterId);

    character.restoreResources();

    await this.repository.save(character);

    return character;
  }

  /**
   * Spend action points
   *
   * @throws BadRequestException if insufficient PA
   */
  async spendActionPoints(characterId: string, amount: number): Promise<CharacterEntity> {
    if (amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    const character = await this.findById(characterId);

    if (character.pa < amount) {
      throw new BadRequestException(
        `Insufficient action points. Need ${amount}, have ${character.pa}`,
      );
    }

    character.spendActionPoints(amount);

    await this.repository.save(character);

    return character;
  }

  /**
   * Spend movement points
   *
   * @throws BadRequestException if insufficient PM
   */
  async spendMovementPoints(characterId: string, amount: number): Promise<CharacterEntity> {
    if (amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    const character = await this.findById(characterId);

    if (character.pm < amount) {
      throw new BadRequestException(
        `Insufficient movement points. Need ${amount}, have ${character.pm}`,
      );
    }

    character.spendMovementPoints(amount);

    await this.repository.save(character);

    return character;
  }

  // ========================================
  // APTITUDES
  // ========================================

  /**
   * Add an aptitude to character
   *
   * @description
   * Grants access to a new aptitude/spell.
   * Usually done via unlockTalentRank() or level-up rewards.
   */
  async addAptitude(characterId: string, aptitudeId: string): Promise<CharacterEntity> {
    const character = await this.findById(characterId);

    character.addAptitude(aptitudeId);

    await this.repository.save(character);
    this.logger.log(`Added aptitude ${aptitudeId} to character ${characterId}`);

    return character;
  }

  /**
   * Remove an aptitude from character
   *
   * @description
   * For respec or admin operations.
   */
  async removeAptitude(characterId: string, aptitudeId: string): Promise<CharacterEntity> {
    const character = await this.findById(characterId);

    character.removeAptitude(aptitudeId);

    await this.repository.save(character);
    this.logger.log(`Removed aptitude ${aptitudeId} from character ${characterId}`);

    return character;
  }

  // ========================================
  // INVENTORY
  // ========================================

  /**
   * Add an item to character's inventory
   *
   * @description
   * Adds a new item or increases quantity if stackable.
   */
  async addInventoryItem(
    userId: string,
    characterId: string,
    command: AddInventoryItemCommand,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);

    const item: InventoryItem = {
      definitionId: command.definitionId,
      name: command.name || command.definitionId,
      qty: command.qty ?? 1,
      description: command.description,
      equipped: command.equipped ?? false,
      meta: command.meta,
    };

    character.addInventoryItem(item);

    await this.repository.save(character);
    this.logger.log(`Added item ${command.definitionId} to character ${characterId}`);

    return character;
  }

  /**
   * Remove an item from character's inventory
   *
   * @param qty Optional quantity to remove. If not specified, removes all.
   */
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

  /**
   * Equip an item
   *
   * @description
   * Marks an inventory item as equipped.
   * Unequips any item in the same slot.
   */
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

  /**
   * Update an inventory item
   *
   * @description
   * Modifies properties of an existing inventory item.
   */
  async updateInventoryItem(
    userId: string,
    characterId: string,
    itemId: string,
    command: UpdateInventoryItemCommand,
  ): Promise<CharacterEntity> {
    const character = await this.findByUserAndId(userId, characterId);

    character.updateInventoryItem(itemId, command);

    await this.repository.save(character);
    this.logger.log(`Updated inventory item ${itemId} on character ${characterId}`);

    return character;
  }
}
