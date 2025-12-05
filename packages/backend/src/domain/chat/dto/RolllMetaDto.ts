import { ApiPropertyOptional } from '@nestjs/swagger';

export class RollMetaDto {
  @ApiPropertyOptional({ description: 'Attack bonus to apply' })
  attackBonus?: number;

  @ApiPropertyOptional({ description: 'Target name' })
  target?: string;

  @ApiPropertyOptional({ description: 'Target armor class' })
  targetAc?: number;

  @ApiPropertyOptional({ description: 'Damage dice expression' })
  damageDice?: string;

  @ApiPropertyOptional({ description: 'Damage bonus to apply' })
  damageBonus?: number;

  @ApiPropertyOptional({ description: 'Action type (e.g., attack, damage)' })
  action?: string;
}
