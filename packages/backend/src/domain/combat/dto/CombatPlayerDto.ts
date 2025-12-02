import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class CombatPlayerDto {
  @ApiProperty({ description: 'Character ID of the player' })
  @IsString()
  characterId: string;

  @ApiProperty({ description: 'Player name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Current hit points' })
  @IsNumber()
  hp: number;

  @ApiProperty({ description: 'Maximum hit points' })
  @IsNumber()
  hpMax: number;

  @ApiProperty({ description: 'Armor class' })
  @IsNumber()
  ac: number;

  @ApiProperty({ description: 'Initiative order value' })
  @IsNumber()
  initiative: number;

  @ApiProperty({ description: 'Attack bonus for the player' })
  @IsNumber()
  attackBonus: number;

  @ApiProperty({ description: 'Damage dice expression (e.g., 1d8)' })
  @IsString()
  damageDice: string;

  @ApiProperty({ description: 'Damage bonus to add to damage roll' })
  @IsNumber()
  damageBonus: number;
}
