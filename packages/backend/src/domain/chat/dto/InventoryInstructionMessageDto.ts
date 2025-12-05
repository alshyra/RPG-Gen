import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';

export class InventoryInstructionMessageDto {
  @ApiProperty({
    description: 'Instruction type',
    enum: ['inventory'],
  })
  type: 'inventory';

  @ApiProperty({
    description: 'Inventory action',
    enum: [
      'add',
      'remove',
      'use',
    ],
  })
  action: 'add' | 'remove' | 'use';

  @ApiProperty({ description: 'Item name' })
  name: string;

  @ApiPropertyOptional({ description: 'Inventory item _id (required for use action)' })
  itemId?: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  quantity?: number;

  @ApiPropertyOptional({ description: 'Item description' })
  description?: string;
}
