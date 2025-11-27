import { ApiPropertyOptional } from '@nestjs/swagger';

export class GrantInspirationBodyDto {
  @ApiPropertyOptional({ description: 'Amount of inspiration to grant (1-5)', default: 1 })
  amount?: number;
}
