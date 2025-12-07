import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber, IsObject,
  IsString,
} from 'class-validator';
import {
  ArmorMeta, ConsumableMeta, PackMeta, ToolMeta, WeaponMeta, type InventoryItemMeta,
} from './InventoryItemMeta.js';

export class InventoryItemDto<MetaType = InventoryItemMeta> {
  @ApiPropertyOptional({ description: 'Item ID' })
  _id?: string;

  @ApiProperty({ description: 'Definition ID' })
  @IsString()
  definitionId: string;

  @ApiProperty({ description: 'Item name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsNumber()
  qty?: number;

  @ApiProperty({ description: 'Item description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Is equipped' })
  @IsBoolean()
  equipped: boolean;

  @ApiProperty({
    description: 'Arbitrary item meta',
    oneOf: [
      { $ref: getSchemaPath(WeaponMeta) },
      { $ref: getSchemaPath(ArmorMeta) },
      { $ref: getSchemaPath(ConsumableMeta) },
      { $ref: getSchemaPath(PackMeta) },
      { $ref: getSchemaPath(ToolMeta) },
    ],
  })
  @IsObject()
  meta: MetaType;
}
