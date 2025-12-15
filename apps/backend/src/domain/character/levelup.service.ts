import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CharacterService } from './character.service.js';
import { SpellDefinitionService } from '../spell-definition/spell-definition.service.js';
import type { CharacterResponseDto } from './dto/CharacterResponseDto.js';
import type { LevelUpOptionsDto } from './dto/LevelUpOptionsDto.js';
import type { LevelUpApplyDto } from './dto/LevelUpApplyDto.js';
import type { SpellResponseDto } from './dto/SpellResponseDto.js';
import type { CharacterClassResponseDto } from './dto/CharacterClassResponseDto.js';
import type { UpdateCharacterRequestDto } from './dto/UpdateCharacterRequestDto.js';

@Injectable()
export class LevelUpService {
  private readonly logger = new Logger(LevelUpService.name);

  // Level numbers (D&D 5e typical progression) for ASI and proficiency increases
  private ASI_LEVELS = [4, 8, 12, 16, 19];
  private PROFICIENCY_INCREASE_LEVELS = [5, 9, 13, 17];

  constructor(
    private readonly characterService: CharacterService,
    private readonly spellDefService: SpellDefinitionService,
  ) {}

  async getOptionsForClass(
    character: CharacterResponseDto,
    className: string,
  ): Promise<LevelUpOptionsDto> {
    const classRecord = (character.classes || []).find(
      c => String(c.name).toLowerCase() === String(className).toLowerCase(),
    );
    const currentLevel = classRecord?.level ?? 0;
    const nextLevel = currentLevel + 1;

    // For MVP: unlocked spells are all spells with level === nextLevel
    const unlocked = await this.spellDefService.findByLevel(nextLevel);

    // Map SpellDefinition -> SpellResponseDto to keep DTO contract (now including definitionId)
    const unlockedSpells: SpellResponseDto[] = (unlocked || []).map(s => ({
      definitionId: s.definitionId,
      name: s.name,
      level: s.level,
      description: s.description ?? undefined,
      meta: s.meta ?? {},
    }));

    const options: LevelUpOptionsDto = {
      className,
      currentLevel,
      nextLevel,
      unlockedSpells,
      asiAvailable: this.ASI_LEVELS.includes(nextLevel),
      proficiencyIncrease: this.PROFICIENCY_INCREASE_LEVELS.includes(nextLevel),
      cantripsKnown: 0, // Legacy method - not class-data-driven, set to 0
      spellsKnown: 0, // Legacy method - not class-data-driven, set to 0
    };

    return options;
  }

  private async saveCharacterUpdates(
    userId: string,
    characterId: string,
    updates: UpdateCharacterRequestDto,
  ) {
    return this.characterService.update(userId, characterId, updates);
  }

  private getClassLevelInfo(character: CharacterResponseDto, className: string) {
    const idx = (character.classes || []).findIndex(
      c => String(c.name).toLowerCase() === String(className).toLowerCase(),
    );
    const classRecord = idx >= 0 ? character.classes![idx] : undefined;
    const currentLevel = classRecord?.level ?? 0;
    const nextLevel = currentLevel + 1;
    return {
      idx,
      currentLevel,
      nextLevel,
    };
  }

  private ensureClassLevel(
    character: CharacterResponseDto,
    idx: number,
    className: string,
    nextLevel: number,
  ) {
    if (idx >= 0) character.classes![idx].level = nextLevel;
    else {
      const newClass: CharacterClassResponseDto = {
        name: className,
        level: nextLevel,
      };
      character.classes = [...(character.classes || []), newClass];
    }
  }

  async applyLevelUp(
    userId: string,
    characterId: string,
    className: string,
    payload: LevelUpApplyDto,
  ) {
    const character = await this.characterService.findByCharacterId(userId, characterId);
    if (!character) throw new BadRequestException('character not found');

    const { idx, nextLevel } = this.getClassLevelInfo(character, className);

    // Validate selected spells levels
    const addSpells = payload.newSpellIds ?? [];
    if (addSpells.length > 0) {
      const invalid = await this.validateSelectedSpells(addSpells, nextLevel);
      if (invalid.length > 0)
        throw new BadRequestException(
          `Invalid spells for level ${nextLevel}: ${invalid.join(', ')}`,
        );
    }

    // Apply changes: increment class level
    this.ensureClassLevel(character, idx, className, nextLevel);

    // Add spells to character.spells (SpellResponseDto)
    const newSpells = await this.buildSpellResponses(addSpells, character.spells || []);
    const updatedSpells = [...(character.spells || []), ...newSpells];

    // Apply ability increases if any
    const updatedScores = this.applyAbilityIncreases(
      character.scores as Record<string, unknown> | undefined,
      payload.abilityIncreases ?? [],
    );

    // Handle selected combat proficiencies: append new selections to existing ones
    const newCombatProficiencies = payload.selectedCombatProficiencies ?? [];
    const existingCombatProficiencies = character.selectedCombatProficiencies ?? [];
    const combinedCombatProficiencies = [...existingCombatProficiencies, ...newCombatProficiencies];
    // Remove duplicates while preserving order
    const uniqueCombatProficiencies = Array.from(new Set(combinedCombatProficiencies));

    // persist
    const updates = {
      classes: character.classes,
      spells: updatedSpells,
      scores: updatedScores,
      selectedCombatProficiencies: uniqueCombatProficiencies,
    };

    const saved = await this.saveCharacterUpdates(userId, characterId, updates);
    this.logger.log(`Applied level-up for ${characterId} / ${className} => ${nextLevel}`);
    return this.characterService.toCharacterDto(saved);
  }

  private async validateSelectedSpells(
    newSpellIds: string[],
    nextLevel: number,
  ): Promise<string[]> {
    // Perform validation in parallel to avoid banned loop constructs.
    const checks = await Promise.all(
      newSpellIds.map(async defId => {
        const def = await this.spellDefService.findByDefinitionId(defId);
        return {
          defId,
          def,
        };
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

  private applyAbilityIncreases(
    scores: Record<string, unknown> | undefined,
    abilityIncreases: {
      ability: string;
      inc: number;
    }[],
  ): Record<string, number> {
    const updatedScores = { ...(scores as Record<string, number>) } as Record<string, number>;
    (abilityIncreases || []).forEach(asi => {
      if (!asi || !asi.ability) return;
      const key = asi.ability;
      const old = updatedScores[key] ?? 10;
      updatedScores[key] = old + (asi.inc ?? 0);
    });
    return updatedScores;
  }
}
