import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SpellDefinitionService } from '../spell-definition/spell-definition.service.js';
import type { LevelUpOptionsDto } from '../character/dto/LevelUpOptionsDto.js';
import type { SpellResponseDto } from '../character/dto/SpellResponseDto.js';

interface ClassLevelData {
  schemaVersion: number;
  className: string;
  hitDie: string;
  primarySpellAbility: string;
  levels: {
    level: number;
    proficiencyBonus: number;
    cantripsKnown?: number;
    spellsKnown?: number;
    spellSlots?: Record<string, number>;
    features: any[];
    choices: any[];
    unlockedSpells: any[];
  }[];
  allowedSpellsByLevel: Record<string, { name: string;
    definitionId: string; }[]>;
}

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  // Level numbers (D&D 5e typical progression) for ASI and proficiency increases
  private ASI_LEVELS = [4, 8, 12, 16, 19];
  private PROFICIENCY_INCREASE_LEVELS = [5, 9, 13, 17];

  // Cache for class data
  private classDataCache = new Map<string, ClassLevelData>();

  constructor(
    private readonly spellDefService: SpellDefinitionService,
  ) {}

  /**
   * Load class level data from seed files
   */
  private async loadClassData(className: string): Promise<ClassLevelData> {
    if (this.classDataCache.has(className)) {
      return this.classDataCache.get(className)!;
    }

    try {
      const classNameLower = className.toLowerCase();
      const seedPath = join(process.cwd(), 'src', 'seed', 'classes', `${classNameLower}.levels.json`);
      const content = await readFile(seedPath, 'utf-8');
      const data: ClassLevelData = JSON.parse(content);
      this.classDataCache.set(className, data);
      return data;
    } catch (error) {
      this.logger.error(`Failed to load class data for ${className}:`, error);
      throw new NotFoundException(`Class data not found for ${className}`);
    }
  }

  /**
   * Get class-level options for a given class and level (no character required)
   */
  async getOptionsForLevel(className: string, level: number): Promise<LevelUpOptionsDto> {
    const classData = await this.loadClassData(className);

    // Find the level data for this specific level
    const levelData = classData.levels.find(l => l.level === level);
    if (!levelData) {
      throw new NotFoundException(`Level ${level} not found for class ${className}`);
    }

    // Get allowed spell definitionIds for this class at all levels up to and including current level
    const allowedDefinitionIds = new Set<string>();

    // Collect all allowed spells from level 0 up to the requested level
    for (let lvl = 0; lvl <= level; lvl++) {
      const spellsAtLevel = classData.allowedSpellsByLevel[lvl.toString()] || [];
      spellsAtLevel.forEach((spell) => {
        if (spell.definitionId) {
          allowedDefinitionIds.add(spell.definitionId);
        }
      });
    }

    // Fetch all spells from level 0 up to requested level
    const allSpells: SpellResponseDto[] = [];
    for (let lvl = 0; lvl <= level; lvl++) {
      const spellsAtLevel = await this.spellDefService.findByLevel(lvl);
      const mapped = spellsAtLevel.map(s => ({
        definitionId: s.definitionId,
        name: s.name,
        level: s.level,
        description: s.description ?? undefined,
        meta: s.meta ?? {},
      }));
      allSpells.push(...mapped);
    }

    // Filter to only allowed spells for this class
    const unlockedSpells = allSpells.filter(spell => spell.definitionId && allowedDefinitionIds.has(spell.definitionId));

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

    this.logger.log(`Fetched class-level options for ${className} level ${level}: ${unlockedSpells.length} spells (filtered from ${allSpells.length} total), limits: ${levelData.cantripsKnown} cantrips, ${levelData.spellsKnown} spells`);
    return options;
  }
}
