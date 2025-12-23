import { Race } from '../../domain/race/entities/Race.js';
import { RaceResponseDto, RaceBonusesResponseDto, TraitEffectResponseDto } from './RaceResponseDto.js';

/**
 * Maps Race domain entity to API response DTO
 */
export class RaceResponseMapper {
  static toDto(entity: Race): RaceResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      trait: entity.trait,
      traitEffect: RaceResponseMapper.toTraitEffectDto(entity.traitEffect),
      bonuses: RaceResponseMapper.toBonusesDto(entity.bonuses),
      descriptionForAi: entity.descriptionForAi,
      color: entity.color,
      icon: entity.icon,
    };
  }

  private static toTraitEffectDto(traitEffect: { type: string; value: number; condition?: string }): TraitEffectResponseDto {
    return {
      type: traitEffect.type,
      value: traitEffect.value,
      condition: traitEffect.condition,
    };
  }

  private static toBonusesDto(bonuses: { vigor: number; finesse: number; mind: number; survival: number }): RaceBonusesResponseDto {
    return {
      vigor: bonuses.vigor,
      finesse: bonuses.finesse,
      mind: bonuses.mind,
      survival: bonuses.survival,
    };
  }
}
