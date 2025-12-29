import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Weapon metadata DTO
 */
export class WeaponMetaResponseDto {
  @ApiProperty({ description: 'Item type (always weapon)', example: 'weapon' })
  type: 'weapon';

  @ApiProperty({ description: 'Weapon type', example: 'sword' })
  weaponType: string;

  @ApiProperty({ description: 'Damage dice expression', example: '1d8' })
  damage: string;

  @ApiPropertyOptional({ description: 'Weapon properties', type: [String], example: ['versatile', 'finesse'] })
  properties?: string[];
}
