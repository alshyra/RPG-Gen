import { ApiPropertyOptional } from '@nestjs/swagger';

export class KillCharacterBodyDto {
  @ApiPropertyOptional({ description: 'Location where character died' })
  deathLocation?: string;
}
