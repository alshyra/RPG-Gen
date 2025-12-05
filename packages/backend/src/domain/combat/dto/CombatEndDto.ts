import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsBoolean, IsNumber, IsOptional, IsString,
} from 'class-validator';

export class CombatEndDto {
  @ApiProperty({ description: 'Victory state' })
  @IsBoolean()
  victory: boolean;

  @ApiProperty({ description: 'XP gained' })
  @IsNumber()
  xp_gained: number;

  @ApiProperty({ description: 'Player\'s HP at the end' })
  @IsNumber()
  player_hp: number;

  @ApiProperty({ description: 'Enemies that were defeated' })
  @IsArray()
  enemies_defeated: string[];

  @ApiPropertyOptional({ description: 'Flee indicator' })
  @IsOptional()
  @IsBoolean()
  fled?: boolean;

  @ApiProperty({ description: 'Narrative summary' })
  @IsString()
  narrative: string;

  constructor(combatEnd?: Partial<CombatEndDto>) {
    Object.assign(this, combatEnd);
  }
}
