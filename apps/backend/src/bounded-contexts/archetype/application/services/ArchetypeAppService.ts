import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Archetype } from '../../domain/entities/Archetype.js';
import { TalentTree } from '../../domain/value-objects/TalentTree.js';
import { TalentRank } from '../../domain/value-objects/TalentRank.js';
import {
  IArchetypeRepository,
} from '../../domain/repositories/IArchetypeRepository.js';
import { VoieProgressDto } from '../../../character/api/dto/response/VoieProgressDto.js';
import { ClassDefinitionResponseDto, TalentTreeDto } from '../../api/dto/index.js';

/**
 * Application Service for Archetype bounded context
 *
 * @description
 * Orchestrates archetype use cases:
 * - Delegates queries to repository
 * - Applies domain logic (via entities)
 * - Transforms domain entities to DTOs for API responses
 *
 * NO business logic here — all in CharacterClass / TalentTree entities.
 * This is a thin orchestration layer between controller and domain.
 */
@Injectable()
export class ArchetypeAppService {
  private readonly logger = new Logger(ArchetypeAppService.name);

  constructor(
    @Inject('IArchetypeRepository')
    private readonly repository: IArchetypeRepository,
  ) {}

  // ========================================
  // QUERIES (Read Operations)
  // ========================================

  /**
   * Retrieve all archetypes
   */
  async findAll(): Promise<Archetype[]> {
    return this.repository.findAll();
  }

  /**
   * Find an archetype by name
   * @throws NotFoundException
   */
  async findByName(name: string): Promise<Archetype> {
    return this.repository.findByNameOrThrow(name);
  }

  /**
   * Get all archetypes as API DTOs
   */
  async getAllArchetypesDto(): Promise<ClassDefinitionResponseDto[]> {
    const archetypes = await this.repository.findAll();
    return archetypes.map(archetype => this.archetypeToDto(archetype));
  }

  /**
   * Get an archetype as API DTO
   */
  async getArchetypeDto(name: string): Promise<ClassDefinitionResponseDto> {
    const archetype = await this.repository.findByNameOrThrow(name);
    return this.archetypeToDto(archetype);
  }

  /**
   * Get talent trees (voies) for an archetype
   */
  async getTalentTreesDto(name: string): Promise<TalentTreeDto[]> {
    const archetype = await this.repository.findByNameOrThrow(name);
    return archetype.talentTrees.map((tree, index) => this.talentTreeToDto(tree, index));
  }

  /**
   * Get starting aptitudes for an archetype
   */
  async getStartingAptitudes(name: string): Promise<string[]> {
    const archetype = await this.repository.findByNameOrThrow(name);
    return [...archetype.startingAptitudes];
  }

  /**
   * Get all talent trees with metadata for character progression
   */
  async getVoiesWithMetadata(archetypeName: string): Promise<VoieProgressDto[]> {
    const archetype = await this.repository.findByNameOrThrow(archetypeName);

    return archetype.talentTrees.map((voie, index) => ({
      voieId: `voie_${index}`,
      voieName: voie.name,
      className: archetypeName,
      currentRank: 0, // Default unstarted
      requiredTalentPoints: this.calculateTalentPointsForRank(voie, 1),
      unlockedAptitudes: [],
      ranks: voie.ranks.map(rank => ({
        rank: rank.rank,
        aptitudeId: rank.aptitudeId,
        pointCost: rank.pointCost,
      })),
    }));
  }

  /**
   * Calculate total talent points required to reach a rank in a single voie
   */
  calculateTalentPointsForRank(voie: TalentTree, targetRank: number): number {
    if (targetRank < 1 || targetRank > 5) {
      throw new Error('Rank must be between 1 and 5');
    }

    let totalPoints = 0;
    for (let i = 1; i <= targetRank; i++) {
      const rank = voie.getRankData(i);
      if (rank) {
        totalPoints += rank.pointCost;
      }
    }
    return totalPoints;
  }

  /**
   * Get total talent points required for all 3 voies at a specific rank
   */
  async calculateTotalPointsForAllVoies(
    archetypeName: string,
    targetRank: number,
  ): Promise<number> {
    const archetype = await this.repository.findByNameOrThrow(archetypeName);

    return archetype.talentTrees.reduce((total, voie) => {
      return total + this.calculateTalentPointsForRank(voie, targetRank);
    }, 0);
  }

  /**
   * Get a specific rank in a voie
   */
  async getRankInVoie(
    archetypeName: string,
    voieIndex: number,
    rankNumber: number,
  ): Promise<TalentRank | null> {
    const archetype = await this.repository.findByNameOrThrow(archetypeName);
    const voie = archetype.talentTrees[voieIndex];

    if (!voie) {
      return null;
    }

    return voie.getRankData(rankNumber);
  }

  // ========================================
  // COMMANDS (Write Operations)
  // ========================================

  /**
   * Save an archetype
   */
  async save(archetype: Archetype): Promise<Archetype> {
    return this.repository.save(archetype);
  }

  /**
   * Delete an archetype by name
   */
  async delete(name: string): Promise<void> {
    return this.repository.delete(name);
  }

  // ========================================
  // DTO MAPPERS
  // ========================================

  private archetypeToDto(archetype: Archetype): ClassDefinitionResponseDto {
    return {
      name: archetype.name,
      baseStats: {
        hpBase: archetype.stats.hpBase,
        hpGain: archetype.stats.hpGain,
        pa: archetype.stats.pa,
        pm: archetype.stats.pm,
      },
      startingAptitudes: [...archetype.startingAptitudes],
    };
  }

  private talentTreeToDto(tree: TalentTree, index: number): TalentTreeDto {
    return {
      id: `voie_${index}`,
      name: tree.name,
      ranks: tree.ranks.map(rank => ({
        rank: rank.rank,
        aptitudeId: rank.aptitudeId,
        pointCost: rank.pointCost,
      })),
    };
  }
}
