import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { BaseMeta } from './BaseMeta.js';

export class ConsumableMeta extends BaseMeta {
  @ApiProperty({
    enum: ['consumable'],
    description: 'Type discriminator for consumables',
  })
  type = 'consumable' as const;

  @ApiProperty({
    description: 'Whether the item can be used directly',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  usable?: boolean;

  @ApiProperty({
    description: 'Whether the item can be used in combat (e.g., potions)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  combatUsable?: boolean;

  @ApiProperty({
    description: 'Whether the item can be used during rest (e.g., rations)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  restUsable?: boolean;

  @ApiProperty({
    description: 'Heal dice expression (e.g., "2d4+2")',
    required: false,
  })
  @IsOptional()
  @IsString()
  healDice?: string;
}
