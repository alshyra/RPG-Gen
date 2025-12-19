import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { CharacterService } from "./character.service.js";
import { SpellDefinitionService } from "../spell-definition/spell-definition.service.js";
import type { CharacterResponseDto } from "./dto/CharacterResponseDto.js";
import type { LevelUpOptionsDto } from "./dto/LevelUpOptionsDto.js";
import type { LevelUpApplyDto } from "./dto/LevelUpApplyDto.js";
import type { SpellResponseDto } from "./dto/SpellResponseDto.js";
import { calculateMaxHP, CLASS_STATS } from "../combat/scaling.util.js";

/**
 * LevelUpService - Tactical system level progression
 * 
 * New system:
 * - Single class per character (guerrier, rogue, mage)
 * - Simple level progression (1-20)
 * - HP calculated via class formula
 * - No ASI system, stats come from race/equipment
 */
@Injectable()
export class LevelUpService {
  private readonly logger = new Logger(LevelUpService.name);

  constructor(
    private readonly characterService: CharacterService,
    private readonly spellDefService: SpellDefinitionService,
  ) {}

  async getOptionsForClass(
    character: CharacterResponseDto,
    className: string,
  ): Promise<LevelUpOptionsDto> {
    const currentLevel = character.level ?? 1;
    const nextLevel = currentLevel + 1;

    // For tactical system: unlocked aptitudes/spells at next level
    const unlocked = await this.spellDefService.findByLevel(nextLevel);

    const unlockedSpells: SpellResponseDto[] = (unlocked || []).map(s => ({
      definitionId: s.definitionId,
      name: s.name,
      level: s.level,
      description: s.description ?? undefined,
      meta: s.meta ?? {},
    }));

    const options: LevelUpOptionsDto = {
      className: character.className ?? className,
      currentLevel,
      nextLevel,
      unlockedSpells,
      asiAvailable: false, // No ASI in tactical system
      proficiencyIncrease: false, // No proficiency in tactical system
      cantripsKnown: 0,
      spellsKnown: 0,
    };

    return options;
  }

  async applyLevelUp(
    userId: string,
    characterId: string,
    className: string,
    payload: LevelUpApplyDto,
  ) {
    const character = await this.characterService.findByCharacterId(userId, characterId);
    if (!character) throw new BadRequestException("character not found");

    const currentLevel = character.level ?? 1;
    const nextLevel = currentLevel + 1;

    // Validate selected spells/aptitudes
    const addSpells = payload.newSpellIds ?? [];
    if (addSpells.length > 0) {
      const invalid = await this.validateSelectedSpells(addSpells, nextLevel);
      if (invalid.length > 0)
        throw new BadRequestException(
          `Invalid spells for level ${nextLevel}: ${invalid.join(", ")}`,
        );
    }

    // Add spells to character
    const newSpells = await this.buildSpellResponses(addSpells, character.spells || []);
    const updatedSpells = [...(character.spells || []), ...newSpells];

    // Calculate new HP max using tactical formula
    const charClassName = character.className ?? className;
    const survival = character.stats?.survival ?? 0;
    const newHpMax = calculateMaxHP(charClassName, nextLevel, survival);

    // Get class PA/PM
    const classStats = CLASS_STATS[charClassName.toLowerCase()] ?? CLASS_STATS.guerrier;

    // Persist updates
    const updates = {
      level: nextLevel,
      spells: updatedSpells,
      hpMax: newHpMax,
      hp: newHpMax, // Full heal on level up
      paMax: classStats.pa,
      pmMax: classStats.pm,
    };

    const saved = await this.characterService.update(userId, characterId, updates);
    this.logger.log(`Applied level-up for ${characterId} => level ${nextLevel}`);
    return this.characterService.toCharacterDto(saved);
  }

  private async validateSelectedSpells(
    newSpellIds: string[],
    nextLevel: number,
  ): Promise<string[]> {
    const checks = await Promise.all(
      newSpellIds.map(async defId => {
        const def = await this.spellDefService.findByDefinitionId(defId);
        return { defId, def };
      }),
    );

    return checks.reduce((acc, { defId, def }) => {
      if (!def || (def.level ?? 0) > nextLevel) acc.push(defId);
      return acc;
    }, [] as string[]);
  }

  private async buildSpellResponses(
    newSpellIds: string[],
    existingSpells: SpellResponseDto[] = [],
  ): Promise<SpellResponseDto[]> {
    const existingSpellIds = new Set(existingSpells.map(s => s.definitionId));
    const results = await Promise.all(
      newSpellIds
        .filter(id => !existingSpellIds.has(id))
        .map(id => this.spellDefService.findByDefinitionId(id)),
    );
    return results.map(
      r =>
        ({
          definitionId: r.definitionId,
          name: r.name,
          level: r.level,
          description: r.description,
          meta: r.meta ?? {},
        }) as SpellResponseDto,
    );
  }
}
