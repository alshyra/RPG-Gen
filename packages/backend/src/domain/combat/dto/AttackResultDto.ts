import { ApiProperty } from '@nestjs/swagger';
import {
  IsString, IsNumber, IsBoolean, IsArray,
} from 'class-validator';

export class AttackResultDto {
  @ApiProperty({ description: 'Attacker identifier' })
  @IsString()
  attacker: string;

  @ApiProperty({ description: 'Target identifier' })
  @IsString()
  target: string;

  @ApiProperty({ description: 'Raw attack roll' })
  @IsNumber()
  attackRoll: number;

  @ApiProperty({ description: 'Attack bonus applied' })
  @IsNumber()
  attackBonus: number;

  @ApiProperty({ description: 'Total attack value (roll + bonus)' })
  @IsNumber()
  totalAttack: number;

  @ApiProperty({ description: 'Target\'s AC' })
  @IsNumber()
  targetAc: number;

  @ApiProperty({ description: 'Whether the attack hit' })
  @IsBoolean()
  hit: boolean;

  @ApiProperty({ description: 'Whether the attack was a critical hit' })
  @IsBoolean()
  critical: boolean;

  @ApiProperty({ description: 'Whether the attack was a fumble' })
  @IsBoolean()
  fumble: boolean;

  @ApiProperty({
    description: 'Individual dice results for the damage roll',
    type: [Number],
  })
  @IsArray()
  damageRoll: number[];

  @ApiProperty({ description: 'Damage bonus applied' })
  @IsNumber()
  damageBonus: number;

  @ApiProperty({ description: 'Total damage applied' })
  @IsNumber()
  totalDamage: number;

  @ApiProperty({ description: 'Target\'s HP before the attack' })
  @IsNumber()
  targetHpBefore: number;

  @ApiProperty({ description: 'Target\'s HP after the attack' })
  @IsNumber()
  targetHpAfter: number;

  @ApiProperty({ description: 'Whether the target was defeated' })
  @IsBoolean()
  targetDefeated: boolean;
}
