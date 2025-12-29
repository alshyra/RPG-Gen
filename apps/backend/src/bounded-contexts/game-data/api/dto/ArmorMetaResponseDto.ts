import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Armor metadata DTO
 */
export class ArmorMetaResponseDto {
  @ApiProperty({ description: 'Item type (always armor)', example: 'armor' })
  type: 'armor';

  @ApiProperty({ description: 'Armor type', example: 'medium' })
  armorType: string;

  @ApiProperty({ description: 'Armor class bonus', example: 14 })
  armorClass: number;

  @ApiPropertyOptional({ description: 'Maximum dexterity bonus', example: 2 })
  maxDexBonus?: number;
}
