import { ApiProperty } from '@nestjs/swagger';

export class CombatEnemyDto {
  @ApiProperty({ description: 'Unique enemy ID' })
  id: string;

  @ApiProperty({ description: 'Enemy name' })
  name: string;

  @ApiProperty({ description: 'Current hit points' })
  hp: number;

  @ApiProperty({ description: 'Maximum hit points' })
  hpMax: number;

  @ApiProperty({ description: 'Armor class' })
  ac: number;

  @ApiProperty({
    description: 'Optional portrait URL or data URI',
    required: false,
  })
  portrait?: string;

  @ApiProperty({
    description: 'Optional short description for the enemy',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: 'Initiative order value' })
  initiative: number;

  @ApiProperty({ description: 'Attack bonus for the enemy' })
  attackBonus: number;

  @ApiProperty({ description: 'Damage dice expression (e.g., 1d8)' })
  damageDice: string;

  @ApiProperty({ description: 'Damage bonus to add to damage roll' })
  damageBonus: number;
}
