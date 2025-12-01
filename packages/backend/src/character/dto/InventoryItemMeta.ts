import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsArray, IsBoolean, IsOptional, IsString,
} from 'class-validator';

export class BaseMeta {
  @ApiPropertyOptional({ description: 'Item type discriminator' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Item cost (gold pieces or formatted string)' })
  @IsOptional()
  cost?: string | number;

  @ApiPropertyOptional({ description: 'Item weight in pounds' })
  @IsOptional()
  weight?: string | number;

  @ApiPropertyOptional({ description: 'Whether this is a starter item' })
  @IsOptional()
  @IsBoolean()
  starter?: boolean;
}

export class WeaponMeta extends BaseMeta {
  @ApiProperty({
    enum: ['weapon'],
    description: 'Type discriminator for weapons',
  })
  @IsString()
  override type = 'weapon' as const;

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

export class ArmorMeta extends BaseMeta {
  @ApiProperty({
    enum: ['armor'],
    description: 'Type discriminator for armor',
  })
  @IsString()
  override type = 'armor' as const;

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

export class ConsumableMeta extends BaseMeta {
  @ApiProperty({
    enum: ['consumable'],
    description: 'Type discriminator for consumables',
  })
  @IsString()
  override type = 'consumable' as const;

  @ApiPropertyOptional({ description: 'Whether the item can be used directly' })
  @IsOptional()
  @IsBoolean()
  usable?: boolean;
}

export class PackMeta extends BaseMeta {
  @ApiProperty({
    enum: ['pack'],
    description: 'Type discriminator for packs',
  })
  @IsString()
  override type = 'pack' as const;
}

export class ToolMeta extends BaseMeta {
  @ApiProperty({
    enum: ['tool'],
    description: 'Type discriminator for tools',
  })
  @IsString()
  override type = 'tool' as const;
}

export class GenericMeta extends BaseMeta {
  [key: string]: unknown;
}

export type InventoryItemMeta = WeaponMeta | ArmorMeta | ConsumableMeta | PackMeta | ToolMeta | GenericMeta;
