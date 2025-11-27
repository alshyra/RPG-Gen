import { ApiProperty } from '@nestjs/swagger';

export class CombatPlayerDto {
  @ApiProperty({ description: 'Character ID of the player' })
  characterId: string;

  @ApiProperty({ description: 'Player name' })
  name: string;

  @ApiProperty({ description: 'Current hit points' })
  hp: number;

  @ApiProperty({ description: 'Maximum hit points' })
  hpMax: number;

  @ApiProperty({ description: 'Armor class' })
  ac: number;

  @ApiProperty({ description: 'Initiative order value' })
  initiative: number;

  @ApiProperty({ description: 'Attack bonus for the player' })
  attackBonus: number;

  @ApiProperty({ description: 'Damage dice expression (e.g., 1d8)' })
  damageDice: string;

  @ApiProperty({ description: 'Damage bonus to add to damage roll' })
  damageBonus: number;
}
