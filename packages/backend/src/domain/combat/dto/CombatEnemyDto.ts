import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CombatEnemyDto {
  @ApiProperty({ description: 'Unique enemy ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Enemy name' })
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

  @ApiProperty({
    description: 'Optional portrait URL or data URI',
    required: false,
  })
  @IsOptional()
  @IsString()
  portrait?: string;

  @ApiProperty({
    description: 'Optional short description for the enemy',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Initiative order value' })
  @IsNumber()
  initiative: number;

  @ApiProperty({ description: 'Attack bonus for the enemy' })
  @IsNumber()
  attackBonus: number;

  @ApiProperty({ description: 'Damage dice expression (e.g., 1d8)' })
  @IsString()
  damageDice: string;

  @ApiProperty({ description: 'Damage bonus to add to damage roll' })
  @IsNumber()
  damageBonus: number;
}
