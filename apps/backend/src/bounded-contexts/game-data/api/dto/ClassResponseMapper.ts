import { CharacterClass } from '../../domain/class/entities/CharacterClass.js';
import { TalentTree } from '../../domain/class/value-objects/TalentTree.js';
import { TalentRank } from '../../domain/class/value-objects/TalentRank.js';
import { ClassResponseDto, ClassStatsResponseDto, TalentTreeResponseDto, TalentRankResponseDto } from './ClassResponseDto.js';

/**
 * Maps CharacterClass domain entity to API response DTO
 */
export class ClassResponseMapper {
  static toDto(entity: CharacterClass): ClassResponseDto {
    return {
      name: entity.name,
      baseStats: ClassResponseMapper.toStatsDto(entity),
      proficiencies: [...entity.proficiencies],
      startingAptitudes: [...entity.startingAptitudes],
      talentTrees: entity.talentTrees.map(tree => ClassResponseMapper.toTreeDto(tree)),
    };
  }

  private static toStatsDto(entity: CharacterClass): ClassStatsResponseDto {
    return {
      hpBase: entity.stats.hpBase,
      hpGain: entity.stats.hpGain,
      pa: entity.stats.pa,
      pm: entity.stats.pm,
    };
  }

  private static toTreeDto(tree: TalentTree): TalentTreeResponseDto {
    return {
      name: tree.name,
      ranks: tree.ranks.map(rank => ClassResponseMapper.toRankDto(rank)),
    };
  }

  private static toRankDto(rank: TalentRank): TalentRankResponseDto {
    return {
      rank: rank.rank,
      aptitudeId: rank.aptitudeId,
      pointCost: rank.pointCost,
    };
  }
}
