import { ApiProperty } from '@nestjs/swagger';

export class EquipInventoryDto {
  @ApiProperty({
    description: 'Definition id of the item to equip',
    example: 'weapon-rapier',
  })
  definitionId!: string;
}
