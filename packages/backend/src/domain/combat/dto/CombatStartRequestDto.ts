import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';

export class CombatStartEntryDto {
  @ApiProperty({ description: 'Enemy name' })
  name: string;

  @ApiProperty({ description: 'Enemy HP' })
  hp: number;

  @ApiProperty({ description: 'Enemy AC' })
  ac: number;

  @ApiPropertyOptional({ description: 'Attack bonus (optional)' })
  attack_bonus?: number;

  @ApiPropertyOptional({ description: 'Damage dice (optional)' })
  damage_dice?: string;

  @ApiPropertyOptional({ description: 'Damage bonus (optional)' })
  damage_bonus?: number;
}

export class CombatStartRequestDto {
  @ApiProperty({
    description: 'Array of enemies to initialize combat with',
    type: [CombatStartEntryDto],
  })
  combat_start: CombatStartEntryDto[];
}
