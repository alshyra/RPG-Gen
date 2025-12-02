import { ApiProperty } from '@nestjs/swagger';
import { type InventoryItemMeta } from '../character/dto/InventoryItemMeta.js';

export class ItemDefinitionDto {
  @ApiProperty({
    description: 'Unique identifier for the item definition',
    example: 'sword_of_flames_001',
  })
  definitionId: string;

  @ApiProperty({
    description: 'Display name of the item',
    example: 'Sword of Flames',
  })
  name: string;

  @ApiProperty({
    description: 'Detailed description of the item',
    example: 'A magical sword that burns with eternal flames',
    default: '',
  })
  description: string;

  @ApiProperty({
    description: 'Metadata containing item properties and stats',
    example: {
      damage: 10,
      durability: 100,
      rarity: 'rare',
    },
  })
  meta: InventoryItemMeta;

  @ApiProperty({
    description: 'Whether this item definition can be modified',
    default: true,
  })
  isEditable: boolean;
}
