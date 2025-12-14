import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SpellDefinitionService } from '../spell-definition/spell-definition.service.js';
import { ClassDefinitionService } from '../class-definition/class-definition.service.js';
import type { LevelUpOptionsDto } from '../character/dto/LevelUpOptionsDto.js';
import type { SpellResponseDto } from '../character/dto/SpellResponseDto.js';

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

  /**
   * Get class-level options for a given class and level (no character required)
   */
  async getOptionsForLevel(className: string, level: number): Promise<LevelUpOptionsDto> {
    const classData = await this.classDefService.findByNameOrThrow(className);

    // Find the level data for this specific level
    const levelData = classData.levels.find(l => l.level === level);
    if (!levelData) {
      throw new NotFoundException(`Level ${level} not found for class ${className}`);
    }

    // Get allowed spell definitionIds for this class at all levels up to and including current level
    const allowedDefinitionIds = new Set<string>();

    // Collect all allowed spells from level 0 up to the requested level
    const allowedSpellsByLevel = classData.allowedSpellsByLevel || {};
    Array.from({ length: level + 1 }, (_, i) => i).forEach(lvl => {
      const spellsAtLevel = allowedSpellsByLevel[lvl.toString()] || [];
      spellsAtLevel.forEach((spell: any) => {
        if (spell.definitionId) allowedDefinitionIds.add(spell.definitionId);
      });
    });

    // Fetch all spells from level 0 up to requested level
    const levels = Array.from({ length: level + 1 }, (_, i) => i);
    const allSpells: SpellResponseDto[] = [];
    const spellsPerLevel = await Promise.all(
      levels.map(lvl => this.spellDefService.findByLevel(lvl)),
    );
    spellsPerLevel.forEach(spellsAtLevel => {
      const mapped = spellsAtLevel.map(s => ({
        definitionId: s.definitionId,
        name: s.name,
        level: s.level,
        description: s.description ?? undefined,
        meta: s.meta ?? {},
      }));
      allSpells.push(...mapped);
    });

    // Filter to only allowed spells for this class
    const unlockedSpells = allSpells.filter(
      spell => spell.definitionId && allowedDefinitionIds.has(spell.definitionId),
    );

    const options: LevelUpOptionsDto = {
      className,
      currentLevel: level - 1,
      nextLevel: level,
      unlockedSpells,
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
