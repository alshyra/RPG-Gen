import { ApiPropertyOptional } from '@nestjs/swagger';
import type { InventoryItemMeta } from './InventoryItemMeta.js';

export class ItemResponseDto<MetaType = InventoryItemMeta> {
  @ApiPropertyOptional({ description: 'Item ID' })
  _id?: string;

  @ApiPropertyOptional({ description: 'Definition ID' })
  definitionId?: string;

  @ApiPropertyOptional({ description: 'Item name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  qty?: number;

  @ApiPropertyOptional({ description: 'Item description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Is equipped' })
  equipped?: boolean;

  @ApiPropertyOptional({
    description: 'Item metadata',
    additionalProperties: true,
  })
  meta?: MetaType;
}
