import {
  ApiPropertyOptional, ApiProperty, getSchemaPath, ApiExtraModels,
} from '@nestjs/swagger';
import {
  IsOptional, IsString, IsBoolean, IsNumber, IsObject, Min, IsNotEmpty,
} from 'class-validator';
import {
  WeaponMeta,
  ArmorMeta,
  ConsumableMeta,
  PackMeta,
  ToolMeta,
  GenericMeta,
  type InventoryItemMeta,
} from './InventoryItemMeta.js';

@ApiExtraModels(WeaponMeta, ArmorMeta, ConsumableMeta, PackMeta, ToolMeta, GenericMeta)
export class CreateInventoryItemDto {
  @ApiPropertyOptional({ description: 'Inventory item id (UUID). If provided, attempt to merge with existing item' })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiProperty({ description: 'Canonical definition id for this item' })
  @IsNotEmpty()
  @IsString()
  definitionId: string;

  @ApiPropertyOptional({ description: 'Name for this inventory item' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Quantity for this item' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  qty?: number;

  @ApiPropertyOptional({ description: 'Item description / notes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'If true this item is equipped' })
  @IsOptional()
  @IsBoolean()
  equipped?: boolean;

  @ApiPropertyOptional({
    description: 'Arbitrary item meta',
    oneOf: [
      { $ref: getSchemaPath(WeaponMeta) },
      { $ref: getSchemaPath(ArmorMeta) },
      { $ref: getSchemaPath(ConsumableMeta) },
      { $ref: getSchemaPath(PackMeta) },
      { $ref: getSchemaPath(ToolMeta) },
      { $ref: getSchemaPath(GenericMeta) },
    ],
  })
  @IsOptional()
  @IsObject()
  meta?: InventoryItemMeta;
}
