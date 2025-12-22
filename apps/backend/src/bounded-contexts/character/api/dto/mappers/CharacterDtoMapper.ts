import { Injectable, Logger } from "@nestjs/common";
import { CharacterEntity } from "../../../domain/entities/CharacterEntity.js";
import { BaseCharacterResponseDto } from "../response/BaseCharacterResponseDto.js";
import { CharacterResponseDto } from "../response/CharacterResponseDto.js";
import { DraftCharacterResponseDto } from "../response/DraftCharacterResponseDto.js";
import { DeceasedCharacterResponseDto } from "../response/DeceasedCharacterResponseDto.js";
import { AptitudeResponseDto } from "../response/AptitudeResponseDto.js";
import { VoieProgressDto } from "../response/VoieProgressDto.js";
import type { InventoryItemDto } from "../response/InventoryItemDto.js";
import type { TacticalStats } from "../response/TacticalStats.js";
import { AptitudeService } from "../../../../spell/domain/services/AptitudeService.js";
import { ClassDefinitionService } from "../../../../../domain/class-definition/class-definition.service.js";
import { CharacterMapper } from "../../../infrastructure/persistence/mongo/mappers/CharacterMapper.js";
import type { CharacterDocument } from "../../../infrastructure/persistence/mongo/schemas/CharacterDocument.js";

/**
 * Mapper for converting CharacterEntity to API response DTOs.
 * Injectable service that can enrich responses with aptitudes and voies.
 */
@Injectable()
export class CharacterDtoMapper {
  private readonly logger = new Logger(CharacterDtoMapper.name);

  constructor(
    private readonly aptitudeService: AptitudeService,
    private readonly classDefinitionService: ClassDefinitionService,
  ) {}

  /**
   * Convert a CharacterEntity to enriched response DTO with aptitudes and voies.
   */
  async toEnrichedDto(entity: CharacterEntity): Promise<CharacterResponseDto | DraftCharacterResponseDto> {
    const baseDto = CharacterDtoMapper.toDto(entity);
    
    // Build enriched aptitudes
    const enrichedAptitudes = await this.buildEnrichedAptitudes(entity);
    
    // Build voies progress
    const voiesProgress = await this.buildVoiesProgress(entity);
    
    // Add enriched data
    baseDto.aptitudes = enrichedAptitudes;
    baseDto.voies = voiesProgress;
    
    return baseDto;
  }

  /**
   * Convert a CharacterDocument to enriched response DTO.
   * Used for services that still return CharacterDocument (e.g., ProgressionService).
   */
  async toEnrichedDtoFromDocument(doc: CharacterDocument): Promise<CharacterResponseDto | DraftCharacterResponseDto> {
    const entity = CharacterMapper.toDomain(doc);
    return this.toEnrichedDto(entity);
  }

  /**
   * Build enriched aptitude DTOs from character's aptitude IDs.
   */
  private async buildEnrichedAptitudes(
    entity: CharacterEntity,
  ): Promise<AptitudeResponseDto[]> {
    const characterAptitudes = entity.aptitudes;
    if (characterAptitudes.length === 0) {
      return [];
    }

    const aptitudeIds = characterAptitudes.map(a => a.aptitudeId);
    const aptitudeDefinitions = await this.aptitudeService.findByIds(aptitudeIds);

    return characterAptitudes.map(charApt => {
      const definition = aptitudeDefinitions.find(d => d.aptitudeId === charApt.aptitudeId);
      if (!definition) {
        this.logger.warn(`Aptitude definition not found for ID: ${charApt.aptitudeId}`);
        return null;
      }

      return new AptitudeResponseDto({
        aptitudeId: definition.aptitudeId,
        name: definition.name,
        description: definition.description,
        descriptionForAi: definition.descriptionForAi,
        paCost: definition.paCost,
        pmCost: definition.pmCost,
        cooldown: definition.cooldown,
        targetType: definition.targetType,
        range: definition.range,
        areaOfEffect: definition.areaOfEffect,
        category: definition.category,
        basePower: definition.basePower,
        currentCooldown: charApt.currentCooldown,
      });
    }).filter((apt): apt is AptitudeResponseDto => apt !== null);
  }

  /**
   * Build voies progress DTOs from character's unlocked ranks.
   */
  private async buildVoiesProgress(
    entity: CharacterEntity,
  ): Promise<VoieProgressDto[]> {
    if (!entity.className) {
      return [];
    }

    const classDef = await this.classDefinitionService.findByName(entity.className);
    if (!classDef?.talentTrees) {
      return [];
    }

    const unlockedRanks = entity.unlockedRanks;

    // Build a map of voieId -> max unlocked rank
    const voieRankMap = new Map<string, number>();
    unlockedRanks.forEach(rank => {
      const current = voieRankMap.get(rank.voieId) || 0;
      if (rank.rank > current) {
        voieRankMap.set(rank.voieId, rank.rank);
      }
    });

    // Create VoieProgressDto for each talent tree
    return Object.entries(classDef.talentTrees).map(([voieId, tree]) => {
      const currentRank = voieRankMap.get(voieId) || 0;
      
      // Get unlocked aptitude IDs for this voie
      const unlockedAptitudes: string[] = [];
      (tree.ranks || []).forEach(rank => {
        if (rank.rank <= currentRank && rank.aptitudeId) {
          unlockedAptitudes.push(rank.aptitudeId);
        }
      });

      // Map all ranks to TalentRankDto
      const ranks = (tree.ranks || []).map(rank => ({
        rank: rank.rank,
        aptitudeId: rank.aptitudeId,
        pointCost: rank.pointCost,
      }));

      return new VoieProgressDto({
        voieId,
        voieName: tree.name,
        className: entity.className!,
        currentRank,
        requiredTalentPoints: currentRank < 5 ? 1 : undefined,
        unlockedAptitudes,
        ranks,
      });
    });
  }

  /**
   * Convert a CharacterEntity to the appropriate response DTO based on state.
   */
  static toDto(entity: CharacterEntity): CharacterResponseDto | DraftCharacterResponseDto {
    if (entity.isDraft) {
      return CharacterDtoMapper.toDraftDto(entity);
    }
    return CharacterDtoMapper.toCompleteDto(entity);
  }

  /**
   * Convert a CharacterEntity to DraftCharacterResponseDto.
   */
  static toDraftDto(entity: CharacterEntity): DraftCharacterResponseDto {
    const stats: TacticalStats | undefined = entity.stats
      ? {
          vigor: entity.stats.vigor,
          finesse: entity.stats.finesse,
          mind: entity.stats.mind,
          survival: entity.stats.survival,
        }
      : undefined;

    const inventory: InventoryItemDto[] = entity.inventory.map(item => ({
      _id: item._id,
      definitionId: item.definitionId,
      name: item.name,
      qty: item.qty,
      description: item.description ?? "",
      equipped: item.equipped,
      meta: item.meta ?? {},
    }));

    return new DraftCharacterResponseDto({
      characterId: entity.id,
      name: entity.name,
      physicalDescription: entity.physicalDescription,
      portrait: entity.portrait,
      gender: entity.gender,
      state: "draft",
      className: entity.className,
      raceId: entity.raceId,
      level: entity.level,
      stats,
      hp: entity.hp,
      hpMax: entity.hpMax,
      pa: entity.pa,
      paMax: entity.paMax,
      pm: entity.pm,
      pmMax: entity.pmMax,
      totalXp: entity.totalXp,
      inspirationPoints: entity.inspirationPoints,
      isDeceased: entity.isDeceased,
      inventory,
    });
  }

  /**
   * Convert a CharacterEntity to CharacterResponseDto (complete character).
   */
  static toCompleteDto(entity: CharacterEntity): CharacterResponseDto {
    const stats: TacticalStats | undefined = entity.stats
      ? {
          vigor: entity.stats.vigor,
          finesse: entity.stats.finesse,
          mind: entity.stats.mind,
          survival: entity.stats.survival,
        }
      : undefined;

    const inventory: InventoryItemDto[] = entity.inventory.map(item => ({
      _id: item._id,
      definitionId: item.definitionId,
      name: item.name,
      qty: item.qty,
      description: item.description ?? "",
      equipped: item.equipped,
      meta: item.meta ?? {},
    }));

    return new CharacterResponseDto({
      characterId: entity.id,
      name: entity.name,
      physicalDescription: entity.physicalDescription,
      portrait: entity.portrait,
      gender: entity.gender,
      state: entity.state,
      className: entity.className,
      raceId: entity.raceId,
      level: entity.level,
      stats,
      hp: entity.hp,
      hpMax: entity.hpMax,
      pa: entity.pa,
      paMax: entity.paMax,
      pm: entity.pm,
      pmMax: entity.pmMax,
      totalXp: entity.totalXp,
      inspirationPoints: entity.inspirationPoints,
      talentPoints: entity.talentPoints,
      isDeceased: entity.isDeceased,
      diedAt: entity.diedAt?.toISOString(),
      deathLocation: entity.deathLocation,
      inventory,
    });
  }

  /**
   * Convert a CharacterEntity to DeceasedCharacterResponseDto.
   */
  static toDeceasedDto(entity: CharacterEntity): DeceasedCharacterResponseDto {
    const baseDto = CharacterDtoMapper.toCompleteDto(entity);
    return new DeceasedCharacterResponseDto({
      ...baseDto,
      diedAt: entity.diedAt?.toISOString(),
      deathLocation: entity.deathLocation,
    });
  }

  /**
   * Convert a CharacterEntity to BaseCharacterResponseDto.
   */
  static toBaseDto(entity: CharacterEntity): BaseCharacterResponseDto {
    const stats: TacticalStats | undefined = entity.stats
      ? {
          vigor: entity.stats.vigor,
          finesse: entity.stats.finesse,
          mind: entity.stats.mind,
          survival: entity.stats.survival,
        }
      : undefined;

    const inventory: InventoryItemDto[] = entity.inventory.map(item => ({
      _id: item._id,
      definitionId: item.definitionId,
      name: item.name,
      qty: item.qty,
      description: item.description ?? "",
      equipped: item.equipped,
      meta: item.meta ?? {},
    }));

    return new BaseCharacterResponseDto({
      characterId: entity.id,
      name: entity.name,
      physicalDescription: entity.physicalDescription,
      portrait: entity.portrait,
      gender: entity.gender,
      state: entity.state,
      className: entity.className,
      raceId: entity.raceId,
      level: entity.level,
      stats,
      hp: entity.hp,
      hpMax: entity.hpMax,
      pa: entity.pa,
      paMax: entity.paMax,
      pm: entity.pm,
      pmMax: entity.pmMax,
      totalXp: entity.totalXp,
      inspirationPoints: entity.inspirationPoints,
      talentPoints: entity.talentPoints,
      isDeceased: entity.isDeceased,
      diedAt: entity.diedAt?.toISOString(),
      deathLocation: entity.deathLocation,
      inventory,
    });
  }

  /**
   * Convert multiple entities to DTOs.
   */
  static toDtoMany(
    entities: CharacterEntity[],
  ): (CharacterResponseDto | DraftCharacterResponseDto)[] {
    return entities.map(e => CharacterDtoMapper.toDto(e));
  }

  /**
   * Convert multiple entities to base DTOs.
   */
  static toBaseDtoMany(entities: CharacterEntity[]): BaseCharacterResponseDto[] {
    return entities.map(e => CharacterDtoMapper.toBaseDto(e));
  }
}
