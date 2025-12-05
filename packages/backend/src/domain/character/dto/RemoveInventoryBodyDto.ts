import { ApiPropertyOptional } from '@nestjs/swagger';

export class RemoveInventoryBodyDto {
  @ApiPropertyOptional({ description: 'Quantity to remove (-1 = remove all)' })
  qty: number;
}
