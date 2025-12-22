import { Injectable, Logger } from "@nestjs/common";
import { CharacterDocument } from "../../infra/mongo/index.js";
import { AptitudeService } from "../aptitude/aptitude.service.js";
import { ClassDefinitionService } from "../class-definition/class-definition.service.js";
import { AptitudeResponseDto } from "./dto/AptitudeResponseDto.js";
import { VoieProgressDto } from "./dto/VoieProgressDto.js";
import { CharacterResponseDto } from "./dto/CharacterResponseDto.js";
import { DraftCharacterResponseDto } from "./dto/DraftCharacterResponseDto.js";

/**
 * Service to map CharacterDocument to enriched DTOs.
 * Resolves aptitudes and voies from their IDs to full objects.
 */
@Injectable()
export class CharacterResponseMapper {
  private readonly logger = new Logger(CharacterResponseMapper.name);

  constructor(
    private readonly aptitudeService: AptitudeService,
    private readonly classDefinitionService: ClassDefinitionService,
  ) {}

  /**
   * Convert CharacterDocument to response DTO with enriched aptitudes and voies.
   */
  async toEnrichedResponse(
    character: CharacterDocument,
  ): Promise<CharacterResponseDto | DraftCharacterResponseDto> {
    // Build enriched aptitudes
    const enrichedAptitudes = await this.buildEnrichedAptitudes(character);
    
    // Build voies progress
    const voiesProgress = await this.buildVoiesProgress(character);
    
    // Create base DTO
    const baseDto = character.state === "draft"
      ? new DraftCharacterResponseDto(character)
      : new CharacterResponseDto(character);
    
    // Add enriched data
    baseDto.aptitudes = enrichedAptitudes;
    baseDto.voies = voiesProgress;
    
    return baseDto;
  }

  /**
   * Build enriched aptitude DTOs from character's aptitude IDs.
   */
  private async buildEnrichedAptitudes(
    character: CharacterDocument,
  ): Promise<AptitudeResponseDto[]> {
    const characterAptitudes = character.aptitudes || [];
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
    character: CharacterDocument,
  ): Promise<VoieProgressDto[]> {
    if (!character.className) {
      return [];
    }

    const classDef = await this.classDefinitionService.findByName(character.className);
    if (!classDef?.talentTrees) {
      return [];
    }

    const unlockedRanks = character.unlockedRanks || [];

    // Build a map of voieId -> max unlocked rank
    const voieRankMap = new Map<string, number>();
    for (const rank of unlockedRanks) {
      const current = voieRankMap.get(rank.voieId) || 0;
      if (rank.rank > current) {
        voieRankMap.set(rank.voieId, rank.rank);
      }
    }

    // Create VoieProgressDto for each talent tree
    return Object.entries(classDef.talentTrees).map(([voieId, tree]) => {
      const currentRank = voieRankMap.get(voieId) || 0;
      
      // Get unlocked aptitude IDs for this voie
      const unlockedAptitudes: string[] = [];
      for (const rank of (tree.ranks || [])) {
        if (rank.rank <= currentRank && rank.aptitudeId) {
          unlockedAptitudes.push(rank.aptitudeId);
        }
      }

      // Map all ranks to TalentRankDto
      const ranks = (tree.ranks || []).map(rank => ({
        rank: rank.rank,
        aptitudeId: rank.aptitudeId,
        pointCost: rank.pointCost,
      }));

      return new VoieProgressDto({
        voieId,
        voieName: tree.name,
        className: character.className!,
        currentRank,
        requiredTalentPoints: currentRank < 5 ? 1 : undefined,
        unlockedAptitudes,
        ranks,
      });
    });
  }
}
