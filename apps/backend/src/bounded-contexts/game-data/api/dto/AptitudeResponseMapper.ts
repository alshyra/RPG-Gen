import { Aptitude } from '../../domain/aptitude/entities/Aptitude.js';
import { AptitudeResponseDto, AptitudeTargetingResponseDto, AptitudeEffectResponseDto } from './AptitudeResponseDto.js';

/**
 * Maps Aptitude domain entity to API response DTO
 */
export class AptitudeResponseMapper {
  static toDto(entity: Aptitude): AptitudeResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.descriptionForAi,
      paCost: entity.paCost,
      cooldown: entity.cooldown,
      targeting: AptitudeResponseMapper.toTargetingDto(entity),
      effects: [AptitudeResponseMapper.toEffectDto(entity)],
      icon: undefined, // No icon property on domain entity
    };
  }

  private static toTargetingDto(entity: Aptitude): AptitudeTargetingResponseDto {
    return {
      type: entity.targetType,
      range: entity.range,
      aoe: entity.area ? parseInt(entity.area.split('_')[1] ?? '0', 10) : undefined,
    };
  }

  private static toEffectDto(entity: Aptitude): AptitudeEffectResponseDto {
    return {
      type: entity.effectType,
      value: entity.basePower,
      scaling: entity.scaling !== 'none' ? entity.scaling : undefined,
      duration: undefined,
    };
  }
}
