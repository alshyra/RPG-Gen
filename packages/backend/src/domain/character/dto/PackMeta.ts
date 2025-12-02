import { ApiProperty } from '@nestjs/swagger';
import { BaseMeta } from './BaseMeta.js';

export class PackMeta extends BaseMeta {
  @ApiProperty({
    enum: ['pack'],
    description: 'Type discriminator for packs',
  })
  type = 'pack' as const;
}
