import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { SpellDefinitionService } from "../spell-definition/spell-definition.service.js";
import { ClassDefinitionService } from "../class-definition/class-definition.service.js";
import type { LevelUpOptionsDto } from "../character/dto/LevelUpOptionsDto.js";
import type { SpellResponseDto } from "../character/dto/SpellResponseDto.js";
import CombatOption from "src/infra/mongo/class/CombatOption.js";
import { ClassDefinition } from "src/infra/mongo/index.js";
import { CombatOptionDto } from "../character/dto/CombatOptionDto.js";

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  // Level numbers (D&D 5e typical progression) for ASI and proficiency increases
  private ASI_LEVELS = [4, 8, 12, 16, 19];
  private PROFICIENCY_INCREASE_LEVELS = [5, 9, 13, 17];

  constructor(
    private readonly spellDefService: SpellDefinitionService,
    private readonly classDefService: ClassDefinitionService,
  ) {}

  private getLevelDataOrThrow(classData: ClassDefinition, level: number) {
    const levelData = classData.levels.find(l => l.level === level);
    if (!levelData) {
      throw new NotFoundException(
        `Level ${level} not found for class ${classData.name ?? "unknown"}`,
      );
    }
    return levelData;
  }

  private getDefinitionIdsByLevel(allowedSpellsByLevel: Map<string, { definitionId?: string }[]>) {
    return (lvl: number) =>
      (allowedSpellsByLevel?.get(lvl.toString()) ?? [])
        .filter(spell => !!(spell && spell.definitionId))
        .map(spell => spell.definitionId)
        .filter((definitionId): definitionId is string => !!definitionId);
  }

  private buildAllowedDefinitionIds(
    allowedSpellsByLevel: Map<string, { definitionId?: string }[]>,
    maxLevel = 0,
  ) {
    return new Set<string>(
      Array.from({ length: maxLevel + 1 }, (_, i) => i)
        .flatMap(this.getDefinitionIdsByLevel(allowedSpellsByLevel))
        .filter(Boolean),
    );
  }

  private gatherDedupedCombatOptions(
    combatOptionsByLevel: Map<string, CombatOption[]>,
    maxLevel: number,
  ) {
    return Array.from(
      new Set(
        Array.from({ length: maxLevel + 1 }, (_, i) => i)
          .flatMap(lvl => combatOptionsByLevel.get(lvl.toString()))
          .filter(combatOption => !!combatOption),
      ),
    ).map(combatOption => new CombatOptionDto(combatOption));
  }

  private async fetchAllSpellsUpToLevel(level: number): Promise<SpellResponseDto[]> {
    const levels = Array.from({ length: level + 1 }, (_, i) => i);
    const spellsPerLevel = await Promise.all(
      levels.map(lvl => this.spellDefService.findByLevel(lvl)),
    );
    return spellsPerLevel.flatMap(spellsAtLevel =>
      spellsAtLevel.map(spell => ({
        definitionId: spell.definitionId,
        name: spell.name,
        level: spell.level,
        description: spell.description ?? undefined,
        meta: spell.meta ?? {},
      })),
    );
  }

  private filterUnlockedSpells(allowedDefinitionIds: Set<string>) {
    return (spell: SpellResponseDto) =>
      spell.definitionId && allowedDefinitionIds.has(spell.definitionId);
  }

  /**
   * Get class-level options for a given class and level (no character required)
   */
  async getOptionsForLevel(className: string, level: number): Promise<LevelUpOptionsDto> {
    const classData = await this.classDefService.findByNameOrThrow(className);
    const levelData = this.getLevelDataOrThrow(classData, level);

    const allowedDefinitionIds = this.buildAllowedDefinitionIds(
      classData.allowedSpellsByLevel,
      level,
    );
    const dedupedCombatOptions = this.gatherDedupedCombatOptions(
      classData.combatOptionsByLevel,
      level,
    );
    const allSpells = await this.fetchAllSpellsUpToLevel(level);
    const unlockedSpells = allSpells.filter(this.filterUnlockedSpells(allowedDefinitionIds));

    const options: LevelUpOptionsDto = {
      className,
      currentLevel: level - 1,
      nextLevel: level,
      unlockedSpells,
      combatOptions: dedupedCombatOptions,
      asiAvailable: this.ASI_LEVELS.includes(level),
      proficiencyIncrease: this.PROFICIENCY_INCREASE_LEVELS.includes(level),
      cantripsKnown: levelData.cantripsKnown ?? 0,
      spellsKnown: levelData.spellsKnown ?? 0,
    };

    this.logger.log(
      `Fetched class-level options for ${className} level ${level}: ${unlockedSpells.length} spells (filtered from ${allSpells.length} total), limits: ${levelData.cantripsKnown} cantrips, ${levelData.spellsKnown} spells`,
    );
    return options;
  }
}
