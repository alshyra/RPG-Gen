import { ApiProperty } from '@nestjs/swagger';
import { BaseMeta } from './BaseMeta.js';

export class ToolMeta extends BaseMeta {
  @ApiProperty({
    enum: ['tool'],
    description: 'Type discriminator for tools',
  })
  type = 'tool' as const;
}
