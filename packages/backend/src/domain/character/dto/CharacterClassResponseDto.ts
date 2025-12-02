import { ApiPropertyOptional } from '@nestjs/swagger';

export class CharacterClassResponseDto {
  @ApiPropertyOptional({ description: 'Class name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Class level' })
  level?: number;
}
