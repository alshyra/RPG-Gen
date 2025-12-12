import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { BaseMeta } from './BaseMeta.js';

export class WeaponMeta extends BaseMeta {
  @ApiProperty({
    enum: ['weapon'],
    description: 'Type discriminator for weapons',
  })
  type = 'weapon' as const;

  @ApiPropertyOptional({ description: 'Weapon class (e.g., Simple Melee, Martial Ranged)' })
  @IsOptional()
  @IsString()
  class?: string;

  @ApiPropertyOptional({ description: 'Damage expression (e.g., 1d6 bludgeoning)' })
  @IsOptional()
  @IsString()
  damage?: string;

  @ApiPropertyOptional({
    description: 'Weapon properties (e.g., Finesse, Thrown)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  properties?: string[];
}
