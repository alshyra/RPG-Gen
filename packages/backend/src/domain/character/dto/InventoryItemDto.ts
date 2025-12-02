import { ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import {
  ArmorMeta, ConsumableMeta, GenericMeta, PackMeta, ToolMeta, WeaponMeta, type InventoryItemMeta,
} from './InventoryItemMeta.js';
import { IsObject, IsOptional } from 'class-validator';

export class InventoryItemDto<MetaType = InventoryItemMeta> {
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
    description: 'Arbitrary item meta',
    oneOf: [
      { $ref: getSchemaPath(WeaponMeta) },
      { $ref: getSchemaPath(ArmorMeta) },
      { $ref: getSchemaPath(ConsumableMeta) },
      { $ref: getSchemaPath(PackMeta) },
      { $ref: getSchemaPath(ToolMeta) },
    ],
  })
  @IsOptional()
  @IsObject()
  meta?: MetaType;
}
