import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString, IsNumber, IsOptional, IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CombatStartEntryDto {
  @ApiProperty({ description: 'Enemy name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Enemy HP' })
  @IsNumber()
  hp: number;

  @ApiProperty({ description: 'Enemy AC' })
  @IsNumber()
  ac: number;

  @ApiPropertyOptional({ description: 'Attack bonus (optional)' })
  @IsOptional()
  @IsNumber()
  attack_bonus?: number;

  @ApiPropertyOptional({ description: 'Damage dice (optional)' })
  @IsOptional()
  @IsString()
  damage_dice?: string;

  @ApiPropertyOptional({ description: 'Damage bonus (optional)' })
  @IsOptional()
  @IsNumber()
  damage_bonus?: number;
}

export class CombatStartRequestDto {
  @ApiProperty({
    description: 'Array of enemies to initialize combat with',
    type: [CombatStartEntryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CombatStartEntryDto)
  combat_start: CombatStartEntryDto[];
}
