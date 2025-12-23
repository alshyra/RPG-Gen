import { ItemDefinition } from '../../domain/item/entities/ItemDefinition.js';
import { ItemResponseDto } from './ItemResponseDto.js';

/**
 * Maps ItemDefinition domain entity to API response DTO
 */
export class ItemResponseMapper {
  static toDto(entity: ItemDefinition): ItemResponseDto {
    return {
      definitionId: entity.definitionId,
      name: entity.name,
      description: entity.description,
      rarity: 'common', // Default - not in domain entity
      value: undefined, // Not in domain entity
      isStarter: entity.meta.starter ?? false,
      icon: undefined, // Not in domain entity
      meta: entity.meta as ItemResponseDto['meta'],
    };
  }
}
