import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeaponMetaResponseDto } from './WeaponMetaResponseDto.js';
import { ArmorMetaResponseDto } from './ArmorMetaResponseDto.js';
import { ConsumableMetaResponseDto } from './ConsumableMetaResponseDto.js';

// Re-export for convenience
export { WeaponMetaResponseDto, ArmorMetaResponseDto, ConsumableMetaResponseDto };

/**
 * Item definition response DTO
 */
export class ItemResponseDto {
  @ApiProperty({ description: 'Item definition ID (unique identifier)', example: 'epee_longue' })
  definitionId: string;

  @ApiProperty({ description: 'Display name', example: 'Épée longue' })
  name: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Une épée classique.' })
  description?: string;

  @ApiProperty({ description: 'Rarity', example: 'common', enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] })
  rarity: string;

  @ApiPropertyOptional({ description: 'Base value in gold', example: 50 })
  value?: number;

  @ApiProperty({ description: 'Is this a starter item?', example: false })
  isStarter: boolean;

  @ApiPropertyOptional({ description: 'Icon emoji', example: '⚔️' })
  icon?: string;

  @ApiPropertyOptional({ description: 'Metadata (weapon/armor/consumable)', type: Object })
  meta?: WeaponMetaResponseDto | ArmorMetaResponseDto | ConsumableMetaResponseDto;
}
