import { Injectable, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Character, CharacterDocument, Item } from "../../infra/mongo/index.js";
import { ItemDefinitionService } from "../item/domain/services/ItemDefinitionService.js";
import { ArchetypeDefinitionService } from "../archetype/application/archetype-definition.service.js";
import { RaceService, RaceMetadata } from "../race/race.service.js";
import type { TalentProgress, CharacterAptitude } from "../character/infrastructure/persistence/mongo/schemas/CharacterDocument.js";
import type { ItemBonuses } from "../item/infrastructure/persistence/mongo/schemas/ItemDefinition.js";
import { CharacterStats } from "../character/infrastructure/persistence/mongo/schemas/CharacterStats.js";

// Starter pack configuration per class
interface StarterPackConfig {
  weaponId: string;
  armorId: string;
  consumableId: string;
  consumableQty: number;
}

// Class base stats - exported for controller return type
export interface ClassBaseStats {
  hp: number;
  pa: number;
  pm: number;
  stats: CharacterStats;
}

// Mapping of class names to their starter packs
const STARTER_PACKS: Record<string, StarterPackConfig> = {
  guerrier: {
    weaponId: "weapon_warrior_sword",
    armorId: "armor_warrior_chainmail",
    consumableId: "consumable_warrior_vigor",
    consumableQty: 2,
  },
  rogue: {
    weaponId: "weapon_rogue_daggers",
    armorId: "armor_rogue_leather",
    consumableId: "consumable_rogue_smoke",
    consumableQty: 3,
  },
  mage: {
    weaponId: "weapon_mage_staff",
    armorId: "armor_mage_robe",
    consumableId: "consumable_mage_elixir",
    consumableQty: 2,
  },
};

// Base stats per class
const CLASS_BASE_STATS: Record<string, ClassBaseStats> = {
  guerrier: {
    hp: 12,
    pa: 6,
    pm: 4,
    stats: { vigor: 3, finesse: 1, mind: 0, survival: 2 },
  },
  rogue: {
    hp: 10,
    pa: 5,
    pm: 6,
    stats: { vigor: 1, finesse: 3, mind: 1, survival: 1 },
  },
  mage: {
    hp: 8,
    pa: 5,
    pm: 4,
    stats: { vigor: 0, finesse: 1, mind: 3, survival: 2 },
  },
};

// Starting aptitudes per class
const STARTING_APTITUDES: Record<string, string[]> = {
  guerrier: ["frappe_simple", "posture_defensive"],
  rogue: ["attaque_sournoise", "esquive"],
  mage: ["projectile_arcanique", "bouclier_magique"],
};

@Injectable()
export class ProgressionService {
  private readonly logger = new Logger(ProgressionService.name);

  constructor(
    @InjectModel(Character.name) private characterModel: Model<CharacterDocument>,
    private itemDefinitionService: ItemDefinitionService,
    private classDefinitionService: ArchetypeDefinitionService,
    private raceService: RaceService,
  ) {}

  /**
   * Select a class for a character and assign the starter pack.
   * This is called during character creation (step 2).
   */
  async selectClass(
    userId: string,
    characterId: string,
    className: string,
  ): Promise<CharacterDocument> {
    const normalizedClass = className.toLowerCase();
    
    // Validate class name
    if (!STARTER_PACKS[normalizedClass]) {
      throw new BadRequestException(
        `Invalid class: ${className}. Must be one of: guerrier, rogue, mage`,
      );
    }

    const character = await this.characterModel.findOne({ userId, characterId });
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    // Get class configuration
    const starterPack = STARTER_PACKS[normalizedClass];
    const baseStats = CLASS_BASE_STATS[normalizedClass];
    const startingAptitudes = STARTING_APTITUDES[normalizedClass];

    // Build inventory from starter pack
    const inventory = await this.buildStarterInventory(starterPack);

    // Build starting aptitudes
    const aptitudes: CharacterAptitude[] = startingAptitudes.map(id => ({
      aptitudeId: id,
      currentCooldown: 0,
    }));

    // Calculate final stats with equipment bonuses
    const equipmentBonuses = this.calculateEquipmentBonuses(inventory);
    const finalStats = this.applyEquipmentBonuses(baseStats.stats, equipmentBonuses);

    // Update character
    character.className = normalizedClass;
    character.hp = baseStats.hp;
    character.hpMax = baseStats.hp;
    character.pa = baseStats.pa + (equipmentBonuses.pa || 0);
    character.paMax = baseStats.pa + (equipmentBonuses.pa || 0);
    character.pm = baseStats.pm + (equipmentBonuses.pm || 0);
    character.pmMax = baseStats.pm + (equipmentBonuses.pm || 0);
    character.stats = finalStats;
    character.inventory = inventory;
    character.aptitudes = aptitudes;
    character.talentPoints = 0;
    character.talentProgress = [];
    character.level = 1;

    // Also set legacy fields for backward compatibility
    // No need to update classes in new system - className is used instead
    // character.classes = [{ name: this.capitalizeClass(normalizedClass), level: 1 }];

    await character.save();
    this.logger.log(
      `Class ${normalizedClass} selected for character ${characterId} with starter pack`,
    );

    return character;
  }

  /**
   * Calculate final character stats including equipment bonuses.
   * Formula: base_stats + floor(level / 5) + equipment_bonuses
   */
  calculateCharacterStats(
    baseStats: CharacterStats,
    level: number,
    equipmentBonuses: ItemBonuses,
  ): CharacterStats {
    const levelBonus = Math.floor(level / 5);
    
    return {
      vigor: baseStats.vigor + levelBonus + (equipmentBonuses.vigor || 0),
      finesse: baseStats.finesse + levelBonus + (equipmentBonuses.finesse || 0),
      mind: baseStats.mind + levelBonus + (equipmentBonuses.mind || 0),
      survival: baseStats.survival + levelBonus + (equipmentBonuses.survival || 0),
    };
  }

  /**
   * Award talent points on level up.
   * Returns the number of talent points awarded.
   */
  async awardTalentPoints(characterId: string, points: number): Promise<number> {
    const character = await this.characterModel.findOne({ characterId });
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    character.talentPoints = (character.talentPoints || 0) + points;
    await character.save();

    this.logger.log(`Awarded ${points} talent points to ${characterId}`);
    return character.talentPoints;
  }

  /**
   * Unlock a rank in a talent tree (voie).
   */
  async unlockRank(
    userId: string,
    characterId: string,
    voieId: string,
    rank: number,
  ): Promise<CharacterDocument> {
    const character = await this.characterModel.findOne({ userId, characterId });
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    // Check if player has enough talent points (each rank costs 1 point)
    if ((character.talentPoints || 0) < 1) {
      throw new BadRequestException("Not enough talent points");
    }

    // Check if previous rank is unlocked (except for rank 1)
    if (rank > 1) {
      const previousUnlocked = (character.talentProgress || []).some(
        r => r.voieId === voieId && r.rank === rank - 1,
      );
      if (!previousUnlocked) {
        throw new BadRequestException(`Must unlock rank ${rank - 1} first`);
      }
    }

    // Check if rank is already unlocked
    const alreadyUnlocked = (character.talentProgress || []).some(
      r => r.voieId === voieId && r.rank === rank,
    );
    if (alreadyUnlocked) {
      throw new BadRequestException(`Rank ${rank} in ${voieId} is already unlocked`);
    }

    // Get the class definition to find the aptitude for this rank
    if (!character.className) {
      throw new BadRequestException("Character has no class selected");
    }

    const classDef = await this.classDefinitionService.findByName(character.className);
    if (!classDef) {
      throw new NotFoundException(`Class definition ${character.className} not found`);
    }

    const talentTree = classDef.talentTrees && classDef.talentTrees[voieId];
    if (!talentTree) {
      throw new BadRequestException(`Talent tree ${voieId} not found in class ${character.className}`);
    }

    const talentRank = talentTree.ranks?.find(r => r.rank === rank);
    if (!talentRank) {
      throw new BadRequestException(`Rank ${rank} not found in talent tree ${voieId}`);
    }

    // Unlock the rank
    const newRank: TalentProgress = { voieId, rank };
    character.talentProgress = [...(character.talentProgress || []), newRank];
    character.talentPoints = (character.talentPoints || 0) - 1;

    // Add the aptitude from this rank to character.aptitudes
    const newAptitude: CharacterAptitude = {
      aptitudeId: talentRank.aptitudeId,
      currentCooldown: 0,
    };

    // Check if aptitude is already learned
    const alreadyLearned = (character.aptitudes || []).some(
      a => a.aptitudeId === talentRank.aptitudeId,
    );

    if (!alreadyLearned) {
      character.aptitudes = [...(character.aptitudes || []), newAptitude];
    }

    await character.save();
    this.logger.log(`Unlocked rank ${rank} in ${voieId} for ${characterId}`);

    return character;
  }

  /**
   * Select first talent during character creation.
   * Unlocks rank 1 of chosen voie and applies +1 stat bonus.
   * This does NOT consume talent points (first talent is free).
   */
  async selectFirstTalent(
    userId: string,
    characterId: string,
    voieName: string,
    statBonus: "vigor" | "finesse" | "mind" | "survival",
  ): Promise<CharacterDocument> {
    const character = await this.characterModel.findOne({ userId, characterId });
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    if (!character.className) {
      throw new BadRequestException("Character has no class selected");
    }

    // Get class definition to find voie
    const classDef = await this.classDefinitionService.findByName(character.className);
    if (!classDef) {
      throw new NotFoundException(`Class definition ${character.className} not found`);
    }

    // Find voie by name (case insensitive match)
    const voieEntry = Object.entries(classDef.talentTrees || {}).find(
      ([_, tree]) => tree.name.toLowerCase() === voieName.toLowerCase(),
    );

    if (!voieEntry) {
      throw new BadRequestException(`Talent tree ${voieName} not found in class ${character.className}`);
    }

    const [voieId, talentTree] = voieEntry;
    const rank1 = talentTree.ranks?.find(r => r.rank === 1);
    
    if (!rank1) {
      throw new BadRequestException(`Rank 1 not found in talent tree ${voieName}`);
    }

    // Check if rank 1 is already unlocked
    const alreadyUnlocked = (character.talentProgress || []).some(
      r => r.voieId === voieId && r.rank === 1,
    );
    
    if (alreadyUnlocked) {
      throw new BadRequestException(`First talent already selected`);
    }

    // Unlock rank 1 (free - no talent point cost)
    const newRank: TalentProgress = { voieId, rank: 1 };
    character.talentProgress = [...(character.talentProgress || []), newRank];

    // Add aptitude from rank 1
    const newAptitude: CharacterAptitude = {
      aptitudeId: rank1.aptitudeId,
      currentCooldown: 0,
    };

    const alreadyLearned = (character.aptitudes || []).some(
      a => a.aptitudeId === rank1.aptitudeId,
    );

    if (!alreadyLearned) {
      character.aptitudes = [...(character.aptitudes || []), newAptitude];
    }

    // Apply +1 stat bonus
    if (!character.stats) {
      throw new BadRequestException("Character has no stats initialized");
    }

    character.stats[statBonus] = (character.stats[statBonus] || 0) + 1;

    await character.save();
    this.logger.log(
      `First talent selected for ${characterId}: ${voieName} (rank 1) + ${statBonus} +1`,
    );

    return character;
  }

  /**
   * Get available classes with their metadata for the selection UI.
   */
  getAvailableClasses(): Array<{
    id: string;
    name: string;
    displayName: string;
    description: string;
    baseStats: ClassBaseStats;
    color: string;
    icon: string;
  }> {
    return [
      {
        id: "guerrier",
        name: "guerrier",
        displayName: "Guerrier",
        description: "Maître du combat rapproché, le Guerrier excelle en défense et en puissance brute.",
        baseStats: CLASS_BASE_STATS.guerrier,
        color: "#dc2626", // red
        icon: "⚔️",
      },
      {
        id: "rogue",
        name: "rogue",
        displayName: "Rogue",
        description: "Furtif et agile, le Rogue frappe vite et disparaît dans l'ombre.",
        baseStats: CLASS_BASE_STATS.rogue,
        color: "#16a34a", // green
        icon: "🗡️",
      },
      {
        id: "mage",
        name: "mage",
        displayName: "Mage",
        description: "Maître des arcanes, le Mage manipule les forces magiques pour détruire ou protéger.",
        baseStats: CLASS_BASE_STATS.mage,
        color: "#7c3aed", // purple
        icon: "🔮",
      },
    ];
  }

  /**
   * Get available races with their metadata for the selection UI.
   */
  async getAvailableRaces(): Promise<RaceMetadata[]> {
    return this.raceService.getAllRaces();
  }

  /**
   * Select a race for a character and apply race bonuses to stats.
   */
  async selectRace(
    userId: string,
    characterId: string,
    raceId: string,
  ): Promise<CharacterDocument> {
    const character = await this.characterModel.findOne({ userId, characterId });
    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    // Get race data
    const race = await this.raceService.getRaceById(raceId);
    if (!race) {
      throw new BadRequestException(`Invalid race: ${raceId}`);
    }

    // Set the race
    character.raceId = raceId;

    // Apply race bonuses to character stats
    const currentStats = character.stats || { vigor: 0, finesse: 0, mind: 0, survival: 0 };
    character.stats = {
      vigor: currentStats.vigor + (race.bonuses.vigor || 0),
      finesse: currentStats.finesse + (race.bonuses.finesse || 0),
      mind: currentStats.mind + (race.bonuses.mind || 0),
      survival: currentStats.survival + (race.bonuses.survival || 0),
    };

    // Handle special race traits that affect base stats
    // Elfe: +1 PM permanent
    if (raceId === "elfe") {
      character.pmMax = (character.pmMax || 4) + 1;
      character.pm = (character.pm || 4) + 1;
    }

    await character.save();
    this.logger.log(`Selected race ${raceId} for character ${characterId}`);

    return character;
  }

  // --- Private helpers ---

  private async buildStarterInventory(pack: StarterPackConfig): Promise<Item[]> {
    const items: Item[] = [];

    // Weapon (equipped)
    const weaponDef = await this.itemDefinitionService.findByDefinitionId(pack.weaponId);
    if (weaponDef) {
      items.push({
        _id: crypto.randomUUID(),
        name: weaponDef.name,
        qty: 1,
        description: weaponDef.description,
        definitionId: weaponDef.definitionId,
        equipped: true,
        meta: weaponDef.meta,
      });
    }

    // Armor (equipped)
    const armorDef = await this.itemDefinitionService.findByDefinitionId(pack.armorId);
    if (armorDef) {
      items.push({
        _id: crypto.randomUUID(),
        name: armorDef.name,
        qty: 1,
        description: armorDef.description,
        definitionId: armorDef.definitionId,
        equipped: true,
        meta: armorDef.meta,
      });
    }

    // Consumables
    const consumableDef = await this.itemDefinitionService.findByDefinitionId(pack.consumableId);
    if (consumableDef) {
      items.push({
        _id: crypto.randomUUID(),
        name: consumableDef.name,
        qty: pack.consumableQty,
        description: consumableDef.description,
        definitionId: consumableDef.definitionId,
        equipped: false,
        meta: consumableDef.meta,
      });
    }

    // Common items for all classes
    const backpack = await this.itemDefinitionService.findByDefinitionId("pack-backpack");
    if (backpack) {
      items.push({
        _id: crypto.randomUUID(),
        name: backpack.name,
        qty: 1,
        description: backpack.description,
        definitionId: backpack.definitionId,
        equipped: false,
        meta: backpack.meta,
      });
    }

    const healthPotion = await this.itemDefinitionService.findByDefinitionId("potion-health");
    if (healthPotion) {
      items.push({
        _id: crypto.randomUUID(),
        name: healthPotion.name,
        qty: 2,
        description: healthPotion.description,
        definitionId: healthPotion.definitionId,
        equipped: false,
        meta: healthPotion.meta,
      });
    }

    return items;
  }

  private calculateEquipmentBonuses(inventory: Array<{ definitionId: string; equipped?: boolean }>): ItemBonuses {
    // For now, return empty bonuses - in full implementation, 
    // we'd look up each equipped item's bonuses from ItemDefinition
    // This is a simplified version that works with the seed data
    const bonuses: ItemBonuses = {};
    
    // Check for specific equipment that affects stats
    inventory.forEach(item => {
      if (!item.equipped) return;
      
      // These values match our seed data
      if (item.definitionId === "armor_warrior_chainmail") {
        bonuses.pm = (bonuses.pm || 0) - 1;
      }
      if (item.definitionId === "armor_rogue_leather") {
        bonuses.pm = (bonuses.pm || 0) + 1;
      }
      if (item.definitionId === "weapon_warrior_sword") {
        bonuses.vigor = (bonuses.vigor || 0) + 1;
      }
      if (item.definitionId === "weapon_rogue_daggers") {
        bonuses.finesse = (bonuses.finesse || 0) + 1;
      }
      if (item.definitionId === "weapon_mage_staff") {
        bonuses.mind = (bonuses.mind || 0) + 1;
      }
    });

    return bonuses;
  }

  private applyEquipmentBonuses(baseStats: CharacterStats, bonuses: ItemBonuses): CharacterStats {
    return {
      vigor: baseStats.vigor + (bonuses.vigor || 0),
      finesse: baseStats.finesse + (bonuses.finesse || 0),
      mind: baseStats.mind + (bonuses.mind || 0),
      survival: baseStats.survival + (bonuses.survival || 0),
    };
  }

  private capitalizeClass(className: string): string {
    const mapping: Record<string, string> = {
      guerrier: "Fighter",
      rogue: "Rogue",
      mage: "Wizard",
    };
    return mapping[className] || className;
  }
}
