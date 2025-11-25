import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, IsObject, Min, IsNotEmpty } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Arbitrary item meta' })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}
