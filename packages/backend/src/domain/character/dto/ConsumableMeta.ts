import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
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
}
