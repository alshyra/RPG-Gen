import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
