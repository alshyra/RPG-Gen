import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseMeta } from './BaseMeta.js';

export class ArmorMeta extends BaseMeta {
  @ApiProperty({
    enum: ['armor'],
    description: 'Type discriminator for armor',
  })
  type = 'armor' as const;

  @ApiPropertyOptional({ description: 'Armor class (Light, Medium, Heavy, Shield)' })
  @IsOptional()
  @IsString()
  class?: string;

  @ApiPropertyOptional({ description: 'AC value (e.g., 11 + Dex modifier)' })
  @IsOptional()
  @IsString()
  ac?: string;

  @ApiPropertyOptional({ description: 'Strength requirement (e.g., Str 13)' })
  @IsOptional()
  @IsString()
  strength?: string;

  @ApiPropertyOptional({ description: 'Stealth effect (e.g., Disadvantage)' })
  @IsOptional()
  @IsString()
  stealth?: string;
}
