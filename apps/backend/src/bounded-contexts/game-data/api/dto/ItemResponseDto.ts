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

/**
 * Consumable metadata DTO
 */
export class ConsumableMetaResponseDto {
  @ApiProperty({ description: 'Item type (always consumable)', example: 'consumable' })
  type: 'consumable';

  @ApiProperty({ description: 'Consumable subtype', example: 'potion' })
  consumableType: string;

  @ApiPropertyOptional({ description: 'Uses per rest', example: 1 })
  uses?: number;

  @ApiPropertyOptional({ description: 'Effect value', example: 10 })
  effectValue?: number;
}

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
